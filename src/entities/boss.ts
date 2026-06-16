import { Container, Graphics } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { BOSS } from '../config/balance';
import { createSprite } from '../render/spriteSheet';
import type { BossEntity } from '../types/entities';

export function createBoss(): BossEntity {
  const container = new Container();
  container.x = WIDTH + 120;
  container.y = HEIGHT / 2;

  // SVG sprite as primary visual
  const sprite = createSprite('boss', 280, 220);
  container.addChild(sprite);

  // Graphics overlay for hit-flash effects
  const visual = new Graphics();
  container.addChild(visual);

  const scale = BOSS.visualScale;
  container.scale.set(scale);

  return {
    kind: 'boss',
    container,
    visual,
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    hitRadius: BOSS.hitRadius * scale,
    baseScale: scale,
    speed: BOSS.speed,
    phase: 0,
    shootTimer: BOSS.shootInterval,
    homingShootTimer: BOSS.homingShootInterval,
    entered: false,
    value: BOSS.value
  };
}
