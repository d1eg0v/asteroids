// Asteroid field: three sizes, random polygon shapes, drift + spin, wrap, waves.
import { CFG } from './config.js';
import { ship } from './ship.js';

export const asteroids = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Radial offsets per vertex (N in CFG.asteroids.vertices range, ±jitter of r).
function makeShape(r) {
  const [minV, maxV] = CFG.asteroids.vertices;
  const n = minV + Math.floor(Math.random() * (maxV - minV + 1));
  const shape = [];
  for (let i = 0; i < n; i++) {
    shape.push(r * (1 + rand(-1, 1) * CFG.asteroids.jitter));
  }
  return shape;
}

function spawnAsteroid(x, y, size) {
  const s = CFG.asteroids.sizes[size];
  const dir = rand(0, Math.PI * 2);
  const [spinMin, spinMax] = CFG.asteroids.spinRange;
  const spin = rand(spinMin, spinMax) * (Math.random() < 0.5 ? -1 : 1);
  asteroids.push({
    x,
    y,
    vx: Math.cos(dir) * s.speed,
    vy: Math.sin(dir) * s.speed,
    r: s.r,
    size,
    spin,
    angle: rand(0, Math.PI * 2),
    shape: makeShape(s.r),
  });
}

// Spawn n large asteroids at random positions, kept clear of the ship.
function spawnWave(n) {
  const { width, height } = CFG.view;
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = rand(0, width);
      y = rand(0, height);
      tries++;
    } while (tries < 50 && Math.hypot(x - ship.x, y - ship.y) < CFG.asteroids.spawnClear);
    spawnAsteroid(x, y, 'large');
  }
}

function update(dt) {
  const { width, height } = CFG.view;
  for (const a of asteroids) {
    a.x = (a.x + a.vx * dt + width) % width;
    a.y = (a.y + a.vy * dt + height) % height;
    a.angle += a.spin * dt;
  }
}

function draw(ctx) {
  ctx.strokeStyle = CFG.colors.line;
  ctx.lineWidth = CFG.asteroids.lineWidth;
  for (const a of asteroids) {
    ctx.beginPath();
    const n = a.shape.length;
    for (let i = 0; i < n; i++) {
      const ang = a.angle + (i / n) * Math.PI * 2;
      const px = a.x + Math.cos(ang) * a.shape[i];
      const py = a.y + Math.sin(ang) * a.shape[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke(); // outline only — no fill
  }
}

// Remove a; push 2 children one size down (small: none). Reuses spawn()
// so child shapes/speeds stay CFG-driven.
function split(a) {
  const idx = asteroids.indexOf(a);
  if (idx !== -1) asteroids.splice(idx, 1);
  const next = { large: 'medium', medium: 'small' }[a.size];
  if (!next) return; // small -> gone
  for (let i = 0; i < 2; i++) {
    const off = a.r * 0.5;
    const ang = Math.random() * Math.PI * 2;
    spawnAsteroid(
      (a.x + Math.cos(ang) * off + CFG.view.width) % CFG.view.width,
      (a.y + Math.sin(ang) * off + CFG.view.height) % CFG.view.height,
      next,
    );
  }
}

// Attach methods to the pool array (same pattern as bullets.js).
asteroids.spawnWave = spawnWave;
asteroids.split = split;
asteroids.spawn = spawnAsteroid; // contract name
asteroids.spawnAsteroid = spawnAsteroid; // task name (alias)
asteroids.update = update;
asteroids.draw = draw;
