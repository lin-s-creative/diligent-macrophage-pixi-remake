import { Container, Graphics } from 'pixi.js';
import { COLORS } from '../config/constants';
import { WEAPON_1_PHAGOCYTOSIS, WEAPON_2_PLASMA, WEAPON_3_ANTIBODY, WEAPON_4_CYTOKINE, WEAPON_5_HEAVY, ENEMY_SHOT_STRAIGHT, ENEMY_SHOT_HOMING } from '../config/balance';
import { bulletSpriteKey, createSprite } from '../render/spriteSheet';
import type { EnemyBulletEntity, PlayerBulletEntity, WeaponType } from '../types/entities';

export function createBullet(type: WeaponType, x: number, y: number, angle = 0): PlayerBulletEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.rotation = angle;

  // SVG sprite as primary visual
  const key = bulletSpriteKey(type);
  const sprite = createSprite(key);
  container.addChild(sprite);

  // Graphics overlay (unused but kept for type compatibility)
  const visual = new Graphics();
  container.addChild(visual);

  const bullet: PlayerBulletEntity = {
    kind: 'playerBullet',
    weaponType: type,
    container,
    visual,
    hitRadius: WEAPON_1_PHAGOCYTOSIS.hitRadius,
    damage: WEAPON_1_PHAGOCYTOSIS.damage,
    speed: WEAPON_1_PHAGOCYTOSIS.speed,
    vx: Math.cos(angle) * WEAPON_1_PHAGOCYTOSIS.speed,
    vy: Math.sin(angle) * WEAPON_1_PHAGOCYTOSIS.speed,
    turnSpeed: 0,
    life: WEAPON_1_PHAGOCYTOSIS.life
  };

  if (type === 1) {
    sprite.width = 28;
    sprite.height = 28;
  } else if (type === 2) {
    bullet.speed = WEAPON_2_PLASMA.speed;
    bullet.vx = Math.cos(angle) * bullet.speed;
    bullet.vy = Math.sin(angle) * bullet.speed;
    bullet.hitRadius = WEAPON_2_PLASMA.hitRadius;
    bullet.damage = WEAPON_2_PLASMA.damage;
    sprite.width = 32;
    sprite.height = 28;
  } else if (type === 3) {
    bullet.speed = WEAPON_3_ANTIBODY.speed;
    bullet.vx = Math.cos(angle) * bullet.speed;
    bullet.vy = Math.sin(angle) * bullet.speed;
    bullet.damage = WEAPON_3_ANTIBODY.damage;
    bullet.hitRadius = WEAPON_3_ANTIBODY.hitRadius;
    bullet.turnSpeed = WEAPON_3_ANTIBODY.turnSpeed;
    sprite.width = 28;
    sprite.height = 28;
  } else if (type === 4) {
    bullet.speed = WEAPON_4_CYTOKINE.speed;
    bullet.vx = Math.cos(angle) * bullet.speed;
    bullet.vy = Math.sin(angle) * bullet.speed;
    bullet.damage = WEAPON_4_CYTOKINE.damage;
    bullet.hitRadius = WEAPON_4_CYTOKINE.hitRadius;
    sprite.width = 40;
    sprite.height = 24;
  } else {
    bullet.speed = WEAPON_5_HEAVY.speed;
    bullet.vx = Math.cos(angle) * bullet.speed;
    bullet.vy = Math.sin(angle) * bullet.speed;
    bullet.damage = WEAPON_5_HEAVY.damage;
    bullet.hitRadius = WEAPON_5_HEAVY.hitRadius;
    bullet.life = WEAPON_5_HEAVY.life;
    sprite.width = 52;
    sprite.height = 40;
  }

  return bullet;
}

export function createEnemyBullet(x: number, y: number, targetX: number, targetY: number, speed: number = ENEMY_SHOT_STRAIGHT.speed, radius: number = ENEMY_SHOT_STRAIGHT.radius): EnemyBulletEntity {
  const container = new Container();
  container.x = x;
  container.y = y;

  // SVG sprite
  const sprite = createSprite('enemyShot', radius * 2, radius * 2);
  container.addChild(sprite);

  // Graphics overlay
  const visual = new Graphics();
  container.addChild(visual);

  const angle = Math.atan2(targetY - y, targetX - x);
  container.rotation = angle;
  return {
    kind: 'enemyBullet',
    bulletType: 'straight',
    container,
    visual,
    hitRadius: radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    turnSpeed: 0,
    hp: 1,
    maxHp: 1,
    life: 6
  };
}

export function createEnemyHomingBullet(x: number, y: number, targetX: number, targetY: number, speed: number = ENEMY_SHOT_HOMING.speed): EnemyBulletEntity {
  const container = new Container();
  container.x = x;
  container.y = y;

  // SVG sprite
  const sprite = createSprite('enemyShotHoming', 48, 48);
  container.addChild(sprite);

  // Graphics overlay
  const visual = new Graphics();
  container.addChild(visual);

  const angle = Math.atan2(targetY - y, targetX - x);
  container.rotation = angle;
  return {
    kind: 'enemyBullet',
    bulletType: 'homing',
    container,
    visual,
    hitRadius: ENEMY_SHOT_HOMING.hitRadius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    turnSpeed: ENEMY_SHOT_HOMING.turnSpeed,
    hp: ENEMY_SHOT_HOMING.hp,
    maxHp: ENEMY_SHOT_HOMING.hp,
    life: ENEMY_SHOT_HOMING.life
  };
}
