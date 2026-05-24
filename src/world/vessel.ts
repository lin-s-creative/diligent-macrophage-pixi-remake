import { BASE_VESSEL_BOTTOM, BASE_VESSEL_TOP, VESSEL_WAVE } from '../config/constants';

export function vesselTopAt(x: number): number {
  return BASE_VESSEL_TOP + Math.sin(x * 0.014) * VESSEL_WAVE + Math.sin(x * 0.037 + 1.3) * 7;
}

export function vesselBottomAt(x: number): number {
  return BASE_VESSEL_BOTTOM + Math.sin(x * 0.012 + 2.5) * VESSEL_WAVE + Math.cos(x * 0.032) * 8;
}
