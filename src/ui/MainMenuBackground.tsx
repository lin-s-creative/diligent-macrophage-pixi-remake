import { useEffect, useRef } from 'react';

// Layer paths
const BACKGROUND_LAYERS = [
  '/backgrounds/location-1-vessel/layer-1.svg',
  '/backgrounds/location-1-vessel/layer-2.svg',
  '/backgrounds/location-1-vessel/layer-3.svg',
  '/backgrounds/location-1-vessel/layer-4.svg',
];

// Bacteria paths
const BACTERIA_SPRITES = [
  '/sprites/enemy-coccus.svg',
  '/sprites/enemy-bacillus.svg',
  '/sprites/enemy-phage.svg',
];

interface BacteriaEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  imageIndex: number;
  noiseX: number;
  noiseY: number;
  noiseStepX: number;
  noiseStepY: number;
}

export function MainMenuBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load background images
    const bgImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    BACKGROUND_LAYERS.forEach((path) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
      };
      bgImages.push(img);
    });

    // Load bacteria images
    const bacteriaImages: HTMLImageElement[] = [];
    BACTERIA_SPRITES.forEach((path) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
      };
      bacteriaImages.push(img);
    });

    const totalImagesToLoad = BACKGROUND_LAYERS.length + BACTERIA_SPRITES.length;

    // Resize handling
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize bacteria entities
    const bacteriaList: BacteriaEntity[] = [];
    const bacteriaCount = 18;

    for (let i = 0; i < bacteriaCount; i++) {
      bacteriaList.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        radius: 30 + Math.random() * 25, // size scaling (60px to 110px diameter)
        imageIndex: Math.floor(Math.random() * BACTERIA_SPRITES.length),
        noiseX: Math.random() * 100,
        noiseY: Math.random() * 100,
        noiseStepX: 0.01 + Math.random() * 0.015,
        noiseStepY: 0.01 + Math.random() * 0.015,
      });
    }

    // Scroll and parallax settings
    let time = 0;
    let targetMouseOffsetX = 0;
    let targetMouseOffsetY = 0;
    let currentMouseOffsetX = 0;
    let currentMouseOffsetY = 0;

    const autoScrollSpeeds = [0.05, 0.12, 0.22, 0.35];
    const mouseParallaxFactors = [0.01, 0.02, 0.035, 0.05];

    let animationId: number;

    const updateAndDraw = () => {
      time++;

      // Smoothly update mouse offsets
      if (mouseX !== null && mouseY !== null) {
        targetMouseOffsetX = (mouseX - window.innerWidth / 2) / (window.innerWidth / 2);
        targetMouseOffsetY = (mouseY - window.innerHeight / 2) / (window.innerHeight / 2);
      } else {
        // Return to center slowly when mouse is not on screen
        targetMouseOffsetX = 0;
        targetMouseOffsetY = 0;
      }
      currentMouseOffsetX += (targetMouseOffsetX - currentMouseOffsetX) * 0.06;
      currentMouseOffsetY += (targetMouseOffsetY - currentMouseOffsetY) * 0.06;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const allImagesLoaded = loadedCount >= totalImagesToLoad;

      if (allImagesLoaded) {
        // Draw background layers with parallax
        bgImages.forEach((img, i) => {
          if (!img.complete || img.naturalWidth === 0) return;

          // Scale slightly larger than height to allow vertical offset buffer
          const stretchFactor = 1.12;
          const h = canvas.height * stretchFactor;
          const scale = h / img.naturalHeight;
          const w = img.naturalWidth * scale;

          // Parallax and scroll calculations
          const scrollX = -time * autoScrollSpeeds[i];
          const mouseXShift = -currentMouseOffsetX * mouseParallaxFactors[i] * canvas.width;
          const mouseYShift = -currentMouseOffsetY * mouseParallaxFactors[i] * canvas.height;

          // Vertical offset centered with buffer
          const y = (canvas.height - h) / 2 + mouseYShift;

          // Wrap horizontally to make background endless
          let x = ((scrollX + mouseXShift) % w + w) % w - w;
          while (x < canvas.width) {
            ctx.drawImage(img, x, y, w, h);
            x += w;
          }
        });

        // Draw and update bacteria entities
        bacteriaList.forEach((b) => {
          // Magnetism and chaotic motion update
          if (mouseX !== null && mouseY !== null) {
            const dx = mouseX - b.x;
            const dy = mouseY - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 15) {
              // Attraction pulls them in
              const pullForce = Math.min(0.25, 75 / (dist + 40));
              b.vx += (dx / dist) * pullForce;
              b.vy += (dy / dist) * pullForce;

              // Swirling orbit force
              const orbitDirection = b.imageIndex % 2 === 0 ? 1 : -1;
              const orbitForce = 0.045 * orbitDirection;
              b.vx += (-dy / dist) * orbitForce;
              b.vy += (dx / dist) * orbitForce;
            }
          }

          // Chaotic noise perturbation
          b.noiseX += b.noiseStepX;
          b.noiseY += b.noiseStepY;
          b.vx += Math.sin(b.noiseX) * 0.075;
          b.vy += Math.cos(b.noiseY) * 0.075;

          // Friction limits building up velocity
          b.vx *= 0.965;
          b.vy *= 0.965;

          // Limit peak speed
          const speedFactor = 2.8;
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > speedFactor) {
            b.vx = (b.vx / speed) * speedFactor;
            b.vy = (b.vy / speed) * speedFactor;
          }

          // Update position
          b.x += b.vx;
          b.y += b.vy;
          b.rotation += b.rotationSpeed;

          // Soft screen bounds bouncing
          const pad = b.radius + 10;
          if (b.x < pad) {
            b.x = pad;
            b.vx = Math.abs(b.vx) * 0.9;
          } else if (b.x > canvas.width - pad) {
            b.x = canvas.width - pad;
            b.vx = -Math.abs(b.vx) * 0.9;
          }

          if (b.y < pad) {
            b.y = pad;
            b.vy = Math.abs(b.vy) * 0.9;
          } else if (b.y > canvas.height - pad) {
            b.y = canvas.height - pad;
            b.vy = -Math.abs(b.vy) * 0.9;
          }

          // Draw bacterium
          const bImg = bacteriaImages[b.imageIndex];
          if (bImg && bImg.complete && bImg.naturalWidth > 0) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);
            ctx.globalAlpha = 0.55; // Semi-transparent overlay style for background
            ctx.drawImage(
              bImg,
              -b.radius,
              -b.radius,
              b.radius * 2,
              b.radius * 2
            );
            ctx.restore();
          }
        });
      }

      animationId = requestAnimationFrame(updateAndDraw);
    };

    animationId = requestAnimationFrame(updateAndDraw);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="menu-background-canvas" />;
}
