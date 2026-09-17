import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../engine/types';
import type { AnswerRecord } from '../engine/types';
import {
  checkAnswer,
  promptFor,
  solutionAnswer,
  wrongAnswer,
  type CheckResult,
} from '../engine/check';
import { Bar, Btn, Sheet } from './ui';
import { Mascot } from './Mascot';
import {
  PickImageEx,
  SelectWordEx,
  ListenPickEx,
  FillBlankEx,
  FidelPickSoundEx,
  FidelPickCharEx,
  FidelOrderEx,
} from './exercises/Choice';
import { MatchPairsEx, TranslateBankEx, TranslateTypeEx } from './exercises/Bank';
import { sfxComplete, sfxCorrect, sfxHeartLost, sfxWrong } from '../audio/sfx';
import { haptic, speak as speakTi, supported as ttsSupported } from '../audio/speech';

/**
 * The lesson player.
 *
 * The queue is the whole game: a wrong answer is pushed back a few slots and
 * the denominator grows, so the progress bar only moves on exercises the
 * learner has actually got right. That is what makes a lesson feel like it
 * ends when you've learned the material rather than after a fixed count.
 */

export interface LessonOutcome {
  completed: boolean;
  correct: number;
  total: number;
  seconds: number;
  answers: AnswerRecord[];
}

interface Props {
  exercises: Exercise[];
  title: string;
  hearts: number;
  unlimitedHearts: boolean;
  /**
   * Whether mistakes spend hearts. False for practice sessions, which are the
   * way back when hearts have run out and so must never consume them.
   */
  costHearts?: boolean;
  showTr: boolean;
  /** Called on every graded answer so the store can update the SRS. */
  onAnswer: (wordIds: string[], correct: boolean) => void;
  onHeartLost: () => void;
  /** Called when the last exercise clears, or when the learner quits/fails. */
  onFinish: (o: LessonOutcome) => void;
  /** Offer a gem refill when hearts hit zero. */
  onRefill?: () => void;
  canRefill: boolean;
  /** Leave the lesson and go practise, which costs nothing and earns a heart. */
  onPracticeInstead?: () => void;
}

/** How many exercises later a missed one comes back. */
const REQUEUE_GAP = 3;

/**
 * Opt-in test hook. With `?e2e=1` in the URL the current exercise publishes a
 * `solve()` on `window` so the smoke test can play a genuine lesson end to end.
 * Off for every real learner, since it is keyed on a query parameter nobody
 * types by accident.
 */
const E2E =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('e2e');

