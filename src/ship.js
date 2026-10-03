// Ship entity: rotate, thrust, inertia + friction, screen wrap.
import { CFG } from './config.js';
import { held } from './input.js';

export const ship = {
  x: CFG.view.width * CFG.ship.start[0],
  y: CFG.view.height * CFG.ship.start[1],
  vx: 0,
  vy: 0,
  angle: 0, // radians; 0 points right
  r: CFG.ship.r,
  alive: true,
  invuln: 0,

  update(dt) {
    const s = CFG.ship;
    if (ship.cooldown > 0) ship.cooldown = Math.max(0, ship.cooldown - dt);
    if (held('ArrowLeft')) ship.angle -= s.turnRate * dt;
    if (held('ArrowRight')) ship.angle += s.turnRate * dt;
    if (held('ArrowUp')) {
      ship.vx += Math.cos(ship.angle) * s.thrust * dt;
      ship.vy += Math.sin(ship.angle) * s.thrust * dt;
    }
    const drag = Math.max(0, 1 - s.friction * dt);
    ship.vx *= drag;
    ship.vy *= drag;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    const W = CFG.view.width;
    const H = CFG.view.height;
    ship.x = (ship.x + W) % W;
    ship.y = (ship.y + H) % H;
  },

  cooldown: 0, // hyperspace jump cooldown (s)

  hyperspace() { // teleport; small chance of self-destruct (CFG.hyperspace.risk)
    if (!ship.alive || ship.cooldown > 0) return;
    ship.cooldown = CFG.hyperspace.cooldown;
    ship.x = Math.random() * CFG.view.width;
    ship.y = Math.random() * CFG.view.height;
    ship.vx = 0;
    ship.vy = 0;
    if (Math.random() < CFG.hyperspace.risk) ship.alive = false;
  },

  draw(ctx) {
    if (!ship.alive) return;
    ctx.save();
    if (ship.invuln > 0) {
      const phase = Math.floor(ship.invuln / CFG.game.blink) % 2;
      ctx.globalAlpha = phase === 0 ? 1 : CFG.game.blinkAlpha;
    }
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = CFG.colors.line;
    ctx.lineWidth = CFG.ship.lineWidth;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const r = ship.r;
    const shape = CFG.ship.shape;
    ctx.moveTo(shape[0][0] * r, shape[0][1] * r);
    for (let i = 1; i < shape.length; i++) {
      ctx.lineTo(shape[i][0] * r, shape[i][1] * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },
};
