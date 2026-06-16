import { Graphics } from 'pixi.js';
import { COLORS, HEIGHT, TWO_PI, WIDTH } from '../config/constants';
import type { LevelConfig } from '../config/levels';
import { vesselBottomAt, vesselTopAt } from '../world/vessel';
import type { WeaponType } from '../types/entities';

/**
 * Mixes two colors in 0xRRGGBB form by ratio (0..1) toward `b`.
 * Used to derive layered tints (highlights, shadows, organelles) from a
 * single base color so the rendered cells read as one organism.
 */
function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const c = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | c;
}

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

  // Doubled vertex count for smoother, more organic outline.
  const verts: Array<{ x: number; y: number }> = [];
  const detailedPoints = Math.max(points * 2, 28);
  for (let i = 0; i < detailedPoints; i++) {
    const angle = (i / detailedPoints) * TWO_PI;
    const noise =
      0.86 +
      0.18 * Math.sin(i * 1.73 + seed) +
      0.09 * Math.cos(i * 2.41 - seed * 0.7) +
      0.05 * Math.sin(i * 4.13 + seed * 1.3);
    const r = radius * noise;
    verts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * scaleY
    });
  }

  // Outer soft halo
  graphics.lineStyle(0);
  graphics.beginFill(color, 0.18);
  graphics.drawEllipse(0, 0, radius * 1.22, radius * 1.18 * scaleY);
  graphics.endFill();

  // Main body, thicker double-stroke edge
  const darkEdge = mixColor(edgeColor, 0x000000, 0.35);
  graphics.lineStyle(5, darkEdge, 0.65);
  graphics.beginFill(color, 1);
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

  // Bright inner edge accent traces the same path
  graphics.lineStyle(2, edgeColor, 0.95);
  graphics.moveTo(verts[0].x * 0.93, verts[0].y * 0.93);
  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];
    graphics.quadraticCurveTo(
      current.x * 0.93,
      current.y * 0.93,
      ((current.x + next.x) / 2) * 0.93,
      ((current.y + next.y) / 2) * 0.93
    );
  }

  // Shadow crescent on the lower-right, darker tint of the body color
  const shadow = mixColor(color, 0x000000, 0.45);
  graphics.lineStyle(0);
  graphics.beginFill(shadow, 0.32);
  graphics.drawEllipse(radius * 0.22, radius * 0.28 * scaleY, radius * 0.62, radius * 0.5 * scaleY);
  graphics.endFill();

  // Body again clipped over the shadow softens the edge
  graphics.beginFill(color, 0.55);
  graphics.drawEllipse(-radius * 0.05, -radius * 0.08 * scaleY, radius * 0.78, radius * 0.7 * scaleY);
  graphics.endFill();

  // Organelle granules scattered across the cytoplasm
  const granuleColor = mixColor(color, 0xffffff, 0.55);
  const granuleDark = mixColor(color, 0x000000, 0.4);
  for (let i = 0; i < 9; i++) {
    const a = seed + i * 0.97;
    const rr = radius * (0.18 + 0.5 * ((i * 13) % 7) / 7);
    const gx = Math.cos(a) * rr;
    const gy = Math.sin(a) * rr * scaleY;
    const gr = radius * (0.045 + 0.025 * ((i * 5) % 3));
    graphics.beginFill(i % 3 === 0 ? granuleDark : granuleColor, 0.55);
    graphics.drawCircle(gx, gy, gr);
    graphics.endFill();
  }

  // Twin specular highlights on the top-left
  graphics.lineStyle(0);
  graphics.beginFill(0xffffff, 0.22);
  graphics.drawEllipse(-radius * 0.32, -radius * 0.34 * scaleY, radius * 0.36, radius * 0.18 * scaleY);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.45);
  graphics.drawEllipse(-radius * 0.42, -radius * 0.42 * scaleY, radius * 0.13, radius * 0.07 * scaleY);
  graphics.endFill();

  // Subtle membrane ring
  graphics.lineStyle(1.5, 0xffffff, 0.18);
  graphics.drawEllipse(0, 0, radius * 0.78, radius * 0.7 * scaleY);
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

  // Soft inner glow line for added depth
  graphics.lineStyle(1.5, 0xffffff, 0.18);
  graphics.drawRoundedRect(left + 6, top + 6, width - 12, height - 12, 14);
}

