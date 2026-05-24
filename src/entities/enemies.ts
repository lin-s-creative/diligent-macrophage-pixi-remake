import { Container, Graphics } from 'pixi.js';
import { COLORS, TWO_PI } from '../config/constants';
import { drawBacillus, drawIrregularBlob, drawPhage } from '../render/drawing';
import type { EnemyEntity, EnemyKind } from '../types/entities';
import { randomRange } from '../utils/math';

export function createEnemy(type: EnemyKind, x: number, y: number): EnemyEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
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
    wobble: randomRange(0, TWO_PI),
    shootTimer: 0,
    value: 1
  };

  if (type === 'coccus') {
    enemy.hp = 1;
    enemy.maxHp = 1;
    enemy.hitRadius = 20;
    enemy.speed = randomRange(1.8, 2.7);
    enemy.value = 1;
    drawIrregularBlob(visual, 20, COLORS.coccus, 0x276e2e, Math.random() * 10, 14, 0.96);
  } else if (type === 'bacillus') {
    enemy.hp = 2;
    enemy.maxHp = 2;
    enemy.hitRadius = 30;
    enemy.speed = randomRange(1.2, 2.0);
    enemy.value = 2;
    drawBacillus(visual);
  } else {
    enemy.hp = 3;
    enemy.maxHp = 3;
    enemy.hitRadius = 28;
    enemy.speed = randomRange(1.0, 1.7);
    enemy.shootTimer = randomRange(0.3, 1.3);
    enemy.value = 3;
    drawPhage(visual);
  }

  return enemy;
}
