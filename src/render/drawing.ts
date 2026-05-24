import { Graphics } from 'pixi.js';
import { COLORS, HEIGHT, TWO_PI, WIDTH } from '../config/constants';
import { randomRange } from '../utils/math';
import { vesselBottomAt, vesselTopAt } from '../world/vessel';
import type { WeaponType } from '../types/entities';

export function drawIrregularBlob(
  graphics: Graphics,
  radius: number,
  color: number,
  edgeColor: number,
  seed = 0,
  points = 18,
  scaleY = 1
): void {
  graphics.clear();
  graphics.lineStyle(4, edgeColor, 0.85);
  graphics.beginFill(color, 1);

  const verts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * TWO_PI;
    const noise = 0.86 + 0.18 * Math.sin(i * 1.73 + seed) + 0.09 * Math.cos(i * 2.41 - seed * 0.7);
    const r = radius * noise;
    verts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * scaleY
    });
  }

  graphics.moveTo(verts[0].x, verts[0].y);
  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];
    const controlX = (current.x + next.x) / 2;
    const controlY = (current.y + next.y) / 2;
    graphics.quadraticCurveTo(current.x, current.y, controlX, controlY);
  }
  graphics.closePath();
  graphics.endFill();

  graphics.lineStyle(2, 0xffffff, 0.18);
  graphics.beginFill(0xffffff, 0.08);
  graphics.drawEllipse(-radius * 0.28, -radius * 0.27 * scaleY, radius * 0.34, radius * 0.16 * scaleY);
  graphics.endFill();
}

export function drawIrregularRoundedRect(graphics: Graphics, width: number, height: number, fill: number, edge: number, seed = 0): void {
  graphics.clear();
  graphics.lineStyle(4, edge, 0.95);
  graphics.beginFill(fill, 0.96);
  const left = -width / 2;
  const right = width / 2;
  const top = -height / 2;
  const bottom = height / 2;
  const points = [
    [left + 22, top + Math.sin(seed) * 3],
    [right - 24, top + Math.cos(seed * 1.2) * 4],
    [right + Math.sin(seed * 2) * 4, top + 22],
    [right - 6, bottom - 18],
    [right - 28, bottom + Math.cos(seed) * 3],
    [left + 24, bottom + Math.sin(seed * 1.4) * 4],
    [left + Math.cos(seed * 1.7) * 5, bottom - 20],
    [left - 4, top + 22]
  ];
  graphics.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const point = points[i];
    graphics.quadraticCurveTo(prev[0], prev[1], (prev[0] + point[0]) / 2, (prev[1] + point[1]) / 2);
  }
  graphics.quadraticCurveTo(points[points.length - 1][0], points[points.length - 1][1], points[0][0], points[0][1]);
  graphics.endFill();
}

export function drawVesselSegment(graphics: Graphics, offsetX: number): void {
  graphics.clear();
  graphics.beginFill(COLORS.plasmaDark);
  graphics.drawRect(0, 0, WIDTH, HEIGHT);
  graphics.endFill();

  for (let i = 0; i < 12; i++) {
    const x = (i * 92 + offsetX * 0.3) % (WIDTH + 120) - 60;
    const y = 120 + ((i * 71 + offsetX * 0.18) % 310);
    graphics.beginFill(i % 2 ? 0x4f1020 : 0x68172a, 0.16);
    graphics.drawEllipse(x, y, 95 + (i % 3) * 18, 23 + (i % 4) * 5);
    graphics.endFill();
  }

  const topPoints: number[][] = [];
  const bottomPoints: number[][] = [];
  for (let x = -20; x <= WIDTH + 20; x += 24) {
    const topY = vesselTopAt(x + offsetX);
    const bottomY = vesselBottomAt(x + offsetX);
    topPoints.push([x, topY]);
    bottomPoints.push([x, bottomY]);
  }

  graphics.beginFill(COLORS.vesselWallDark, 1);
  graphics.moveTo(0, 0);
  graphics.lineTo(WIDTH, 0);
  for (let i = topPoints.length - 1; i >= 0; i--) graphics.lineTo(topPoints[i][0], topPoints[i][1]);
  graphics.closePath();
  graphics.endFill();

  graphics.beginFill(COLORS.vesselWallDark, 1);
  graphics.moveTo(0, HEIGHT);
  graphics.lineTo(WIDTH, HEIGHT);
  for (let i = bottomPoints.length - 1; i >= 0; i--) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1]);
  graphics.closePath();
  graphics.endFill();

  graphics.lineStyle(9, COLORS.vesselWall, 0.88);
  graphics.moveTo(topPoints[0][0], topPoints[0][1]);
  for (let i = 1; i < topPoints.length; i++) {
    const prev = topPoints[i - 1];
    const point = topPoints[i];
    graphics.quadraticCurveTo(prev[0], prev[1], (prev[0] + point[0]) / 2, (prev[1] + point[1]) / 2);
  }

  graphics.moveTo(bottomPoints[0][0], bottomPoints[0][1]);
  for (let i = 1; i < bottomPoints.length; i++) {
    const prev = bottomPoints[i - 1];
    const point = bottomPoints[i];
    graphics.quadraticCurveTo(prev[0], prev[1], (prev[0] + point[0]) / 2, (prev[1] + point[1]) / 2);
  }

  graphics.lineStyle(3, 0xff9d9d, 0.2);
  graphics.moveTo(topPoints[0][0], topPoints[0][1] + 12);
  for (let i = 1; i < topPoints.length; i++) graphics.lineTo(topPoints[i][0], topPoints[i][1] + 12);
  graphics.moveTo(bottomPoints[0][0], bottomPoints[0][1] - 12);
  for (let i = 1; i < bottomPoints.length; i++) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1] - 12);
}

