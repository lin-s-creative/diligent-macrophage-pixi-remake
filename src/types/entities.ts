import type { Container, Graphics } from 'pixi.js';

export type SceneName = 'menu' | 'game';
export type EnemyKind = 'coccus' | 'bacillus' | 'phage';
export type ResultTitle = 'ПОБЕДА' | 'ИГРА ОКОНЧЕНА';
export type WeaponType = 1 | 2 | 3 | 4 | 5;
export type WeaponBonusType = 2 | 3 | 4 | 5;
export type EnemyBulletType = 'straight' | 'homing';

export interface PlayerEntity {
  kind: 'player';
  container: Container;
  visual: Graphics;
  hitRadius: number;
  /** Designer-tunable base render scale (from PLAYER_VISUAL_SCALE). Transient animations should multiply, not overwrite, this value. */
  baseScale: number;
  health: number;
  maxHealth: number;
  invulnerableTimer: number;
  blinkTimer: number;
  amoebaTimer: number;
  amoebaSeed: number;
  speed: number;
}

export interface PlayerBulletEntity {
  kind: 'playerBullet';
  weaponType: WeaponType;
  container: Container;
  visual: Graphics;
  hitRadius: number;
  damage: number;
  speed: number;
  vx: number;
  vy: number;
  turnSpeed: number;
  life: number;
}

export interface EnemyEntity {
  kind: EnemyKind;
  container: Container;
  visual: Graphics;
  hp: number;
  maxHp: number;
  speed: number;
  hitRadius: number;
  /** Designer-tunable base render scale (from ENEMY_VISUAL_SCALES). Hit-flash and other transient animations should multiply, not overwrite, this value. */
  baseScale: number;
  wobble: number;
  shootTimer: number;
  homingShootTimer: number;
  value: number;
  rewardGroupId?: number;
}

export interface RewardGroupState {
  id: number;
  remaining: number;
  failed: boolean;
}

export interface BossEntity {
  kind: 'boss';
  container: Container;
  visual: Graphics;
  hp: number;
  maxHp: number;
  hitRadius: number;
  /** Designer-tunable base render scale (from ENEMY_VISUAL_SCALES.boss). Hit-flash should multiply, not overwrite, this value. */
  baseScale: number;
  speed: number;
  phase: number;
  shootTimer: number;
  homingShootTimer: number;
  entered: boolean;
  value: number;
}

export interface EnemyBulletEntity {
  kind: 'enemyBullet';
  bulletType: EnemyBulletType;
  container: Container;
  visual: Graphics;
  hitRadius: number;
  vx: number;
  vy: number;
  speed: number;
  turnSpeed: number;
  hp: number;
  maxHp: number;
  life: number;
}

export interface BonusEntity {
  kind: 'bonus';
  type: WeaponBonusType;
  availableTypes: WeaponBonusType[];
  rotationIndex: number;
  rotationTimer: number;
  container: Container;
  visual: Graphics;
  hitRadius: number;
  vx: number;
  wobble: number;
  seed: number;
}

export interface ParticleEntity {
  container: Container;
  visual: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hitRadius: number;
}
