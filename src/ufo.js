// Saucers crossing the screen + saucer bullets (Phase 7).
import { CFG } from './config.js';
import { ship } from './ship.js';

export const ufos = [];
export const ufoBullets = [];

function spawnWave() {
  if (Math.random() >= CFG.ufo.spawnChance) return;
  const size = Math.random() < CFG.ufo.smallChance ? 'small' : 'large';
  const s = CFG.ufo.sizes[size];
  const dir = Math.random() < 0.5 ? 1 : -1;
  const y = CFG.view.height * (0.15 + 0.7 * Math.random());
  ufos.push({
    x: dir > 0 ? -s.r : CFG.view.width + s.r,
    y,
    vx: dir * s.speed,
    vy: 0,
    size,
    r: s.r,
    fireTimer: CFG.ufo.fireDelay,
  });
}

function update(dt) {
  for (let i = ufos.length - 1; i >= 0; i--) {
    const u = ufos[i];
    u.x += u.vx * dt;
    u.y += u.vy * dt;
    const W = CFG.view.width;
    if ((u.vx > 0 && u.x > W + u.r) || (u.vx < 0 && u.x < -u.r)) {
      ufos.splice(i, 1);
      continue;
    }
    u.fireTimer -= dt;
    if (u.fireTimer <= 0) {
      u.fireTimer = u.size === 'large' ? CFG.ufo.fireIntervalLarge : CFG.ufo.fireIntervalSmall;
      if (ufoBullets.length >= CFG.ufo.bullet.max) continue;
      let angle;
      if (u.size === 'large') {
        angle = Math.random() * Math.PI * 2; // large saucer: random shots
      } else {
        angle = Math.atan2(ship.y - u.y, ship.x - u.x) + (Math.random() * 2 - 1) * CFG.ufo.aimError;
      }
      ufoBullets.push({
        x: u.x,
        y: u.y,
        vx: Math.cos(angle) * CFG.ufo.bullet.speed,
        vy: Math.sin(angle) * CFG.ufo.bullet.speed,
        life: CFG.ufo.bullet.lifetime,
        r: CFG.ufo.bullet.r,
      });
    }
  }
  for (let i = ufoBullets.length - 1; i >= 0; i--) {
    const b = ufoBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) ufoBullets.splice(i, 1);
  }
}

function draw(ctx) {
  ctx.strokeStyle = CFG.colors.line;
  ctx.fillStyle = CFG.colors.line;
  ctx.lineWidth = CFG.ufo.lineWidth;
  for (const u of ufos) {
    const r = u.r;
    ctx.beginPath(); // hull ellipse
    ctx.ellipse(u.x, u.y, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath(); // dome
    ctx.moveTo(u.x - r * 0.5, u.y - r * 0.3);
    ctx.lineTo(u.x - r * 0.45, u.y - r * 0.85);
    ctx.lineTo(u.x + r * 0.45, u.y - r * 0.85);
    ctx.lineTo(u.x + r * 0.5, u.y - r * 0.3);
    ctx.stroke();
  }
  for (const b of ufoBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Attach methods to the pool array (same pattern as asteroids.js).
ufos.spawnWave = spawnWave;
ufos.update = update;
ufos.draw = draw;
