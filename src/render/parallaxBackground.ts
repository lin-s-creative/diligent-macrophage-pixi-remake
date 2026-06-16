import { Container, Sprite, Texture } from 'pixi.js';
import { HEIGHT, WIDTH } from '../config/constants';
import type { LevelConfig, LevelParallaxLayer } from '../config/levels';

export interface ParallaxLayerView {
  container: Container;
  sprites: Sprite[];
  speed: number;
  tileWidth: number;
}

export interface ParallaxBackgroundView {
  container: Container;
  layers: ParallaxLayerView[];
}

function createLayerView(layer: LevelParallaxLayer): ParallaxLayerView {
  const texture = Texture.from(layer.imageUrl);
  const container = new Container();
  container.alpha = layer.alpha ?? 1;
  const scale = layer.scale ?? 1;
  const tileWidth = WIDTH * scale;

  // Use 3 copies to guarantee seamless coverage during wrap
  const sprites: Sprite[] = [];
  for (let i = 0; i < 3; i++) {
    const sprite = new Sprite(texture);
    sprite.width = tileWidth;
    sprite.height = HEIGHT * scale;
    sprite.y = 0;
    container.addChild(sprite);
    sprites.push(sprite);
  }

  return {
    container,
    sprites,
    speed: layer.speed,
    tileWidth
  };
}

export function createParallaxBackground(level: LevelConfig): ParallaxBackgroundView | null {
  if (!level.parallax) return null;

  const container = new Container();
  const layers = level.parallax.layers.map((layer) => {
    const view = createLayerView(layer);
    container.addChild(view.container);
    return view;
  });

  return { container, layers };
}

export function updateParallaxBackground(background: ParallaxBackgroundView, offset: number): void {
  background.layers.forEach((layer) => {
    const { tileWidth, sprites } = layer;
    const rawX = -offset * layer.speed;
    // Wrap so base is always in [-tileWidth, 0)
    const baseX = ((rawX % tileWidth) + tileWidth) % tileWidth - tileWidth;

    for (let i = 0; i < sprites.length; i++) {
      sprites[i].x = Math.round(baseX + i * tileWidth);
    }
  });
}
