import { WORDS, word, type Word } from '../data/lexicon';
import { SENTENCE_BY_ID, enTokens, tiTokens, type Sentence } from '../data/sentences';
import { FIDEL_BY_ID, ORDERS, type FidelRow } from '../data/fidel';
import { NODE_BY_ID, type LessonNode } from '../data/curriculum';
import { Rng } from './rng';
import type { Exercise } from './types';

/**
 * Turns a lesson node into a playable queue of exercises.
 *
 * The shape of a lesson follows the pattern Duolingo-style courses use: open
 * with recognition (pictures, multiple choice) so the learner gets an early
 * win, move into production (word banks, typing) in the middle, and close with
 * a match-pairs round that recycles everything at speed.
 */

const DEFAULT_LENGTH = 14;

/**
 * Distractors should look plausible — same part of speech where possible — and
 * must never repeat an English gloss.
 *
 * Tigrinya has several pairs that share one English word (ንስኻ / ንስኺ are both
 * "you", እዩ / እያ are both "is"). Offering two of them in the same question
 * makes it unanswerable, so glosses are deduped across the whole option set,
 * not just against the target.
 */
function distractors(target: Word, pool: Word[], n: number, rng: Rng): Word[] {
  const taken = new Set([target.en]);
  const usable = (w: Word) => w.id !== target.id && !taken.has(w.en);

  const picked: Word[] = [];
  const drawFrom = (candidates: Word[]) => {
    for (const w of rng.shuffle(candidates)) {
      if (picked.length >= n) return;
      if (!usable(w)) continue;
      taken.add(w.en);
      picked.push(w);
    }
  };

  drawFrom(pool.filter((w) => w.pos === target.pos));
  if (picked.length < n) drawFrom(pool);
  return picked;
}

function picturable(pool: Word[]): Word[] {
  return pool.filter((w) => w.emoji);
}

/** Tokens from other sentences, used to pad a word bank with near-misses. */
function bankDistractors(
  correct: string[],
  allSentences: Sentence[],
  side: 'ti' | 'en',
  n: number,
  rng: Rng,
): string[] {
  const pool = new Set<string>();
  for (const s of allSentences) {
    for (const t of side === 'ti' ? tiTokens(s) : enTokens(s)) {
      if (!correct.includes(t)) pool.add(t);
    }
  }
  return rng.sample([...pool], n);
}

// ─── Individual exercise builders ────────────────────────────────────────

function pickImage(target: Word, pool: Word[], rng: Rng, key: string): Exercise | null {
  if (!target.emoji) return null;
  const others = distractors(target, picturable(pool), 3, rng).filter((w) => w.emoji);
  if (others.length < 3) return null;
  return {
    type: 'pick_image',
    key,
    wordIds: [target.id],
    prompt: target,
    options: rng.shuffle([target, ...others]),
    answer: target.id,
  };
}

function selectWord(
  target: Word,
  pool: Word[],
  direction: 'ti_en' | 'en_ti',
  rng: Rng,
  key: string,
): Exercise | null {
  const others = distractors(target, pool, 3, rng);
  if (others.length < 2) return null;
  return {
    type: 'select_word',
    key,
    wordIds: [target.id],
    direction,
    prompt: target,
    options: rng.shuffle([target, ...others]),
    answer: target.id,
  };
}

function translateBank(
  s: Sentence,
  direction: 'ti_en' | 'en_ti',
  allSentences: Sentence[],
  rng: Rng,
  key: string,
): Exercise {
  const answerTokens = direction === 'ti_en' ? enTokens(s) : tiTokens(s);
  const side = direction === 'ti_en' ? 'en' : 'ti';
  const padCount = Math.min(4, Math.max(2, 7 - answerTokens.length));
  const bank = rng.shuffle([
    ...answerTokens,
    ...bankDistractors(answerTokens, allSentences, side, padCount, rng),
  ]);
  return {
    type: 'translate_bank',
    key,
    wordIds: s.uses,
    direction,
    sentenceId: s.id,
    promptText: direction === 'ti_en' ? s.ti : s.en,
    promptTr: direction === 'ti_en' ? s.tr : undefined,
    answerTokens,
    bank,
    tip: s.tip,
  };
}

function translateType(s: Sentence, key: string): Exercise {
  return {
    type: 'translate_type',
    key,
    wordIds: s.uses,
    direction: 'ti_en',
    sentenceId: s.id,
    promptText: s.ti,
    promptTr: s.tr,
    answer: s.en,
    accept: [s.en, ...(s.altEn ?? [])],
    tip: s.tip,
  };
}

