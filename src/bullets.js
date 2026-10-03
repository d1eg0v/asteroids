// Bullet pool: fire from the ship's nose, lifetime, on-screen cap, wrap.
// Pool is an array with fire/update/draw attached (same pattern as ship singleton).
import { CFG } from './config.js';

export const bullets = [];

bullets.fire = (x, y, angle) => {
  if (bullets.length >= CFG.bullets.max) return; // cap: no-op at max
  const d = CFG.bullets.noseOffset * CFG.ship.r; // nose offset from CFG, not inline
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  bullets.push({
    x: x + d * c,
    y: y + d * s,
    vx: CFG.bullets.speed * c,
    vy: CFG.bullets.speed * s,
    life: CFG.bullets.lifetime,
    r: CFG.bullets.r,
  });
};

bullets.update = (dt) => {
  const { width, height } = CFG.view;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }
    if (b.x < 0) b.x += width;
    else if (b.x >= width) b.x -= width;
    if (b.y < 0) b.y += height;
    else if (b.y >= height) b.y -= height;
  }
};

bullets.draw = (ctx) => {
  ctx.fillStyle = CFG.colors.line;
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
};