function drawLevelTexture(graphics: Graphics, level: LevelConfig, offsetX: number): void {
  if (level.environment === 'lungs') {
    // Layer 1: large alveolar sacs
    for (let i = 0; i < 30; i++) {
      const x = (i * 86 + offsetX * 0.24) % (WIDTH + 130) - 65;
      const y = 92 + ((i * 67 + offsetX * 0.12) % 356);
      graphics.lineStyle(3, i % 2 ? level.theme.textureA : level.theme.textureB, 0.25);
      graphics.beginFill(i % 2 ? level.theme.textureA : level.theme.textureB, 0.08);
      graphics.drawEllipse(x, y, 38 + (i % 4) * 10, 30 + (i % 3) * 7);
      graphics.endFill();
    }
    // Layer 2: small bubble cluster
    graphics.lineStyle(0);
    for (let i = 0; i < 40; i++) {
      const x = (i * 53 + offsetX * 0.42) % (WIDTH + 80) - 40;
      const y = 80 + ((i * 41 + offsetX * 0.27) % 380);
      graphics.beginFill(level.theme.textureA, 0.1);
      graphics.drawCircle(x, y, 4 + (i % 3) * 2);
      graphics.endFill();
    }
    // Layer 3: capillary filaments
    for (let i = 0; i < 14; i++) {
      const baseY = 110 + ((i * 109 + offsetX * 0.05) % 320);
      const baseX = (i * 137 + offsetX * 0.18) % (WIDTH + 200) - 100;
      graphics.lineStyle(1.5, level.theme.textureB, 0.22);
      graphics.moveTo(baseX, baseY);
      graphics.bezierCurveTo(baseX + 60, baseY + 18, baseX + 110, baseY - 22, baseX + 180, baseY + 14);
    }
    return;
  }

  if (level.environment === 'bone') {
    // Layer 1: matrix lamellae
    for (let i = 0; i < 44; i++) {
      const x = (i * 58 + offsetX * 0.18) % (WIDTH + 100) - 50;
      const y = 86 + ((i * 47 + offsetX * 0.16) % 370);
      graphics.beginFill(i % 2 ? level.theme.textureA : level.theme.textureB, 0.12);
      graphics.drawRoundedRect(x - 34, y - 7, 68 + (i % 3) * 12, 14 + (i % 2) * 5, 8);
      graphics.endFill();
    }
    // Layer 2: tiny canaliculi dots
    for (let i = 0; i < 80; i++) {
      const x = (i * 31 + offsetX * 0.5) % (WIDTH + 40) - 20;
      const y = 80 + ((i * 23 + offsetX * 0.3) % 380);
      graphics.beginFill(level.theme.textureA, 0.18);
      graphics.drawCircle(x, y, 1.6);
      graphics.endFill();
    }
    // Layer 3: lacunae oval voids
    for (let i = 0; i < 18; i++) {
      const x = (i * 91 + offsetX * 0.12) % (WIDTH + 100) - 50;
      const y = 120 + ((i * 79 + offsetX * 0.09) % 300);
      graphics.lineStyle(1.5, level.theme.textureB, 0.32);
      graphics.beginFill(0x000000, 0.18);
      graphics.drawEllipse(x, y, 9 + (i % 3) * 2, 4 + (i % 2));
      graphics.endFill();
    }
    return;
  }

  // Default vessel: plasma streaks + erythrocytes
  for (let i = 0; i < 24; i++) {
    const x = (i * 92 + offsetX * 0.3) % (WIDTH + 120) - 60;
    const y = 120 + ((i * 71 + offsetX * 0.18) % 310);
    graphics.beginFill(i % 2 ? level.theme.textureA : level.theme.textureB, 0.16);
    graphics.drawEllipse(x, y, 95 + (i % 3) * 18, 23 + (i % 4) * 5);
    graphics.endFill();
  }
  // Floating red blood cell silhouettes
  for (let i = 0; i < 18; i++) {
    const x = (i * 121 + offsetX * 0.38) % (WIDTH + 120) - 60;
    const y = 100 + ((i * 83 + offsetX * 0.22) % 340);
    const rx = 8 + (i % 3) * 2;
    const ry = rx * 0.78;
    graphics.lineStyle(1.5, level.theme.textureA, 0.32);
    graphics.beginFill(level.theme.textureA, 0.22);
    graphics.drawEllipse(x, y, rx, ry);
    graphics.endFill();
    graphics.beginFill(level.theme.background, 0.45);
    graphics.drawCircle(x, y, rx * 0.45);
    graphics.endFill();
  }
  // Plasma micro-particles
  graphics.lineStyle(0);
  for (let i = 0; i < 60; i++) {
    const x = (i * 41 + offsetX * 0.55) % (WIDTH + 40) - 20;
    const y = 80 + ((i * 37 + offsetX * 0.31) % 380);
    graphics.beginFill(0xffffff, 0.06 + (i % 4) * 0.015);
    graphics.drawCircle(x, y, 1 + (i % 3) * 0.6);
    graphics.endFill();
  }
}