export function Lesson({
  exercises,
  title,
  hearts,
  unlimitedHearts,
  costHearts = true,
  showTr,
  onAnswer,
  onHeartLost,
  onFinish,
  onRefill,
  canRefill,
  onPracticeInstead,
}: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [solved, setSolved] = useState(0);
  const [total, setTotal] = useState(exercises.length);
  // The answer and the verdict are stored against the exercise they belong to.
  // Keying them this way means moving to the next exercise clears them during
  // the same render, rather than showing one frame of the previous answer while
  // an effect catches up.
  const [answerState, setAnswerState] = useState<{ key: string; value: string[] }>({
    key: '',
    value: [],
  });
  const [resultState, setResultState] = useState<{ key: string; value: CheckResult } | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [shake, setShake] = useState(false);

  const startedAt = useRef(Date.now());
  const exStartedAt = useRef(Date.now());
  const audioAvailable = useMemo(() => ttsSupported(), []);

  const ex = queue[0];
  const answer = answerState.key === ex?.key ? answerState.value : [];
  const result = resultState?.key === ex?.key ? resultState.value : null;
  const locked = result !== null;
  // Hearts are out of play entirely in practice, and when the learner has
  // switched them off.
  const heartsOff = unlimitedHearts || !costHearts;
  const dead = !heartsOff && hearts <= 0;

  const setAnswer = useCallback(
    (value: string[]) => {
      if (ex) setAnswerState({ key: ex.key, value });
    },
    [ex],
  );

  const speak = useCallback((text: string) => {
    speakTi(text);
  }, []);

  // Start the per-exercise clock whenever the head of the queue changes.
  useEffect(() => {
    exStartedAt.current = Date.now();
  }, [ex?.key]);

  useEffect(() => {
    if (!E2E || !ex) return;
    (window as Window & { __e2e?: unknown }).__e2e = {
      type: ex.type,
      solve: () => setAnswer(solutionAnswer(ex)),
      fail: () => setAnswer(wrongAnswer(ex)),
      pairs: ex.type === 'match_pairs' ? ex.pairs : undefined,
    };
  }, [ex, setAnswer]);

  const finish = useCallback(
    (completed: boolean, recs: AnswerRecord[]) => {
      const correct = recs.filter((r) => r.correct).length;
      onFinish({
        completed,
        correct,
        total: Math.max(recs.length, 1),
        seconds: Math.round((Date.now() - startedAt.current) / 1000),
        answers: recs,
      });
    },
    [onFinish],
  );

  const ready =
    ex?.type === 'translate_type'
      ? (answer[0] ?? '').trim().length > 0
      : answer.length > 0;

  const check = () => {
    if (!ex || locked || !ready) return;
    const r = checkAnswer(ex, answer);
    const rec: AnswerRecord = {
      key: ex.key,
      correct: r.correct,
      ms: Date.now() - exStartedAt.current,
    };
    setRecords((rs) => [...rs, rec]);
    onAnswer(ex.wordIds, r.correct);

    if (r.correct) {
      sfxCorrect();
      haptic(14);
    } else {
      sfxWrong();
      haptic([12, 60, 12]);
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      if (!heartsOff) {
        sfxHeartLost();
        onHeartLost();
      }
    }
    setResultState({ key: ex.key, value: r });
  };

  const advance = () => {
    if (!ex) return;
    const wasCorrect = result?.correct ?? false;

    setQueue((q) => {
      const [head, ...rest] = q;
      if (wasCorrect) return rest;
      // Put it back a few slots away so it is a real recall test, not an echo.
      const at = Math.min(REQUEUE_GAP, rest.length);
      return [...rest.slice(0, at), head, ...rest.slice(at)];
    });

    if (wasCorrect) {
      setSolved((s) => s + 1);
    } else {
      setTotal((t) => t + 1);
    }
  };

  // When the queue empties, the lesson is done.
  useEffect(() => {
    if (queue.length === 0 && records.length > 0) {
      sfxComplete();
      finish(true, records);
    }
  }, [queue.length, records, finish]);

  /** Match rounds grade themselves and skip the Check button entirely. */
  const matchDone = (misses: number) => {
    if (!ex) return;
    const rec: AnswerRecord = {
      key: ex.key,
      correct: misses === 0,
      ms: Date.now() - exStartedAt.current,
    };
    const recs = [...records, rec];
    setRecords(recs);
    onAnswer(ex.wordIds, misses === 0);
    sfxCorrect();
    setSolved((s) => s + 1);
    setQueue((q) => q.slice(1));
  };

  if (!ex) {
    return (
      <div className="app center">
        <Mascot mood="cheer" size={140} idle />
      </div>
    );
  }

  return (
    <div className="app">
      {/* ─── Header: quit, progress, hearts ─────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-row" style={{ gap: 12 }}>
          <button
            onClick={() => setConfirmQuit(true)}
            aria-label="Quit lesson"
            style={{ fontSize: 26, color: 'var(--muted)', lineHeight: 1, padding: '0 2px' }}
          >
            ✕
          </button>
          <Bar value={total ? solved / total : 0} />
          {costHearts ? (
            <div className="stat hearts" aria-label={unlimitedHearts ? 'Unlimited hearts' : `${hearts} hearts`}>
              <span className="ico">{dead ? '💔' : '❤️'}</span>
              {unlimitedHearts ? '∞' : hearts}
            </div>
          ) : (
            <div className="stat" style={{ color: 'var(--blue)' }} aria-label="Practice session, no hearts at stake">
              <span className="ico">🎯</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Exercise ───────────────────────────────────────────────────── */}
      <div className="page page-pad-bottom" style={{ paddingTop: 18 }}>
        <h2 className="h1" style={{ marginBottom: 20 }}>{promptFor(ex)}</h2>
        <div className={shake ? 'shake' : ''}>
          <Body
            ex={ex}
            answer={answer}
            setAnswer={setAnswer}
            locked={locked}
            showTr={showTr}
            speak={speak}
            audioAvailable={audioAvailable}
            onMatchDone={matchDone}
          />
        </div>
      </div>

      {/* ─── Footer: check / continue ───────────────────────────────────── */}
      {ex.type !== 'match_pairs' && (
        <Footer
          result={result}
          ready={ready}
          onCheck={check}
          onContinue={advance}
          tip={'tip' in ex ? ex.tip : undefined}
        />
      )}

      {/* ─── Sheets ─────────────────────────────────────────────────────── */}
      <Sheet open={confirmQuit} onClose={() => setConfirmQuit(false)}>
        <div className="col center" style={{ gap: 14, paddingBottom: 6 }}>
          <Mascot mood="sad" size={96} />
          <div className="h2" style={{ textAlign: 'center' }}>Leave {title}?</div>
          <div className="small muted" style={{ textAlign: 'center' }}>
            Your progress in this lesson won’t be saved.
          </div>
          <Btn tone="red" onClick={() => finish(false, records)}>Quit lesson</Btn>
          <Btn tone="quiet" onClick={() => setConfirmQuit(false)}>Keep learning</Btn>
        </div>
      </Sheet>

      <Sheet open={dead && !locked} onClose={() => undefined} sticky>
        <div className="col center" style={{ gap: 14, paddingBottom: 6 }}>
          <div style={{ fontSize: 52 }}>💔</div>
          <div className="h2">You’re out of hearts</div>
          <div className="small muted" style={{ textAlign: 'center' }}>
            Hearts come back over time, or refill them now to keep this lesson going.
          </div>
          {onRefill && (
            <Btn tone="gold" onClick={onRefill} disabled={!canRefill}>
              💎 Refill hearts {canRefill ? '' : '— not enough gems'}
            </Btn>
          )}
          {onPracticeInstead && (
            <Btn tone="ghost" onClick={onPracticeInstead}>
              🎯 Practise — free, and earns a heart
            </Btn>
          )}
          <Btn tone="quiet" onClick={() => finish(false, records)}>End session</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/** Renders whichever exercise is at the head of the queue. */
function Body({
  ex,
  answer,
  setAnswer,
  locked,
  showTr,
  speak,
  audioAvailable,
  onMatchDone,
}: {
  ex: Exercise;
  answer: string[];
  setAnswer: (v: string[]) => void;
  locked: boolean;
  showTr: boolean;
  speak: (t: string) => void;
  audioAvailable: boolean;
  onMatchDone: (misses: number) => void;
}) {
  const common = { value: answer, onChange: setAnswer, locked, showTr };

  switch (ex.type) {
    case 'pick_image':
      return <PickImageEx ex={ex} {...common} correctId={ex.answer} />;
    case 'select_word':
      return <SelectWordEx ex={ex} {...common} correctId={ex.answer} />;
    case 'listen_pick':
      return <ListenPickEx ex={ex} {...common} correctId={ex.answer} speak={speak} audioAvailable={audioAvailable} />;
    case 'fill_blank':
      return <FillBlankEx ex={ex} {...common} correctId={ex.answer} />;
    case 'fidel_pick_sound':
      return <FidelPickSoundEx ex={ex} {...common} correctId={ex.answer} />;
    case 'fidel_pick_char':
      return <FidelPickCharEx ex={ex} {...common} correctId={ex.answer} />;
    case 'fidel_order':
      return <FidelOrderEx ex={ex} {...common} correctId={ex.answer} />;
    case 'translate_bank':
      return (
        <TranslateBankEx
          ex={ex}
          value={answer}
          onChange={setAnswer}
          locked={locked}
          showTr={showTr}
          speak={speak}
          audioAvailable={audioAvailable}
        />
      );
    case 'translate_type':
      return (
        <TranslateTypeEx
          ex={ex}
          value={answer}
          onChange={setAnswer}
          locked={locked}
          showTr={showTr}
          speak={speak}
          audioAvailable={audioAvailable}
        />
      );
    case 'match_pairs':
      return <MatchPairsEx ex={ex} onDone={onMatchDone} showTr={showTr} />;
  }
}

/**
 * The footer changes role once an answer is checked: it becomes the feedback
 * banner, coloured by the verdict, with the correct solution when needed.
 */
function Footer({
  result,
  ready,
  onCheck,
  onContinue,
  tip,
}: {
  result: CheckResult | null;
  ready: boolean;
  onCheck: () => void;
  onContinue: () => void;
  tip?: string;
}) {
  const tone = !result ? null : result.verdict === 'wrong' ? 'bad' : result.verdict === 'almost' ? 'warn' : 'good';

  const bg =
    tone === 'good' ? 'var(--green-soft)' : tone === 'bad' ? 'var(--red-soft)' : tone === 'warn' ? 'var(--gold-soft)' : 'transparent';

  return (
    <div
      style={{
        flex: 'none',
        background: bg,
        borderTop: tone ? 'none' : '2px solid var(--line-2)',
        padding: `14px max(var(--gutter), var(--sal)) calc(var(--sab) + 14px)`,
        transition: 'background 0.18s ease',
      }}
    >
      {result && (
        <div className="col pop" style={{ gap: 6, marginBottom: 12 }}>
          <div
            className="h2"
            style={{
              color: tone === 'bad' ? 'var(--red-ink)' : tone === 'warn' ? 'var(--gold-ink)' : 'var(--green-ink)',
            }}
          >
            {tone === 'good' ? 'ጽቡቕ! Nice.' : tone === 'warn' ? 'Almost — watch the spelling' : 'Not quite'}
          </div>
          {(tone === 'bad' || tone === 'warn') && result.solution && (
            <div className="col" style={{ gap: 1 }}>
              <div className="tiny upper muted">Correct answer</div>
              <div
                className={/[ሀ-፿]/.test(result.solution) ? 'geez' : ''}
                style={{ fontSize: 18, fontWeight: 800 }}
              >
                {result.solution}
              </div>
              {result.solutionTr && <div className="tr">{result.solutionTr}</div>}
            </div>
          )}
          {tone === 'good' && tip && <div className="small muted">{tip}</div>}
        </div>
      )}

      {result ? (
        <Btn tone={tone === 'bad' ? 'red' : 'green'} onClick={onContinue} silent>
          Continue
        </Btn>
      ) : (
        <Btn onClick={onCheck} disabled={!ready} silent>
          Check
        </Btn>
      )}
    </div>
  );
}
