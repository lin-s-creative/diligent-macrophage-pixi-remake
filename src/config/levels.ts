import type { WeaponBonusType } from '../types/entities';
import { DESIGNER_CONFIG, hexToNumber } from './designerConfig';

export type LevelId = 1 | 2 | 3;
export type LevelEnvironment = 'vessel' | 'lungs' | 'bone';

export interface LevelTheme {
  background: number;
  textureA: number;
  textureB: number;
  wall: number;
  wallDark: number;
  innerLine: number;
  accent: number;
  panelFill: number;
  panelEdge: number;
}

export interface LevelGeometry {
  topBase: number;
  bottomBase: number;
  wave: number;
  secondaryWave: number;
  topFrequency: number;
  bottomFrequency: number;
  topPhase: number;
  bottomPhase: number;
}

export interface LevelEnemyMix {
  coccusStart: number;
  coccusEnd: number;
  bacillusStart: number;
  bacillusEnd: number;
}

export type EnemyTimelineEventKind = 'wave' | 'burst' | 'formation' | 'reward' | 'suppressAuto';
export type EnemyTimelineFormation = 'scattered' | 'line' | 'column' | 'diagonalDown' | 'diagonalUp' | 'wedge' | 'arc';
export type EnemyTimelineEnemyType = 'coccus' | 'bacillus' | 'phage' | 'mixed';
export type EnemyTimelineIntensityTag = 'breather' | 'normal' | 'pressure' | 'panic';

export interface EnemyTimelineEvent {
  id: string;
  time: number;
  kind: EnemyTimelineEventKind;
  label?: string;
  enemyType: EnemyTimelineEnemyType;
  count: number;
  duration: number;
  formation: EnemyTimelineFormation;
  yRange: readonly [number, number];
  suppressAuto: boolean;
  intensityTag: EnemyTimelineIntensityTag;
}

export interface EnemyTimelineConfig {
  enabled: boolean;
  autoWavesEnabled: boolean;
  events: readonly EnemyTimelineEvent[];
}

export interface LevelParallaxLayer {
  imageUrl: string;
  speed: number;
  alpha?: number;
  scale?: number;
  verticalDrift?: number;
}

export interface LevelParallaxBackground {
  layers: readonly LevelParallaxLayer[];
}

export interface LevelConfig {
  id: LevelId;
  title: string;
  shortTitle: string;
  location: string;
  description: string;
  unlockHint: string;
  environment: LevelEnvironment;
  theme: LevelTheme;
  /**
   * Optional fullscreen artwork shown on the level select slider.
   * Place files in /public/levels/ and reference as '/levels/level-1.jpg'.
   */
  imageUrl?: string;
  parallax?: LevelParallaxBackground;
  geometry: LevelGeometry;
  scrollSpeed: number;
  waveInterval: number;
  bossAppearTime: number;
  waveSize: readonly [number, number];
  enemySpeedMultiplier: number;
  enemyHpBonus: number;
  phageShootInterval: number;
  phageHomingShootInterval: number;
  bossHp: number;
  bossValue: number;
  bossShootInterval: number;
  bossHomingShootInterval: number;
  availableWeaponBonuses: readonly WeaponBonusType[];
  enemyTimeline: EnemyTimelineConfig;
  enemyMix: LevelEnemyMix;
}

function coerceEnvironment(value: string): LevelEnvironment {
  if (value === 'lungs' || value === 'bone') return value;
  return 'vessel';
}

function coerceWeaponBonus(value: number): WeaponBonusType {
  if (value >= 5) return 5;
  if (value >= 4) return 4;
  if (value >= 3) return 3;
  return 2;
}

function convertTimelineEvent(event: NonNullable<typeof DESIGNER_CONFIG.levels[number]['enemyTimeline']>['events'][number], index: number): EnemyTimelineEvent {
  const kind = event.kind === 'burst' || event.kind === 'formation' || event.kind === 'reward' || event.kind === 'suppressAuto' ? event.kind : 'wave';
  const enemyType = event.enemyType === 'bacillus' || event.enemyType === 'phage' || event.enemyType === 'mixed' ? event.enemyType : 'coccus';
  const formation = event.formation === 'line' || event.formation === 'column' || event.formation === 'diagonalDown' || event.formation === 'diagonalUp' || event.formation === 'wedge' || event.formation === 'arc' ? event.formation : 'scattered';
  const intensityTag = event.intensityTag === 'breather' || event.intensityTag === 'pressure' || event.intensityTag === 'panic' ? event.intensityTag : 'normal';
  const yRange = Array.isArray(event.yRange) ? [event.yRange[0] ?? 0.25, event.yRange[1] ?? 0.75] as const : [0.25, 0.75] as const;
  return {
    id: event.id || `timeline-${index + 1}`,
    time: Math.max(0, event.time ?? 0),
    kind,
    label: event.label,
    enemyType,
    count: Math.max(0, event.count ?? (kind === 'reward' ? 4 : 3)),
    duration: Math.max(0, event.duration ?? 0),
    formation,
    yRange,
    suppressAuto: Boolean(event.suppressAuto),
    intensityTag
  };
}

