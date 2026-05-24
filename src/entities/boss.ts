import { Container, Graphics } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { drawBoss } from '../render/drawing';
import type { BossEntity } from '../types/entities';

export function createBoss(): BossEntity {
  const container = new Container();
  container.x = WIDTH + 120;
  container.y = HEIGHT / 2;
  const visual = new Graphics();
  container.addChild(visual);
  drawBoss(visual);

  return {
    kind: 'boss',
    container,
    visual,
    hp: 20,
    maxHp: 20,
    hitRadius: 78,
    speed: 1.2,
    phase: 0,
    shootTimer: 1.2,
    entered: false,
    value: 10
  };
}
