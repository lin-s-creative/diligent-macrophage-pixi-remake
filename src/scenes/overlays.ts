import { Container, Graphics } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import { drawIrregularRoundedRect } from '../render/drawing';
import { createText } from '../render/text';
import type { ResultTitle } from '../types/entities';
import { makeClayButton } from '../ui/button';
import { clearContainer } from '../utils/pixi';

export interface OverlayCallbacks {
  toggleControls: () => void;
  resumeGame: () => void;
  showMenu: () => void;
  startGame: () => void;
}

export interface ResultOverlayData {
  title: ResultTitle;
  score: number;
  bestScore: number;
  isNewRecord: boolean;
}

export function buildControlsOverlay(scene: Container, toggleControlsOverlay: () => void): void {
  clearContainer(scene);
  scene.visible = false;
  const dim = new Graphics();
  dim.beginFill(0x000000, 0.62);
  dim.drawRect(0, 0, WIDTH, HEIGHT);
  dim.endFill();
  dim.eventMode = 'static';
  dim.on('pointertap', toggleControlsOverlay);

  const panel = new Container();
  panel.x = WIDTH / 2;
  panel.y = HEIGHT / 2;
  const panelBg = new Graphics();
  drawIrregularRoundedRect(panelBg, 620, 340, 0x4d1220, 0xffb094, 8);
  const title = createText('УПРАВЛЕНИЕ', 42, 0, -120, 0.5, 0.5, '#ffe2b9');
  const lines = [
    'Стрелки или WASD — движение макрофага',
    'Пробел или Z — выстрел',
    'Esc или P — пауза / продолжить',
    'Подбирайте красные, синие и жёлтые шарики,',
    'чтобы переключать тип оружия.'
  ];
  panel.addChild(panelBg, title);
  lines.forEach((line, index) => {
    panel.addChild(createText(line, index < 3 ? 23 : 20, 0, -55 + index * 42, 0.5, 0.5, '#fff1dd'));
  });
  const close = makeClayButton('ЗАКРЫТЬ', 0, 136, 230, 54, toggleControlsOverlay);
  panel.addChild(close);
  scene.addChild(dim, panel);
}

export function buildPauseOverlay(scene: Container, callbacks: Pick<OverlayCallbacks, 'resumeGame' | 'showMenu'>): void {
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

export function buildResultOverlay(scene: Container, data: ResultOverlayData, callbacks: Pick<OverlayCallbacks, 'startGame' | 'showMenu'>): void {
  clearContainer(scene);
  scene.visible = true;
  const dim = new Graphics();
  dim.beginFill(0x000000, 0.64);
  dim.drawRect(0, 0, WIDTH, HEIGHT);
  dim.endFill();
  const panel = new Container();
  panel.x = WIDTH / 2;
  panel.y = HEIGHT / 2;
  const panelBg = new Graphics();
  drawIrregularRoundedRect(panelBg, 560, 340, data.title === 'ПОБЕДА' ? 0x244b2a : 0x4d1220, 0xffc29a, 12.2);
  const title = createText(data.title, 58, 0, -112, 0.5, 0.5, data.title === 'ПОБЕДА' ? '#d8ffbe' : '#ffe2b9');
  const scoreLabel = createText(`СЧЁТ: ${data.score}`, 28, 0, -54, 0.5, 0.5, '#fff0df');
  const recordLabel = createText(
    data.isNewRecord ? 'НОВЫЙ ЛОКАЛЬНЫЙ РЕКОРД!' : `ЛУЧШИЙ СЧЁТ: ${data.bestScore}`,
    20,
    0,
    -18,
    0.5,
    0.5,
    data.isNewRecord ? '#ffdc4d' : '#f5b4aa'
  );
  const restart = makeClayButton('ЗАНОВО', 0, 58, 250, 60, callbacks.startGame);
  const menu = makeClayButton('В МЕНЮ', 0, 136, 230, 56, callbacks.showMenu);
  panel.addChild(panelBg, title, scoreLabel, recordLabel, restart, menu);
  scene.addChild(dim, panel);
}