export function drawVesselSegment(graphics: Graphics, offsetX: number, level: LevelConfig): void {
  graphics.clear();

  const hasParallaxBackground = Boolean(level.parallax);

  if (!hasParallaxBackground) {
    // Background base
    graphics.beginFill(level.theme.background);
    graphics.drawRect(0, 0, WIDTH, HEIGHT);
    graphics.endFill();
  } else {
    // Very light tint keeps the editable SVG layers in the level palette without covering them.
    graphics.beginFill(level.theme.background, 0.14);
    graphics.drawRect(0, 0, WIDTH, HEIGHT);
    graphics.endFill();
  }

  // Subtle radial vignette via two rim bands of darker shade
  const vignette = mixColor(level.theme.background, 0x000000, 0.55);
  graphics.beginFill(vignette, hasParallaxBackground ? 0.24 : 0.5);
  graphics.drawRect(0, 0, WIDTH, 60);
  graphics.drawRect(0, HEIGHT - 60, WIDTH, 60);
  graphics.endFill();

  if (!hasParallaxBackground) drawLevelTexture(graphics, level, offsetX);

  const topPoints: number[][] = [];
  const bottomPoints: number[][] = [];
  for (let x = -20; x <= WIDTH + 20; x += 12) {
    const topY = vesselTopAt(x + offsetX, level);
    const bottomY = vesselBottomAt(x + offsetX, level);
    topPoints.push([x, topY]);
    bottomPoints.push([x, bottomY]);
  }

  // Wall fills
  graphics.beginFill(level.theme.wallDark, 1);
  graphics.moveTo(0, 0);
  graphics.lineTo(WIDTH, 0);
  for (let i = topPoints.length - 1; i >= 0; i--) graphics.lineTo(topPoints[i][0], topPoints[i][1]);
  graphics.closePath();
  graphics.endFill();

  graphics.beginFill(level.theme.wallDark, 1);
  graphics.moveTo(0, HEIGHT);
  graphics.lineTo(WIDTH, HEIGHT);
  for (let i = bottomPoints.length - 1; i >= 0; i--) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1]);
  graphics.closePath();
  graphics.endFill();

  // Wall mid-tone band sandwiched above the dark fill
  const wallMid = mixColor(level.theme.wallDark, level.theme.wall, 0.45);
  graphics.lineStyle(0);
  graphics.beginFill(wallMid, 0.55);
  graphics.moveTo(topPoints[0][0], topPoints[0][1]);
  for (let i = 1; i < topPoints.length; i++) graphics.lineTo(topPoints[i][0], topPoints[i][1]);
  for (let i = topPoints.length - 1; i >= 0; i--) graphics.lineTo(topPoints[i][0], topPoints[i][1] - 18);
  graphics.closePath();
  graphics.endFill();
  graphics.beginFill(wallMid, 0.55);
  graphics.moveTo(bottomPoints[0][0], bottomPoints[0][1]);
  for (let i = 1; i < bottomPoints.length; i++) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1]);
  for (let i = bottomPoints.length - 1; i >= 0; i--) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1] + 18);
  graphics.closePath();
  graphics.endFill();

  // Primary wall edge
  graphics.lineStyle(level.environment === 'bone' ? 11 : 9, level.theme.wall, 0.9);
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

  // Bright sheen line just inside wall
  const wallSheen = mixColor(level.theme.wall, 0xffffff, 0.4);
  graphics.lineStyle(2, wallSheen, 0.55);
  for (let i = 0; i < topPoints.length - 1; i++) {
    const p = topPoints[i];
    const n = topPoints[i + 1];
    if (i === 0) graphics.moveTo(p[0], p[1] + 4);
    graphics.lineTo(n[0], n[1] + 4);
  }
  for (let i = 0; i < bottomPoints.length - 1; i++) {
    const p = bottomPoints[i];
    const n = bottomPoints[i + 1];
    if (i === 0) graphics.moveTo(p[0], p[1] - 4);
    graphics.lineTo(n[0], n[1] - 4);
  }

  // Inner pulse lines (existing)
  graphics.lineStyle(3, level.theme.innerLine, 0.24);
  graphics.moveTo(topPoints[0][0], topPoints[0][1] + 12);
  for (let i = 1; i < topPoints.length; i++) graphics.lineTo(topPoints[i][0], topPoints[i][1] + 12);
  graphics.moveTo(bottomPoints[0][0], bottomPoints[0][1] - 12);
  for (let i = 1; i < bottomPoints.length; i++) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1] - 12);

  // Second softer trace deeper inside
  graphics.lineStyle(2, level.theme.innerLine, 0.16);
  graphics.moveTo(topPoints[0][0], topPoints[0][1] + 22);
  for (let i = 1; i < topPoints.length; i++) graphics.lineTo(topPoints[i][0], topPoints[i][1] + 22);
  graphics.moveTo(bottomPoints[0][0], bottomPoints[0][1] - 22);
  for (let i = 1; i < bottomPoints.length; i++) graphics.lineTo(bottomPoints[i][0], bottomPoints[i][1] - 22);

  // Endothelial cell nuclei dotted along the walls
  const nucleus = mixColor(level.theme.wall, 0x000000, 0.4);
  graphics.lineStyle(0);
  for (let i = 0; i < topPoints.length; i += 4) {
    const p = topPoints[i];
    const seed = (p[0] * 13 + offsetX * 0.07) % 11;
    if (seed < 0) continue;
    graphics.beginFill(nucleus, 0.6);
    graphics.drawEllipse(p[0], p[1] + 6 + (seed % 3), 5, 2);
    graphics.endFill();
  }
  for (let i = 0; i < bottomPoints.length; i += 4) {
    const p = bottomPoints[i];
    const seed = (p[0] * 17 + offsetX * 0.05) % 11;
    if (seed < 0) continue;
    graphics.beginFill(nucleus, 0.6);
    graphics.drawEllipse(p[0], p[1] - 6 - (seed % 3), 5, 2);
    graphics.endFill();
  }
}

