import { Container, Graphics, Sprite } from 'pixi.js';
import { HEIGHT } from '../config/constants';
import { PLAYER } from '../config/balance';
import { createSprite } from '../render/spriteSheet';
import type { PlayerEntity } from '../types/entities';

export function createPlayer(): PlayerEntity {
  const container = new Container();
  container.x = 125;
  container.y = HEIGHT / 2;

  // SVG sprite as primary visual
  const sprite = createSprite('player', 80, 80);
  container.addChild(sprite);

  // Graphics overlay for invulnerability blink effects
  const visual = new Graphics();
  container.addChild(visual);

  const scale = PLAYER.visualScale;
  container.scale.set(scale);

  const entity: PlayerEntity = {
    kind: 'player',
    container,
    visual,
    hitRadius: PLAYER.radius * scale,
    baseScale: scale,
    health: PLAYER.maxHealth,
    maxHealth: PLAYER.maxHealth,
    invulnerableTimer: 0,
    blinkTimer: 0,
    amoebaTimer: 0,
    amoebaSeed: 0,
    speed: PLAYER.speed
  };

  return entity;
}

/**
 * Animate the player sprite with a subtle organic pulse.
 * Called each frame — replaces the old procedural redraw.
 */
export function redrawPlayer(entity: PlayerEntity, _stretch = 0): void {
  // Animate amoeba-like pulsation via scale on the sprite child
  const sprite = entity.container.getChildAt(0) as Sprite;
  const pulse = 1 + Math.sin(entity.amoebaSeed * 2) * 0.04;
  const pulseY = 1 + Math.cos(entity.amoebaSeed * 1.7) * 0.03;
  sprite.scale.set(pulse, pulseY);

  // Slight rotation wobble
  sprite.rotation = Math.sin(entity.amoebaSeed * 1.3) * 0.06;
}
