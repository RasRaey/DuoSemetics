import type { Word } from '../data/lexicon';

/**
 * Every exercise the lesson player knows how to render.
 *
 * `wordIds` is what the SRS credits or penalises when the exercise is answered,
 * so it must list every lexicon item the learner actually had to know.
 */
export type Exercise =
  | PickImage
  | SelectWord
  | TranslateBank
  | TranslateType
  | MatchPairs
  | FillBlank
  | FidelPickSound
  | FidelPickChar
  | FidelOrder;

interface Base {
  /** Unique within a session — lets React key the exercise and the queue dedupe. */
  key: string;
  wordIds: string[];
}

/** "Which one is ማይ?" with four pictures. */
export interface PickImage extends Base {
  type: 'pick_image';
  prompt: Word;
  options: Word[];
  answer: string;
}

/** Four-way multiple choice, either direction. */
export interface SelectWord extends Base {
  type: 'select_word';
  /** 'ti_en' shows Ge'ez and asks for English. */
  direction: 'ti_en' | 'en_ti';
  prompt: Word;
  options: Word[];
  answer: string;
}

/** Build the translation by tapping tiles from a word bank. */
export interface TranslateBank extends Base {
  type: 'translate_bank';
  direction: 'ti_en' | 'en_ti';
  sentenceId: string;
  /** What is shown at the top. */
  promptText: string;
  promptTr?: string;
  /** Correct token order. */
  answerTokens: string[];
  /** Tokens offered, correct ones plus distractors, already shuffled. */
  bank: string[];
  tip?: string;
}

/** Free-text translation, graded leniently. */
export interface TranslateType extends Base {
  type: 'translate_type';
  direction: 'ti_en' | 'en_ti';
  sentenceId?: string;
  promptText: string;
  promptTr?: string;
  answer: string;
  accept: string[];
  tip?: string;
}

/** Tap matching Tigrinya and English tiles until the grid clears. */
export interface MatchPairs extends Base {
  type: 'match_pairs';
  pairs: { id: string; ti: string; en: string; tr: string }[];
}

/** A sentence with one token blanked out and three candidates. */
export interface FillBlank extends Base {
  type: 'fill_blank';
  sentenceId: string;
  /** Tokens with `null` marking the gap. */
  parts: (string | null)[];
  options: string[];
  answer: string;
  en: string;
  tip?: string;
}

/** Show a Ge'ez character, pick its sound. */
export interface FidelPickSound extends Base {
  type: 'fidel_pick_sound';
  char: string;
  options: string[];
  answer: string;
}

/** Show a sound, pick the Ge'ez character. */
export interface FidelPickChar extends Base {
  type: 'fidel_pick_char';
  read: string;
  options: string[];
  answer: string;
}

/** Given a row and a target vowel, pick the right order form. */
export interface FidelOrder extends Base {
  type: 'fidel_order';
  /** The order-1 form, shown as the reference shape. */
  baseChar: string;
  consonant: string;
  targetRead: string;
  orderName: string;
  options: string[];
  answer: string;
}

export type ExerciseType = Exercise['type'];

/** How an exercise was answered, used for the end-of-lesson stats. */
export interface AnswerRecord {
  key: string;
  correct: boolean;
  /** Milliseconds spent on this exercise. */
  ms: number;
}