export function drawBacillus(graphics: Graphics): void {
  graphics.clear();

  // Trailing flagella on the rear
  graphics.lineStyle(1.5, 0xc8a8ff, 0.6);
  graphics.moveTo(-38, -3);
  graphics.bezierCurveTo(-50, -10, -58, -2, -68, -8);
  graphics.moveTo(-38, 3);
  graphics.bezierCurveTo(-52, 8, -60, 1, -72, 5);
  graphics.moveTo(-36, 0);
  graphics.bezierCurveTo(-46, 2, -56, -3, -64, 0);

  // Outer cell wall (lighter halo)
  const wallOuter = mixColor(COLORS.bacillus, 0xffffff, 0.22);
  graphics.lineStyle(2, wallOuter, 0.5);
  graphics.beginFill(wallOuter, 0.18);
  graphics.drawRoundedRect(-42, -18, 84, 36, 18);
  graphics.endFill();

  // Main body
  graphics.lineStyle(4, 0x4d1f7b, 0.95);
  graphics.beginFill(COLORS.bacillus, 1);
  graphics.drawRoundedRect(-38, -15, 76, 30, 15);
  graphics.endFill();

  // Inner cytoplasm tint
  graphics.lineStyle(0);
  graphics.beginFill(mixColor(COLORS.bacillus, 0xffffff, 0.18), 0.45);
  graphics.drawRoundedRect(-32, -10, 64, 20, 10);
  graphics.endFill();

  // Polar caps
  const cap = mixColor(COLORS.bacillus, 0x000000, 0.35);
  graphics.beginFill(cap, 0.55);
  graphics.drawCircle(-30, 0, 6);
  graphics.drawCircle(30, 0, 6);
  graphics.endFill();

  // Ribosomes scattered inside
  const ribo = mixColor(COLORS.bacillus, 0xffffff, 0.55);
  for (let i = 0; i < 10; i++) {
    const rx = -26 + i * 6;
    const ry = ((i * 7) % 11) - 5;
    graphics.beginFill(ribo, 0.6);
    graphics.drawCircle(rx, ry, 1.4);
    graphics.endFill();
  }

  // Specular highlight band
  graphics.beginFill(0xffffff, 0.18);
  graphics.drawEllipse(-12, -7, 24, 5);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.32);
  graphics.drawEllipse(-18, -9, 8, 2);
  graphics.endFill();

  // Surface ridges
  graphics.lineStyle(2, 0xd0b1ff, 0.55);
  graphics.moveTo(-29, -10);
  graphics.quadraticCurveTo(-10, -17, 7, -10);
  graphics.moveTo(-22, 11);
  graphics.quadraticCurveTo(2, 17, 27, 8);
  graphics.lineStyle(1.5, 0xd0b1ff, 0.4);
  graphics.moveTo(-15, -4);
  graphics.quadraticCurveTo(0, -7, 18, -3);

  // Septum ring suggesting division
  graphics.lineStyle(2, mixColor(COLORS.bacillus, 0x000000, 0.5), 0.6);
  graphics.moveTo(0, -15);
  graphics.lineTo(0, 15);
}

