import { DEFAULT_LEVEL, DEFAULT_UNLOCKED_LEVEL_ID, type LevelConfig, type LevelId } from '../config/levels';
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
  RewardGroupState,
  SceneName,
  WeaponType
} from '../types/entities';

export interface PointerInput {
  x: number;
  y: number;
  active: boolean;
}

export interface GameState {
  input: Record<string, boolean>;
  pointer: PointerInput;
  currentScene: SceneName;
  isPaused: boolean;
  selectedLevel: LevelConfig;
  unlockedLevelId: LevelId;
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
  rewardGroups: Map<number, RewardGroupState>;
  executedTimelineEventIds: Set<string>;
  nextRewardGroupId: number;
  rewardGroupTimer: number;
  currentWeapon: WeaponType;
  weaponBuffTimer: number;
  shotTimer: number;
  gameEnded: boolean;
  controlsVisible: boolean;
  lastPauseKeyDown: boolean;
  layers: GameplayLayers | null;
}

export function createInitialGameState(
  selectedLevel: LevelConfig = DEFAULT_LEVEL,
  unlockedLevelId: LevelId = DEFAULT_UNLOCKED_LEVEL_ID
): GameState {
  return {
    input: Object.create(null) as Record<string, boolean>,
    pointer: { x: 125, y: 270, active: false },
    currentScene: 'menu',
    isPaused: false,
    selectedLevel,
    unlockedLevelId,
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
    rewardGroups: new Map(),
    executedTimelineEventIds: new Set(),
    nextRewardGroupId: 1,
    rewardGroupTimer: 10,
    currentWeapon: 1,
    weaponBuffTimer: 0,
    shotTimer: 0,
    gameEnded: false,
    controlsVisible: false,
    lastPauseKeyDown: false,
    layers: null
  };
}

export function resetGameState(state: GameState, selectedLevel: LevelConfig = state.selectedLevel): void {
  state.selectedLevel = selectedLevel;
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.bonuses = [];
  state.particles = [];
  state.rewardGroups = new Map();
  state.executedTimelineEventIds = new Set();
  state.nextRewardGroupId = 1;
  state.rewardGroupTimer = 10;
  state.boss = null;
  state.bossSpawned = false;
  state.score = 0;
  state.elapsedTime = 0;
  state.waveTimer = 0.8;
  state.shotTimer = 0;
  state.currentWeapon = 1;
  state.weaponBuffTimer = 0;
  state.isPaused = false;
  state.gameEnded = false;
  state.lastPauseKeyDown = false;
  state.pointer.active = false;
  state.pointer.x = 125;
  state.pointer.y = 270;
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