function convertEnemyTimeline(level: typeof DESIGNER_CONFIG.levels[number]): EnemyTimelineConfig {
  const source = level.enemyTimeline;
  if (!source) return { enabled: false, autoWavesEnabled: true, events: [] };
  return {
    enabled: Boolean(source.enabled),
    autoWavesEnabled: source.autoWavesEnabled !== false,
    events: Array.isArray(source.events) ? source.events.map(convertTimelineEvent).sort((a, b) => a.time - b.time) : []
  };
}

function convertLevel(level: typeof DESIGNER_CONFIG.levels[number]): LevelConfig {
  return {
    id: coerceLevelId(level.id),
    title: level.title,
    shortTitle: level.shortTitle,
    location: level.location,
    description: level.description,
    unlockHint: level.unlockHint,
    environment: coerceEnvironment(level.environment),
    theme: {
      background: hexToNumber(level.theme.background, 0x200813),
      textureA: hexToNumber(level.theme.textureA, 0x4f1020),
      textureB: hexToNumber(level.theme.textureB, 0x68172a),
      wall: hexToNumber(level.theme.wall, 0x76182a),
      wallDark: hexToNumber(level.theme.wallDark, 0x3e0b18),
      innerLine: hexToNumber(level.theme.innerLine, 0xff9d9d),
      accent: hexToNumber(level.theme.accent, 0xff9d84),
      panelFill: hexToNumber(level.theme.panelFill, 0xb9424e),
      panelEdge: hexToNumber(level.theme.panelEdge, 0xff9d84)
    },
    imageUrl: level.imageUrl,
    parallax: level.parallax ? {
      layers: level.parallax.layers.map((layer) => ({
        imageUrl: layer.imageUrl,
        speed: layer.speed,
        alpha: layer.alpha,
        scale: layer.scale,
        verticalDrift: layer.verticalDrift
      }))
    } : undefined,
    geometry: {
      topBase: level.geometry.topBase,
      bottomBase: level.geometry.bottomBase,
      wave: level.geometry.wave,
      secondaryWave: level.geometry.secondaryWave,
      topFrequency: level.geometry.topFrequency,
      bottomFrequency: level.geometry.bottomFrequency,
      topPhase: level.geometry.topPhase,
      bottomPhase: level.geometry.bottomPhase
    },
    scrollSpeed: level.scrollSpeed,
    waveInterval: level.waveInterval,
    bossAppearTime: level.bossAppearTime,
    waveSize: [level.waveSize[0], level.waveSize[1]] as const,
    enemySpeedMultiplier: level.enemySpeedMultiplier,
    enemyHpBonus: level.enemyHpBonus,
    phageShootInterval: level.phageShootInterval,
    phageHomingShootInterval: level.phageHomingShootInterval,
    bossHp: level.bossHp,
    bossValue: level.bossValue,
    bossShootInterval: level.bossShootInterval,
    bossHomingShootInterval: level.bossHomingShootInterval,
    availableWeaponBonuses: level.availableWeaponBonuses.map(coerceWeaponBonus),
    enemyTimeline: convertEnemyTimeline(level),
    enemyMix: {
      coccusStart: level.enemyMix.coccusStart,
      coccusEnd: level.enemyMix.coccusEnd,
      bacillusStart: level.enemyMix.bacillusStart,
      bacillusEnd: level.enemyMix.bacillusEnd
    }
  };
}

export function coerceLevelId(value: number): LevelId {
  if (value >= 3) return 3;
  if (value >= 2) return 2;
  return 1;
}

export const LEVELS: readonly LevelConfig[] = DESIGNER_CONFIG.levels.map(convertLevel);

export const DEFAULT_LEVEL = LEVELS[0];
export const DEFAULT_UNLOCKED_LEVEL_ID: LevelId = 1;
export const UNLOCKED_LEVEL_STORAGE_KEY = 'macrophage.unlockedLevel';

export function getLevelById(levelId: LevelId): LevelConfig {
  return LEVELS.find((level) => level.id === levelId) ?? DEFAULT_LEVEL;
}

export function getNextLevel(levelId: LevelId): LevelConfig | null {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  return index >= 0 ? LEVELS[index + 1] ?? null : null;
}

export function readUnlockedLevelId(): LevelId {
  if (typeof window === 'undefined') return DEFAULT_UNLOCKED_LEVEL_ID;
  const stored = Number(window.localStorage.getItem(UNLOCKED_LEVEL_STORAGE_KEY));
  return coerceLevelId(Number.isFinite(stored) ? stored : DEFAULT_UNLOCKED_LEVEL_ID);
}

export function saveUnlockedLevelId(levelId: LevelId): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UNLOCKED_LEVEL_STORAGE_KEY, String(levelId));
}
