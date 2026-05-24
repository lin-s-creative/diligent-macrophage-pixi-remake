import type { Container, Graphics } from 'pixi.js';

export type SceneName = 'menu' | 'game';
export type EnemyKind = 'coccus' | 'bacillus' | 'phage';
export type ResultTitle = 'ПОБЕДА' | 'ИГРА ОКОНЧЕНА';
export type WeaponType = 1 | 2 | 3;

export interface PlayerEntity {
  kind: 'player';
  container: Container;
  visual: Graphics;
  hitRadius: number;
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
  wobble: number;
  shootTimer: number;
  value: number;
}

export interface BossEntity {
  kind: 'boss';
  container: Container;
  visual: Graphics;
  hp: number;
  maxHp: number;
  hitRadius: number;
  speed: number;
  phase: number;
  shootTimer: number;
  entered: boolean;
  value: number;
}

export interface EnemyBulletEntity {
  kind: 'enemyBullet';
  container: Container;
  visual: Graphics;
  hitRadius: number;
  vx: number;
  vy: number;
  life: number;
}

export interface BonusEntity {
  kind: 'bonus';
  type: WeaponType;
  container: Container;
  visual: Graphics;
  hitRadius: number;
  vx: number;
  wobble: number;
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
