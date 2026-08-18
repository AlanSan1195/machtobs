import { useEffect, useRef } from 'react';

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

const DOT_SPACING = 18;
const POINTER_RADIUS = 104;
const SPRING_STRENGTH = 0.032;
const POINTER_STRENGTH = 1.8;
const VELOCITY_DAMPING = 0.88;

function readAccentColor() {
  const value = window.getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb')
    .trim()
    .split(/\s+/)
    .map(Number);

  return value.length === 3 && value.every(Number.isFinite) ? value : [58, 155, 220];
}

export function HeroParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const interactionArea = canvas?.parentElement;
    const context = canvas?.getContext('2d');

    if (!canvas || !interactionArea || !context) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const particles: Particle[] = [];
    const pointer = { x: 0, y: 0, active: false };
    const accent = readAccentColor();
    let animationFrame = 0;
    let previousTime = 0;
    let fieldWidth = 0;
    let fieldHeight = 0;

    const drawField = () => {
      context.clearRect(0, 0, fieldWidth, fieldHeight);

      const centerX = fieldWidth / 2;
      const centerY = fieldHeight / 2;
      const radius = Math.min(fieldWidth, fieldHeight) / 2 - 1;

      context.strokeStyle = `rgba(${accent.join(', ')}, 0.12)`;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = `rgba(${accent.join(', ')}, 0.055)`;
      context.beginPath();
      context.arc(centerX, centerY, radius * 0.52, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = `rgba(${accent.join(', ')}, 0.24)`;
      for (const particle of particles) {
        context.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      }
    };

    const animate = (time: number) => {
      animationFrame = 0;
      const elapsed = previousTime === 0 ? 16.67 : Math.min(time - previousTime, 32);
      const frameScale = elapsed / 16.67;
      previousTime = time;
      let isMoving = false;

      for (const particle of particles) {
        if (pointer.active) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);

          if (distance < POINTER_RADIUS) {
            const influence = 1 - distance / POINTER_RADIUS;
            const force = influence * influence * POINTER_STRENGTH * frameScale;
            const directionX = distance > 0 ? deltaX / distance : 1;
            const directionY = distance > 0 ? deltaY / distance : 0;
            particle.velocityX += directionX * force;
            particle.velocityY += directionY * force;
          }
        }

        particle.velocityX += (particle.homeX - particle.x) * SPRING_STRENGTH * frameScale;
        particle.velocityY += (particle.homeY - particle.y) * SPRING_STRENGTH * frameScale;
        particle.velocityX *= Math.pow(VELOCITY_DAMPING, frameScale);
        particle.velocityY *= Math.pow(VELOCITY_DAMPING, frameScale);
        particle.x += particle.velocityX * frameScale;
        particle.y += particle.velocityY * frameScale;

        if (
          Math.abs(particle.velocityX) > 0.02
          || Math.abs(particle.velocityY) > 0.02
          || Math.abs(particle.x - particle.homeX) > 0.08
          || Math.abs(particle.y - particle.homeY) > 0.08
        ) {
          isMoving = true;
        }
      }

      drawField();

      if ((pointer.active || isMoving) && !document.hidden) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        previousTime = 0;
      }
    };

    const requestAnimation = () => {
      if (animationFrame || reducedMotionQuery.matches || document.hidden) return;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const rebuildField = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      fieldWidth = bounds.width;
      fieldHeight = bounds.height;
      canvas.width = Math.round(fieldWidth * pixelRatio);
      canvas.height = Math.round(fieldHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      particles.length = 0;
      const centerX = fieldWidth / 2;
      const centerY = fieldHeight / 2;
      const radius = Math.min(fieldWidth, fieldHeight) / 2 - DOT_SPACING / 2;
      const firstX = (fieldWidth % DOT_SPACING) / 2;
      const firstY = (fieldHeight % DOT_SPACING) / 2;

      for (let y = firstY; y <= fieldHeight; y += DOT_SPACING) {
        for (let x = firstX; x <= fieldWidth; x += DOT_SPACING) {
          if (Math.hypot(x - centerX, y - centerY) > radius) continue;
          particles.push({
            homeX: x,
            homeY: y,
            x,
            y,
            velocityX: 0,
            velocityY: 0,
          });
        }
      }

      drawField();
    };

    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = pointer.x >= -POINTER_RADIUS
        && pointer.x <= bounds.width + POINTER_RADIUS
        && pointer.y >= -POINTER_RADIUS
        && pointer.y <= bounds.height + POINTER_RADIUS;
      requestAnimation();
    };

    const releasePointer = () => {
      pointer.active = false;
      requestAnimation();
    };

    const handleMotionPreference = () => {
      pointer.active = false;
      if (reducedMotionQuery.matches && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        for (const particle of particles) {
          particle.x = particle.homeX;
          particle.y = particle.homeY;
          particle.velocityX = 0;
          particle.velocityY = 0;
        }
        drawField();
      }
    };

    const resizeObserver = new ResizeObserver(rebuildField);
    resizeObserver.observe(canvas);
    interactionArea.addEventListener('pointermove', updatePointer, { passive: true });
    interactionArea.addEventListener('pointerleave', releasePointer);
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });
    reducedMotionQuery.addEventListener('change', handleMotionPreference);
    rebuildField();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      interactionArea.removeEventListener('pointermove', updatePointer);
      interactionArea.removeEventListener('pointerleave', releasePointer);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      reducedMotionQuery.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-particle-field" aria-hidden="true" />;
}