function fillBlank(s: Sentence, allSentences: Sentence[], rng: Rng, key: string): Exercise | null {
  const tokens = tiTokens(s);
  if (tokens.length < 3) return null;
  const gap = rng.int(tokens.length);
  const answer = tokens[gap];
  const others = bankDistractors([answer], allSentences, 'ti', 2, rng);
  if (others.length < 2) return null;
  return {
    type: 'fill_blank',
    key,
    wordIds: s.uses,
    sentenceId: s.id,
    parts: tokens.map((t, i) => (i === gap ? null : t)),
    options: rng.shuffle([answer, ...others]),
    answer,
    en: s.en,
    tip: s.tip,
  };
}

function matchPairs(pool: Word[], rng: Rng, key: string): Exercise | null {
  // Avoid two tiles sharing an English gloss — the grid would be unsolvable.
  const seen = new Set<string>();
  const unique = pool.filter((w) => !seen.has(w.en) && seen.add(w.en));
  const chosen = rng.sample(unique, 5);
  if (chosen.length < 4) return null;
  return {
    type: 'match_pairs',
    key,
    wordIds: chosen.map((w) => w.id),
    pairs: chosen.map((w) => ({ id: w.id, ti: w.ti, en: w.en, tr: w.tr })),
  };
}

// ─── Fidel builders ──────────────────────────────────────────────────────

function fidelPickSound(row: FidelRow, order: number, rows: FidelRow[], rng: Rng, key: string): Exercise {
  const wrong = new Set<string>();
  // Near-misses: same row other orders, and the same order in other rows.
  row.reads.forEach((r, i) => i !== order && wrong.add(r));
  rows.forEach((r) => r.id !== row.id && wrong.add(r.reads[order]));
  return {
    type: 'fidel_pick_sound',
    key,
    wordIds: [],
    char: row.chars[order],
    options: rng.shuffle([row.reads[order], ...rng.sample([...wrong], 3)]),
    answer: row.reads[order],
  };
}

function fidelPickChar(row: FidelRow, order: number, rows: FidelRow[], rng: Rng, key: string): Exercise {
  const wrong = new Set<string>();
  row.chars.forEach((c, i) => i !== order && wrong.add(c));
  rows.forEach((r) => r.id !== row.id && wrong.add(r.chars[order]));
  return {
    type: 'fidel_pick_char',
    key,
    wordIds: [],
    read: row.reads[order],
    options: rng.shuffle([row.chars[order], ...rng.sample([...wrong], 3)]),
    answer: row.chars[order],
  };
}

function fidelOrder(row: FidelRow, order: number, rng: Rng, key: string): Exercise {
  const wrong = row.chars.filter((_, i) => i !== order);
  return {
    type: 'fidel_order',
    key,
    wordIds: [],
    baseChar: row.chars[0],
    consonant: row.consonant,
    targetRead: row.reads[order],
    orderName: ORDERS[order].name,
    options: rng.shuffle([row.chars[order], ...rng.sample(wrong, 3)]),
    answer: row.chars[order],
  };
}

// ─── Lesson assembly ─────────────────────────────────────────────────────

function buildFidelLesson(node: LessonNode, rng: Rng, length: number): Exercise[] {
  const rows = (node.fidelRows ?? []).map((id) => FIDEL_BY_ID[id]);
  if (!rows.length) return [];
  const out: Exercise[] = [];

  // Open with the base shapes, then work through the other orders.
  for (const row of rows) {
    out.push(fidelPickSound(row, 0, rows, rng, `f0-${row.id}`));
  }
  let i = 0;
  while (out.length < length) {
    const row = rows[i % rows.length];
    const order = 1 + rng.int(6);
    const kind = i % 3;
    const key = `f${out.length}-${row.id}-${order}`;
    if (kind === 0) out.push(fidelPickChar(row, order, rows, rng, key));
    else if (kind === 1) out.push(fidelOrder(row, order, rng, key));
    else out.push(fidelPickSound(row, order, rows, rng, key));
    i++;
  }
  return out.slice(0, length);
}

