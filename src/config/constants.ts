import { DESIGNER_CONFIG, hexToNumber } from './designerConfig';

const { constants, balance } = DESIGNER_CONFIG;

export const WIDTH = constants.width;
export const HEIGHT = constants.height;
export const PLAYER_RADIUS = balance.player.radius;
export const BASE_VESSEL_TOP = constants.baseVesselTop;
export const BASE_VESSEL_BOTTOM = constants.baseVesselBottom;
export const VESSEL_WAVE = constants.vesselWave;
export const PLAYER_SPEED = balance.player.speed;
export const PLAYER_MOUSE_FOLLOW_SLOWDOWN = balance.player.mouseFollowSlowdown;
export const BG_SCROLL_SPEED = balance.spawning.bgScrollSpeed;
export const SHOT_COOLDOWN = balance.player.shotCooldown;
export const WAVE_INTERVAL = balance.spawning.waveInterval;
export const BOSS_APPEAR_TIME = balance.spawning.bossAppearTime;
export const TWO_PI = Math.PI * 2;

export const WEAPON_BUFF_DURATION = balance.bonus.buffDuration;
export const BONUS_TYPE_ROTATION_INTERVAL = balance.bonus.rotationInterval;
export const ENEMY_HOMING_SHOT_BASE_SPEED = balance.enemyProjectiles.homing.speed;
export const ENEMY_HOMING_SHOT_TURN_SPEED = balance.enemyProjectiles.homing.turnSpeed ?? 0.038;
export const ENEMY_HOMING_SHOT_HP = balance.enemyProjectiles.homing.hp;

export const COLORS = {
  plasmaDark: hexToNumber(constants.colors.plasmaDark, 0x200813),
  plasmaMid: hexToNumber(constants.colors.plasmaMid, 0x5e1224),
  plasmaLight: hexToNumber(constants.colors.plasmaLight, 0x9a2738),
  vesselWall: hexToNumber(constants.colors.vesselWall, 0x76182a),
  vesselWallDark: hexToNumber(constants.colors.vesselWallDark, 0x3e0b18),
  player: hexToNumber(constants.colors.player, 0xf5e1c8),
  playerEdge: hexToNumber(constants.colors.playerEdge, 0xd2a89f),
  redWeapon: hexToNumber(constants.colors.redWeapon, 0xe9413e),
  blueWeapon: hexToNumber(constants.colors.blueWeapon, 0x44a3ff),
  yellowWeapon: hexToNumber(constants.colors.yellowWeapon, 0xffdc4d),
  greenWeapon: hexToNumber(constants.colors.greenWeapon, 0x53e07a),
  purpleWeapon: hexToNumber(constants.colors.purpleWeapon, 0xc86dff),
  coccus: hexToNumber(constants.colors.coccus, 0x66c653),
  bacillus: hexToNumber(constants.colors.bacillus, 0x8c4dd3),
  phage: hexToNumber(constants.colors.phage, 0x8b1e2e),
  boss: hexToNumber(constants.colors.boss, 0xb94a62),
  enemyShot: hexToNumber(constants.colors.enemyShot, 0xff7c7c),
  enemyHomingShot: hexToNumber(constants.colors.enemyHomingShot, 0xffa238),
  white: hexToNumber(constants.colors.white, 0xfff3df),
  black: hexToNumber(constants.colors.black, 0x0b0306)
} as const;
