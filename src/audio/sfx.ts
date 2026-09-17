/**
 * Sound effects, synthesised with the Web Audio API.
 *
 * Nothing is fetched — every sound is a few oscillators and an envelope. That
 * keeps the app a single small download and means sounds are instant, which
 * matters when the feedback has to land the moment a tile is tapped.
 *
 * iOS only allows audio after a user gesture, so the context is created lazily
 * on the first tap and resumed on every play.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Call from the first user gesture so later sounds are not blocked. */
export function unlockAudio() {
  const a = audio();
  if (!a) return;
  const g = a.createGain();
  g.gain.value = 0;
  g.connect(a.destination);
  const o = a.createOscillator();
  o.connect(g);
  o.start();
  o.stop(a.currentTime + 0.01);
}

interface ToneOpts {
  freq: number;
  /** Seconds from now. */
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the note. */
  to?: number;
}

function tone({ freq, at = 0, dur = 0.12, type = 'sine', gain = 0.18, to }: ToneOpts) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const env = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);

  // Short attack, exponential decay — reads as a "pluck" rather than a beep.
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(env).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(at = 0, dur = 0.18, gain = 0.09) {
  const a = audio();
  if (!a) return;
  const frames = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, frames, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = gain;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(a.currentTime + at);
}

/** Tapping a tile or an option. */
export const sfxTap = () => tone({ freq: 660, dur: 0.05, type: 'triangle', gain: 0.07 });

/** Un-tapping / returning a tile. */
export const sfxUntap = () => tone({ freq: 430, dur: 0.05, type: 'triangle', gain: 0.06 });

/** Right answer: a bright major third. */
export function sfxCorrect() {
  tone({ freq: 784, dur: 0.11, type: 'triangle', gain: 0.16 });
  tone({ freq: 1046.5, at: 0.06, dur: 0.16, type: 'triangle', gain: 0.14 });
}

/** Wrong answer: a short falling buzz. */
export function sfxWrong() {
  tone({ freq: 233, to: 155, dur: 0.24, type: 'sawtooth', gain: 0.11 });
  noise(0, 0.12, 0.05);
}

/** Losing a heart. */
export function sfxHeartLost() {
  tone({ freq: 392, to: 262, dur: 0.3, type: 'sine', gain: 0.12 });
}

/** Finishing a lesson: a rising arpeggio. */
export function sfxComplete() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, at: i * 0.09, dur: 0.22, type: 'triangle', gain: 0.15 }),
  );
}

/** Match-pairs: two tiles clicking together. */
export function sfxMatch() {
  tone({ freq: 880, dur: 0.07, type: 'sine', gain: 0.12 });
  tone({ freq: 1318.5, at: 0.05, dur: 0.09, type: 'sine', gain: 0.1 });
}

/** Opening a chest / claiming a reward. */
export function sfxReward() {
  [659.25, 830.61, 987.77, 1318.5].forEach((f, i) =>
    tone({ freq: f, at: i * 0.07, dur: 0.3, type: 'triangle', gain: 0.13 }),
  );
  noise(0.02, 0.4, 0.04);
}

/** Streak extended. */
export function sfxStreak() {
  tone({ freq: 440, to: 880, dur: 0.35, type: 'triangle', gain: 0.14 });
}

/** Levelling up a unit / crown gained. */
export function sfxCrown() {
  [784, 988, 1175, 1568].forEach((f, i) =>
    tone({ freq: f, at: i * 0.06, dur: 0.26, type: 'square', gain: 0.07 }),
  );
}
