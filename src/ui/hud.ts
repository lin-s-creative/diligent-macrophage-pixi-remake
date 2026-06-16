import { Container, Graphics, Text } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import type { LevelConfig } from '../config/levels';
import { drawHeart, drawWeaponIndicator } from '../render/drawing';
import { createText } from '../render/text';
import type { PlayerEntity, WeaponType } from '../types/entities';

export interface HudView {
  container: Container;
  healthIcons: Graphics[];
  scoreText: Text;
  levelText: Text;
  weaponIcon: Graphics;
  weaponText: Text;
}

export interface HudState {
  player: PlayerEntity;
  score: number;
  currentWeapon: WeaponType;
  weaponBuffTimer: number;
  level: LevelConfig;
}

const WEAPON_NAMES: Record<WeaponType, string> = {
  1: 'ФАГОЦИТОЗ',
  2: 'ТРОЙНОЙ ЗАЛП',
  3: 'НАВЕДЕНИЕ',
  4: 'ВПЕРЁД/НАЗАД',
  5: 'ТЯЖЁЛЫЙ ЗАРЯД'
};

export function createHud(): HudView {
  const container = new Container();
  const healthIcons: Graphics[] = [];
  for (let i = 0; i < 5; i++) {
    const icon = new Graphics();
    drawHeart(icon, i < 5);
    icon.x = 28 + i * 34;
    icon.y = 28;
    container.addChild(icon);
    healthIcons.push(icon);
  }

  const scoreText = createText('СЧЁТ: 0', 24, WIDTH - 24, 26, 1, 0.5, '#ffe7c9');
  const levelText = createText('УРОВЕНЬ 1: СОСУД', 17, 28, 58, 0, 0.5, '#fff0df');
  const weaponBack = new Graphics();
  weaponBack.beginFill(0x210811, 0.65);
  weaponBack.drawRoundedRect(WIDTH / 2 - 125, HEIGHT - 50, 250, 38, 18);
  weaponBack.endFill();
  const weaponIcon = new Graphics();
  weaponIcon.x = WIDTH / 2 - 100;
  weaponIcon.y = HEIGHT - 31;
  const weaponText = createText('ФАГОЦИТОЗ', 17, WIDTH / 2 - 72, HEIGHT - 31, 0, 0.5, '#fff0df');

  container.addChild(scoreText, levelText, weaponBack, weaponIcon, weaponText);
  return { container, healthIcons, scoreText, levelText, weaponIcon, weaponText };
}

export function updateHud(hud: HudView, state: HudState): void {
  hud.healthIcons.forEach((icon, index) => drawHeart(icon, index < state.player.health));
  hud.scoreText.text = `СЧЁТ: ${state.score}`;
  hud.levelText.text = `УРОВЕНЬ ${state.level.id}: ${state.level.title}`;
  drawWeaponIndicator(hud.weaponIcon, state.currentWeapon);
  const weaponName = WEAPON_NAMES[state.currentWeapon];
  hud.weaponText.text = state.weaponBuffTimer > 0 ? `${weaponName} ${Math.ceil(state.weaponBuffTimer)}с` : weaponName;
}
