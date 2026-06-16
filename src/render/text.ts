import { Text } from 'pixi.js';

const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2) * 2;

Text.defaultAutoResolution = false;
Text.defaultResolution = TEXT_RESOLUTION;

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
  label.resolution = TEXT_RESOLUTION;
  label.roundPixels = true;
  label.anchor.set(anchorX, anchorY);
  label.x = Math.round(x);
  label.y = Math.round(y);
  label.updateText(false);
  return label;
}
