import { useEffect, useRef } from 'react';

interface Particle {
  energy: number;
  homeX: number;
  homeY: number;
  phase: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

const DOT_SPACING = 18;
const POINTER_RADIUS = 164;
const CORE_RADIUS = 34;
const PARTICLE_GRAVITY_RADIUS = 42;
const COLLISION_DISTANCE = 9;
const RESTING_SPRING = 0.03;
const ACTIVE_DAMPING = 0.955;
const RESTING_DAMPING = 0.88;
const MAX_SPEED = 7.5;

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
    const activeParticles: Particle[] = [];
    const pointer = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      active: false,
      hasPosition: false,
    };
    const accent = readAccentColor();
    let animationFrame = 0;
    let previousTime = 0;
    let fieldWidth = 0;
    let fieldHeight = 0;
    let fieldPresence = 0;

    const drawField = () => {
      context.clearRect(0, 0, fieldWidth, fieldHeight);

      const centerX = fieldWidth / 2;
      const centerY = fieldHeight / 2;
      const radius = Math.min(fieldWidth, fieldHeight) / 2 - 1;

      if (fieldPresence > 0.01) {
        context.save();
        context.translate(pointer.x, pointer.y);
        context.scale(1.38, 0.72);

        const gravityLens = context.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          POINTER_RADIUS * 0.78,
        );
        gravityLens.addColorStop(0, `rgba(9, 10, 10, ${0.78 * fieldPresence})`);
        gravityLens.addColorStop(0.28, `rgba(9, 10, 10, ${0.54 * fieldPresence})`);
        gravityLens.addColorStop(0.55, `rgba(${accent.join(', ')}, ${0.18 * fieldPresence})`);
        gravityLens.addColorStop(1, `rgba(${accent.join(', ')}, 0)`);
        context.fillStyle = gravityLens;
        context.beginPath();
        context.arc(0, 0, POINTER_RADIUS * 0.78, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = `rgba(${accent.join(', ')}, ${0.16 * fieldPresence})`;
        context.lineWidth = 0.8;
        context.beginPath();
        context.arc(0, 0, CORE_RADIUS * 1.55, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }

      context.strokeStyle = `rgba(${accent.join(', ')}, 0.12)`;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = `rgba(${accent.join(', ')}, 0.055)`;
      context.beginPath();
      context.arc(centerX, centerY, radius * 0.52, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = `rgba(${accent.join(', ')}, 0.2)`;
      context.lineWidth = 0.8;
      context.beginPath();
      for (const particle of particles) {
        const speed = Math.hypot(particle.velocityX, particle.velocityY);
        if (particle.energy < 0.08 || speed < 0.35) continue;
        const trailLength = Math.min(speed * 2.4, 16) * particle.energy;
        context.moveTo(particle.x, particle.y);
        context.lineTo(
          particle.x - (particle.velocityX / speed) * trailLength,
          particle.y - (particle.velocityY / speed) * trailLength,
        );
      }
      context.stroke();

      context.fillStyle = `rgba(${accent.join(', ')}, 0.28)`;
      for (const particle of particles) {
        context.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      }

      context.fillStyle = `rgba(${accent.join(', ')}, 0.52)`;
      for (const particle of particles) {
        if (particle.energy < 0.08) continue;
        const size = 2 + particle.energy * 1.8;
        context.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
      }
    };

    const animate = (time: number) => {
      animationFrame = 0;
      const elapsed = previousTime === 0 ? 16.67 : Math.min(time - previousTime, 32);
      const frameScale = elapsed / 16.67;
      previousTime = time;
      let isMoving = false;
      activeParticles.length = 0;
      const targetPresence = pointer.active ? 1 : 0;
      const presenceSpeed = pointer.active ? 0.18 : 0.075;
      fieldPresence += (targetPresence - fieldPresence) * presenceSpeed * frameScale;

      for (const particle of particles) {
        let influence = 0;

        if (pointer.active) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);

          if (distance < POINTER_RADIUS) {
            const linearInfluence = 1 - distance / POINTER_RADIUS;
            influence = linearInfluence * linearInfluence;
            const directionX = distance > 0 ? deltaX / distance : 1;
            const directionY = distance > 0 ? deltaY / distance : 0;
            const orbitDirection = Math.sin(particle.phase) >= 0 ? 1 : -1;

            if (distance < CORE_RADIUS) {
              const coreForce = (1 - distance / CORE_RADIUS) * 2.5 * frameScale;
              particle.velocityX += directionX * coreForce;
              particle.velocityY += directionY * coreForce;
            } else {
              const gravityForce = (0.18 + influence * 0.52) * influence * frameScale;
              particle.velocityX -= directionX * gravityForce;
              particle.velocityY -= directionY * gravityForce;
            }

            const orbitForce = influence * 0.72 * orbitDirection * frameScale;
            const turbulence = Math.sin(time * 0.005 + particle.phase) * influence * 0.14 * frameScale;
            particle.velocityX += -directionY * orbitForce + directionX * turbulence;
            particle.velocityY += directionX * orbitForce + directionY * turbulence;
            particle.velocityX += pointer.velocityX * influence * 0.035;
            particle.velocityY += pointer.velocityY * influence * 0.035;
            activeParticles.push(particle);
          }
        }

        const energyTarget = pointer.active ? Math.min(1, influence * 2.4) : 0;
        const energySpeed = energyTarget > particle.energy ? 0.2 : 0.075;
        particle.energy += (energyTarget - particle.energy) * energySpeed * frameScale;
      }

      for (let firstIndex = 0; firstIndex < activeParticles.length; firstIndex += 1) {
        const firstParticle = activeParticles[firstIndex];

        for (let secondIndex = firstIndex + 1; secondIndex < activeParticles.length; secondIndex += 1) {
          const secondParticle = activeParticles[secondIndex];
          const deltaX = secondParticle.x - firstParticle.x;
          const deltaY = secondParticle.y - firstParticle.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;

          if (distanceSquared === 0 || distanceSquared > PARTICLE_GRAVITY_RADIUS ** 2) continue;

          const distance = Math.sqrt(distanceSquared);
          const directionX = deltaX / distance;
          const directionY = deltaY / distance;
          const sharedEnergy = Math.min(firstParticle.energy, secondParticle.energy);

          if (distance < COLLISION_DISTANCE) {
            const collisionForce = (1 - distance / COLLISION_DISTANCE) * 0.42 * frameScale;
            firstParticle.velocityX -= directionX * collisionForce;
            firstParticle.velocityY -= directionY * collisionForce;
            secondParticle.velocityX += directionX * collisionForce;
            secondParticle.velocityY += directionY * collisionForce;
          } else {
            const particleGravity = (
              1 - distance / PARTICLE_GRAVITY_RADIUS
            ) * sharedEnergy * 0.012 * frameScale;
            firstParticle.velocityX += directionX * particleGravity;
            firstParticle.velocityY += directionY * particleGravity;
            secondParticle.velocityX -= directionX * particleGravity;
            secondParticle.velocityY -= directionY * particleGravity;
          }
        }
      }

      pointer.velocityX *= Math.pow(0.82, frameScale);
      pointer.velocityY *= Math.pow(0.82, frameScale);

      for (const particle of particles) {
        const springStrength = RESTING_SPRING * (1 - particle.energy * 0.86);
        const damping = particle.energy > 0.03 ? ACTIVE_DAMPING : RESTING_DAMPING;
        particle.velocityX += (particle.homeX - particle.x) * springStrength * frameScale;
        particle.velocityY += (particle.homeY - particle.y) * springStrength * frameScale;
        particle.velocityX *= Math.pow(damping, frameScale);
        particle.velocityY *= Math.pow(damping, frameScale);

        const speed = Math.hypot(particle.velocityX, particle.velocityY);
        if (speed > MAX_SPEED) {
          particle.velocityX = (particle.velocityX / speed) * MAX_SPEED;
          particle.velocityY = (particle.velocityY / speed) * MAX_SPEED;
        }

        particle.x += particle.velocityX * frameScale;
        particle.y += particle.velocityY * frameScale;

        if (
          Math.abs(particle.velocityX) > 0.02
          || Math.abs(particle.velocityY) > 0.02
          || Math.abs(particle.x - particle.homeX) > 0.08
          || Math.abs(particle.y - particle.homeY) > 0.08
          || particle.energy > 0.01
        ) {
          isMoving = true;
        }
      }

      drawField();

      if ((pointer.active || isMoving || fieldPresence > 0.01) && !document.hidden) {
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
            energy: 0,
            homeX: x,
            homeY: y,
            phase: (x * 12.9898 + y * 78.233) % (Math.PI * 2),
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
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;

      if (pointer.hasPosition) {
        pointer.velocityX = Math.max(-22, Math.min(22, (nextX - pointer.x) * 0.72));
        pointer.velocityY = Math.max(-22, Math.min(22, (nextY - pointer.y) * 0.72));
      }

      pointer.x = nextX;
      pointer.y = nextY;
      pointer.hasPosition = true;
      pointer.active = pointer.x >= -POINTER_RADIUS
        && pointer.x <= bounds.width + POINTER_RADIUS
        && pointer.y >= -POINTER_RADIUS
        && pointer.y <= bounds.height + POINTER_RADIUS;
      requestAnimation();
    };

    const releasePointer = () => {
      pointer.active = false;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
      requestAnimation();
    };

    const handleMotionPreference = () => {
      pointer.active = false;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
      if (reducedMotionQuery.matches && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        for (const particle of particles) {
          particle.x = particle.homeX;
          particle.y = particle.homeY;
          particle.velocityX = 0;
          particle.velocityY = 0;
          particle.energy = 0;
        }
        fieldPresence = 0;
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
