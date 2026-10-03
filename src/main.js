// Entry point: canvas + fixed-timestep accumulator loop + state machine wiring.
import { CFG } from './config.js';
import { tap } from './input.js';
import { ship } from './ship.js';
import { bullets } from './bullets.js';
import { asteroids } from './asteroids.js';
import { resolve } from './collisions.js';
import { game, drawMenu, drawPaused, drawGameOver } from './game.js';
import { audio } from './audio.js';
import { held } from './input.js';
import { ufos } from './ufo.js';
import { particles } from './particles.js';

const canvas = document.getElementById('game');
canvas.width = CFG.view.width;
canvas.height = CFG.view.height;
const ctx = canvas.getContext('2d');

let thrustTimer = 0; // thrust loop re-trigger countdown (s)

// Touch/pointer input: on-screen buttons dispatch synthetic key events so
// input.js (keyboard-only) needs no changes (plan Touches excludes input.js).
const touchActive = new Set(); // button key codes currently pressed by pointer
function pointer(e) {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  const pressed = e.type === 'pointerdown' || (e.type === 'pointermove' && e.buttons.length > 0);
  const hit = new Set();
  if (pressed) {
    for (const b of CFG.touch.buttons) {
      if (Math.hypot(x - b.x, y - b.y) <= b.r) hit.add(b.key);
    }
  }
  for (const b of CFG.touch.buttons) {
    if (hit.has(b.key) && !touchActive.has(b.key)) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: b.key }));
      touchActive.add(b.key);
    } else if (!hit.has(b.key) && touchActive.has(b.key)) {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: b.key }));
      touchActive.delete(b.key);
    }
  }
}
if (CFG.touch.enabled) {
  canvas.addEventListener('pointerdown', pointer);
  canvas.addEventListener('pointermove', pointer);
  canvas.addEventListener('pointerup', pointer);
  canvas.addEventListener('pointercancel', pointer);
}

function update(dt) {
  if (tap('KeyM')) audio.setMuted(!audio.muted); // M toggles mute
  if (game.state === 'playing') {
    ship.update(dt);
    if (tap('Space')) {
      bullets.fire(ship.x, ship.y, ship.angle);
      audio.sfx('fire');
    }
    if (held('ArrowUp')) {
      thrustTimer -= dt;
      if (thrustTimer <= 0) {
        audio.sfx('thrust');
        thrustTimer = CFG.audio.thrustInterval;
      }
    } else {
      thrustTimer = 0;
    }
    asteroids.update(dt);
    ufos.update(dt); // saucers traverse + fire (after asteroids so positions current)
    resolve(); // AFTER bullets/asteroids/ufos update so positions are current
    particles.update(dt); // debris drifts/fades
    if (tap('ShiftLeft') || tap('ShiftRight') || tap('KeyH')) {
      const wasAlive = ship.alive;
      ship.hyperspace();
      audio.sfx('fire'); // jump sound
      if (wasAlive && !ship.alive) { // hyperspace self-destruct: debris + shake
        audio.sfx('ship_death');
        particles.burst(ship.x, ship.y, CFG.particles.burst.ship, CFG.colors.line);
        particles.shake(CFG.particles.shake.ship);
      }
    }
  }
  game.update(dt); // state machine always runs (taps, timers, waves)
}

function draw() {
  ctx.fillStyle = CFG.colors.bg;
  ctx.fillRect(0, 0, CFG.view.width, CFG.view.height);
  if (game.state === 'menu') {
    drawMenu(ctx);
  } else {
    const off = particles.shakeOffset(); // screen shake: translate world
    ctx.save();
    ctx.translate(off.dx, off.dy);
    ctx.strokeStyle = CFG.colors.line;
    ctx.fillStyle = CFG.colors.line;
    ctx.lineWidth = CFG.render.lineWidth; // line widths from CFG.render
    ctx.shadowColor = CFG.colors.line;
    ctx.shadowBlur = CFG.render.glow; // glow on entity strokes
    ship.draw(ctx);
    ctx.shadowBlur = CFG.render.glowShip; // ship gets a brighter glow
    bullets.draw(ctx); // draw after ship
    ctx.shadowBlur = CFG.render.glow;
    asteroids.draw(ctx); // draw after bullets
    ufos.draw(ctx); // saucers + saucer bullets on top
    particles.draw(ctx); // debris on top of entities
    ctx.shadowBlur = 0; // HUD stays crisp
    ctx.restore();
    game.drawHud(ctx);
    if (game.state === 'paused') drawPaused(ctx);
    if (game.state === 'gameover') drawGameOver(ctx);
    if (CFG.touch.enabled) { // on-screen touch buttons (outside shake)
      ctx.strokeStyle = CFG.colors.line;
      ctx.fillStyle = CFG.colors.line;
      ctx.globalAlpha = CFG.touch.alpha;
      for (const b of CFG.touch.buttons) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = b.r + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, b.y);
      }
      ctx.globalAlpha = 1;
    }
  }
}

let acc = 0;
let last = performance.now();

function frame() {
  const now = performance.now();
  acc = Math.min(acc + (now - last) / 1000, CFG.view.step * 5); // clamp catch-up
  last = now;
  while (acc >= CFG.view.step) {
    update(CFG.view.step);
    acc -= CFG.view.step;
  }
  draw();
  requestAnimationFrame(frame);
}

frame();
