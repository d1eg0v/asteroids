// Line-segment debris + screen shake (Phase 8).
import { CFG } from './config.js';

export const particles = [];
let shakeAmp = 0; // current shake amplitude (px)
let shakeT = 0; // seconds of shake remaining

export function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = CFG.particles.speedMin + Math.random() * (CFG.particles.speedMax - CFG.particles.speedMin);
    const life = CFG.particles.lifeMin + Math.random() * (CFG.particles.lifeMax - CFG.particles.lifeMin);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      angle: a,
      len: CFG.particles.lenMin + Math.random() * (CFG.particles.lenMax - CFG.particles.lenMin),
      life,
      maxLife: life,
      color,
    });
  }
  if (particles.length > CFG.particles.max) particles.splice(0, particles.length - CFG.particles.max);
}

export function update(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (shakeT > 0) {
    shakeT -= dt;
    if (shakeT <= 0) { shakeT = 0; shakeAmp = 0; }
  }
}

export function shake(intensity) {
  shakeAmp = Math.max(shakeAmp, intensity);
  shakeT = CFG.particles.shakeDuration;
}

export function shakeOffset() {
  if (shakeT <= 0) return { dx: 0, dy: 0 };
  const amp = shakeAmp * (shakeT / CFG.particles.shakeDuration);
  return { dx: (Math.random() * 2 - 1) * amp, dy: (Math.random() * 2 - 1) * amp };
}

export function draw(ctx) {
  ctx.lineWidth = CFG.particles.lineWidth;
  for (const p of particles) {
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    const half = p.len / 2;
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(p.angle) * half, p.y - Math.sin(p.angle) * half);
    ctx.lineTo(p.x + Math.cos(p.angle) * half, p.y + Math.sin(p.angle) * half);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Attach methods to the pool array (same pattern as asteroids.js/ufos).
particles.burst = burst;
particles.update = update;
particles.shake = shake;
particles.shakeOffset = shakeOffset;
particles.draw = draw;
