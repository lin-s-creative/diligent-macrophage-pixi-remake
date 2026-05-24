export const WIDTH = 960;
export const HEIGHT = 540;
export const PLAYER_RADIUS = 28;
export const BASE_VESSEL_TOP = 82;
export const BASE_VESSEL_BOTTOM = HEIGHT - 82;
export const VESSEL_WAVE = 20;
export const PLAYER_SPEED = 4;
export const BG_SCROLL_SPEED = 1;
export const SHOT_COOLDOWN = 0.25;
export const WAVE_INTERVAL = 2;
export const BOSS_APPEAR_TIME = 60;
export const TWO_PI = Math.PI * 2;

export const COLORS = {
  plasmaDark: 0x200813,
  plasmaMid: 0x5e1224,
  plasmaLight: 0x9a2738,
  vesselWall: 0x76182a,
  vesselWallDark: 0x3e0b18,
  player: 0xf5e1c8,
  playerEdge: 0xd2a89f,
  redWeapon: 0xe9413e,
  blueWeapon: 0x44a3ff,
  yellowWeapon: 0xffdc4d,
  coccus: 0x66c653,
  bacillus: 0x8c4dd3,
  phage: 0x8b1e2e,
  boss: 0xb94a62,
  enemyShot: 0xff7c7c,
  white: 0xfff3df,
  black: 0x0b0306
} as const;
