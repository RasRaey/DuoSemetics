/**
 * Anbi — the course mascot.
 *
 * ኣንበሳ (anbesa) means "lion", the animal on the old Ethiopian and Eritrean
 * heraldry and a stock character in Tigrinya folk tales. Drawn as inline SVG so
 * it scales, themes and animates without any image download.
 *
 * Moods drive the eyes, the mouth and the mane colour, and are used to give
 * feedback a face: `cheer` after a right answer, `sad` after a wrong one.
 */

export type Mood = 'happy' | 'cheer' | 'sad' | 'think' | 'sleep' | 'wave';

interface Props {
  mood?: Mood;
  size?: number;
  /** Adds a gentle idle bob. */
  idle?: boolean;
  className?: string;
}

const MANE: Record<Mood, string> = {
  happy: '#f0a92c',
  cheer: '#ffc23c',
  sad: '#cfa96a',
  think: '#e8b45c',
  sleep: '#d9b078',
  wave: '#f0a92c',
};

export function Mascot({ mood = 'happy', size = 120, idle = false, className = '' }: Props) {
  const mane = MANE[mood];
  const eyesClosed = mood === 'sleep';
  const eyesSquint = mood === 'cheer';

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Anbi the lion, looking ${mood}`}
      className={[idle ? 'bob' : '', className].filter(Boolean).join(' ')}
      style={{ overflow: 'visible' }}
    >
      {/* Mane: two rings of rounded petals, offset so the silhouette reads as fur. */}
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={`o${i}`}
              cx={60 + Math.cos(a) * 34}
              cy={62 + Math.sin(a) * 34}
              r={14}
              fill={mane}
            />
          );
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2;
          return (
            <circle
              key={`i${i}`}
              cx={60 + Math.cos(a) * 28}
              cy={62 + Math.sin(a) * 28}
              r={15}
              fill={mane}
              opacity={0.95}
            />
          );
        })}
      </g>

      {/* Ears */}
      <circle cx="36" cy="36" r="10" fill={mane} />
      <circle cx="84" cy="36" r="10" fill={mane} />
      <circle cx="36" cy="36" r="5" fill="#e07b52" />
      <circle cx="84" cy="36" r="5" fill="#e07b52" />

      {/* Face */}
      <circle cx="60" cy="62" r="31" fill="#ffd98a" />
      <ellipse cx="60" cy="74" rx="19" ry="14" fill="#fff0cd" />

      {/* Eyes */}
      {eyesClosed ? (
        <>
          <path d="M42 58 q7 6 14 0" stroke="#3b2a17" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M64 58 q7 6 14 0" stroke="#3b2a17" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      ) : eyesSquint ? (
        <>
          <path d="M42 60 q7 -8 14 0" stroke="#3b2a17" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M64 60 q7 -8 14 0" stroke="#3b2a17" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="58" rx="6" ry={mood === 'sad' ? 5 : 7} fill="#3b2a17" />
          <ellipse cx="71" cy="58" rx="6" ry={mood === 'sad' ? 5 : 7} fill="#3b2a17" />
          <circle cx="51" cy="55.5" r="2.3" fill="#fff" />
          <circle cx="73" cy="55.5" r="2.3" fill="#fff" />
        </>
      )}

      {/* Brows — the main carrier of mood */}
      {mood === 'sad' && (
        <>
          <path d="M42 47 q7 3 13 6" stroke="#8a6534" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M78 47 q-7 3 -13 6" stroke="#8a6534" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'think' && (
        <>
          <path d="M42 48 q7 -3 13 1" stroke="#8a6534" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M65 45 q7 2 13 5" stroke="#8a6534" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Muzzle */}
      <path d="M55 68 q5 -4 10 0 q-3 5 -5 5 q-2 0 -5 -5 z" fill="#c9603f" />
      {mood === 'sad' ? (
        <path d="M51 84 q9 -7 18 0" stroke="#8a4a2e" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      ) : mood === 'sleep' ? (
        <path d="M54 80 q6 4 12 0" stroke="#8a4a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path
          d={mood === 'cheer' ? 'M48 76 q12 14 24 0 q-12 5 -24 0z' : 'M51 77 q9 8 18 0'}
          stroke="#8a4a2e"
          strokeWidth="3.2"
          fill={mood === 'cheer' ? '#8a4a2e' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Whiskers */}
      <g stroke="#d8b06f" strokeWidth="2" strokeLinecap="round">
        <path d="M38 72 h-9" />
        <path d="M39 78 h-8" />
        <path d="M82 72 h9" />
        <path d="M81 78 h8" />
      </g>

      {mood === 'sleep' && (
        <text x="92" y="28" fontSize="16" fontWeight="800" fill="var(--muted)">
          z
        </text>
      )}
      {mood === 'wave' && (
        <g>
          <circle cx="99" cy="84" r="9" fill="#ffd98a" />
          <circle cx="99" cy="84" r="9" fill="none" stroke={mane} strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

/** A small crown, used on completed nodes and the unit banner. */
export function Crown({ size = 18, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-1.8 10H4.8L3 8z"
        fill={filled ? 'var(--gold)' : 'var(--locked)'}
        stroke={filled ? 'var(--gold-ink)' : 'var(--locked-ink)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
