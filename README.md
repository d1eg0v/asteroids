# Asteroids — vector arcade clone

A browser Asteroids clone built with vanilla JavaScript + HTML5 Canvas: ES modules,
no bundler, no dependencies. Everything is vector-drawn with Canvas strokes — no
sprites, no image assets. Audio is optional (synth-beep fallback).

## Play

**Live:** https://d1eg0v.github.io/asteroids/

Or run locally:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/ in any modern browser.

## Controls

| Input | Action |
|---|---|
| ← / → | rotate |
| ↑ | thrust |
| Space | fire |
| Shift or H | hyperspace (risky teleport) |
| P | pause |
| M | mute |

Touch: on-screen buttons at the bottom corners (◀ ▶ rotate, ● fire, ▲ thrust,
H hyperspace) — pointer events map to the same input model, so the game plays on
mobile with no keyboard.

## Project layout

```
Asteroids/
├── index.html              # canvas bootstrap
├── plan.md                 # build plan + session handoff (see below)
├── README.md               # this file
├── resources/
│   ├── README.md           # audio sourcing guide + required filenames
│   ├── CREDITS.md          # attribution table
│   └── audio/
│       ├── sfx/            # .wav SFX
│       └── music/          # .mp3 music
└── src/
    ├── config.js           # all tunables (frozen CFG)
    ├── main.js             # fixed-timestep loop
    ├── input.js            # keyboard state
    ├── ship.js             # ship + hyperspace
    ├── bullets.js          # bullet pool
    ├── asteroids.js        # asteroid field + waves
    ├── collisions.js       # circle tests + resolution
    ├── game.js             # states, lives, score, HUD
    ├── audio.js            # SFX + heartbeat music
    ├── ufo.js              # saucers
    └── particles.js        # debris, glow, shake
```

## Building with a small-context model

This project is designed to be built phase by phase by a model with only ~64k
tokens of context:

- `plan.md` is the build plan: one phase per session, each ending in a playable
  game with zero console errors.
- A session reads only the Status block, Working rules, the Module contracts
  table, and the current phase section — never the whole plan, never other
  modules' code.
- Every source file stays ≤150 lines; all tunables live in `src/config.js`;
  no inline magic numbers.
- Placeholders come before assets: vector shapes and oscillator beeps first;
  audio files are optional.
- The Status / Current phase / Last session notes block at the top of `plan.md`
  is the handoff between sessions — keep it updated at every phase boundary.

## Roadmap

Phases 0–8 are listed in the `plan.md` Status checklist: skeleton → ship →
bullets → asteroids → collisions → game states → audio → extras → polish &
release.

## Credits

See `resources/CREDITS.md` for asset attribution (fill as audio is added).
Audio sources and required filenames: `resources/README.md`.
