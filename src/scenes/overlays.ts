import { Container, Graphics } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { drawIrregularRoundedRect } from '../render/drawing';
import { createText } from '../render/text';
import { makeClayButton } from '../ui/button';
import { clearContainer } from '../utils/pixi';

export interface PauseOverlayCallbacks {
  resumeGame: () => void;
  showMenu: () => void;
}

export function buildPauseOverlay(scene: Container, callbacks: PauseOverlayCallbacks): void {
  clearContainer(scene);
  scene.visible = false;
  const dim = new Graphics();
  dim.beginFill(0x000000, 0.58);
  dim.drawRect(0, 0, WIDTH, HEIGHT);
  dim.endFill();
  const panel = new Container();
  panel.x = WIDTH / 2;
  panel.y = HEIGHT / 2;
  const panelBg = new Graphics();
  drawIrregularRoundedRect(panelBg, 420, 280, 0x3e101e, 0xffb69c, 5.6);
  const title = createText('ПАУЗА', 54, 0, -82, 0.5, 0.5, '#ffe2b9');
  const resume = makeClayButton('ПРОДОЛЖИТЬ', 0, 18, 290, 62, callbacks.resumeGame);
  const menu = makeClayButton('В МЕНЮ', 0, 96, 230, 56, callbacks.showMenu);
  panel.addChild(panelBg, title, resume, menu);
  scene.addChild(dim, panel);
}
