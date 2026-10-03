// All tunables — single source of truth. Never mutate at runtime.
export const CFG = Object.freeze({
  view: {
    width: 960,
    height: 600,
    step: 1 / 60, // fixed-timestep seconds
  },
  colors: {
    bg: '#05070a',
    line: '#e8f2ff',
    accent: '#ff5a6a',
  },
  ship: {
    r: 14, // collision + draw radius (px)
    turnRate: Math.PI * 1.5, // rad/s
    thrust: 300, // px/s^2 forward accel while ArrowUp held
    friction: 0.8, // decay rate (1/s) when not thrusting
    lineWidth: 2,
    start: [0.5, 0.5], // start position as fractions of view
    shape: [[1, 0], [-0.6, 0.5], [-0.6, -0.5]], // unit polygon (nose at +x)
  },
  bullets: {
    speed: 500, // px/s
    lifetime: 1.2, // seconds before cull
    max: 5, // max bullets on screen
    r: 1.5, // dot radius (px)
    noseOffset: 1, // nose offset as multiple of CFG.ship.r
  },
  asteroids: {
    sizes: {
      large: { r: 48, speed: 60, score: 20 },
      medium: { r: 26, speed: 95, score: 50 },
      small: { r: 14, speed: 140, score: 100 },
    },
    vertices: [10, 14], // vertex count range per polygon
    jitter: 0.2, // radial jitter as fraction of r
    spinRange: [0.4, 1.4], // rad/s drift-spin range (sign randomized)
    waveCount: 4, // large asteroids in the initial wave
    spawnClear: 150, // min px away from ship when spawning
    lineWidth: 1.5,
  },
  score: {
    bySize: { large: 20, medium: 50, small: 100 }, // points per destroyed size
  },
  game: {
    lives: 3, // starting lives
    extraLifeEvery: 10000, // points per extra life (plan: every 10,000)
    invuln: 2.5, // seconds of invulnerability after respawn
    respawnDelay: 1.2, // seconds between death and respawn
    waveGrowth: 3, // extra large asteroids per cleared wave (plan: min(n+3, 11))
    waveMax: 11, // cap on large asteroids per wave
    blink: 0.15, // seconds per blink phase while invuln > 0
    blinkAlpha: 0.15, // ship alpha during the off phase
    startAngle: -Math.PI / 2, // ship heading at start/respawn (nose up)
  },
  hud: {
    font: 20, // px
    x: 12, // score text position
    y: 26,
    centerX: 0.5, // overlay/menu text horizontal center (fraction)
    hiX: 0.5, // hi-score text centered
    waveX: 0.96, // wave number (fractions of view, bottom-right)
    waveY: 0.94,
    livesX: 0.02, // lives pips origin (fractions, bottom-left)
    livesY: 0.94,
    pipScale: 0.5, // ship pip radius as fraction of CFG.ship.r
    pipGap: 26, // px between pips
    menuFont: 48,
    menuY: 0.28, // menu title y (fraction)
    promptFont: 20,
    promptY: 0.55, // menu prompt y (fraction)
    overlayFont: 32,
    overlayY: 0.45, // paused/gameover text y (fraction)
  },
  ufo: {
    spawnChance: 0.35, // chance a saucer appears per wave
    smallChance: 0.5, // chance the saucer is the small (aimed) kind
    sizes: {
      large: { r: 24, speed: 90 },
      small: { r: 16, speed: 130 },
    },
    score: { large: 50, small: 100 }, // points per saucer destroyed
    fireDelay: 1.0, // s before first shot after spawn
    fireIntervalLarge: 1.2, // s between random shots (large)
    fireIntervalSmall: 1.0, // s between aimed shots (small)
    aimError: 0.12, // rad jitter on small-saucer aim
    bullet: { speed: 320, lifetime: 1.6, max: 6, r: 2 },
    lineWidth: 1.5,
  },
  hyperspace: {
    risk: 0.25, // chance a jump self-destructs (plan: CFG.hyperspace.risk)
    cooldown: 1.0, // s between jumps
  },
  audio: {
    masterVolume: 0.6, // master gain 0..1
    thrustInterval: 0.15, // s between thrust loop re-triggers
    beep: { // oscillator fallback per SFX name: pitch Hz, dur s
      fire: { pitch: 880, dur: 0.08 },
      thrust: { pitch: 140, dur: 0.12 },
      explosion_large: { pitch: 160, dur: 0.4 },
      explosion_medium: { pitch: 260, dur: 0.28 },
      explosion_small: { pitch: 420, dur: 0.2 },
      ship_death: { pitch: 100, dur: 0.5 },
      extra_life: { pitch: 660, dur: 0.3 },
    },
    hb: { // heartbeat pulse
      periodMax: 1.4, // s between pulses when field is full
      periodMin: 0.35, // s between pulses when field nearly clear
      refCount: 11, // asteroid count treated as "full"
      noteA: 220, // Hz first note
      noteB: 165, // Hz second note
      noteDur: 0.09, // s per note
      noteGap: 0.12, // s between the two notes
    },
  },
  particles: {
    max: 240, // debris cap (oldest culled on overflow)
    lifeMin: 0.5, // s debris lifespan range
    lifeMax: 1.4,
    speedMin: 40, // px/s debris drift range
    speedMax: 180,
    lenMin: 4, // px segment length range
    lenMax: 12,
    lineWidth: 1.5,
    burst: { large: 14, medium: 9, small: 6, ufoLarge: 12, ufoSmall: 8, ship: 16 }, // debris count per event
    shake: { large: 6, medium: 4, small: 2, ufoLarge: 5, ufoSmall: 3, ship: 8 }, // shake px per event
    shakeDuration: 0.35, // s of shake per request
    dust: { // thruster exhaust puffs
      rate: 140, // particles emitted per second while thrusting
      max: 160, // cap (oldest culled)
      tailOffset: 0.6, // emit point behind ship centre, multiple of CFG.ship.r
      lateral: 0.35, // sideways spawn jitter, multiple of CFG.ship.r
      speedMin: 60, // px/s ejection speed (relative to ship), backwards
      speedMax: 160,
      spread: 0.35, // rad cone half-angle around the exhaust direction
      lifeMin: 0.25, // s
      lifeMax: 0.6,
      sizeMin: 0.8, // px start radius range
      sizeMax: 2.2,
      color: '#ffb36b',
    },
  },
  render: {
    glow: 6, // ctx.shadowBlur px for entity strokes
    glowShip: 8, // ship gets a brighter glow
    lineWidth: 1.5, // default entity stroke width
  },
  touch: {
    enabled: true, // on-screen buttons for pointer/touch input
    alpha: 0.25, // button outline alpha
    buttons: [ // on-screen buttons: canvas coords, mapped key code, glyph
      { x: 70, y: 530, r: 34, key: 'ArrowLeft', label: '◀' },
      { x: 150, y: 530, r: 34, key: 'ArrowRight', label: '▶' },
      { x: 890, y: 530, r: 38, key: 'Space', label: '●' },
      { x: 810, y: 530, r: 30, key: 'ArrowUp', label: '▲' },
      { x: 850, y: 460, r: 26, key: 'KeyH', label: 'H' },
    ],
  },
});
