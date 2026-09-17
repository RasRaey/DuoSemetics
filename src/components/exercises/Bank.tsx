import { Fragment, useMemo, useState } from 'react';
import type { MatchPairs, TranslateBank, TranslateType } from '../../engine/types';
import { Geez, SpeakerBtn } from '../ui';
import { sfxMatch, sfxTap, sfxUntap, sfxWrong } from '../../audio/sfx';
import { haptic } from '../../audio/speech';

/**
 * Word-bank translation.
 *
 * Tiles move between the bank and the answer line. Each tile is tracked by its
 * index in the bank rather than its text, because a sentence can legitimately
 * use the same token twice and two identical tiles must stay independent.
 */
export function TranslateBankEx({
  ex,
  value,
  onChange,
  locked,
  showTr,
  speak,
  audioAvailable,
}: {
  ex: TranslateBank;
  /** Indices into `ex.bank`, in the order they were tapped. */
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
  showTr: boolean;
  speak: (t: string) => void;
  audioAvailable: boolean;
}) {
  const chosen = value.map(Number);
  const used = new Set(chosen);
  const toTi = ex.direction === 'en_ti';

  const add = (i: number) => {
    if (locked || used.has(i)) return;
    sfxTap();
    haptic(6);
    onChange([...value, String(i)]);
  };
  const remove = (pos: number) => {
    if (locked) return;
    sfxUntap();
    onChange(value.filter((_, k) => k !== pos));
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Prompt */}
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        {!toTi && <SpeakerBtn onPlay={() => speak(ex.promptText)} available={audioAvailable} size="sm" />}
        <div className="grow">
          {toTi ? (
            <div className="h2" style={{ lineHeight: 1.35 }}>{ex.promptText}</div>
          ) : (
            <Geez text={ex.promptText} tr={ex.promptTr} size={26} showTr={showTr} align="left" />
          )}
        </div>
      </div>

      {/* Answer line: two ruled rows, like a writing exercise. */}
      <div style={{ minHeight: 104, paddingTop: 4 }}>
        <div
          className="row wrap"
          style={{
            gap: 8,
            alignContent: 'flex-start',
            minHeight: 96,
            borderTop: '2px solid var(--line-2)',
            borderBottom: '2px solid var(--line-2)',
            padding: '10px 0',
          }}
        >
          {chosen.map((i, pos) => (
            <Tile key={`${i}-${pos}`} text={ex.bank[i]} geez={toTi} onClick={() => remove(pos)} />
          ))}
        </div>
      </div>

      {/* Bank */}
      <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
        {ex.bank.map((t, i) => (
          <Tile
            key={i}
            text={t}
            geez={toTi}
            spent={used.has(i)}
            onClick={() => add(i)}
          />
        ))}
      </div>
    </div>
  );
}

function Tile({
  text,
  geez,
  spent,
  onClick,
}: {
  text: string;
  geez: boolean;
  spent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        padding: geez ? '7px 13px 9px' : '9px 13px',
        fontSize: geez ? 21 : 16,
        fontWeight: 800,
        fontFamily: geez ? 'var(--font-geez)' : undefined,
        // Spent tiles keep their footprint so the bank doesn't reflow on every tap.
        visibility: spent ? 'hidden' : 'visible',
      }}
    >
      {text}
    </button>
  );
}

/** Free-text translation. */
export function TranslateTypeEx({
  ex,
  value,
  onChange,
  locked,
  showTr,
  speak,
  audioAvailable,
}: {
  ex: TranslateType;
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
  showTr: boolean;
  speak: (t: string) => void;
  audioAvailable: boolean;
}) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <SpeakerBtn onPlay={() => speak(ex.promptText)} available={audioAvailable} size="sm" />
        <div className="grow">
          <Geez text={ex.promptText} tr={ex.promptTr} size={26} showTr={showTr} align="left" />
        </div>
      </div>
      <textarea
        value={value[0] ?? ''}
        onChange={(e) => onChange([e.target.value])}
        disabled={locked}
        rows={3}
        placeholder="Type in English…"
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck
        style={{
          width: '100%',
          resize: 'none',
          padding: 14,
          fontSize: 17,
          fontWeight: 700,
          fontFamily: 'var(--font)',
          color: 'var(--ink)',
          background: 'var(--surface-2)',
          border: '2px solid var(--line)',
          borderRadius: 'var(--r-md)',
          outline: 'none',
        }}
      />
    </div>
  );
}

/**
 * Match pairs.
 *
 * Tapping a Tigrinya tile then its English partner clears both. A wrong pair
 * flashes red and resets. The round reports completion itself — there is no
 * Check button — which is why it always sits last in a lesson.
 */
export function MatchPairsEx({
  ex,
  onDone,
  showTr,
}: {
  ex: MatchPairs;
  /** Called once every pair is cleared, with how many wrong taps happened. */
  onDone: (misses: number) => void;
  showTr: boolean;
}) {
  const [cleared, setCleared] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ side: 'ti' | 'en'; id: string } | null>(null);
  const [bad, setBad] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);

  // Each column is shuffled independently so partners never sit side by side.
  const left = useMemo(
    () => [...ex.pairs].sort((a, b) => (a.ti < b.ti ? -1 : 1)),
    [ex.pairs],
  );
  const right = useMemo(
    () => [...ex.pairs].sort((a, b) => (a.en < b.en ? -1 : 1)),
    [ex.pairs],
  );

  const tap = (side: 'ti' | 'en', id: string) => {
    if (cleared.includes(id) || bad.length) return;
    if (!picked) {
      sfxTap();
      setPicked({ side, id });
      return;
    }
    if (picked.side === side) {
      sfxTap();
      setPicked({ side, id });
      return;
    }
    if (picked.id === id) {
      sfxMatch();
      haptic(12);
      const next = [...cleared, id];
      setCleared(next);
      setPicked(null);
      if (next.length === ex.pairs.length) {
        window.setTimeout(() => onDone(misses), 320);
      }
    } else {
      sfxWrong();
      haptic([10, 40, 10]);
      setMisses((m) => m + 1);
      setBad([picked.id, id]);
      window.setTimeout(() => {
        setBad([]);
        setPicked(null);
      }, 480);
    }
  };

  const cls = (id: string) =>
    [
      'card',
      cleared.includes(id) ? 'gone' : '',
      bad.includes(id) ? 'bad' : '',
      picked?.id === id && !bad.length ? 'sel' : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {left.map((p, i) => (
        <Fragment key={p.id}>
          <button className={cls(p.id)} onClick={() => tap('ti', p.id)} style={{ padding: '14px 8px', minHeight: 62 }}>
            <div className="geez" style={{ fontSize: 21 }}>{p.ti}</div>
            {showTr && <div className="tr" style={{ fontSize: 11 }}>{p.tr}</div>}
          </button>
          <button
            className={cls(right[i].id)}
            onClick={() => tap('en', right[i].id)}
            style={{ padding: '14px 8px', minHeight: 62, fontSize: 16, fontWeight: 800 }}
          >
            {right[i].en}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
