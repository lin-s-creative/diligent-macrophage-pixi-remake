import { useEffect, useRef } from 'react';
import { DESIGNER_CONFIG } from '../config/designerConfig';

const HOMING_MOLECULE_SPRITE = DESIGNER_CONFIG.assets.sprites.enemyShotHoming;
const BASE_MOLECULE_COUNT = 88;
const MIN_MOLECULE_COUNT = 64;
const MAX_MOLECULE_COUNT = 132;

interface MoleculeEntity {
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  alpha: number;
  wobblePhaseX: number;
  wobblePhaseY: number;
  wobbleSpeedX: number;
  wobbleSpeedY: number;
  orbitDirection: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createMolecule(width: number, height: number): MoleculeEntity {
  const anchorX = Math.random() * width;
  const anchorY = Math.random() * height;
  const radius = 8 + Math.random() * 15;

  return {
    anchorX,
    anchorY,
    x: anchorX,
    y: anchorY,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.025,
    radius,
    alpha: 0.36 + Math.random() * 0.34,
    wobblePhaseX: Math.random() * Math.PI * 2,
    wobblePhaseY: Math.random() * Math.PI * 2,
    wobbleSpeedX: 0.006 + Math.random() * 0.014,
    wobbleSpeedY: 0.006 + Math.random() * 0.014,
    orbitDirection: Math.random() > 0.5 ? 1 : -1,
  };
}

function drawRadialGradientBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const baseGradient = ctx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, '#16030b');
  baseGradient.addColorStop(0.48, '#2d0917');
  baseGradient.addColorStop(1, '#090208');
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const gradients = [
    { x: width * 0.18, y: height * 0.18, r: Math.max(width, height) * 0.48, color: 'rgba(185, 66, 78, 0.36)' },
    { x: width * 0.82, y: height * 0.72, r: Math.max(width, height) * 0.55, color: 'rgba(118, 24, 42, 0.42)' },
    { x: width * 0.5, y: height * 0.46, r: Math.max(width, height) * 0.42, color: 'rgba(255, 157, 132, 0.13)' },
    { x: width * 0.68, y: height * 0.18, r: Math.max(width, height) * 0.34, color: 'rgba(255, 162, 56, 0.12)' },
    { x: width * 0.2, y: height * 0.85, r: Math.max(width, height) * 0.38, color: 'rgba(80, 14, 32, 0.58)' },
  ];

  gradients.forEach(({ x, y, r, color }) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.58, color.replace(/, [0-9.]+\)/, ', 0.08)'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, Math.min(width, height) * 0.15, width * 0.5, height * 0.48, Math.max(width, height) * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.52)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function MainMenuBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moleculeImage = new Image();
    moleculeImage.src = HOMING_MOLECULE_SPRITE;

    let mouseX: number | null = null;
    let mouseY: number | null = null;
    let animationId = 0;
    let time = 0;
    let molecules: MoleculeEntity[] = [];

    const getTargetMoleculeCount = () => {
      const areaFactor = (window.innerWidth * window.innerHeight) / (1280 * 720);
      return clamp(Math.round(BASE_MOLECULE_COUNT * areaFactor), MIN_MOLECULE_COUNT, MAX_MOLECULE_COUNT);
    };

    const seedMolecules = (width: number, height: number, count: number) => {
      molecules = Array.from({ length: count }, () => createMolecule(width, height));
    };

    const resizeCanvas = () => {
      const previousWidth = canvas.width || window.innerWidth;
      const previousHeight = canvas.height || window.innerHeight;
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const scaleX = nextWidth / previousWidth;
      const scaleY = nextHeight / previousHeight;

      canvas.width = nextWidth;
      canvas.height = nextHeight;

      const targetCount = getTargetMoleculeCount();
      if (molecules.length === 0) {
        seedMolecules(nextWidth, nextHeight, targetCount);
        return;
      }

      molecules.forEach((molecule) => {
        molecule.anchorX *= scaleX;
        molecule.anchorY *= scaleY;
        molecule.x *= scaleX;
        molecule.y *= scaleY;
      });

      if (molecules.length < targetCount) {
        molecules.push(...Array.from({ length: targetCount - molecules.length }, () => createMolecule(nextWidth, nextHeight)));
      } else if (molecules.length > targetCount) {
        molecules = molecules.slice(0, targetCount);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    const updateMolecule = (molecule: MoleculeEntity) => {
      molecule.wobblePhaseX += molecule.wobbleSpeedX;
      molecule.wobblePhaseY += molecule.wobbleSpeedY;

      const wobbleX = Math.sin(molecule.wobblePhaseX + time * 0.004) * 16;
      const wobbleY = Math.cos(molecule.wobblePhaseY + time * 0.004) * 16;
      const homeX = molecule.anchorX + wobbleX;
      const homeY = molecule.anchorY + wobbleY;

      molecule.vx += (homeX - molecule.x) * 0.0017;
      molecule.vy += (homeY - molecule.y) * 0.0017;

      if (mouseX !== null && mouseY !== null) {
        const dx = mouseX - molecule.x;
        const dy = mouseY - molecule.y;
        const distance = Math.hypot(dx, dy);
        const magnetRadius = 280;

        if (distance > 1 && distance < magnetRadius) {
          const falloff = 1 - distance / magnetRadius;
          const pull = falloff * falloff * 0.24;
          molecule.vx += (dx / distance) * pull;
          molecule.vy += (dy / distance) * pull;

          const swirl = 0.035 * falloff * molecule.orbitDirection;
          molecule.vx += (-dy / distance) * swirl;
          molecule.vy += (dx / distance) * swirl;
        }
      }

      molecule.vx += Math.sin(time * 0.01 + molecule.wobblePhaseY) * 0.006;
      molecule.vy += Math.cos(time * 0.01 + molecule.wobblePhaseX) * 0.006;
      molecule.vx *= 0.935;
      molecule.vy *= 0.935;

      const maxSpeed = 2.15;
      const speed = Math.hypot(molecule.vx, molecule.vy);
      if (speed > maxSpeed) {
        molecule.vx = (molecule.vx / speed) * maxSpeed;
        molecule.vy = (molecule.vy / speed) * maxSpeed;
      }

      molecule.x += molecule.vx;
      molecule.y += molecule.vy;
      molecule.rotation += molecule.rotationSpeed + molecule.vx * 0.002;

      const padding = molecule.radius * 1.4;
      if (molecule.x < -padding) molecule.x = canvas.width + padding;
      if (molecule.x > canvas.width + padding) molecule.x = -padding;
      if (molecule.y < -padding) molecule.y = canvas.height + padding;
      if (molecule.y > canvas.height + padding) molecule.y = -padding;
    };

    const drawMolecule = (molecule: MoleculeEntity) => {
      if (!moleculeImage.complete || moleculeImage.naturalWidth === 0) return;

      ctx.save();
      ctx.translate(molecule.x, molecule.y);
      ctx.rotate(molecule.rotation);
      ctx.globalAlpha = molecule.alpha;
      ctx.shadowColor = 'rgba(255, 162, 56, 0.48)';
      ctx.shadowBlur = molecule.radius * 0.7;
      ctx.drawImage(
        moleculeImage,
        -molecule.radius,
        -molecule.radius,
        molecule.radius * 2,
        molecule.radius * 2,
      );
      ctx.restore();
    };

    const updateAndDraw = () => {
      time += 1;

      drawRadialGradientBackground(ctx, canvas.width, canvas.height);
      molecules.forEach((molecule) => {
        updateMolecule(molecule);
        drawMolecule(molecule);
      });

      animationId = requestAnimationFrame(updateAndDraw);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationId = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="menu-background-canvas" />;
}