export function drawBacillus(graphics: Graphics): void {
  graphics.clear();
  graphics.lineStyle(4, 0x4d1f7b, 0.9);
  graphics.beginFill(COLORS.bacillus, 1);
  graphics.drawRoundedRect(-38, -15, 76, 30, 15);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.13);
  graphics.drawEllipse(-12, -6, 22, 6);
  graphics.endFill();
  graphics.lineStyle(2, 0xd0b1ff, 0.55);
  graphics.moveTo(-29, -10);
  graphics.quadraticCurveTo(-10, -17, 7, -10);
  graphics.moveTo(-22, 11);
  graphics.quadraticCurveTo(2, 17, 27, 8);
}

export function drawPhage(graphics: Graphics): void {
  graphics.clear();
  graphics.lineStyle(4, 0x4d0710, 0.95);
  graphics.beginFill(COLORS.phage, 1);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * TWO_PI / 6;
    const x = Math.cos(a) * (24 + (i % 2) * 3);
    const y = Math.sin(a) * (22 + ((i + 1) % 2) * 4);
    if (i === 0) graphics.moveTo(x, y);
    else graphics.lineTo(x, y);
  }
  graphics.closePath();
  graphics.endFill();
  graphics.lineStyle(3, 0xff9b8b, 0.55);
  graphics.moveTo(0, 21);
  graphics.lineTo(0, 38);
  graphics.moveTo(-11, 17);
  graphics.lineTo(-22, 34);
  graphics.moveTo(11, 17);
  graphics.lineTo(22, 34);
  graphics.lineStyle(2, 0x39040c, 0.8);
  graphics.drawCircle(0, -2, 8);
}

export function drawBoss(graphics: Graphics): void {
  graphics.clear();
  graphics.lineStyle(5, 0x711426, 0.9);
  const blobs = [
    [-18, -30, 42], [26, -18, 38], [-35, 18, 36], [22, 28, 45], [0, 0, 52]
  ];
  blobs.forEach((b, index) => {
    graphics.beginFill(index % 2 ? 0xc45770 : COLORS.boss, 1);
    graphics.drawCircle(b[0], b[1], b[2]);
    graphics.endFill();
  });
  graphics.lineStyle(7, 0x5d1020, 0.8);
  graphics.moveTo(-75, -45);
  graphics.quadraticCurveTo(-112, -74, -124, -22);
  graphics.moveTo(72, -38);
  graphics.quadraticCurveTo(118, -45, 128, 3);
  graphics.moveTo(-70, 48);
  graphics.quadraticCurveTo(-112, 78, -128, 31);
  graphics.moveTo(67, 55);
  graphics.quadraticCurveTo(116, 84, 124, 28);
  graphics.lineStyle(3, 0xffb6ae, 0.4);
  graphics.drawEllipse(-12, -20, 42, 14);
  graphics.drawEllipse(28, 22, 34, 12);
}

export function drawAntibody(graphics: Graphics, color: number): void {
  graphics.clear();
  graphics.lineStyle(5, color, 1);
  graphics.moveTo(-8, 8);
  graphics.lineTo(0, 0);
  graphics.lineTo(10, -10);
  graphics.moveTo(0, 0);
  graphics.lineTo(10, 10);
  graphics.lineStyle(2, 0xfff8bb, 0.8);
  graphics.moveTo(-8, 8);
  graphics.lineTo(0, 0);
  graphics.lineTo(10, -10);
  graphics.moveTo(0, 0);
  graphics.lineTo(10, 10);
}

export function drawHeart(graphics: Graphics, active: boolean): void {
  graphics.clear();
  graphics.beginFill(active ? 0xff5e67 : 0x57202a, 1);
  graphics.lineStyle(2, active ? 0xffd4d4 : 0x8d4a56, 0.85);
  graphics.moveTo(0, 8);
  graphics.bezierCurveTo(-18, -4, -9, -20, 0, -10);
  graphics.bezierCurveTo(9, -20, 18, -4, 0, 8);
  graphics.endFill();
}

export function drawWeaponIndicator(graphics: Graphics, type: WeaponType): void {
  graphics.clear();
  if (type === 1) {
    graphics.beginFill(COLORS.redWeapon);
    graphics.drawCircle(0, 0, 10);
    graphics.endFill();
  } else if (type === 2) {
    graphics.beginFill(COLORS.blueWeapon);
    graphics.moveTo(12, 0);
    graphics.lineTo(-8, -10);
    graphics.lineTo(-4, 0);
    graphics.lineTo(-8, 10);
    graphics.closePath();
    graphics.endFill();
  } else {
    drawAntibody(graphics, COLORS.yellowWeapon);
  }
}

export function randomBonusColor(type: WeaponType): number {
  return type === 1 ? COLORS.redWeapon : type === 2 ? COLORS.blueWeapon : COLORS.yellowWeapon;
}

export function randomWeaponType(): WeaponType {
  return Math.floor(randomRange(1, 4)) as WeaponType;
}
