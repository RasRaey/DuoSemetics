import { gradeChoice, gradeTokens, gradeTyped, type Verdict } from './grading';
import type { Exercise } from './types';

export interface CheckResult {
  correct: boolean;
  /** Typed answers can be "almost" — accepted, but the polished form is shown. */
  verdict: Verdict;
  /** What to display in the feedback banner when the learner got it wrong. */
  solution: string;
  /** Transliteration of the solution, when there is one. */
  solutionTr?: string;
}

/**
 * Single entry point for grading, so the lesson player never has to know how a
 * particular exercise type stores its answer.
 *
 * `answer` is always an array of strings: one element for a choice or a typed
 * answer, many for a word bank.
 */
export function checkAnswer(ex: Exercise, answer: string[]): CheckResult {
  switch (ex.type) {
    case 'pick_image': {
      const correct = gradeChoice(answer[0] ?? '', ex.answer);
      return {
        correct,
        verdict: correct ? 'correct' : 'wrong',
        solution: ex.prompt.en,
        solutionTr: ex.prompt.tr,
      };
    }

    case 'select_word': {
      const correct = gradeChoice(answer[0] ?? '', ex.answer);
      return {
        correct,
        verdict: correct ? 'correct' : 'wrong',
        // Show whichever side the learner was asked to produce.
        solution: ex.direction === 'ti_en' ? ex.prompt.en : ex.prompt.ti,
        solutionTr: ex.direction === 'ti_en' ? undefined : ex.prompt.tr,
      };
    }

    case 'listen_pick': {
      const correct = gradeChoice(answer[0] ?? '', ex.answer);
      return {
        correct,
        verdict: correct ? 'correct' : 'wrong',
        solution: ex.audioText,
        solutionTr: ex.audioTr,
      };
    }

    case 'fill_blank': {
      const correct = gradeChoice(answer[0] ?? '', ex.answer);
      return {
        correct,
        verdict: correct ? 'correct' : 'wrong',
        solution: ex.parts.map((p) => p ?? ex.answer).join(' '),
      };
    }

    case 'fidel_pick_sound':
    case 'fidel_pick_char':
    case 'fidel_order': {
      const correct = gradeChoice(answer[0] ?? '', ex.answer);
      return { correct, verdict: correct ? 'correct' : 'wrong', solution: ex.answer };
    }

    case 'translate_bank': {
      // The UI stores which bank tiles were tapped, as indices — resolve them
      // to their text before comparing. Indices rather than text because a
      // sentence may legitimately use the same token twice.
      const tokens = answer.map((i) => ex.bank[Number(i)] ?? '');
      const correct = gradeTokens(tokens, ex.answerTokens);
      return {
        correct,
        verdict: correct ? 'correct' : 'wrong',
        solution: ex.answerTokens.join(' '),
      };
    }

    case 'translate_type': {
      const verdict = gradeTyped(answer[0] ?? '', ex.accept);
      return {
        correct: verdict !== 'wrong',
        verdict,
        solution: ex.answer,
      };
    }

    case 'match_pairs':
      // Match rounds grade themselves tile by tile and report through onDone.
      return { correct: true, verdict: 'correct', solution: '' };
  }
}

/** The instruction line shown above each exercise. */
export function promptFor(ex: Exercise): string {
  switch (ex.type) {
    case 'pick_image':
      return 'Which one of these?';
    case 'select_word':
      return ex.direction === 'ti_en' ? 'What does this mean?' : 'How do you say this?';
    case 'listen_pick':
      return 'What did you hear?';
    case 'fill_blank':
      return 'Fill in the blank';
    case 'translate_bank':
      return ex.direction === 'ti_en' ? 'Translate this sentence' : 'Write this in Tigrinya';
    case 'translate_type':
      return 'Type the English translation';
    case 'match_pairs':
      return 'Tap the matching pairs';
    case 'fidel_pick_sound':
      return 'What sound is this letter?';
    case 'fidel_pick_char':
      return 'Which letter makes this sound?';
    case 'fidel_order':
      return 'Pick the right form';
  }
}

/**
 * The answer array a fully correct response would produce.
 *
 * Used by the end-to-end smoke test so it can play a real lesson without
 * guessing, and by nothing else — keeping it here means the "what counts as
 * correct" logic stays in one file.
 */
export function solutionAnswer(ex: Exercise): string[] {
  switch (ex.type) {
    case 'pick_image':
    case 'select_word':
    case 'listen_pick':
    case 'fill_blank':
    case 'fidel_pick_sound':
    case 'fidel_pick_char':
    case 'fidel_order':
      return [ex.answer];
    case 'translate_type':
      return [ex.answer];
    case 'translate_bank': {
      // Bank answers are indices, and a token can legitimately appear twice, so
      // each index is claimed once.
      const used = new Set<number>();
      return ex.answerTokens.map((t) => {
        const i = ex.bank.findIndex((b, j) => b === t && !used.has(j));
        used.add(i);
        return String(i);
      });
    }
    case 'match_pairs':
      return ex.pairs.map((p) => p.id);
  }
}
