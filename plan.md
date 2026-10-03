# Asteroids — Build Plan

Stack: vanilla JS + HTML5 Canvas, ES modules, no bundler, no dependencies.
Dev server: `python3 -m http.server 8000` → http://localhost:8000/

Design constraint: the model that builds this has only a ~64k context window.
One phase per session (~30–40k tokens of work); every phase ends in a playable
game with zero console errors.

## Status

- [x] Scaffold — docs only (plan.md, README.md, resources/)
- [x] Phase 0 — Skeleton & fixed-timestep loop
- [x] Phase 1 — Ship: rotate, thrust, inertia, friction, screen wrap
- [x] Phase 2 — Bullets: fire, lifetime, on-screen limit, wrap
- [x] Phase 3 — Asteroids: sizes, random polygons, drift + spin, wrap, wave spawn
- [x] Phase 4 — Collisions & splitting: circle tests, split chain, score by size
- [x] Phase 5 — Game states: menu/playing/paused/gameover, lives, respawn + invulnerability, waves, HUD
- [ ] Phase 6 — Audio: SFX + heartbeat music (oscillator fallback)
- [ ] Phase 7 — Extras: UFO saucers, hyperspace, extra life, high score
- [ ] Phase 8 — Polish & release: particles, glow, shake, touch, balance, credits, deploy

- [x] Phase 6 — Audio: SFX + heartbeat music (oscillator fallback)

- [x] Phase 7 — Extras: UFO saucers, hyperspace, extra life, high score

**Current phase:** Phase 8 — Polish & release: particles, glow, shake, touch, balance, credits, deploy

**Last session notes:** Phase 7 done: ufo.js (new, 88 lines) — ufos[] + ufoBullets[] pools; ufos.spawnWave() rolls CFG.ufo.spawnChance 0.35 per wave (startGame + wave-clear both call it), saucer crosses screen edge-to-edge (spawns just off-screen, removed on exit), large fires random angles every fireIntervalLarge, small aims at ship with CFG.ufo.aimError jitter every fireIntervalSmall, ufoBullets capped CFG.ufo.bullet.max 6; methods attached to ufos array (ufos.spawnWave/update/draw — same pattern as asteroids.js, NOT module-level exports; first bug this session was forgetting that attachment). collisions.js now 4 passes: bullet↔ufo (score CFG.ufo.score large 50/small 100, explosion sfx), ufoBullet↔ship (dies, bullet removed), ship↔asteroid, ship↔ufo (both die, score). ship.js: ship.hyperspace() teleports to random pos, zeroes velocity, CFG.hyperspace.risk 0.25 self-destruct, cooldown 1.0s ticked in ship.update, no-op when dead or cooling. game.js: addScore grants extra life every CFG.game.extraLifeEvery 10000 (nextExtra threshold field, lives+1, extra_life sfx) + hi persisted via localStorage 'asteroids.hi' (read at module init, written on new hi). main.js: ufos.update before resolve, ufos.draw after asteroids, Shift/H tap → ship.hyperspace() + fire sfx. Judgment calls: hyperspace cooldown 1.0s added (plan silent, prevents spam); jump sound reuses fire beep (no dedicated sfx name in CFG.audio.beep); saucers don't collide with asteroids or bullets-from-ufos don't hit asteroids (plan says ufoBullets hit ship only); extra life can exceed starting lives (no cap — plan silent). game.js grew to 160 lines mid-phase, compacted to 138 (one-line state branches + forEach pip loop) — behavior unchanged. Verified (port 8123, ?v=p7b..p7d): saucer spawns, fires (small saucer aim within aimError of ship vector), bullet kills saucer (+100 small), ufoBullet↔ship and ufo↔ship (+50 large) both die ship, hyperspace teleports + cooldown blocks re-jump, addScore(10000) → lives 3→4, hi 10100 stored in localStorage and read back on fresh module graph (survives reload), zero console errors. Next session: particles.js (burst/shake/shakeOffset), wire into collisions explosions + ship death + ufo death, glow via shadowBlur + CFG.render line widths, balance pass, CREDITS.md, deploy + record URL.

## Working rules

1. One phase per session. Stop at the phase boundary — never start the next phase.
2. Read only: the Status block, Working rules, Architecture + Module contracts, and the current phase section. Grep `^## Phase` for headings; never read the whole plan.
3. Open only the files listed under the phase's **Touches**. For modules you merely call, code against the Module contracts table — do not read their implementations.
4. Every source file stays ≤150 lines. If a file passes 150 lines, split it before starting the next phase.
5. All tunable numbers (sizes, speeds, cooldowns, caps, colors) live in `src/config.js` as a frozen `CFG`. No inline magic numbers in game code — even ones this plan states in prose.
6. Implement the contracts' export names and signatures exactly. If a signature must deviate, take the simplest option and record the choice in "Last session notes" so the next session sees it.
7. Placeholders before assets: vector shapes, oscillator beeps. Never block on downloading audio or images.
8. Every phase ends playable: page loads, canvas renders, zero console errors. Verify in a real browser before ticking the checkbox.
9. Never paste big files or logs into chat — reference code as `path:line` and summarize.
10. End of session: update the top of plan.md — tick the phase, set **Current phase** to the next one, write 1–3 lines in **Last session notes** (what was done, judgment calls, anything half-finished).

