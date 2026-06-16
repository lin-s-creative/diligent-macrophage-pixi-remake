import { WIDTH } from '../config/constants';
import type { EnemyTimelineFormation } from '../config/levels';

export interface EnemyPlacementPoint {
  x: number;
  yT: number;
}

export function deterministicUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function enemySpawnXForIndex(index: number, duration = 0, seed = 'event'): number {
  const spacing = 34 + deterministicUnit(`${seed}:x:${index}`) * 42;
  return WIDTH + 40 + index * spacing + duration * 42;
}

export function enemyPlacementTForIndex(
  index: number,
  total: number,
  formation: EnemyTimelineFormation,
  yRange: readonly [number, number],
  seed = 'event'
): number {
  const minT = Math.min(Math.max(Math.min(yRange[0], yRange[1]), 0), 1);
  const maxT = Math.min(Math.max(Math.max(yRange[0], yRange[1]), 0), 1);
  const t = total <= 1 ? 0.5 : index / (total - 1);

  if (formation === 'line' || formation === 'column') return minT + (maxT - minT) * t;
  if (formation === 'diagonalDown') return minT + (maxT - minT) * t;
  if (formation === 'diagonalUp') return maxT - (maxT - minT) * t;
  if (formation === 'wedge') return minT + (maxT - minT) * (0.5 + (index % 2 === 0 ? -0.28 : 0.28) * Math.min(1, index / Math.max(1, total - 1)));
  if (formation === 'arc') return minT + (maxT - minT) * (0.5 + Math.sin((t - 0.5) * Math.PI) * 0.38);
  return minT + (maxT - minT) * deterministicUnit(`${seed}:y:${index}`);
}

export function enemyPlacementPreview(
  count: number,
  formation: EnemyTimelineFormation,
  yRange: readonly [number, number],
  duration = 0,
  seed = 'event'
): EnemyPlacementPoint[] {
  const total = Math.max(0, Math.floor(count));
  return Array.from({ length: total }, (_, index) => ({
    x: enemySpawnXForIndex(index, duration, seed),
    yT: enemyPlacementTForIndex(index, total, formation, yRange, seed)
  }));
}
