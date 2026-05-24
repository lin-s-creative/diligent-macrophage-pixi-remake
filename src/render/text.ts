import { Text } from 'pixi.js';

export const fontBase = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fill: '#fff0df',
  fontWeight: '900',
  letterSpacing: 2
} as const;

export function createText(
  text: string,
  size: number,
  x: number,
  y: number,
  anchorX = 0.5,
  anchorY = 0.5,
  color = '#fff0df'
): Text {
  const label = new Text(text, {
    ...fontBase,
    fontSize: size,
    fill: color,
    stroke: '#3a0714',
    strokeThickness: Math.max(2, Math.floor(size / 12)),
    dropShadow: true,
    dropShadowColor: '#120209',
    dropShadowBlur: 2,
    dropShadowDistance: 3
  });
  label.anchor.set(anchorX, anchorY);
  label.x = x;
  label.y = y;
  return label;
}
