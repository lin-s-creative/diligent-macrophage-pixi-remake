import type { BackgroundView, GameplayLayers } from '../scenes/gameScene';
import type { HudView } from '../ui/hud';
import type {
  BonusEntity,
  BossEntity,
  EnemyBulletEntity,
  EnemyEntity,
  ParticleEntity,
  PlayerBulletEntity,
  PlayerEntity,
  SceneName,
  WeaponType
} from '../types/entities';

export interface GameState {
  input: Record<string, boolean>;
  currentScene: SceneName;
  isPaused: boolean;
  player: PlayerEntity | null;
  score: number;
  elapsedTime: number;
  waveTimer: number;
  bossSpawned: boolean;
  boss: BossEntity | null;
  bullets: PlayerBulletEntity[];
  enemies: EnemyEntity[];
  enemyBullets: EnemyBulletEntity[];
  bonuses: BonusEntity[];
  particles: ParticleEntity[];
  currentWeapon: WeaponType;
  shotTimer: number;
  gameEnded: boolean;
  controlsVisible: boolean;
  lastPauseKeyDown: boolean;
  layers: GameplayLayers | null;
}

export function createInitialGameState(): GameState {
  return {
    input: Object.create(null) as Record<string, boolean>,
    currentScene: 'menu',
    isPaused: false,
    player: null,
    score: 0,
    elapsedTime: 0,
    waveTimer: 0,
    bossSpawned: false,
    boss: null,
    bullets: [],
    enemies: [],
    enemyBullets: [],
    bonuses: [],
    particles: [],
    currentWeapon: 1,
    shotTimer: 0,
    gameEnded: false,
    controlsVisible: false,
    lastPauseKeyDown: false,
    layers: null
  };
}

export function resetGameState(state: GameState): void {
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.bonuses = [];
  state.particles = [];
  state.boss = null;
  state.bossSpawned = false;
  state.score = 0;
  state.elapsedTime = 0;
  state.waveTimer = 0.8;
  state.shotTimer = 0;
  state.currentWeapon = 1;
  state.isPaused = false;
  state.gameEnded = false;
  state.lastPauseKeyDown = false;
  state.player = null;
  state.layers = null;
}

export function getBackground(state: GameState): BackgroundView {
  if (!state.layers) throw new Error('Gameplay layers are not initialized.');
  return state.layers.background;
}

export function getHud(state: GameState): HudView {
  if (!state.layers) throw new Error('Gameplay layers are not initialized.');
  return state.layers.hud;
}
