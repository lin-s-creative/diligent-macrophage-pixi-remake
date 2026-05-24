import { Container, Graphics } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { drawIrregularRoundedRect } from '../render/drawing';
import { createText } from '../render/text';
import { makeClayButton } from '../ui/button';
import { randomRange } from '../utils/math';
import { clearContainer } from '../utils/pixi';

export interface MenuSceneCallbacks {
  startGame: () => void;
  toggleControls: () => void;
}

export interface MenuStats {
  bestScore: number;
  gamesPlayed: number;
}

export function makeMenuBackground(): Container {
  const container = new Container();
  const bg = new Graphics();
  bg.beginFill(0x17040c);
  bg.drawRect(0, 0, WIDTH, HEIGHT);
  bg.endFill();

  for (let i = 0; i < 20; i++) {
    const g = new Graphics();
    const color = i % 3 === 0 ? 0x75192a : i % 3 === 1 ? 0x4b1020 : 0xa3323d;
    g.beginFill(color, 0.17);
    g.drawEllipse(randomRange(40, WIDTH - 40), randomRange(40, HEIGHT - 40), randomRange(70, 190), randomRange(12, 38));
    g.endFill();
    g.rotation = randomRange(-0.25, 0.25);
    container.addChild(g);
  }

  const wall = new Graphics();
  wall.lineStyle(20, 0x651829, 0.6);
  wall.moveTo(-40, 96);
  for (let x = -40; x <= WIDTH + 40; x += 80) {
    wall.quadraticCurveTo(x + 38, 78 + Math.sin(x * 0.02) * 22, x + 80, 96 + Math.cos(x * 0.03) * 16);
  }
  wall.moveTo(-40, HEIGHT - 94);
  for (let x = -40; x <= WIDTH + 40; x += 80) {
    wall.quadraticCurveTo(x + 40, HEIGHT - 75 + Math.cos(x * 0.018) * 22, x + 80, HEIGHT - 94 + Math.sin(x * 0.025) * 14);
  }

  container.addChildAt(bg, 0);
  container.addChild(wall);
  return container;
}

export function buildMenu(scene: Container, callbacks: MenuSceneCallbacks, stats: MenuStats): void {
  clearContainer(scene);
  scene.visible = true;
  scene.addChild(makeMenuBackground());

  const titleShadow = createText('МАКРОФАГ', 78, WIDTH / 2 + 5, 132 + 6, 0.5, 0.5, '#5f101f');
  const title = createText('МАКРОФАГ', 78, WIDTH / 2, 132, 0.5, 0.5, '#ffe2b9');
  title.rotation = -0.015;
  title.scale.y = 1.04;

  const underline = new Graphics();
  drawIrregularRoundedRect(underline, 520, 22, 0xb84b4d, 0xff9d84, 3.3);
  underline.x = WIDTH / 2;
  underline.y = 190;
  underline.alpha = 0.65;

  const record = createText(`ЛУЧШИЙ СЧЁТ: ${stats.bestScore}`, 22, WIDTH / 2, 232, 0.5, 0.5, '#ffe7c9');
  const games = createText(`ЛОКАЛЬНЫХ ИГР: ${stats.gamesPlayed}`, 16, WIDTH / 2, 258, 0.5, 0.5, '#f5b4aa');

  const playButton = makeClayButton('ИГРАТЬ', WIDTH / 2, 315, 290, 68, callbacks.startGame);
  const controlsButton = makeClayButton('УПРАВЛЕНИЕ', WIDTH / 2, 397, 340, 62, callbacks.toggleControls);
  const exitButton = makeClayButton('ВЫХОД', WIDTH / 2, 470, 230, 52, null);
  exitButton.alpha = 0.45;
  exitButton.cursor = 'default';
  exitButton.removeAllListeners('pointertap');

  const hint = createText('Рекорды сохраняются локально в браузере', 16, WIDTH / 2, 520, 0.5, 0.5, '#f5b4aa');

  scene.addChild(titleShadow, title, underline, record, games, playButton, controlsButton, exitButton, hint);
}