## Architecture

### File tree

```
Asteroids/
├── index.html              # canvas bootstrap; loads src/main.js as a module
├── plan.md                 # this file — build plan + session handoff (top block)
├── README.md               # how to run, controls, layout
├── resources/
│   ├── README.md           # audio sourcing guide + required filenames
│   ├── CREDITS.md          # attribution table (fill as assets are added)
│   └── audio/
│       ├── sfx/            # .wav SFX (see resources/README.md)
│       └── music/          # .mp3 music
└── src/
    ├── config.js           # all tunables — frozen CFG object
    ├── main.js             # canvas, fixed-timestep loop, draw order
    ├── input.js            # keyboard state (held / just-pressed)
    ├── ship.js             # ship entity + hyperspace (Phase 1, 7)
    ├── bullets.js          # bullet pool (Phase 2)
    ├── asteroids.js        # asteroid field + waves + splitting (Phase 3)
    ├── collisions.js       # circle tests + resolution (Phase 4)
    ├── game.js             # state machine, lives, score, waves, HUD (Phase 5)
    ├── audio.js            # SFX + heartbeat music, mute (Phase 6)
    ├── ufo.js              # saucers + saucer bullets (Phase 7)
    └── particles.js        # debris, glow, screen shake (Phase 8)
```

### Module contracts

Code against this table — do not read the module's implementation. All `update(dt)`
take seconds; `ctx` is a `CanvasRenderingContext2D`. Import rule: every module may
import `config`; entity modules import only what they call; no import cycles
(e.g. `bullets.js` never imports `ship.js`). Contracts marked (Phase N) do not
exist until that phase builds them — do not import them earlier.

| Module | Export | Signature | Contract |
|---|---|---|---|
| `config.js` | `CFG` | frozen object | all tunables, namespaced (`CFG.ship.thrust`, `CFG.bullets.max`, `CFG.asteroids.sizes`, `CFG.score.bySize`, …). Phases add keys; nothing mutates at runtime. |
| `main.js` | — | — | entry point: owns canvas + rAF accumulator loop (STEP = `CFG.view.step`); calls subsystems in draw order; applies shake offset (Phase 8). |
| `input.js` | `held(code)` | `(string) -> bool` | key currently down (`code` = KeyboardEvent.code, e.g. `'ArrowLeft'`, `'Space'`). |
| | `tap(code)` | `(string) -> bool` | true once on the frame the key became down. |
| `ship.js` | `ship` | object `{x, y, vx, vy, angle, r, alive, invuln}` | singleton. |
| | `ship.update(dt)` | `(number) -> void` | rotate/thrust/friction/wrap; reads `input` + `CFG.ship`. |
| | `ship.draw(ctx)` | `(ctx) -> void` | vector line-drawn polygon; blinks while `invuln > 0`. |
| | `ship.hyperspace()` | `() -> void` | (Phase 7) teleport to random position; may self-destruct. |
| `bullets.js` | `bullets` | array of `{x, y, vx, vy, life, r}` | pool. |
| | `bullets.fire(x, y, angle)` | `(number, number, number) -> void` | push one bullet from the nose; no-op at `CFG.bullets.max`. |
| | `bullets.update(dt)` | `(number) -> void` | move, age, wrap, cull expired. |
| | `bullets.draw(ctx)` | `(ctx) -> void` | small dots. |
| `asteroids.js` | `asteroids` | array of `{x, y, vx, vy, r, size, spin, shape}` | `size` ∈ `'large'\|'medium'\|'small'`; `shape` = vertex offsets generated once per asteroid. |
| | `asteroids.spawnWave(n)` | `(int) -> void` | spawn `n` large asteroids just off-screen edges. |
| | `asteroids.spawn(x, y, size)` | `(number, number, string) -> void` | single asteroid. |
| | `asteroids.update(dt)` | `(number) -> void` | drift + spin + wrap. |
| | `asteroids.draw(ctx)` | `(ctx) -> void` | random polygon outline. |
| | `asteroids.split(a)` | `(asteroid) -> void` | remove `a`; push 2 children one size down (small: none). |
| `collisions.js` | `resolve()` | `() -> void` | imports `ship`, `bullets`, `asteroids`, `game` (+ `ufos`, `ufoBullets` in Phase 7). Circle-circle tests: bullet↔asteroid → remove both, `split`, `game.addScore(CFG.score.bySize)`; ship↔asteroid → `ship.alive = false`. |
| `game.js` | `game` | object `{state, score, hi, lives, wave}` | `state` ∈ `'menu'\|'playing'\|'paused'\|'gameover'`. |
| | `game.update(dt)` | `(number) -> void` | state machine, respawn + invulnerability timers, wave clear, extra life. |
| | `game.drawHud(ctx)` | `(ctx) -> void` | score, hi, lives pips, wave number. |
| | `game.addScore(n)` | `(int) -> void` | score += n; extra life every 10,000 (Phase 7). |
| `audio.js` | `audio.sfx(name)` | `(string) -> void` | play named SFX; oscillator-beep fallback if file missing. |
| | `audio.update(dt, count)` | `(number, int) -> void` | heartbeat pulse; tempo scales inversely with `count` (asteroids left). |
| | `audio.setMuted(m)` | `(bool) -> void` | M key. |
| `ufo.js` | `ufos` | array of `{x, y, vx, vy, size, r}` | saucers; `size` ∈ `'large'\|'small'`. |
| | `ufoBullets` | array of `{x, y, vx, vy, life, r}` | saucer bullets (hit ship only). |
| | `ufos.spawnWave()` | `() -> void` | occasionally spawn one saucer. |
| | `ufos.update(dt)` | `(number) -> void` | traverse screen; large fires randomly, small aims at ship. |
| | `ufos.draw(ctx)` | `(ctx) -> void` | vector saucer. |
| `particles.js` | `particles.burst(x, y, n, color)` | `(number, number, int, string) -> void` | line-segment debris. |
| | `particles.update(dt)` / `particles.draw(ctx)` | | fade out. |
| | `particles.shake(intensity)` | `(number) -> void` | request screen shake. |
| | `particles.shakeOffset()` | `() -> {dx, dy}` | current shake offset for main.js. |

