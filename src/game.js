// State machine, lives, score, waves, HUD (Phase 5).
import { CFG } from './config.js';
import { tap } from './input.js';
import { ship } from './ship.js';
import { bullets } from './bullets.js';
import { asteroids } from './asteroids.js';
import { audio } from './audio.js';
import { ufos } from './ufo.js';

export const game = {
  state: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  score: 0,
  hi: Number(localStorage.getItem('asteroids.hi') || 0), // persisted high score
  lives: 0,
  wave: 0,
  waveCount: 0, // internal: size of the current wave
  respawnTimer: 0, // internal: seconds until respawn
  nextExtra: 0, // internal: score threshold for the next extra life
};

export function addScore(n) {
  game.score += n;
  while (game.score >= game.nextExtra + CFG.game.extraLifeEvery) {
    game.nextExtra += CFG.game.extraLifeEvery;
    game.lives += 1;
    audio.sfx('extra_life');
  }
  if (game.score > game.hi) {
    game.hi = game.score;
    localStorage.setItem('asteroids.hi', String(game.hi)); // survives reload
  }
}

function resetGame() {
  game.score = 0;
  game.lives = CFG.game.lives;
  game.wave = 1;
  game.waveCount = CFG.asteroids.waveCount;
  game.respawnTimer = 0;
  game.state = 'menu';
}

function respawnShip(invuln) {
  ship.x = CFG.view.width * CFG.ship.start[0];
  ship.y = CFG.view.height * CFG.ship.start[1];
  ship.vx = 0;
  ship.vy = 0;
  ship.angle = CFG.game.startAngle;
  ship.alive = true;
  ship.invuln = invuln;
}

function startGame() {
  resetGame();
  game.state = 'playing';
  bullets.length = 0; // clear stale bullets on restart
  respawnShip(CFG.game.invuln);
  asteroids.spawnWave(game.waveCount);
  ufos.spawnWave(); // occasionally one saucer per wave
}

function update(dt) {
  if (game.state === 'menu') { if (tap('Space') || tap('Enter')) startGame(); return; }
  if (game.state === 'gameover') { if (tap('Space') || tap('Enter')) resetGame(); return; } // back to menu (plan)
  if (game.state === 'paused') { if (tap('KeyP')) game.state = 'playing'; return; }
  // playing
  if (tap('KeyP')) { game.state = 'paused'; return; }
  if (ship.invuln > 0) ship.invuln = Math.max(0, ship.invuln - dt);
  if (!ship.alive) {
    if (game.respawnTimer <= 0) {
      game.lives -= 1;
      if (game.lives <= 0) { game.state = 'gameover'; return; }
      game.respawnTimer = CFG.game.respawnDelay;
    } else {
      game.respawnTimer -= dt;
      if (game.respawnTimer <= 0) respawnShip(CFG.game.invuln);
    }
  }
  if (asteroids.length === 0) {
    game.wave += 1;
    game.waveCount = Math.min(game.waveCount + CFG.game.waveGrowth, CFG.game.waveMax);
    asteroids.spawnWave(game.waveCount);
    ufos.spawnWave(); // occasionally one saucer per wave
  }
  audio.update(dt, asteroids.length); // heartbeat tempo scales with field size
}

function drawHud(ctx) {
  ctx.fillStyle = CFG.colors.line;
  ctx.font = `${CFG.hud.font}px monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(String(game.score), CFG.hud.x, CFG.hud.y);
  ctx.textAlign = 'center';
  ctx.fillText(String(game.hi), CFG.view.width * CFG.hud.hiX, CFG.hud.y);
  ctx.textAlign = 'right';
  ctx.fillText(`WAVE ${game.wave}`, CFG.view.width * CFG.hud.waveX, CFG.view.height * CFG.hud.waveY);
  // lives as small ship pips, bottom-left
  const pipR = CFG.ship.r * CFG.hud.pipScale;
  const px0 = CFG.view.width * CFG.hud.livesX;
  const py = CFG.view.height * CFG.hud.livesY;
  ctx.strokeStyle = CFG.colors.line;
  ctx.lineWidth = 1;
  const sh = CFG.ship.shape;
  for (let i = 0; i < game.lives; i++) {
    const px = px0 + i * CFG.hud.pipGap;
    ctx.beginPath();
    sh.forEach(([ux, uy], j) => { const x = px + ux * pipR, y = py + uy * pipR; if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.textAlign = 'left';
}

function drawText(ctx, text, font, yFrac) {
  ctx.fillStyle = CFG.colors.line;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${font}px monospace`;
  ctx.fillText(text, CFG.view.width * CFG.hud.centerX, CFG.view.height * yFrac);
  ctx.textAlign = 'left';
}

export function drawMenu(ctx) {
  drawText(ctx, 'ASTEROIDS', CFG.hud.menuFont, CFG.hud.menuY);
  drawText(ctx, 'PRESS ENTER OR SPACE', CFG.hud.promptFont, CFG.hud.promptY);
}

export function drawPaused(ctx) {
  drawText(ctx, 'PAUSED', CFG.hud.overlayFont, CFG.hud.overlayY);
}

export function drawGameOver(ctx) {
  drawText(ctx, 'GAME OVER', CFG.hud.overlayFont, CFG.hud.overlayY);
}

// Contract shape: game.update(dt), game.addScore(n), game.drawHud(ctx) are methods.
game.update = update; game.addScore = addScore; game.drawHud = drawHud;
