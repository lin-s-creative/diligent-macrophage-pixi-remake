import { Container, Graphics } from 'pixi.js';
import type { LevelConfig } from '../config/levels';
import { drawVesselSegment } from '../render/drawing';
import { createParallaxBackground, type ParallaxBackgroundView } from '../render/parallaxBackground';
import { createHud, type HudView } from '../ui/hud';
import { clearContainer } from '../utils/pixi';

export interface BackgroundView {
  container: Container;
  graphics: Graphics;
  parallax: ParallaxBackgroundView | null;
  offset: number;
}

export interface GameplayLayers {
  gameLayer: Container;
  entityLayer: Container;
  projectileLayer: Container;
  particleLayer: Container;
  hitboxDebugLayer: Graphics;
  hudLayer: Container;
  background: BackgroundView;
  hud: HudView;
}

export function setupGameScene(scene: Container, level: LevelConfig): GameplayLayers {
  clearContainer(scene);
  const gameLayer = new Container();
  const entityLayer = new Container();
  const projectileLayer = new Container();
  const particleLayer = new Container();
  const hitboxDebugLayer = new Graphics();
  const hudLayer = new Container();

  const background: BackgroundView = {
    container: new Container(),
    graphics: new Graphics(),
    parallax: createParallaxBackground(level),
    offset: 0
  };
  drawVesselSegment(background.graphics, 0, level);
  if (background.parallax) background.container.addChild(background.parallax.container);
  background.container.addChild(background.graphics);
  gameLayer.addChild(background.container);
  gameLayer.addChild(entityLayer, projectileLayer, particleLayer, hitboxDebugLayer, hudLayer);
  scene.addChild(gameLayer);

  const hud = createHud();
  hudLayer.addChild(hud.container);

  return {
    gameLayer,
    entityLayer,
    projectileLayer,
    particleLayer,
    hitboxDebugLayer,
    hudLayer,
    background,
    hud
  };
}
