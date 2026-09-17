/**
 * Speaking Tigrinya text.
 *
 * There is no bundled recorded audio in this build, and no mainstream platform
 * ships a Tigrinya (`ti`) speech voice. So this tries, in order:
 *
 *   1. a `ti-*` voice, if the device somehow has one;
 *   2. an Amharic (`am-*`) voice — a different language, but it shares the
 *      Ge'ez script and most of the consonant inventory, so it reads Tigrinya
 *      text far more usefully than an English voice would;
 *   3. nothing, in which case `speak` reports failure and the UI falls back to
 *      showing the transliteration prominently instead of pretending.
 *
 * `supported()` is what the UI checks before promising audio.
 */

let cached: SpeechSynthesisVoice[] | null = null;

function voices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  if (cached && cached.length) return cached;
  cached = window.speechSynthesis.getVoices();
  return cached;
}

// Voices load asynchronously on most browsers; refresh the cache when they land.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cached = window.speechSynthesis.getVoices();
  });
}

export interface VoiceChoice {
  voice: SpeechSynthesisVoice;
  /** True when it is genuinely a Tigrinya voice rather than the Amharic stand-in. */
  exact: boolean;
}

export function pickVoice(): VoiceChoice | null {
  const all = voices();
  const ti = all.find((v) => v.lang.toLowerCase().startsWith('ti'));
  if (ti) return { voice: ti, exact: true };
  const am = all.find((v) => v.lang.toLowerCase().startsWith('am'));
  if (am) return { voice: am, exact: false };
  return null;
}

export function supported(): boolean {
  return pickVoice() !== null;
}

/** True when audio is only approximate, so the UI can say so once. */
export function isApproximate(): boolean {
  const v = pickVoice();
  return v !== null && !v.exact;
}

let lastUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak Ge'ez text. Returns false when no usable voice exists, which is the
 * signal to show the transliteration instead.
 */
export function speak(text: string, rate = 0.85): boolean {
  if (!('speechSynthesis' in window)) return false;
  const choice = pickVoice();
  if (!choice) return false;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = choice.voice;
  u.lang = choice.voice.lang;
  u.rate = rate;
  u.pitch = 1;
  lastUtterance = u;
  try {
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stop() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  lastUtterance = null;
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking && lastUtterance !== null;
}

/**
 * Haptics. iOS Safari does not implement the Vibration API, so this is a no-op
 * on the target device; it is kept because it costs nothing and works on
 * Android, and the visual feedback carries the weight either way.
 */
export function haptic(pattern: number | number[] = 10) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored — haptics are a nicety, never load-bearing.
    }
  }
}
