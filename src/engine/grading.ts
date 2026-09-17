/**
 * Answer checking.
 *
 * Typed answers are graded leniently — a learner should not lose a heart over
 * a missing apostrophe or British/American spelling. Choice exercises are
 * exact, since the options are right there.
 */

/** Strip case, punctuation, articles and doubled spaces. */
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    // Drop combining marks so "ts'ḥaf" and "ts'haf" compare equal.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/[.,!?;:"“”()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Words we forgive entirely when they are the only difference. */
const FILLER = new Set(['a', 'an', 'the', 'is', 'am', 'are']);

function contentWords(s: string): string[] {
  return normalise(s)
    .split(' ')
    .filter((w) => w && !FILLER.has(w));
}

/** Levenshtein distance, capped for speed — inputs here are short. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

export type Verdict = 'correct' | 'almost' | 'wrong';

/**
 * Grade a typed answer against every accepted form.
 *
 * 'almost' means accepted but flagged — the learner keeps their heart and sees
 * the polished version, the same way a typo is handled in most course apps.
 */
export function gradeTyped(input: string, accepted: string[]): Verdict {
  const given = normalise(input);
  if (!given) return 'wrong';

  for (const acc of accepted) {
    if (given === normalise(acc)) return 'correct';
  }
  for (const acc of accepted) {
    const target = normalise(acc);
    // Allow one typo per ~6 characters.
    const budget = Math.max(1, Math.floor(target.length / 6));
    if (editDistance(given, target) <= budget) return 'almost';

    // Same content words in the same order, differing only in filler.
    const g = contentWords(input);
    const t = contentWords(acc);
    if (g.length === t.length && g.every((w, i) => editDistance(w, t[i]) <= 1)) {
      return 'almost';
    }
  }
  return 'wrong';
}

/** Word-bank answers: exact token sequence, but tolerant of trailing punctuation. */
export function gradeTokens(given: string[], expected: string[]): boolean {
  if (given.length !== expected.length) return false;
  return given.every((t, i) => normalise(t) === normalise(expected[i]));
}

export function gradeChoice(given: string, answer: string): boolean {
  return given === answer;
}
