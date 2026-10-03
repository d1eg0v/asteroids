// Circle-circle collision resolution: bullet<->asteroid/ufo, ship<->asteroid/ufo/ufoBullet.
import { CFG } from './config.js';
import { ship } from './ship.js';
import { bullets } from './bullets.js';
import { asteroids } from './asteroids.js';
import { game, addScore } from './game.js';
import { audio } from './audio.js';
import { ufos, ufoBullets } from './ufo.js';
import { particles } from './particles.js';

const ufoKey = (size) => 'ufo' + (size[0].toUpperCase() + size.slice(1)); // 'ufoLarge' | 'ufoSmall'

export function resolve() {
  // Bullet <-> asteroid: remove both, split the asteroid, score by size.
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hit = false;
    for (const a of asteroids) {
      if (Math.hypot(b.x - a.x, b.y - a.y) < b.r + a.r) {
        addScore(CFG.score.bySize[a.size]);
        audio.sfx('explosion_' + a.size);
        particles.burst(a.x, a.y, CFG.particles.burst[a.size], CFG.colors.line);
        particles.shake(CFG.particles.shake[a.size]);
        asteroids.split(a);
        hit = true;
        break;
      }
    }
    if (hit) {
      bullets.splice(i, 1);
      continue;
    }
    // Bullet <-> ufo: remove both, score by size.
    for (let j = ufos.length - 1; j >= 0; j--) {
      const u = ufos[j];
      if (Math.hypot(b.x - u.x, b.y - u.y) < b.r + u.r) {
        addScore(CFG.ufo.score[u.size]);
        audio.sfx('explosion_' + u.size);
        particles.burst(u.x, u.y, CFG.particles.burst[ufoKey(u.size)], CFG.colors.line);
        particles.shake(CFG.particles.shake[ufoKey(u.size)]);
        ufos.splice(j, 1);
        hit = true;
        break;
      }
    }
    if (hit) bullets.splice(i, 1);
  }

  // UfoBullet <-> ship: ship dies.
  if (ship.alive && ship.invuln <= 0) {
    for (let i = ufoBullets.length - 1; i >= 0; i--) {
      const b = ufoBullets[i];
      if (Math.hypot(ship.x - b.x, ship.y - b.y) < ship.r + b.r) {
        ufoBullets.splice(i, 1);
        ship.alive = false;
        audio.sfx('ship_death');
        particles.burst(ship.x, ship.y, CFG.particles.burst.ship, CFG.colors.line);
        particles.shake(CFG.particles.shake.ship);
        break;
      }
    }
  }

  // Ship <-> asteroid: ship dies.
  if (ship.alive && ship.invuln <= 0) {
    for (const a of asteroids) {
      if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.r + a.r) {
        ship.alive = false;
        audio.sfx('ship_death');
        particles.burst(ship.x, ship.y, CFG.particles.burst.ship, CFG.colors.line);
        particles.shake(CFG.particles.shake.ship);
        break;
      }
    }
  }

  // Ship <-> ufo: both die.
  if (ship.alive && ship.invuln <= 0) {
    for (let j = ufos.length - 1; j >= 0; j--) {
      const u = ufos[j];
      if (Math.hypot(ship.x - u.x, ship.y - u.y) < ship.r + u.r) {
        ufos.splice(j, 1);
        addScore(CFG.ufo.score[u.size]);
        particles.burst(u.x, u.y, CFG.particles.burst[ufoKey(u.size)], CFG.colors.line);
        ship.alive = false;
        audio.sfx('ship_death');
        particles.burst(ship.x, ship.y, CFG.particles.burst.ship, CFG.colors.line);
        particles.shake(CFG.particles.shake.ship);
        break;
      }
    }
  }
}
