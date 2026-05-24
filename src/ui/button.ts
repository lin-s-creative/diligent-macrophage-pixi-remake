import { Container, Graphics, Text } from 'pixi.js';
import { drawIrregularRoundedRect } from '../render/drawing';
import { createText } from '../render/text';

export interface ClayButton extends Container {
  visual: Graphics;
  label: Text;
}

export function makeClayButton(
  labelText: string,
  x: number,
  y: number,
  width = 260,
  height = 64,
  onClick: (() => void) | null = null
): ClayButton {
  const button = new Container() as ClayButton;
  button.x = x;
  button.y = y;
  button.eventMode = 'static';
  button.cursor = 'pointer';

  const visual = new Graphics();
  drawIrregularRoundedRect(visual, width, height, 0xb9424e, 0xff9d84, Math.random() * 10);
  const label = createText(labelText, 28, 0, 0, 0.5, 0.5, '#fff4df');

  button.addChild(visual, label);
  button.visual = visual;
  button.label = label;

  button.on('pointerover', () => {
    button.scale.set(1.1);
  });
  button.on('pointerout', () => {
    button.scale.set(1);
  });
  button.on('pointertap', () => {
    if (onClick) onClick();
  });

  return button;
}
