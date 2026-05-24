import { Container, Graphics } from 'pixi.js';
import { TWO_PI } from '../config/constants';
import type { ParticleEntity } from '../types/entities';
import { randomRange } from '../utils/math';

export function createParticle(x: number, y: number, color: number): ParticleEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
  const visual = new Graphics();
  const radius = randomRange(3, 7);
  visual.beginFill(color, 0.95);
  visual.drawCircle(0, 0, radius);
  visual.endFill();
  container.addChild(visual);
  const angle = randomRange(0, TWO_PI);
  const speed = randomRange(1.1, 3.4);

  return {
    container,
    visual,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: randomRange(0.32, 0.65),
    maxLife: 0.65,
    hitRadius: radius
  };
}