Each phase below lists **Touches** (the only files to open), **Build**, and
**Done when** (the playable gate). Find a section with `rg '^## Phase N'`.

## Phase 0 — Skeleton & fixed-timestep loop

**Touches:** `index.html`, `src/config.js`, `src/main.js`, `src/input.js` (all new)

**Build:**
- `index.html`: full-viewport canvas, `<script type="module" src="./src/main.js">`, dark page background.
- `config.js`: frozen `CFG` — `view.width/height`, `view.step` (1/60), colors (`bg`, `line`).
- `main.js`: `requestAnimationFrame` + accumulator; run `update()` in `step` chunks (clamp catch-up), `draw()` once per frame. Placeholder: a white square drifting, bouncing off edges (proves the loop).
- `input.js`: `keydown`/`keyup` listeners on `window`; expose `held()`/`tap()`.

**Done when:** page loads at http://localhost:8000, square moves smoothly at consistent speed, zero console errors.

## Phase 1 — Ship: rotate, thrust, inertia, friction, screen wrap

**Touches:** `src/ship.js` (new), `src/config.js`, `src/main.js`

**Build:**
- `ship.js`: vector line-drawn ship (stroked triangle polygon, no fill); ←/→ rotate, ↑ thrust along heading; velocity inertia + friction (deceleration); screen wrap.
- `config.js`: add `CFG.ship` — turn rate, thrust accel, friction, radius, start position.
- `main.js`: import `ship`, call `ship.update(dt)` / `ship.draw(ctx)`; remove the placeholder square.

**Done when:** ship flies with inertia, wraps at all edges, rotates crisply, zero console errors.

## Phase 2 — Bullets: fire, lifetime, limit on screen, wrap

**Touches:** `src/bullets.js` (new), `src/config.js`, `src/main.js`

**Build:**
- `bullets.js`: pool + `fire(x, y, angle)` from the ship's nose, lifetime, wrap, cull.
- `config.js`: add `CFG.bullets` — speed, lifetime, max on screen, radius.
- `main.js`: `input.tap('Space')` → `bullets.fire(ship.x, ship.y, ship.angle)`; draw after ship.

**Done when:** bullets fire from the nose, cap respected, expire on lifetime, wrap, zero console errors.

## Phase 3 — Asteroids: large/medium/small, random polygon shapes, drift + spin, wrap, wave spawning

**Touches:** `src/asteroids.js` (new), `src/config.js`, `src/main.js`

**Build:**
- `asteroids.js`: three sizes (radius, speed, score in `CFG.asteroids.sizes`); random polygon (10–14 vertices, ±20% radius jitter, generated once per asteroid); drift + spin; wrap; `spawnWave(n)` just off-screen edges.
- `main.js`: spawn an initial wave of 4 large asteroids; update/draw.

**Done when:** a wave of large asteroids drifts and spins across the screen, wraps, zero console errors.

