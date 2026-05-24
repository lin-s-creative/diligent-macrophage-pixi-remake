import type { Container } from 'pixi.js';

export function destroyEntity(entity: { container?: Container } | null | undefined): void {
  if (!entity || !entity.container) return;
  if (entity.container.parent) entity.container.parent.removeChild(entity.container);
  entity.container.destroy({ children: true });
}

export function clearContainer(container: Container | null | undefined): void {
  if (!container) return;
  container.removeChildren().forEach((child) => child.destroy({ children: true }));
}