export function drawPhage(graphics: Graphics): void {
  graphics.clear();

  // Outer halo
  graphics.lineStyle(0);
  graphics.beginFill(COLORS.phage, 0.18);
  graphics.drawCircle(0, -2, 32);
  graphics.endFill();

  // Hexagonal capsid head
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

  // Capsid plate facets - inner triangles connecting center to edges
  const facet = mixColor(COLORS.phage, 0x000000, 0.3);
  graphics.lineStyle(1.5, facet, 0.8);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * TWO_PI / 6;
    const x = Math.cos(a) * (24 + (i % 2) * 3);
    const y = Math.sin(a) * (22 + ((i + 1) % 2) * 4);
    graphics.moveTo(0, -2);
    graphics.lineTo(x, y);
  }

  // Capsid highlight (top)
  graphics.lineStyle(0);
  graphics.beginFill(0xffd2c8, 0.32);
  graphics.drawEllipse(-6, -14, 10, 4);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.45);
  graphics.drawEllipse(-9, -16, 4, 1.5);
  graphics.endFill();

  // Tail sheath with rings
  graphics.lineStyle(2, 0x4d0710, 0.85);
  graphics.beginFill(mixColor(COLORS.phage, 0x000000, 0.2), 1);
  graphics.drawRoundedRect(-5, 14, 10, 18, 2);
  graphics.endFill();
  graphics.lineStyle(1, 0xff9b8b, 0.5);
  for (let r = 0; r < 4; r++) {
    graphics.moveTo(-5, 17 + r * 4);
    graphics.lineTo(5, 17 + r * 4);
  }

  // Base plate
  graphics.lineStyle(2, 0x4d0710, 0.9);
  graphics.beginFill(mixColor(COLORS.phage, 0x000000, 0.4), 1);
  graphics.drawRoundedRect(-9, 31, 18, 4, 1);
  graphics.endFill();

  // Tail fibers (legs)
  graphics.lineStyle(2, 0xff9b8b, 0.7);
  graphics.moveTo(-7, 33);
  graphics.lineTo(-16, 38);
  graphics.lineTo(-22, 46);
  graphics.moveTo(-2, 34);
  graphics.lineTo(-6, 42);
  graphics.lineTo(-3, 50);
  graphics.moveTo(2, 34);
  graphics.lineTo(6, 42);
  graphics.lineTo(3, 50);
  graphics.moveTo(7, 33);
  graphics.lineTo(16, 38);
  graphics.lineTo(22, 46);

  // Nucleic acid coil seen through capsid
  graphics.lineStyle(1.2, 0xff5a5a, 0.45);
  graphics.moveTo(-12, -2);
  graphics.bezierCurveTo(-6, -10, 6, 6, 12, -2);
  graphics.moveTo(-10, 4);
  graphics.bezierCurveTo(-4, -2, 4, 10, 10, 4);

  // Center spike
  graphics.lineStyle(2, 0x39040c, 0.85);
  graphics.beginFill(mixColor(COLORS.phage, 0x000000, 0.35), 1);
  graphics.drawCircle(0, -2, 8);
  graphics.endFill();
  graphics.beginFill(0xff9b8b, 0.3);
  graphics.drawCircle(-2, -4, 3);
  graphics.endFill();
}

