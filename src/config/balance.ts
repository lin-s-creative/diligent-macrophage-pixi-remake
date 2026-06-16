/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BALANCE SHEET — Game Designer Tuning Page
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Runtime values are loaded from designerConfig.json so the in-game designer
 * panel can save tuning directly into the project without regenerating TS files.
 *
 * Units:
 *   speed      — pixels per frame (60 fps)
 *   radius     — pixels (before visual scale)
 *   time       — seconds
 *   hp/damage  — abstract hit-points
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { DESIGNER_CONFIG, tuple2 } from './designerConfig';

const { balance } = DESIGNER_CONFIG;

// ─── PLAYER (Macrophage) ─────────────────────────────────────────────────────

export const PLAYER = {
  radius: balance.player.radius,
  speed: balance.player.speed,
  mouseFollowSlowdown: balance.player.mouseFollowSlowdown,
  maxHealth: balance.player.maxHealth,
  invulnerabilityDuration: balance.player.invulnerabilityDuration,
  visualScale: balance.player.visualScale,
  shotCooldown: balance.player.shotCooldown,
} as const;

// ─── ENEMIES ─────────────────────────────────────────────────────────────────

export const ENEMY_COCCUS = {
  hp: balance.enemies.coccus.hp,
  hitRadius: balance.enemies.coccus.hitRadius,
  speed: tuple2(balance.enemies.coccus.speed, [1.8, 2.7]),
  value: balance.enemies.coccus.value,
  visualScale: balance.enemies.coccus.visualScale,
} as const;

export const ENEMY_BACILLUS = {
  hp: balance.enemies.bacillus.hp,
  hitRadius: balance.enemies.bacillus.hitRadius,
  speed: tuple2(balance.enemies.bacillus.speed, [1.2, 2.0]),
  value: balance.enemies.bacillus.value,
  visualScale: balance.enemies.bacillus.visualScale,
} as const;

export const ENEMY_PHAGE = {
  hp: balance.enemies.phage.hp,
  hitRadius: balance.enemies.phage.hitRadius,
  speed: tuple2(balance.enemies.phage.speed, [1.0, 1.7]),
  value: balance.enemies.phage.value,
  visualScale: balance.enemies.phage.visualScale,
  shootTimerRange: tuple2(balance.enemies.phage.shootTimerRange ?? [0.3, 1.3], [0.3, 1.3]),
  homingShootTimerRange: tuple2(balance.enemies.phage.homingShootTimerRange ?? [2.0, 4.6], [2.0, 4.6]),
} as const;

// ─── BOSS ────────────────────────────────────────────────────────────────────

export const BOSS = {
  hp: balance.boss.hp,
  hitRadius: balance.boss.hitRadius,
  speed: balance.boss.speed,
  shootInterval: balance.boss.shootInterval,
  homingShootInterval: balance.boss.homingShootInterval,
  value: balance.boss.value,
  visualScale: balance.boss.visualScale,
} as const;

// ─── WEAPONS (Player Bullet Types) ──────────────────────────────────────────

export const WEAPON_1_PHAGOCYTOSIS = {
  speed: balance.weapons['1'].speed,
  damage: balance.weapons['1'].damage,
  hitRadius: balance.weapons['1'].hitRadius,
  life: balance.weapons['1'].life,
  turnSpeed: balance.weapons['1'].turnSpeed,
} as const;

export const WEAPON_2_PLASMA = {
  speed: balance.weapons['2'].speed,
  damage: balance.weapons['2'].damage,
  hitRadius: balance.weapons['2'].hitRadius,
  life: balance.weapons['2'].life,
  turnSpeed: balance.weapons['2'].turnSpeed,
} as const;

export const WEAPON_3_ANTIBODY = {
  speed: balance.weapons['3'].speed,
  damage: balance.weapons['3'].damage,
  hitRadius: balance.weapons['3'].hitRadius,
  life: balance.weapons['3'].life,
  turnSpeed: balance.weapons['3'].turnSpeed,
} as const;

export const WEAPON_4_CYTOKINE = {
  speed: balance.weapons['4'].speed,
  damage: balance.weapons['4'].damage,
  hitRadius: balance.weapons['4'].hitRadius,
  life: balance.weapons['4'].life,
  turnSpeed: balance.weapons['4'].turnSpeed,
} as const;

export const WEAPON_5_HEAVY = {
  speed: balance.weapons['5'].speed,
  damage: balance.weapons['5'].damage,
  hitRadius: balance.weapons['5'].hitRadius,
  life: balance.weapons['5'].life,
  turnSpeed: balance.weapons['5'].turnSpeed,
} as const;

// ─── ENEMY PROJECTILES ───────────────────────────────────────────────────────

export const ENEMY_SHOT_STRAIGHT = {
  speed: balance.enemyProjectiles.straight.speed,
  radius: balance.enemyProjectiles.straight.radius ?? 8,
  hp: balance.enemyProjectiles.straight.hp,
  life: balance.enemyProjectiles.straight.life,
} as const;

export const ENEMY_SHOT_HOMING = {
  speed: balance.enemyProjectiles.homing.speed,
  hitRadius: balance.enemyProjectiles.homing.hitRadius ?? 15,
  hp: balance.enemyProjectiles.homing.hp,
  turnSpeed: balance.enemyProjectiles.homing.turnSpeed ?? 0.038,
  life: balance.enemyProjectiles.homing.life,
} as const;

// ─── BONUSES / PICKUPS ───────────────────────────────────────────────────────

export const BONUS = {
  driftSpeed: balance.bonus.driftSpeed,
  hitRadius: balance.bonus.hitRadius,
  buffDuration: balance.bonus.buffDuration,
  rotationInterval: balance.bonus.rotationInterval,
} as const;

// ─── WAVE / SPAWN TIMING ─────────────────────────────────────────────────────

export const SPAWNING = {
  waveInterval: balance.spawning.waveInterval,
  bossAppearTime: balance.spawning.bossAppearTime,
  bgScrollSpeed: balance.spawning.bgScrollSpeed,
} as const;
