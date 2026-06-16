import rawDesignerConfig from './designerConfig.json';

export interface DesignerColors {
  plasmaDark: string;
  plasmaMid: string;
  plasmaLight: string;
  vesselWall: string;
  vesselWallDark: string;
  player: string;
  playerEdge: string;
  redWeapon: string;
  blueWeapon: string;
  yellowWeapon: string;
  greenWeapon: string;
  purpleWeapon: string;
  coccus: string;
  bacillus: string;
  phage: string;
  boss: string;
  enemyShot: string;
  enemyHomingShot: string;
  white: string;
  black: string;
}

export interface DesignerConstants {
  width: number;
  height: number;
  baseVesselTop: number;
  baseVesselBottom: number;
  vesselWave: number;
  playerMouseFollowSlowdown: number;
  shotCooldown: number;
  waveInterval: number;
  bossAppearTime: number;
  colors: DesignerColors;
}

export interface DesignerPlayerBalance {
  radius: number;
  speed: number;
  mouseFollowSlowdown: number;
  maxHealth: number;
  invulnerabilityDuration: number;
  visualScale: number;
  shotCooldown: number;
}

export interface DesignerEnemyBalance {
  hp: number;
  hitRadius: number;
  speed: [number, number];
  value: number;
  visualScale: number;
  shootTimerRange?: [number, number];
  homingShootTimerRange?: [number, number];
}

export interface DesignerBossBalance {
  hp: number;
  hitRadius: number;
  speed: number;
  shootInterval: number;
  homingShootInterval: number;
  value: number;
  visualScale: number;
}

export interface DesignerWeaponBalance {
  speed: number;
  damage: number;
  hitRadius: number;
  life: number;
  turnSpeed: number;
}

export interface DesignerEnemyProjectileBalance {
  speed: number;
  radius?: number;
  hitRadius?: number;
  hp: number;
  turnSpeed?: number;
  life: number;
}

export interface DesignerBonusBalance {
  driftSpeed: number;
  hitRadius: number;
  buffDuration: number;
  rotationInterval: number;
}

export interface DesignerSpawningBalance {
  waveInterval: number;
  bossAppearTime: number;
  bgScrollSpeed: number;
}

export interface DesignerBalance {
  player: DesignerPlayerBalance;
  enemies: {
    coccus: DesignerEnemyBalance;
    bacillus: DesignerEnemyBalance;
    phage: DesignerEnemyBalance;
  };
  boss: DesignerBossBalance;
  weapons: Record<string, DesignerWeaponBalance>;
  enemyProjectiles: {
    straight: DesignerEnemyProjectileBalance;
    homing: DesignerEnemyProjectileBalance;
  };
  bonus: DesignerBonusBalance;
  spawning: DesignerSpawningBalance;
}

export interface DesignerLevelTheme {
  background: string;
  textureA: string;
  textureB: string;
  wall: string;
  wallDark: string;
  innerLine: string;
  accent: string;
  panelFill: string;
  panelEdge: string;
}

export interface DesignerLevelGeometry {
  topBase: number;
  bottomBase: number;
  wave: number;
  secondaryWave: number;
  topFrequency: number;
  bottomFrequency: number;
  topPhase: number;
  bottomPhase: number;
}

export interface DesignerLevelParallaxLayer {
  imageUrl: string;
  speed: number;
  alpha?: number;
  scale?: number;
  verticalDrift?: number;
}

export type DesignerEnemyTimelineEventKind = 'wave' | 'burst' | 'formation' | 'reward' | 'suppressAuto';
export type DesignerEnemyTimelineFormation = 'scattered' | 'line' | 'column' | 'diagonalDown' | 'diagonalUp' | 'wedge' | 'arc';
export type DesignerEnemyTimelineEnemyType = 'coccus' | 'bacillus' | 'phage' | 'mixed';

export interface DesignerEnemyTimelineEvent {
  id: string;
  time: number;
  kind: DesignerEnemyTimelineEventKind;
  label?: string;
  enemyType?: DesignerEnemyTimelineEnemyType;
  count?: number;
  duration?: number;
  formation?: DesignerEnemyTimelineFormation;
  yRange?: [number, number];
  suppressAuto?: boolean;
  intensityTag?: 'breather' | 'normal' | 'pressure' | 'panic';
}

export interface DesignerEnemyTimeline {
  enabled: boolean;
  autoWavesEnabled: boolean;
  events: DesignerEnemyTimelineEvent[];
}

export interface DesignerLevel {
  id: number;
  title: string;
  shortTitle: string;
  location: string;
  description: string;
  unlockHint: string;
  environment: string;
  theme: DesignerLevelTheme;
  imageUrl?: string;
  parallax?: {
    layers: DesignerLevelParallaxLayer[];
  };
  geometry: DesignerLevelGeometry;
  scrollSpeed: number;
  waveInterval: number;
  bossAppearTime: number;
  waveSize: [number, number];
  enemySpeedMultiplier: number;
  enemyHpBonus: number;
  phageShootInterval: number;
  phageHomingShootInterval: number;
  bossHp: number;
  bossValue: number;
  bossShootInterval: number;
  bossHomingShootInterval: number;
  availableWeaponBonuses: number[];
  enemyTimeline?: DesignerEnemyTimeline;
  enemyMix: {
    coccusStart: number;
    coccusEnd: number;
    bacillusStart: number;
    bacillusEnd: number;
  };
}

export interface DesignerSpritePaths {
  player: string;
  enemyCoccus: string;
  enemyBacillus: string;
  enemyPhage: string;
  boss: string;
  bulletRed: string;
  bulletBlue: string;
  bulletAntibody: string;
  bulletGreen: string;
  bulletPurple: string;
  enemyShot: string;
  enemyShotHoming: string;
  heart: string;
  heartEmpty: string;
  bonus: string;
}

export interface DesignerConfig {
  version: number;
  constants: DesignerConstants;
  balance: DesignerBalance;
  levels: DesignerLevel[];
  assets: {
    sprites: DesignerSpritePaths;
  };
}

export const DESIGNER_CONFIG = rawDesignerConfig as unknown as DesignerConfig;

export function hexToNumber(value: string, fallback = 0): number {
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback;
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function tuple2(value: readonly number[], fallback: readonly [number, number]): readonly [number, number] {
  return [value[0] ?? fallback[0], value[1] ?? fallback[1]] as const;
}
