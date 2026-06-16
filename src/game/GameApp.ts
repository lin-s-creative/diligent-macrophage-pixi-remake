 import { Application, Container } from 'pixi.js';
import { COLORS, WIDTH, HEIGHT } from '../config/constants';
import { coerceLevelId, getLevelById, getNextLevel, readUnlockedLevelId, saveUnlockedLevelId, type LevelConfig, type LevelId } from '../config/levels';
import { createPlayer } from '../entities/player';
import { setupGameScene } from '../scenes/gameScene';
import { buildPauseOverlay } from '../scenes/overlays';
import type { RecordsSummary, RecordsStore } from '../storage/RecordsStore';
import type { ResultTitle } from '../types/entities';
import { clearContainer } from '../utils/pixi';
import { GameLoop } from './GameLoop';
import { createInitialGameState, resetGameState, type GameState } from './GameState';
import { InputManager } from './InputManager';
import { updateHud } from '../ui/hud';

export interface GameResultData {
  title: ResultTitle;
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  level: LevelConfig;
  nextLevel: LevelConfig | null;
  unlockedNextLevel: boolean;
}

export interface GameAppSnapshot {
  recordsSummary: RecordsSummary;
  unlockedLevelId: LevelId;
  selectedLevel: LevelConfig;
}

export interface GameAppCallbacks {
  onGameStarted?: (level: LevelConfig) => void;
  onMenuRequested?: () => void;
  onProgressChanged?: (unlockedLevelId: LevelId) => void;
  onRecordsChanged?: (recordsSummary: RecordsSummary) => void;
  onResult?: (result: GameResultData) => void;
}

export class GameApp {
  private readonly app: Application;
  private readonly state: GameState;
  private readonly inputManager: InputManager;
  private readonly gameLoop: GameLoop;
  private readonly gameScene = new Container();
  private readonly pauseScene = new Container();
  private recordsSummary: RecordsSummary = { bestScore: 0, gamesPlayed: 0, records: [] };
  private readonly resizeToShell = (): void => {
    const bounds = this.shell.getBoundingClientRect();
    const screenWidth = Math.max(1, Math.ceil(bounds.width || window.innerWidth || WIDTH));
    const screenHeight = Math.max(1, Math.ceil(bounds.height || window.innerHeight || HEIGHT));

    this.app.renderer.resize(screenWidth, screenHeight);
    this.app.stage.scale.set(screenWidth / WIDTH, screenHeight / HEIGHT);
  };

