import { Application, Container } from 'pixi.js';
import { COLORS, HEIGHT, WIDTH } from '../config/constants';
import { createPlayer } from '../entities/player';
import { buildMenu } from '../scenes/menuScene';
import { setupGameScene } from '../scenes/gameScene';
import { buildControlsOverlay, buildPauseOverlay, buildResultOverlay } from '../scenes/overlays';
import type { RecordsSummary, RecordsStore } from '../storage/RecordsStore';
import type { ResultTitle } from '../types/entities';
import { clearContainer } from '../utils/pixi';
import { GameLoop } from './GameLoop';
import { createInitialGameState, resetGameState, type GameState } from './GameState';
import { InputManager } from './InputManager';
import { updateHud } from '../ui/hud';

export class GameApp {
  private readonly app: Application;
  private readonly state: GameState;
  private readonly inputManager: InputManager;
  private readonly gameLoop: GameLoop;
  private readonly menuScene = new Container();
  private readonly gameScene = new Container();
  private readonly pauseScene = new Container();
  private readonly controlsOverlay = new Container();
  private readonly resultOverlay = new Container();
  private recordsSummary: RecordsSummary = { bestScore: 0, gamesPlayed: 0, records: [] };

  constructor(
    private readonly shell: HTMLElement,
    private readonly recordsStore: RecordsStore
  ) {
    this.app = new Application({
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: COLORS.plasmaDark,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    this.state = createInitialGameState();
    this.inputManager = new InputManager(this.state.input);
    this.gameLoop = new GameLoop(this.state, {
      endGame: (title) => {
        void this.endGame(title);
      },
      togglePause: () => this.togglePause()
    });
  }

  async start(): Promise<void> {
    this.shell.appendChild(this.app.view as HTMLCanvasElement);
    this.app.stage.addChild(this.menuScene, this.gameScene, this.pauseScene, this.controlsOverlay, this.resultOverlay);
    this.inputManager.attach();
    this.app.ticker.add((delta) => this.gameLoop.update(delta));
    await this.refreshRecordsSummary();
    this.showMenu();
  }

  destroy(): void {
    this.inputManager.detach();
    this.app.destroy(true, { children: true });
  }

  private async refreshRecordsSummary(): Promise<void> {
    this.recordsSummary = await this.recordsStore.getSummary(5);
  }

  private hideAllScenes(): void {
    this.menuScene.visible = false;
    this.gameScene.visible = false;
    this.pauseScene.visible = false;
    this.controlsOverlay.visible = false;
    this.resultOverlay.visible = false;
    this.state.controlsVisible = false;
  }

  private showMenu(): void {
    this.state.currentScene = 'menu';
    this.state.isPaused = false;
    this.state.gameEnded = false;
    this.hideAllScenes();
    buildMenu(this.menuScene, {
      startGame: () => this.startGame(),
      toggleControls: () => this.toggleControlsOverlay()
    }, this.recordsSummary);
    buildControlsOverlay(this.controlsOverlay, () => this.toggleControlsOverlay());
    this.menuScene.visible = true;
  }

  private startGame(): void {
    this.hideAllScenes();
    this.state.currentScene = 'game';
    resetGameState(this.state);
    this.state.layers = setupGameScene(this.gameScene);
    this.state.player = createPlayer();
    this.state.layers.entityLayer.addChild(this.state.player.container);
    updateHud(this.state.layers.hud, {
      player: this.state.player,
      score: this.state.score,
      currentWeapon: this.state.currentWeapon
    });
    buildPauseOverlay(this.pauseScene, {
      resumeGame: () => this.resumeGame(),
      showMenu: () => this.showMenu()
    });
    clearContainer(this.resultOverlay);
    this.gameScene.visible = true;
    this.pauseScene.visible = false;
    this.resultOverlay.visible = false;
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

  private toggleControlsOverlay(): void {
    this.state.controlsVisible = !this.state.controlsVisible;
    this.controlsOverlay.visible = this.state.controlsVisible;
  }

  private async endGame(title: ResultTitle): Promise<void> {
    if (this.state.gameEnded) return;
    this.state.gameEnded = true;
    this.state.isPaused = true;
    this.pauseScene.visible = false;

    const previousBest = this.recordsSummary.bestScore;
    await this.recordsStore.addRecord({
      score: this.state.score,
      title,
      elapsedTime: this.state.elapsedTime
    });
    await this.refreshRecordsSummary();

    buildResultOverlay(this.resultOverlay, {
      title,
      score: this.state.score,
      bestScore: this.recordsSummary.bestScore,
      isNewRecord: this.state.score > previousBest
    }, {
      startGame: () => this.startGame(),
      showMenu: () => this.showMenu()
    });
  }
}
