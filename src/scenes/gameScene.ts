import { Container, Graphics } from 'pixi.js';
import { drawVesselSegment } from '../render/drawing';
import { createHud, type HudView } from '../ui/hud';
import { clearContainer } from '../utils/pixi';

export interface BackgroundView {
  container: Container;
  graphics: Graphics;
  offset: number;
}

export interface GameplayLayers {
  gameLayer: Container;
  entityLayer: Container;
  projectileLayer: Container;
  particleLayer: Container;
  hudLayer: Container;
  background: BackgroundView;
  hud: HudView;
}

export function setupGameScene(scene: Container): GameplayLayers {
  clearContainer(scene);
  const gameLayer = new Container();
  const entityLayer = new Container();
  const projectileLayer = new Container();
  const particleLayer = new Container();
  const hudLayer = new Container();

  const background: BackgroundView = {
    container: new Container(),
    graphics: new Graphics(),
    offset: 0
  };
  drawVesselSegment(background.graphics, 0);
  background.container.addChild(background.graphics);
  gameLayer.addChild(background.container);
  gameLayer.addChild(entityLayer, projectileLayer, particleLayer, hudLayer);
  scene.addChild(gameLayer);

  const hud = createHud();
  hudLayer.addChild(hud.container);

  return {
    gameLayer,
    entityLayer,
    projectileLayer,
    particleLayer,
    hudLayer,
    background,
    hud
  };
}
