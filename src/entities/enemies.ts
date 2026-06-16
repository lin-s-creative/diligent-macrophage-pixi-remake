import { Container, Graphics } from 'pixi.js';
import { COLORS, TWO_PI } from '../config/constants';
import { ENEMY_COCCUS, ENEMY_BACILLUS, ENEMY_PHAGE } from '../config/balance';
import { createSprite, enemySpriteKey } from '../render/spriteSheet';
import type { EnemyEntity, EnemyKind } from '../types/entities';
import { randomRange } from '../utils/math';

export function markRewardGroupEnemy(enemy: EnemyEntity, groupId: number): void {
  enemy.rewardGroupId = groupId;
  // visual is rendered inside a scaled container, so divide world-space radii
  // back into local units to keep the ring's world padding constant.
  const s = enemy.container.scale.x || 1;
  const localHitR = enemy.hitRadius / s;
  enemy.visual.lineStyle(3, COLORS.yellowWeapon, 0.95);
  enemy.visual.drawCircle(0, 0, localHitR + 8 / s);
  enemy.visual.lineStyle(2, COLORS.white, 0.5);
  enemy.visual.drawCircle(0, 0, localHitR + 13 / s);
}

export function createEnemy(type: EnemyKind, x: number, y: number): EnemyEntity {
  const container = new Container();
  container.x = x;
  container.y = y;

  // SVG sprite as primary visual (added first = behind overlay)
  const spriteKey = enemySpriteKey(type);
  const sprite = createSprite(spriteKey);
  container.addChild(sprite);

  // Graphics overlay for hit-flash rings, reward markers, etc.
  const visual = new Graphics();
  container.addChild(visual);

  const enemy: EnemyEntity = {
    kind: type,
    container,
    visual,
    hp: 1,
    maxHp: 1,
    speed: randomRange(1.4, 2.2),
    hitRadius: 20,
    baseScale: 1,
    wobble: randomRange(0, TWO_PI),
    shootTimer: 0,
    homingShootTimer: randomRange(2.8, 5.2),
    value: 1
  };

  if (type === 'coccus') {
    enemy.hp = ENEMY_COCCUS.hp;
    enemy.maxHp = ENEMY_COCCUS.hp;
    enemy.hitRadius = ENEMY_COCCUS.hitRadius;
    enemy.speed = randomRange(ENEMY_COCCUS.speed[0], ENEMY_COCCUS.speed[1]);
    enemy.value = ENEMY_COCCUS.value;
    sprite.width = 56;
    sprite.height = 56;
  } else if (type === 'bacillus') {
    enemy.hp = ENEMY_BACILLUS.hp;
    enemy.maxHp = ENEMY_BACILLUS.hp;
    enemy.hitRadius = ENEMY_BACILLUS.hitRadius;
    enemy.speed = randomRange(ENEMY_BACILLUS.speed[0], ENEMY_BACILLUS.speed[1]);
    enemy.value = ENEMY_BACILLUS.value;
    sprite.width = 80;
    sprite.height = 44;
  } else {
    enemy.hp = ENEMY_PHAGE.hp;
    enemy.maxHp = ENEMY_PHAGE.hp;
    enemy.hitRadius = ENEMY_PHAGE.hitRadius;
    enemy.speed = randomRange(ENEMY_PHAGE.speed[0], ENEMY_PHAGE.speed[1]);
    enemy.shootTimer = randomRange(ENEMY_PHAGE.shootTimerRange[0], ENEMY_PHAGE.shootTimerRange[1]);
    enemy.homingShootTimer = randomRange(ENEMY_PHAGE.homingShootTimerRange[0], ENEMY_PHAGE.homingShootTimerRange[1]);
    enemy.value = ENEMY_PHAGE.value;
    sprite.width = 60;
    sprite.height = 96;
  }

  // Apply visual scale from balance config.
  const scaleMap = { coccus: ENEMY_COCCUS.visualScale, bacillus: ENEMY_BACILLUS.visualScale, phage: ENEMY_PHAGE.visualScale };
  const scale = scaleMap[type];
  enemy.baseScale = scale;
  container.scale.set(scale);
  enemy.hitRadius *= scale;

  return enemy;
}
