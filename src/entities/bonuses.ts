import { Container, Graphics, Sprite } from 'pixi.js';
import { BONUS_TYPE_ROTATION_INTERVAL, TWO_PI } from '../config/constants';
import { createSprite, bulletSpriteKey, getSpriteTexture } from '../render/spriteSheet';
import type { BonusEntity, WeaponBonusType } from '../types/entities';
import { randomRange } from '../utils/math';

export function redrawBonus(bonus: BonusEntity): void {
  // Swap the sprite texture to match current bonus type
  // The weapon icon sprite is at index 1 (behind it is the bg capsule at 0)
  const sprite = bonus.container.getChildAt(1) as Sprite;
  const key = bulletSpriteKey(bonus.type);
  sprite.texture = getSpriteTexture(key);
}

export function advanceBonusType(bonus: BonusEntity): void {
  if (bonus.availableTypes.length <= 1) return;

  bonus.rotationIndex = (bonus.rotationIndex + 1) % bonus.availableTypes.length;
  bonus.type = bonus.availableTypes[bonus.rotationIndex];
  redrawBonus(bonus);
}

export function createBonus(availableTypes: readonly WeaponBonusType[], x: number, y: number): BonusEntity {
  const container = new Container();
  container.x = x;
  container.y = y;

  const safeTypes = availableTypes.length > 0 ? [...availableTypes] : [2 as WeaponBonusType];
  const rotationIndex = 0;
  const initialType = safeTypes[rotationIndex];

  // SVG sprite showing the bonus weapon icon
  const key = bulletSpriteKey(initialType);
  const sprite = createSprite(key, 48, 48);
  container.addChild(sprite);

  // Background capsule sprite behind the weapon icon
  const bg = createSprite('bonus', 64, 48);
  container.addChildAt(bg, 0);

  // Graphics overlay for sparkle effects
  const visual = new Graphics();
  container.addChild(visual);

  const bonus: BonusEntity = {
    kind: 'bonus',
    type: initialType,
    availableTypes: safeTypes,
    rotationIndex,
    rotationTimer: BONUS_TYPE_ROTATION_INTERVAL,
    container,
    visual,
    hitRadius: 18,
    vx: -1.4,
    wobble: randomRange(0, TWO_PI),
    seed: Math.random() * 10
  };

  return bonus;
}