function buildWordLesson(node: LessonNode, rng: Rng, length: number): Exercise[] {
  const teachIds = node.teach ?? [];
  const reviewIds = node.review ?? [];
  const focus = [...teachIds, ...reviewIds].map(word);
  if (!focus.length && !node.sentences?.length) return [];

  // Distractor pool: the lesson's own words plus a wider slice of the lexicon,
  // so options don't give the answer away by being the only plausible one.
  const pool = [...new Set([...focus, ...rng.sample(WORDS, 40)])];
  const sentences = (node.sentences ?? []).map((id) => SENTENCE_BY_ID[id]);
  const allSentences = Object.values(SENTENCE_BY_ID);

  // `core` is trimmed to fit the target length; `tail` always survives, because
  // the typed answer and the closing speed round are the two exercises that
  // give a lesson its shape.
  const core: Exercise[] = [];
  const tail: Exercise[] = [];
  const push = (e: Exercise | null) => {
    if (e) core.push(e);
  };

  // 1. Introduce each new word with a picture or a four-way choice.
  teachIds.map(word).forEach((w, i) => {
    push(pickImage(w, pool, rng, `t-img-${w.id}`) ?? selectWord(w, pool, 'ti_en', rng, `t-sel-${w.id}-${i}`));
  });

  // 2. Recognition the other way round, then a second pass over a few words
  //    reading them back into English.
  rng.shuffle(focus).slice(0, 3).forEach((w, i) => {
    push(selectWord(w, pool, 'en_ti', rng, `r-sel-${w.id}-${i}`));
  });
  rng.shuffle(focus).slice(0, 2).forEach((w, i) => {
    push(selectWord(w, pool, 'ti_en', rng, `r-read-${w.id}-${i}`));
  });

  // 3. Sentences: read one way, produce the other, and one gap-fill.
  sentences.forEach((s, i) => {
    push(translateBank(s, 'ti_en', allSentences, rng, `s-b1-${s.id}`));
    if (i % 2 === 0) push(translateBank(s, 'en_ti', allSentences, rng, `s-b2-${s.id}`));
    else push(fillBlank(s, allSentences, rng, `s-fb-${s.id}`));
  });

  // 4. One typed answer per lesson keeps recall honest without being punishing,
  //    then close on a speed round.
  if (sentences.length) tail.push(translateType(rng.pick(sentences), `s-ty-${node.id}`));
  const match = matchPairs(focus.length >= 5 ? focus : pool, rng, `m-${node.id}`);
  if (match) tail.push(match);

  const room = Math.max(1, length - tail.length);
  const body = core.slice(0, room);
  while (body.length < room && focus.length) {
    const w = rng.pick(focus);
    const e = selectWord(
      w,
      pool,
      rng.next() < 0.5 ? 'ti_en' : 'en_ti',
      rng,
      `x-${body.length}-${w.id}`,
    );
    if (e) body.push(e);
    else break;
  }
  return [...body, ...tail];
}

export interface GenerateOptions {
  /** Bumped per attempt so a replay is not identical. */
  attempt?: number;
  length?: number;
}

export function generateLesson(nodeId: string, opts: GenerateOptions = {}): Exercise[] {
  const node = NODE_BY_ID[nodeId];
  if (!node) return [];
  const length = opts.length ?? (node.kind === 'review' ? 16 : DEFAULT_LENGTH);
  const rng = new Rng(`${nodeId}:${opts.attempt ?? 0}`);
  const built = node.fidelRows?.length
    ? buildFidelLesson(node, rng, length)
    : buildWordLesson(node, rng, length);
  // Guarantee unique keys — the queue re-inserts wrong answers by key.
  const seen = new Set<string>();
  return built.map((e, i) => {
    let k = e.key;
    while (seen.has(k)) k = `${e.key}#${i}`;
    seen.add(k);
    return { ...e, key: k };
  });
}

/**
 * A practice session built from the learner's weakest words rather than a
 * fixed node — this is what the "Practice" tab and the mistakes review use.
 */
export function generatePractice(wordIds: string[], seed: string, length = 12): Exercise[] {
  const ids = wordIds.filter((id) => WORDS.some((w) => w.id === id));
  if (!ids.length) return [];
  const rng = new Rng(seed);
  const focus = ids.map(word);
  const pool = [...new Set([...focus, ...rng.sample(WORDS, 40)])];
  const relevant = Object.values(SENTENCE_BY_ID).filter((s) =>
    s.uses.some((u) => ids.includes(u)),
  );
  const out: Exercise[] = [];
  const push = (e: Exercise | null) => e && out.push(e);

  rng.shuffle(focus).forEach((w, i) => {
    if (out.length >= length - 3) return;
    const roll = rng.next();
    if (roll < 0.35) push(pickImage(w, pool, rng, `p-img-${w.id}-${i}`));
    else if (roll < 0.7) push(selectWord(w, pool, 'ti_en', rng, `p-a-${w.id}-${i}`));
    else push(selectWord(w, pool, 'en_ti', rng, `p-b-${w.id}-${i}`));
  });
  rng.sample(relevant, 2).forEach((s) => {
    push(translateBank(s, 'ti_en', Object.values(SENTENCE_BY_ID), rng, `p-s-${s.id}`));
  });
  push(matchPairs(focus.length >= 5 ? focus : pool, rng, `p-m-${seed}`));

  const seen = new Set<string>();
  return out.slice(0, length).map((e, i) => {
    let k = e.key;
    while (seen.has(k)) k = `${e.key}#${i}`;
    seen.add(k);
    return { ...e, key: k };
  });
}
