/**
 * A light spaced-repetition layer over the lexicon.
 *
 * Each word carries a strength 0–5. A correct answer moves it up, a wrong one
 * knocks it down two levels, and the next due date follows the interval for the
 * new strength. Words that fall below strength 3 are what "Practice" pulls
 * from, which is how the app decides a word has "gone stale".
 */

export interface WordState {
  strength: number;
  /** Epoch ms when this word should be seen again. */
  due: number;
  seen: number;
  wrong: number;
  /** Epoch ms of the last answer. */
  last: number;
}

/** Interval per strength level, in hours. */
const INTERVALS = [0, 4, 24, 3 * 24, 7 * 24, 30 * 24];

export const MAX_STRENGTH = 5;

export function blank(): WordState {
  return { strength: 0, due: 0, seen: 0, wrong: 0, last: 0 };
}

export function review(state: WordState | undefined, correct: boolean, now = Date.now()): WordState {
  const s = state ?? blank();
  const strength = correct
    ? Math.min(MAX_STRENGTH, s.strength + 1)
    : Math.max(0, s.strength - 2);
  return {
    strength,
    due: now + INTERVALS[strength] * 3600_000,
    seen: s.seen + 1,
    wrong: s.wrong + (correct ? 0 : 1),
    last: now,
  };
}

/** 0–1, decaying as a word approaches and passes its due date. */
export function freshness(state: WordState | undefined, now = Date.now()): number {
  if (!state || !state.seen) return 0;
  const base = state.strength / MAX_STRENGTH;
  if (now <= state.due) return base;
  const overdueHours = (now - state.due) / 3600_000;
  // Halve every week overdue, so a long-neglected word sinks but never to zero
  // while its strength is high.
  return base * Math.pow(0.5, overdueHours / (7 * 24));
}

/**
 * Words most worth practising: overdue first, weakest first, and words the
 * learner has actually got wrong before given a nudge up the list.
 */
export function dueWords(
  srs: Record<string, WordState>,
  candidates: string[],
  now = Date.now(),
  limit = 20,
): string[] {
  return candidates
    .map((id) => ({ id, s: srs[id] }))
    .filter(({ s }) => !s || s.due <= now || s.strength < MAX_STRENGTH)
    .sort((a, b) => {
      const sa = freshness(a.s, now) - (a.s?.wrong ?? 0) * 0.05;
      const sb = freshness(b.s, now) - (b.s?.wrong ?? 0) * 0.05;
      return sa - sb;
    })
    .slice(0, limit)
    .map(({ id }) => id);
}
