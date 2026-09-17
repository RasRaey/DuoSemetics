import type {
  FidelOrder,
  FidelPickChar,
  FidelPickSound,
  FillBlank,
  PickImage,
  SelectWord,
} from '../../engine/types';
import { ORDERS } from '../../data/fidel';
import { Geez } from '../ui';
import { sfxTap } from '../../audio/sfx';
import { haptic } from '../../audio/speech';

/**
 * All the "pick one of N" exercises.
 *
 * They share one selection model: the parent owns `value` (a one-element array)
 * and `locked` flips on once the answer has been checked, at which point the
 * chosen tile turns green or red and the right answer is highlighted.
 */

export interface ChoiceProps {
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
  correctId?: string;
  showTr: boolean;
}

function tileClass(id: string, value: string[], locked: boolean, correctId?: string): string {
  const picked = value[0] === id;
  if (!locked) return `card ${picked ? 'sel' : ''}`;
  if (picked && id === correctId) return 'card ok';
  if (picked) return 'card bad';
  if (id === correctId) return 'card ok';
  return 'card dim';
}

function useTap(onChange: (v: string[]) => void, locked: boolean) {
  return (id: string) => {
    if (locked) return;
    sfxTap();
    haptic(8);
    onChange([id]);
  };
}

/** Big emoji cards — the gentlest introduction to a new word. */
export function PickImageEx({ ex, value, onChange, locked, correctId, showTr }: ChoiceProps & { ex: PickImage }) {
  const tap = useTap(onChange, locked);
  return (
    <div className="col" style={{ gap: 18 }}>
      <Geez text={ex.prompt.ti} tr={ex.prompt.tr} size={36} showTr={showTr} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {ex.options.map((o) => (
          <button
            key={o.id}
            onClick={() => tap(o.id)}
            className={tileClass(o.id, value, locked, correctId)}
            style={{ padding: '18px 10px 12px', display: 'grid', gap: 8, justifyItems: 'center' }}
          >
            <span style={{ fontSize: 52, lineHeight: 1 }}>{o.emoji}</span>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{o.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Four-way text choice, in whichever direction. */
export function SelectWordEx({ ex, value, onChange, locked, correctId, showTr }: ChoiceProps & { ex: SelectWord }) {
  const tap = useTap(onChange, locked);
  const toTi = ex.direction === 'en_ti';
  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="center" style={{ minHeight: 76 }}>
        {toTi ? (
          <div className="h1" style={{ textAlign: 'center' }}>{ex.prompt.en}</div>
        ) : (
          <Geez text={ex.prompt.ti} tr={ex.prompt.tr} size={38} showTr={showTr} />
        )}
      </div>
      <div className="col" style={{ gap: 10 }}>
        {ex.options.map((o) => (
          <button
            key={o.id}
            onClick={() => tap(o.id)}
            className={tileClass(o.id, value, locked, correctId)}
            style={{ padding: '14px 16px', textAlign: 'left' }}
          >
            {toTi ? (
              <div className="row" style={{ gap: 10 }}>
                <span className="geez" style={{ fontSize: 24 }}>{o.ti}</span>
                {showTr && <span className="tr">{o.tr}</span>}
              </div>
            ) : (
              <span style={{ fontSize: 17, fontWeight: 800 }}>{o.en}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A sentence with one token missing and three candidates. */
export function FillBlankEx({ ex, value, onChange, locked, correctId, showTr }: ChoiceProps & { ex: FillBlank }) {
  const tap = useTap(onChange, locked);
  const filled = value[0];
  return (
    <div className="col" style={{ gap: 20 }}>
      <div
        className="geez row wrap center"
        style={{ fontSize: 28, gap: 8, justifyContent: 'center', minHeight: 60 }}
      >
        {ex.parts.map((p, i) =>
          p === null ? (
            <span
              key={i}
              style={{
                display: 'inline-block',
                minWidth: 86,
                borderBottom: `3px solid ${filled ? 'var(--blue)' : 'var(--line)'}`,
                color: filled ? 'var(--ink)' : 'transparent',
                textAlign: 'center',
              }}
            >
              {filled ?? '—'}
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </div>
      {showTr && <div className="tr center">{ex.en}</div>}
      <div className="col" style={{ gap: 10 }}>
        {ex.options.map((o) => (
          <button
            key={o}
            onClick={() => tap(o)}
            className={tileClass(o, value, locked, correctId)}
            style={{ padding: '14px 16px' }}
          >
            <span className="geez" style={{ fontSize: 24 }}>{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Fidel drills ────────────────────────────────────────────────────────

/** Show the letter, pick the sound. */
export function FidelPickSoundEx({ ex, value, onChange, locked, correctId }: ChoiceProps & { ex: FidelPickSound }) {
  const tap = useTap(onChange, locked);
  return (
    <div className="col" style={{ gap: 24 }}>
      <div
        className="geez center"
        style={{
          fontSize: 104,
          lineHeight: 1.1,
          background: 'var(--purple-soft)',
          borderRadius: 'var(--r-xl)',
          padding: '18px 0 26px',
        }}
      >
        {ex.char}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ex.options.map((o) => (
          <button key={o} onClick={() => tap(o)} className={tileClass(o, value, locked, correctId)} style={{ padding: '18px 10px', fontSize: 22, fontWeight: 800 }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Show the sound, pick the letter. */
export function FidelPickCharEx({ ex, value, onChange, locked, correctId }: ChoiceProps & { ex: FidelPickChar }) {
  const tap = useTap(onChange, locked);
  return (
    <div className="col" style={{ gap: 24 }}>
      <div className="center h1" style={{ fontSize: 46, minHeight: 90 }}>{ex.read}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ex.options.map((o) => (
          <button key={o} onClick={() => tap(o)} className={tileClass(o, value, locked, correctId)} style={{ padding: '10px' }}>
            <span className="geez" style={{ fontSize: 48 }}>{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The order drill: given the base shape and a target vowel, pick the form that
 * carries it. This is the exercise that actually teaches the abugida, because
 * it forces attention onto the vowel mark rather than the whole glyph.
 */
export function FidelOrderEx({ ex, value, onChange, locked, correctId }: ChoiceProps & { ex: FidelOrder }) {
  const tap = useTap(onChange, locked);
  const order = ORDERS.find((o) => o.name === ex.orderName);
  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="col center" style={{ gap: 6 }}>
        <div className="tiny muted upper">base shape</div>
        <div className="geez" style={{ fontSize: 60 }}>{ex.baseChar}</div>
        <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
          <span className="h2">{ex.orderName}</span>
          <span className="h2 muted">→ {ex.targetRead}</span>
        </div>
        {order && <div className="tiny muted" style={{ textAlign: 'center' }}>{order.hint}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ex.options.map((o) => (
          <button key={o} onClick={() => tap(o)} className={tileClass(o, value, locked, correctId)} style={{ padding: '10px' }}>
            <span className="geez" style={{ fontSize: 48 }}>{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
