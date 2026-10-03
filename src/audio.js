// SFX + heartbeat music with WebAudio oscillator fallback (Phase 6).
import { CFG } from './config.js';

export const audio = { muted: false, ctx: null, master: null, hbPeriod: 0 };

try {
  audio.ctx = new AudioContext();
  audio.master = audio.ctx.createGain();
  audio.master.connect(audio.ctx.destination); // every node must reach destination
  audio.master.gain.value = CFG.audio.masterVolume;
} catch (e) {
  audio.ctx = null;
  audio.master = null;
}

const buffers = {}; // key -> AudioBuffer | null (null = file missing/failed)
const loading = new Set();

function lazyLoad(key, url) {
  if (key in buffers || loading.has(key) || !audio.ctx) return;
  loading.add(key);
  fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((ab) => (ab ? audio.ctx.decodeAudioData(ab) : null))
    .then((b) => { buffers[key] = b; })
    .catch(() => { buffers[key] = null; });
}

function beep(pitch, dur, offset) {
  if (!audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime + (offset || 0);
  const osc = audio.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = pitch;
  const g = audio.ctx.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(audio.master);
  osc.start(t);
  osc.stop(t + dur);
}

function playBuffer(buf) {
  const src = audio.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(audio.master);
  src.start();
}

function sfx(name) {
  const spec = CFG.audio.beep[name];
  if (!spec || !audio.ctx || audio.muted) return;
  const key = 'sfx/' + name;
  lazyLoad(key, `resources/audio/sfx/${name}.wav`);
  const buf = buffers[key];
  if (buf) { playBuffer(buf); return; }
  beep(spec.pitch, spec.dur, 0);
}

let hbTimer = 0;

function update(dt, count) {
  hbTimer -= dt;
  if (hbTimer > 0) return;
  const h = CFG.audio.hb;
  const frac = Math.min(1, count / h.refCount);
  const period = h.periodMax - (h.periodMax - h.periodMin) * (1 - frac); // fewer rocks = faster pulse
  hbTimer = period;
  audio.hbPeriod = period;
  if (!audio.ctx || audio.muted) return;
  const key = 'music/heartbeat';
  lazyLoad(key, 'resources/audio/music/heartbeat.mp3');
  const buf = buffers[key];
  if (buf) { playBuffer(buf); return; }
  beep(h.noteA, h.noteDur, 0);
  beep(h.noteB, h.noteDur, h.noteGap);
}

function setMuted(m) {
  audio.muted = m;
  if (audio.master) {
    audio.master.gain.value = m ? 0 : CFG.audio.masterVolume;
  }
}

audio.sfx = sfx;
audio.update = update;
audio.setMuted = setMuted;