export function drawBoss(graphics: Graphics): void {
  graphics.clear();

  // Soft outer aura
  graphics.lineStyle(0);
  graphics.beginFill(0x711426, 0.18);
  graphics.drawCircle(0, 0, 100);
  graphics.endFill();

  // Body blob lobes (more, layered)
  const blobs: Array<[number, number, number]> = [
    [-18, -30, 42],
    [26, -18, 38],
    [-35, 18, 36],
    [22, 28, 45],
    [0, 0, 52],
    [-44, -8, 28],
    [40, 10, 30],
    [8, -42, 26],
    [-12, 38, 28]
  ];
  graphics.lineStyle(5, 0x711426, 0.9);
  blobs.forEach((b, index) => {
    const c = index % 3 === 0 ? 0xc45770 : index % 3 === 1 ? COLORS.boss : mixColor(COLORS.boss, 0x000000, 0.25);
    graphics.beginFill(c, 1);
    graphics.drawCircle(b[0], b[1], b[2]);
    graphics.endFill();
  });

  // Central nucleus
  graphics.lineStyle(3, 0x39040c, 0.9);
  graphics.beginFill(mixColor(COLORS.boss, 0x000000, 0.55), 1);
  graphics.drawCircle(0, 0, 24);
  graphics.endFill();
  graphics.beginFill(0xff5a5a, 0.55);
  graphics.drawCircle(-4, -4, 9);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.45);
  graphics.drawCircle(-7, -7, 3);
  graphics.endFill();

  // Surface granules (organelles peppered across the body)
  const granule = mixColor(COLORS.boss, 0xffffff, 0.45);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TWO_PI + 0.13;
    const rr = 22 + ((i * 17) % 30);
    const gx = Math.cos(a) * rr;
    const gy = Math.sin(a) * rr;
    graphics.lineStyle(0);
    graphics.beginFill(i % 2 ? granule : 0xff9b8b, 0.5);
    graphics.drawCircle(gx, gy, 3 + (i % 3));
    graphics.endFill();
  }

  // Tendrils
  graphics.lineStyle(7, 0x5d1020, 0.85);
  graphics.moveTo(-75, -45);
  graphics.quadraticCurveTo(-112, -74, -124, -22);
  graphics.moveTo(72, -38);
  graphics.quadraticCurveTo(118, -45, 128, 3);
  graphics.moveTo(-70, 48);
  graphics.quadraticCurveTo(-112, 78, -128, 31);
  graphics.moveTo(67, 55);
  graphics.quadraticCurveTo(116, 84, 124, 28);

  // Inner tendril cores
  graphics.lineStyle(3, 0xff7c7c, 0.6);
  graphics.moveTo(-75, -45);
  graphics.quadraticCurveTo(-110, -70, -120, -24);
  graphics.moveTo(72, -38);
  graphics.quadraticCurveTo(115, -42, 124, 1);
  graphics.moveTo(-70, 48);
  graphics.quadraticCurveTo(-110, 75, -124, 30);
  graphics.moveTo(67, 55);
  graphics.quadraticCurveTo(112, 80, 120, 28);

  // Tendril hooked tips
  graphics.lineStyle(0);
  [[-124, -22], [128, 3], [-128, 31], [124, 28]].forEach((p) => {
    graphics.beginFill(0xff5a5a, 0.85);
    graphics.drawCircle(p[0], p[1], 5);
    graphics.endFill();
    graphics.beginFill(0xffffff, 0.55);
    graphics.drawCircle(p[0] - 1.5, p[1] - 1.5, 1.8);
    graphics.endFill();
  });

  // Spike crowns sticking out around the silhouette
  graphics.lineStyle(2, 0x39040c, 0.8);
  graphics.beginFill(mixColor(COLORS.boss, 0x000000, 0.2), 1);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TWO_PI;
    const rIn = 48 + ((i * 11) % 8);
    const rOut = 64 + ((i * 13) % 12);
    const x1 = Math.cos(a - 0.06) * rIn;
    const y1 = Math.sin(a - 0.06) * rIn;
    const x2 = Math.cos(a) * rOut;
    const y2 = Math.sin(a) * rOut;
    const x3 = Math.cos(a + 0.06) * rIn;
    const y3 = Math.sin(a + 0.06) * rIn;
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
    graphics.lineTo(x3, y3);
    graphics.closePath();
  }
  graphics.endFill();

  // Subtle highlights
  graphics.lineStyle(0);
  graphics.beginFill(0xffb6ae, 0.45);
  graphics.drawEllipse(-12, -20, 42, 14);
  graphics.drawEllipse(28, 22, 34, 12);
  graphics.endFill();
  graphics.beginFill(0xffffff, 0.32);
  graphics.drawEllipse(-22, -28, 14, 5);
  graphics.endFill();
}

