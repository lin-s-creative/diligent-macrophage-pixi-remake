import { Sprite, Texture } from 'pixi.js';
import { DESIGNER_CONFIG } from '../config/designerConfig';

/**
 * Central registry of all SVG sprite paths.
 * Values are loaded from designerConfig.json so the designer panel can swap art.
 */
export const SPRITE_PATHS = {
  player: DESIGNER_CONFIG.assets.sprites.player,
  enemyCoccus: DESIGNER_CONFIG.assets.sprites.enemyCoccus,
  enemyBacillus: DESIGNER_CONFIG.assets.sprites.enemyBacillus,
  enemyPhage: DESIGNER_CONFIG.assets.sprites.enemyPhage,
  boss: DESIGNER_CONFIG.assets.sprites.boss,
  bulletRed: DESIGNER_CONFIG.assets.sprites.bulletRed,
  bulletBlue: DESIGNER_CONFIG.assets.sprites.bulletBlue,
  bulletAntibody: DESIGNER_CONFIG.assets.sprites.bulletAntibody,
  bulletGreen: DESIGNER_CONFIG.assets.sprites.bulletGreen,
  bulletPurple: DESIGNER_CONFIG.assets.sprites.bulletPurple,
  enemyShot: DESIGNER_CONFIG.assets.sprites.enemyShot,
  enemyShotHoming: DESIGNER_CONFIG.assets.sprites.enemyShotHoming,
  heart: DESIGNER_CONFIG.assets.sprites.heart,
  heartEmpty: DESIGNER_CONFIG.assets.sprites.heartEmpty,
  bonus: DESIGNER_CONFIG.assets.sprites.bonus
} as const;

export type SpriteKey = keyof typeof SPRITE_PATHS;

const textureCache = new Map<string, Texture>();

/**
 * Get or create a cached Texture from an SVG path.
 */
export function getSpriteTexture(key: SpriteKey): Texture {
  const path = SPRITE_PATHS[key];
  let tex = textureCache.get(path);
  if (!tex) {
    tex = Texture.from(path);
    textureCache.set(path, tex);
  }
  return tex;
}

/**
 * Create a new Sprite from the registry, centered at anchor (0.5, 0.5).
 * Optionally set width/height to override natural SVG size.
 */
export function createSprite(key: SpriteKey, width?: number, height?: number): Sprite {
  const sprite = new Sprite(getSpriteTexture(key));
  sprite.anchor.set(0.5, 0.5);
  if (width !== undefined) sprite.width = width;
  if (height !== undefined) sprite.height = height;
  return sprite;
}

/**
 * Map weapon type number to bullet sprite key.
 */
export function bulletSpriteKey(weaponType: number): SpriteKey {
  switch (weaponType) {
    case 1: return 'bulletRed';
    case 2: return 'bulletBlue';
    case 3: return 'bulletAntibody';
    case 4: return 'bulletGreen';
    case 5: return 'bulletPurple';
    default: return 'bulletRed';
  }
}

/**
 * Map enemy type string to sprite key.
 */
export function enemySpriteKey(enemyType: string): SpriteKey {
  switch (enemyType) {
    case 'bacillus': return 'enemyBacillus';
    case 'phage': return 'enemyPhage';
    default: return 'enemyCoccus';
  }
}
