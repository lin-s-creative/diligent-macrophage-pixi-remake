import type { LevelConfig } from '../config/levels';

export function vesselTopAt(x: number, level: LevelConfig): number {
  const { geometry } = level;
  return geometry.topBase
    + Math.sin(x * geometry.topFrequency) * geometry.wave
    + Math.sin(x * 0.037 + geometry.topPhase) * geometry.secondaryWave;
}

export function vesselBottomAt(x: number, level: LevelConfig): number {
  const { geometry } = level;
  return geometry.bottomBase
    + Math.sin(x * geometry.bottomFrequency + geometry.bottomPhase) * geometry.wave
    + Math.cos(x * 0.032) * (geometry.secondaryWave + 1);
}
