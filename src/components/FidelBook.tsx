import { useState } from 'react';
import { FIDEL, GEEZ_NUMERALS, ORDERS, PUNCTUATION, type FidelRow } from '../data/fidel';
import { Sheet } from './ui';
import { sfxTap } from '../audio/sfx';
import { speak, supported } from '../audio/speech';

/**
 * A browsable Fidel chart.
 *
 * The grid is the traditional 7-column layout every Tigrinya learner meets in
 * school, so what someone studies here matches the chart on the classroom wall.
 * Tapping a cell opens the detail sheet with the sound and the order it belongs
 * to — that mapping is the whole skill.
 */
export function FidelBook() {
  const [cell, setCell] = useState<{ row: FidelRow; order: number } | null>(null);
  const audio = supported();

  return (
    <div className="page page-pad-bottom">
      <header style={{ padding: '18px 0 10px' }}>
        <div className="h1">ፊደል</div>
        <div className="small muted" style={{ marginTop: 3 }}>
          Every consonant has seven forms. The base shape carries the consonant; small
          strokes and leg changes add the vowel.
        </div>
      </header>

      {/* Order legend */}
      <div
        className="row"
        style={{
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 10,
          marginBottom: 6,
        }}
      >
        {ORDERS.map((o, i) => (
          <div
            key={o.name}
            style={{
              flex: 'none',
              padding: '6px 10px',
              borderRadius: 10,
              background: 'var(--purple-soft)',
              color: 'var(--purple-ink)',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            <div className="geez">{o.name}</div>
            <div style={{ opacity: 0.75 }}>{i + 1} · -{o.vowel}</div>
          </div>
        ))}
      </div>

      {/* The chart */}
      <div className="col" style={{ gap: 4 }}>
        {FIDEL.map((row) => (
          <div key={row.id} className="row" style={{ gap: 3 }}>
            <div
              className="tiny muted center"
              style={{ width: 26, flex: 'none', fontWeight: 800 }}
            >
              {row.consonant}
            </div>
            {row.chars.map((c, i) => (
              <button
                key={i}
                className="card"
                onClick={() => {
                  sfxTap();
                  setCell({ row, order: i });
                  if (audio) speak(c);
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  aspectRatio: '1',
                  display: 'grid',
                  placeItems: 'center',
                  borderBottomWidth: 2,
                  padding: 0,
                }}
              >
                <span className="geez" style={{ fontSize: 21 }}>{c}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Numerals and punctuation */}
      <h3 className="h3" style={{ margin: '26px 0 8px' }}>Ge’ez numerals</h3>
      <div className="row wrap" style={{ gap: 6 }}>
        {GEEZ_NUMERALS.map((n) => (
          <div
            key={n.glyph}
            className="card center col"
            style={{ width: 54, height: 58, gap: 1, borderBottomWidth: 2 }}
          >
            <span className="geez" style={{ fontSize: 22 }}>{n.glyph}</span>
            <span className="tiny muted">{n.value}</span>
          </div>
        ))}
      </div>

      <h3 className="h3" style={{ margin: '24px 0 8px' }}>Punctuation</h3>
      <div className="col" style={{ gap: 6 }}>
        {PUNCTUATION.map((pn) => (
          <div key={pn.glyph} className="card row" style={{ gap: 12, padding: '10px 14px', borderBottomWidth: 2 }}>
            <span className="geez" style={{ fontSize: 24, width: 28, textAlign: 'center' }}>{pn.glyph}</span>
            <div className="col grow">
              <span className="geez" style={{ fontSize: 15 }}>{pn.name}</span>
              <span className="tiny muted">{pn.use}</span>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={cell !== null} onClose={() => setCell(null)}>
        {cell && (
          <div className="col center" style={{ gap: 10, paddingBottom: 6 }}>
            <div className="geez" style={{ fontSize: 88, lineHeight: 1.1 }}>
              {cell.row.chars[cell.order]}
            </div>
            <div className="h1">{cell.row.reads[cell.order]}</div>
            <div className="row" style={{ gap: 8 }}>
              <span className="geez small" style={{ color: 'var(--purple-ink)' }}>
                {ORDERS[cell.order].name}
              </span>
              <span className="small muted">order {cell.order + 1} · -{ORDERS[cell.order].vowel}</span>
            </div>
            <div className="small muted" style={{ textAlign: 'center' }}>
              {ORDERS[cell.order].hint}
            </div>
            {cell.row.note && (
              <div
                className="small"
                style={{
                  background: 'var(--surface-2)',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--ink-2)',
                  textAlign: 'center',
                }}
              >
                {cell.row.note}
              </div>
            )}
            {/* The whole row, so the vowel marks can be compared side by side. */}
            <div className="row" style={{ gap: 4, marginTop: 4 }}>
              {cell.row.chars.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCell({ row: cell.row, order: i })}
                  className="geez center"
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: 22,
                    borderRadius: 8,
                    background: i === cell.order ? 'var(--purple-soft)' : 'transparent',
                    color: i === cell.order ? 'var(--purple-ink)' : 'var(--muted)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