## Phase 4 — Collisions & splitting: circle tests, bullet/asteroid, ship/asteroid, split large→2 medium→2 small, score by size

**Touches:** `src/collisions.js` (new), `src/game.js` (new, minimal), `src/config.js`, `src/main.js`

**Build:**
- `collisions.js`: `resolve()` with circle-circle tests; bullet↔asteroid removes both and calls `split`; ship↔asteroid sets `ship.alive = false`.
- `game.js` (minimal for now): `game` object + `addScore(n)`; immediate respawn at center when `!ship.alive` (no invulnerability yet — Phase 5).
- `config.js`: add `CFG.score.bySize` (large/medium/small points).
- `main.js`: call `resolve()` each step; draw score text top-left (HUD polish is Phase 5).

**Done when:** shooting splits asteroids down the full chain (large→2 medium→2 small→gone), score increments per size, ship collision kills and respawns, zero console errors.

## Phase 5 — Game states: menu/playing/paused/gameover, lives, respawn with safe invulnerability, waves, HUD

**Touches:** `src/game.js`, `src/ship.js`, `src/config.js`, `src/main.js`

**Build:**
- `game.js`: state machine `menu → playing → paused → gameover`; menu screen (title + "press Enter"); `P` pauses; `CFG.game.lives` lives; wave progression (clearing spawns wave `min(n+3, 11)` large asteroids); game over when lives exhausted → back to menu.
- `ship.js`: respawn at center with `CFG.game.invuln` seconds of invulnerability (blink via alpha).
- `game.js`: HUD — score, hi-score placeholder, lives as small ship pips, wave number.

**Done when:** full loop works: menu → play → death costs a life → invulnerable blink after respawn → waves advance → game over returns to menu; zero console errors.

## Phase 6 — Audio: fire, thrust loop, 3 explosion sizes, ship death, extra life, and the two-note "heartbeat" that speeds up as asteroids dwindle

**Touches:** `src/audio.js` (new), `src/collisions.js`, `src/game.js`, `src/main.js`, `src/config.js`

**Build:**
- `audio.js`: lazy-load `resources/audio/sfx/*.wav` + `resources/audio/music/heartbeat.mp3` via `fetch` + `decodeAudioData`; **if a file is missing, fall back to a WebAudio oscillator beep** (per-name pitch) so the game never blocks on assets.
- SFX names (exact, see `resources/README.md`): `fire`, `thrust` (loop while thrusting), `explosion_large`, `explosion_medium`, `explosion_small`, `ship_death`, `extra_life`.
- Heartbeat: two-note pulse whose tempo scales inversely with `asteroids.length` (faster as the wave dwindles).
- `M` mutes (`audio.setMuted`). Wire `audio.sfx(...)` calls into `collisions.js` and `game.js`.

**Done when:** every event makes a sound (beeps fine if files absent), heartbeat tempo changes with asteroid count, mute works, zero console errors.

## Phase 7 — Extras: UFO saucers (large dumb / small aimed), hyperspace jump with risk, extra life every 10,000, high score in localStorage

**Touches:** `src/ufo.js` (new), `src/ship.js`, `src/game.js`, `src/collisions.js`, `src/config.js`, `src/main.js`

**Build:**
- `ufo.js`: saucers crossing the screen, spawned occasionally per wave; large saucer fires randomly, small saucer aims at the ship; saucer bullets live in `ufoBullets`.
- `collisions.js`: bullet↔ufo (score by size), ufoBullet↔ship, ufo↔ship.
- `ship.js`: `hyperspace()` on `Shift`/`H` — teleport to random position; small chance of self-destruct (`CFG.hyperspace.risk`).
- `game.js`: extra life every 10,000 (`extra_life` sfx); persist hi score in `localStorage`.

**Done when:** saucers attack and get destroyed, hyperspace teleports with occasional risk, 10k grants a life, hi score survives reload, zero console errors.

## Phase 8 — Polish & release: particle debris, glow/line-width, screen shake, touch controls (optional), balancing, credits, deploy

**Touches:** `src/particles.js` (new), `src/main.js`, `src/collisions.js`, `src/config.js`, `README.md`, `resources/CREDITS.md`, `plan.md`

**Build:**
- `particles.js`: line-segment debris burst on every explosion/ship death; `shake()` on explosions and death; `main.js` applies `shakeOffset()`.
- Glow via `ctx.shadowBlur` + line widths from `CFG.render`; balance pass: tune `CFG` numbers (speeds, cooldowns, caps) for playability.
- Optional touch controls (on-screen buttons) — skip if it risks the 150-line budget.
- Fill `resources/CREDITS.md` for every asset actually used; update README roadmap; deploy (GitHub Pages or static host) and record the URL in "Last session notes".

**Done when:** release build plays cleanly with debris/glow/shake, credits filled, deployed URL verified live, zero console errors.