export function drawAntibody(graphics: Graphics, color: number): void {
  graphics.clear();
  // Outer glow halo
  graphics.lineStyle(0);
  graphics.beginFill(color, 0.18);
  graphics.drawCircle(0, 0, 14);
  graphics.endFill();

  // Y arms - dark shadow stroke
  const dark = mixColor(color, 0x000000, 0.5);
  graphics.lineStyle(7, dark, 0.55);
  graphics.moveTo(-8, 8);
  graphics.lineTo(0, 0);
  graphics.lineTo(10, -10);
  graphics.moveTo(0, 0);
  graphics.lineTo(10, 10);

  // Bright arms
  graphics.lineStyle(5, color, 1);
  graphics.moveTo(-8, 8);
  graphics.lineTo(0, 0);
  graphics.lineTo(10, -10);
  graphics.moveTo(0, 0);
  graphics.lineTo(10, 10);

  // Inner bright accent
  graphics.lineStyle(2, 0xfff8bb, 0.85);
  graphics.moveTo(-8, 8);
  graphics.lineTo(0, 0);
  graphics.lineTo(10, -10);
  graphics.moveTo(0, 0);
  graphics.lineTo(10, 10);

  // Binding tips
  graphics.lineStyle(0);
  graphics.beginFill(0xfff8bb, 0.95);
  graphics.drawCircle(-8, 8, 2.4);
  graphics.drawCircle(10, -10, 2.4);
  graphics.drawCircle(10, 10, 2.4);
  graphics.endFill();
  graphics.beginFill(color, 0.95);
  graphics.drawCircle(0, 0, 2);
  graphics.endFill();
}

export function drawFrontBackCharge(graphics: Graphics, color = COLORS.greenWeapon): void {
  graphics.clear();

  // Glow
  graphics.lineStyle(0);
  graphics.beginFill(color, 0.25);
  graphics.drawEllipse(0, 0, 18, 10);
  graphics.endFill();

  // Body shadow
  const dark = mixColor(color, 0x000000, 0.4);
  graphics.beginFill(dark, 0.55);
  graphics.moveTo(13, 1);
  graphics.lineTo(3, -7);
  graphics.lineTo(3, -2);
  graphics.lineTo(-13, -2);
  graphics.lineTo(-13, 4);
  graphics.lineTo(3, 4);
  graphics.lineTo(3, 9);
  graphics.closePath();
  graphics.endFill();

  // Body
  graphics.beginFill(color, 1);
  graphics.moveTo(12, 0);
  graphics.lineTo(2, -8);
  graphics.lineTo(2, -3);
  graphics.lineTo(-12, -3);
  graphics.lineTo(-12, 3);
  graphics.lineTo(2, 3);
  graphics.lineTo(2, 8);
  graphics.closePath();
  graphics.endFill();

  // Bright inner highlight outline
  graphics.lineStyle(1.5, 0xdbffd8, 0.85);
  graphics.moveTo(12, 0);
  graphics.lineTo(2, -8);
  graphics.lineTo(2, -3);
  graphics.lineTo(-12, -3);
  graphics.lineTo(-12, 3);
  graphics.lineTo(2, 3);
  graphics.lineTo(2, 8);
  graphics.closePath();

  // Core spark
  graphics.lineStyle(0);
  graphics.beginFill(0xffffff, 0.85);
  graphics.drawCircle(0, 0, 1.6);
  graphics.endFill();
}

export function drawHeavyCharge(graphics: Graphics, color = COLORS.purpleWeapon): void {
  graphics.clear();

  // Outer glow ring
  graphics.lineStyle(0);
  graphics.beginFill(color, 0.18);
  graphics.drawEllipse(0, 0, 24, 18);
  graphics.endFill();

  // Body
  graphics.beginFill(color, 1);
  graphics.drawEllipse(0, 0, 17, 12);
  graphics.endFill();

  // Edge stroke
  graphics.lineStyle(3, 0xf2d3ff, 0.85);
  graphics.drawEllipse(0, 0, 17, 12);

  // Energy spirals across the surface
  graphics.lineStyle(1.5, 0xfff0ff, 0.7);
  graphics.moveTo(-14, 0);
  graphics.bezierCurveTo(-8, -8, 8, 8, 14, 0);
  graphics.moveTo(-12, 4);
  graphics.bezierCurveTo(-6, 10, 6, -10, 12, -4);

  // Specular highlights
  graphics.lineStyle(2, 0xffffff, 0.55);
  graphics.drawEllipse(-5, -4, 7, 3);
  graphics.lineStyle(0);
  graphics.beginFill(0xffffff, 0.85);
  graphics.drawCircle(-7, -5, 1.5);
  graphics.endFill();
}

