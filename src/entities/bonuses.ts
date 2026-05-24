import { Container, Graphics } from 'pixi.js';
import { drawIrregularBlob, randomBonusColor } from '../render/drawing';
import type { BonusEntity, WeaponType } from '../types/entities';
import { randomRange } from '../utils/math';
import { TWO_PI } from '../config/constants';

export function createBonus(type: WeaponType, x: number, y: number): BonusEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
  const visual = new Graphics();
  const color = randomBonusColor(type);
  drawIrregularBlob(visual, 14, color, 0xfff0d2, Math.random() * 10, 11, 0.95);
  container.addChild(visual);

  return {
    kind: 'bonus',
    type,
    container,
    visual,
    hitRadius: 18,
    vx: -1.4,
    wobble: randomRange(0, TWO_PI)
  };
}
