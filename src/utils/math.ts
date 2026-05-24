import type { Container } from 'pixi.js';

export interface Aabb {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundedEntity {
  container: Container;
  hitRadius?: number;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function rectsIntersect(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

export function getAabb(entity: BoundedEntity): Aabb {
  if (entity.hitRadius) {
    return {
      x: entity.container.x - entity.hitRadius,
      y: entity.container.y - entity.hitRadius,
      width: entity.hitRadius * 2,
      height: entity.hitRadius * 2
    };
  }

  const bounds = entity.container.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  };
}

export function removeFromArray<T>(array: T[], item: T): void {
  const index = array.indexOf(item);
  if (index !== -1) array.splice(index, 1);
}
