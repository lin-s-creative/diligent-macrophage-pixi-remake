import { Container, Graphics } from 'pixi.js';
import { COLORS, HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, TWO_PI } from '../config/constants';
import type { PlayerEntity } from '../types/entities';

export function createPlayer(): PlayerEntity {
  const container = new Container();
  container.x = 125;
  container.y = HEIGHT / 2;

  const visual = new Graphics();
  container.addChild(visual);

  const entity: PlayerEntity = {
    kind: 'player',
    container,
    visual,
    hitRadius: PLAYER_RADIUS,
    health: 5,
    maxHealth: 5,
    invulnerableTimer: 0,
    blinkTimer: 0,
    amoebaTimer: 0,
    amoebaSeed: 0,
    speed: PLAYER_SPEED
  };

  redrawPlayer(entity, 0);
  return entity;
}

export function redrawPlayer(entity: PlayerEntity, stretch = 0): void {
  const g = entity.visual;
  g.clear();
  g.lineStyle(4, COLORS.playerEdge, 0.95);
  g.beginFill(COLORS.player, 1);

  const seed = entity.amoebaSeed;
  const points = 20;
  const verts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * TWO_PI;
    const backward = Math.cos(angle) < -0.2 ? stretch : 0;
    const pseudopod = 1 + 0.2 * Math.sin(seed + i * 1.9) + 0.09 * Math.cos(seed * 1.7 - i);
    let r = PLAYER_RADIUS * pseudopod;
    if (i === 8 || i === 9 || i === 11 || i === 12) r += 7 + 5 * Math.sin(seed + i);
    const x = Math.cos(angle) * (r + backward * 9);
    const y = Math.sin(angle) * (r * 0.88 + Math.sin(seed + i) * 2);
    verts.push({ x, y });
  }

  g.moveTo(verts[0].x, verts[0].y);
  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];
    g.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }
  g.closePath();
  g.endFill();

  g.beginFill(0xffffff, 0.17);
  g.drawEllipse(-8, -10, 12, 7);
  g.endFill();
  g.beginFill(0xeab4ad, 0.5);
  g.drawCircle(8, 4, 6);
  g.endFill();
}
