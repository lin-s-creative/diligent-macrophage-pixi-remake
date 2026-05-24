import { Container, Graphics } from 'pixi.js';
import { COLORS } from '../config/constants';
import { drawAntibody } from '../render/drawing';
import type { EnemyBulletEntity, PlayerBulletEntity, WeaponType } from '../types/entities';

export function createBullet(type: WeaponType, x: number, y: number, angle = 0): PlayerBulletEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.rotation = angle;
  const visual = new Graphics();
  container.addChild(visual);

  const bullet: PlayerBulletEntity = {
    kind: 'playerBullet',
    weaponType: type,
    container,
    visual,
    hitRadius: 8,
    damage: 1,
    speed: 7,
    vx: Math.cos(angle) * 7,
    vy: Math.sin(angle) * 7,
    turnSpeed: 0,
    life: 5
  };

  if (type === 1) {
    visual.beginFill(COLORS.redWeapon);
    visual.drawCircle(0, 0, 8);
    visual.endFill();
    visual.lineStyle(2, 0xffb0a0, 0.7);
    visual.drawCircle(0, 0, 8);
  } else if (type === 2) {
    bullet.speed = 6;
    bullet.vx = Math.cos(angle) * 6;
    bullet.vy = Math.sin(angle) * 6;
    bullet.hitRadius = 9;
    visual.beginFill(COLORS.blueWeapon);
    visual.moveTo(12, 0);
    visual.lineTo(-7, -7);
    visual.lineTo(-3, 0);
    visual.lineTo(-7, 7);
    visual.closePath();
    visual.endFill();
    visual.lineStyle(2, 0xcde9ff, 0.55);
    visual.moveTo(12, 0);
    visual.lineTo(-7, -7);
    visual.lineTo(-3, 0);
    visual.lineTo(-7, 7);
    visual.closePath();
  } else {
    bullet.speed = 4;
    bullet.vx = 4;
    bullet.vy = 0;
    bullet.damage = 0.8;
    bullet.hitRadius = 12;
    bullet.turnSpeed = 0.09;
    drawAntibody(visual, COLORS.yellowWeapon);
  }

  return bullet;
}

export function createEnemyBullet(x: number, y: number, targetX: number, targetY: number, speed = 3.6, radius = 8): EnemyBulletEntity {
  const container = new Container();
  container.x = x;
  container.y = y;
  const visual = new Graphics();
  visual.beginFill(COLORS.enemyShot);
  visual.drawCircle(0, 0, radius);
  visual.endFill();
  visual.lineStyle(2, 0xffdddd, 0.5);
  visual.drawCircle(0, 0, radius);
  container.addChild(visual);

  const angle = Math.atan2(targetY - y, targetX - x);
  return {
    kind: 'enemyBullet',
    container,
    visual,
    hitRadius: radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 6
  };
}
