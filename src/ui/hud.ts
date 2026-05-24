import { Container, Graphics, Text } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { drawHeart, drawWeaponIndicator } from '../render/drawing';
import { createText } from '../render/text';
import type { PlayerEntity, WeaponType } from '../types/entities';

export interface HudView {
  container: Container;
  healthIcons: Graphics[];
  scoreText: Text;
  weaponIcon: Graphics;
  weaponText: Text;
}

export interface HudState {
  player: PlayerEntity;
  score: number;
  currentWeapon: WeaponType;
}

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
  const weaponBack = new Graphics();
  weaponBack.beginFill(0x210811, 0.65);
  weaponBack.drawRoundedRect(WIDTH / 2 - 100, HEIGHT - 48, 200, 34, 16);
  weaponBack.endFill();
  const weaponIcon = new Graphics();
  weaponIcon.x = WIDTH / 2 - 70;
  weaponIcon.y = HEIGHT - 31;
  const weaponText = createText('ФАГОЦИТОЗ', 18, WIDTH / 2 - 42, HEIGHT - 31, 0, 0.5, '#fff0df');

  container.addChild(scoreText, weaponBack, weaponIcon, weaponText);
  return { container, healthIcons, scoreText, weaponIcon, weaponText };
}

export function updateHud(hud: HudView, state: HudState): void {
  hud.healthIcons.forEach((icon, index) => drawHeart(icon, index < state.player.health));
  hud.scoreText.text = `СЧЁТ: ${state.score}`;
  drawWeaponIndicator(hud.weaponIcon, state.currentWeapon);
  hud.weaponText.text = state.currentWeapon === 1 ? 'ФАГОЦИТОЗ' : state.currentWeapon === 2 ? 'ЦИТОКИНЫ' : 'АНТИТЕЛА';
}