export function drawHomingEnemyShot(graphics: Graphics): void {
  graphics.clear();

  // Outer glow / target ring
  graphics.lineStyle(0);
  graphics.beginFill(COLORS.enemyHomingShot, 0.2);
  graphics.drawCircle(0, 0, 18);
  graphics.endFill();
  graphics.lineStyle(2, COLORS.enemyShot, 0.6);
  graphics.drawCircle(-4, 0, 14);
  graphics.lineStyle(1.5, 0xfff0aa, 0.5);
  graphics.drawCircle(-4, 0, 17);

  // Trailing flames
  graphics.lineStyle(2, 0xff7c00, 0.6);
  graphics.moveTo(-8, -4);
  graphics.lineTo(-18, -2);
  graphics.moveTo(-8, 4);
  graphics.lineTo(-18, 2);
  graphics.moveTo(-6, 0);
  graphics.lineTo(-22, 0);

  // Body shape
  const dark = mixColor(COLORS.enemyHomingShot, 0x000000, 0.4);
  graphics.lineStyle(0);
  graphics.beginFill(dark, 0.7);
  graphics.moveTo(17, 1);
  graphics.lineTo(-7, -10);
  graphics.lineTo(-1, 1);
  graphics.lineTo(-7, 12);
  graphics.closePath();
  graphics.endFill();

  graphics.beginFill(COLORS.enemyHomingShot, 1);
  graphics.moveTo(16, 0);
  graphics.lineTo(-8, -11);
  graphics.lineTo(-2, 0);
  graphics.lineTo(-8, 11);
  graphics.closePath();
  graphics.endFill();

  // Bright edge
  graphics.lineStyle(2, 0xfff0aa, 0.9);
  graphics.moveTo(16, 0);
  graphics.lineTo(-8, -11);
  graphics.lineTo(-2, 0);
  graphics.lineTo(-8, 11);
  graphics.closePath();

  // Tip spark
  graphics.lineStyle(0);
  graphics.beginFill(0xffffff, 0.95);
  graphics.drawCircle(13, 0, 2);
  graphics.endFill();
}

export function drawHeart(graphics: Graphics, active: boolean): void {
  graphics.clear();
  // Soft outer glow when active
  if (active) {
    graphics.lineStyle(0);
    graphics.beginFill(0xff5e67, 0.3);
    graphics.drawCircle(0, -2, 16);
    graphics.endFill();
  }
  // Body
  graphics.beginFill(active ? 0xff5e67 : 0x57202a, 1);
  graphics.lineStyle(2, active ? 0xffd4d4 : 0x8d4a56, 0.9);
  graphics.moveTo(0, 8);
  graphics.bezierCurveTo(-18, -4, -9, -20, 0, -10);
  graphics.bezierCurveTo(9, -20, 18, -4, 0, 8);
  graphics.endFill();
  // Highlight bead
  if (active) {
    graphics.lineStyle(0);
    graphics.beginFill(0xffffff, 0.65);
    graphics.drawEllipse(-5, -8, 4, 2);
    graphics.endFill();
  }
}

export function drawWeaponIndicator(graphics: Graphics, type: WeaponType): void {
  graphics.clear();
  if (type === 1) {
    graphics.lineStyle(0);
    graphics.beginFill(COLORS.redWeapon, 0.3);
    graphics.drawCircle(0, 0, 14);
    graphics.endFill();
    graphics.beginFill(COLORS.redWeapon);
    graphics.drawCircle(0, 0, 10);
    graphics.endFill();
    graphics.lineStyle(2, 0xffd2c8, 0.85);
    graphics.drawCircle(0, 0, 10);
    graphics.lineStyle(0);
    graphics.beginFill(0xffffff, 0.6);
    graphics.drawCircle(-3, -3, 2.5);
    graphics.endFill();
  } else if (type === 2) {
    graphics.lineStyle(0);
    graphics.beginFill(COLORS.blueWeapon, 0.25);
    graphics.drawCircle(0, 0, 14);
    graphics.endFill();
    graphics.beginFill(COLORS.blueWeapon);
    graphics.moveTo(12, 0);
    graphics.lineTo(-8, -10);
    graphics.lineTo(-4, 0);
    graphics.lineTo(-8, 10);
    graphics.closePath();
    graphics.endFill();
    graphics.lineStyle(1.5, 0xcde9ff, 0.85);
    graphics.moveTo(12, 0);
    graphics.lineTo(-8, -10);
    graphics.lineTo(-4, 0);
    graphics.lineTo(-8, 10);
    graphics.closePath();
  } else if (type === 3) {
    drawAntibody(graphics, COLORS.yellowWeapon);
  } else if (type === 4) {
    drawFrontBackCharge(graphics);
  } else {
    drawHeavyCharge(graphics);
  }
}

export function randomBonusColor(type: WeaponType): number {
  if (type === 1) return COLORS.redWeapon;
  if (type === 2) return COLORS.blueWeapon;
  if (type === 3) return COLORS.yellowWeapon;
  if (type === 4) return COLORS.greenWeapon;
  return COLORS.purpleWeapon;
}