  constructor(
    private readonly shell: HTMLElement,
    private readonly recordsStore: RecordsStore,
    private readonly callbacks: GameAppCallbacks = {}
  ) {
    this.app = new Application({
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: COLORS.plasmaDark,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    const unlockedLevelId = readUnlockedLevelId();
    this.state = createInitialGameState(getLevelById(unlockedLevelId), unlockedLevelId);
    this.inputManager = new InputManager(this.state.input, this.state.pointer, this.shell);
    this.gameLoop = new GameLoop(this.state, {
      endGame: (title) => {
        void this.endGame(title);
      },
      togglePause: () => this.togglePause()
    });
  }

  async start(): Promise<GameAppSnapshot> {
    this.shell.appendChild(this.app.view as HTMLCanvasElement);
    this.app.stage.addChild(this.gameScene, this.pauseScene);
    this.resizeToShell();
    window.addEventListener('resize', this.resizeToShell);
    this.inputManager.attach();
    this.app.ticker.add((delta) => this.gameLoop.update(delta));
    await this.refreshRecordsSummary();
    this.leaveGameplay();
    return this.getSnapshot();
  }

  destroy(): void {
    window.removeEventListener('resize', this.resizeToShell);
    this.inputManager.detach();
    this.app.destroy(true, { children: true });
  }

  getSnapshot(): GameAppSnapshot {
    return {
      recordsSummary: this.recordsSummary,
      unlockedLevelId: this.state.unlockedLevelId,
      selectedLevel: this.state.selectedLevel
    };
  }

  leaveGameplay(): void {
    this.state.currentScene = 'menu';
    this.state.isPaused = false;
    this.state.gameEnded = false;
    this.state.controlsVisible = false;
    this.gameScene.visible = false;
    this.pauseScene.visible = false;
  }

  requestMainMenu(): void {
    this.leaveGameplay();
    this.callbacks.onMenuRequested?.();
  }

  startGame(level: LevelConfig = this.state.selectedLevel): void {
    const safeLevel = level.id <= this.state.unlockedLevelId ? level : getLevelById(this.state.unlockedLevelId);
    this.leaveGameplay();
    this.state.currentScene = 'game';
    resetGameState(this.state, safeLevel);
    this.state.layers = setupGameScene(this.gameScene, safeLevel);
    this.state.player = createPlayer();
    this.state.layers.entityLayer.addChild(this.state.player.container);
    updateHud(this.state.layers.hud, {
      player: this.state.player,
      score: this.state.score,
      currentWeapon: this.state.currentWeapon,
      weaponBuffTimer: this.state.weaponBuffTimer,
      level: this.state.selectedLevel
    });
    buildPauseOverlay(this.pauseScene, {
      resumeGame: () => this.resumeGame(),
      showMenu: () => this.requestMainMenu()
    });
    this.gameScene.visible = true;
    this.pauseScene.visible = false;
    this.callbacks.onGameStarted?.(safeLevel);
  }

  private async refreshRecordsSummary(): Promise<void> {
    this.recordsSummary = await this.recordsStore.getSummary(5);
    this.callbacks.onRecordsChanged?.(this.recordsSummary);
  }

  private pauseGame(): void {
    if (this.state.currentScene !== 'game' || this.state.gameEnded) return;
    this.state.isPaused = true;
    this.pauseScene.visible = true;
  }

  private resumeGame(): void {
    if (this.state.currentScene !== 'game') return;
    this.state.isPaused = false;
    this.pauseScene.visible = false;
  }

  private togglePause(): void {
    if (this.state.currentScene !== 'game' || this.state.gameEnded) return;
    if (this.state.isPaused) this.resumeGame();
    else this.pauseGame();
  }

  private unlockNextLevelIfWon(title: ResultTitle): { nextLevel: LevelConfig | null; unlockedNextLevel: boolean } {
    const nextLevel = getNextLevel(this.state.selectedLevel.id);
    if (title !== 'ПОБЕДА' || !nextLevel) return { nextLevel, unlockedNextLevel: false };

    const nextUnlockedId = coerceLevelId(Math.max(this.state.unlockedLevelId, nextLevel.id));
    const unlockedNextLevel = nextUnlockedId > this.state.unlockedLevelId;
    this.state.unlockedLevelId = nextUnlockedId;
    saveUnlockedLevelId(nextUnlockedId);
    this.callbacks.onProgressChanged?.(nextUnlockedId);
    return { nextLevel, unlockedNextLevel };
  }

  private async endGame(title: ResultTitle): Promise<void> {
    if (this.state.gameEnded) return;
    this.state.gameEnded = true;
    this.state.isPaused = true;
    this.pauseScene.visible = false;

    const completedLevel = this.state.selectedLevel;
    const { nextLevel, unlockedNextLevel } = this.unlockNextLevelIfWon(title);
    const previousBest = this.recordsSummary.bestScore;
    await this.recordsStore.addRecord({
      score: this.state.score,
      title,
      elapsedTime: this.state.elapsedTime
    });
    await this.refreshRecordsSummary();

    this.callbacks.onResult?.({
      title,
      score: this.state.score,
      bestScore: this.recordsSummary.bestScore,
      isNewRecord: this.state.score > previousBest,
      level: completedLevel,
      nextLevel,
      unlockedNextLevel
    });
  }
}
