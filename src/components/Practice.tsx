import { useMemo, useState } from 'react';
import { WORD_BY_ID, type Word } from '../data/lexicon';
import { dueWords, freshness, MAX_STRENGTH } from '../engine/srs';
import { knownWordIds, type Progress } from '../engine/store';
import { Bar, Btn, Sheet } from './ui';
import { Mascot } from './Mascot';
import { speak, supported } from '../audio/speech';
import { sfxTap } from '../audio/sfx';

/**
 * Practice hub and word list.
 *
 * Two entry points, because they answer different questions: "what did I get
 * wrong" (mistakes) and "what is slipping away" (the SRS due list). Below them
 * sits every word the learner has met, with a strength bar, which doubles as
 * the course dictionary.
 */

interface Props {
  p: Progress;
  onPractice: (wordIds: string[], label: string) => void;
}

export function Practice({ p, onPractice }: Props) {
  const [detail, setDetail] = useState<Word | null>(null);
  const [filter, setFilter] = useState<'all' | 'weak' | 'strong'>('all');
  const audio = supported();

  const known = useMemo(() => knownWordIds(p), [p]);
  const due = useMemo(() => dueWords(p.srs, known, Date.now(), 20), [p.srs, known]);
  const mistakes = p.mistakes.filter((id) => WORD_BY_ID[id]);

  const listed = useMemo(() => {
    const words = known.map((id) => WORD_BY_ID[id]).filter(Boolean);
    const f = (w: Word) => freshness(p.srs[w.id]);
    const sorted = [...words].sort((a, b) => f(a) - f(b));
    if (filter === 'weak') return sorted.filter((w) => f(w) < 0.6);
    if (filter === 'strong') return sorted.filter((w) => f(w) >= 0.6).reverse();
    return sorted;
  }, [known, filter, p.srs]);

  if (!known.length) {
    return (
      <div className="page page-pad-bottom center col" style={{ gap: 16 }}>
        <Mascot mood="sleep" size={130} />
        <div className="h2" style={{ textAlign: 'center' }}>Nothing to practise yet</div>
        <div className="small muted" style={{ textAlign: 'center', maxWidth: 260 }}>
          Finish a lesson on the Learn tab and your words will show up here.
        </div>
      </div>
    );
  }

  return (
    <div className="page page-pad-bottom">
      <header style={{ padding: '18px 0 14px' }}>
        <div className="h1">Practice</div>
        <div className="small muted" style={{ marginTop: 3 }}>
          {known.length} words met · {due.length} ready for review
        </div>
      </header>

      <div className="col" style={{ gap: 10, marginBottom: 22 }}>
        <PracticeCard
          icon="🎯"
          tone="red"
          title="Fix your mistakes"
          sub={mistakes.length ? `${mistakes.length} words you’ve slipped on` : 'Nothing outstanding — nice'}
          disabled={!mistakes.length}
          onClick={() => onPractice(mistakes, 'Mistakes')}
        />
        <PracticeCard
          icon="🔁"
          tone="blue"
          title="Review weak words"
          sub={due.length ? `${due.length} words are fading` : 'Everything is fresh'}
          disabled={!due.length}
          onClick={() => onPractice(due, 'Review')}
        />
        <PracticeCard
          icon="⚡"
          tone="gold"
          title="Quick 5"
          sub="A fast mixed round from everything you know"
          onClick={() => onPractice([...known].sort(() => Math.random() - 0.5).slice(0, 8), 'Quick practice')}
        />
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 12 }}>
        {(['all', 'weak', 'strong'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              sfxTap();
              setFilter(f);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'capitalize',
              background: filter === f ? 'var(--green)' : 'var(--surface-2)',
              color: filter === f ? '#fff' : 'var(--muted)',
              border: '2px solid',
              borderColor: filter === f ? 'var(--green)' : 'var(--line)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="col" style={{ gap: 6 }}>
        {listed.map((w) => {
          const st = p.srs[w.id];
          const strength = (st?.strength ?? 0) / MAX_STRENGTH;
          return (
            <button
              key={w.id}
              className="card row"
              onClick={() => {
                sfxTap();
                setDetail(w);
                if (audio) speak(w.ti);
              }}
              style={{ gap: 12, padding: '11px 14px', borderBottomWidth: 2, textAlign: 'left' }}
            >
              <span style={{ fontSize: 22, width: 26, textAlign: 'center' }}>{w.emoji ?? '·'}</span>
              <div className="col grow" style={{ gap: 1, minWidth: 0 }}>
                <span className="geez" style={{ fontSize: 19 }}>{w.ti}</span>
                <span className="tiny muted">{w.en}</span>
              </div>
              <div style={{ width: 46, flex: 'none' }}>
                <Bar value={strength} tone={strength >= 0.6 ? 'gold' : 'blue'} height={7} />
              </div>
            </button>
          );
        })}
        {!listed.length && (
          <div className="small muted center" style={{ padding: 30 }}>
            No words in this bucket.
          </div>
        )}
      </div>

      <Sheet open={detail !== null} onClose={() => setDetail(null)}>
        {detail && <WordDetail w={detail} p={p} onPractice={onPractice} />}
      </Sheet>
    </div>
  );
}

function WordDetail({
  w,
  p,
  onPractice,
}: {
  w: Word;
  p: Progress;
  onPractice: (ids: string[], label: string) => void;
}) {
  const st = p.srs[w.id];
  const audio = supported();
  return (
    <div className="col center" style={{ gap: 12, paddingBottom: 6 }}>
      {w.emoji && <div style={{ fontSize: 48 }}>{w.emoji}</div>}
      <div className="geez" style={{ fontSize: 40 }}>{w.ti}</div>
      <div className="tr" style={{ fontSize: 15 }}>{w.tr}</div>
      <div className="h2">{w.en}</div>
      <div className="tiny upper muted">{w.pos}</div>

      {w.note && (
        <div
          className="small"
          style={{
            background: 'var(--surface-2)',
            padding: '11px 15px',
            borderRadius: 'var(--r-md)',
            color: 'var(--ink-2)',
            textAlign: 'center',
          }}
        >
          {w.note}
        </div>
      )}

      <div className="col" style={{ width: '100%', gap: 5 }}>
        <div className="row">
          <span className="tiny upper muted grow">Strength</span>
          <span className="tiny muted">
            {st ? `${st.seen} reviews · ${st.wrong} missed` : 'not reviewed yet'}
          </span>
        </div>
        <Bar value={(st?.strength ?? 0) / MAX_STRENGTH} tone="gold" height={10} />
      </div>

      <div className="row" style={{ gap: 8, width: '100%' }}>
        {audio && (
          <Btn tone="ghost" onClick={() => speak(w.ti)}>🔊 Listen</Btn>
        )}
        <Btn tone="blue" onClick={() => onPractice([w.id], w.en)}>Practise this</Btn>
      </div>
    </div>
  );
}

function PracticeCard({
  icon,
  title,
  sub,
  tone,
  disabled,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  tone: 'red' | 'blue' | 'gold';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="card row"
      disabled={disabled}
      onClick={() => {
        sfxTap();
        onClick();
      }}
      style={{
        gap: 14,
        padding: '15px 16px',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        className="center"
        style={{
          width: 44,
          height: 44,
          flex: 'none',
          borderRadius: 13,
          background: `var(--${tone}-soft)`,
          fontSize: 22,
        }}
      >
        {icon}
      </span>
      <div className="col grow" style={{ gap: 1 }}>
        <span className="h3">{title}</span>
        <span className="tiny muted">{sub}</span>
      </div>
      <span className="muted" style={{ fontSize: 20 }}>›</span>
    </button>
  );
}
