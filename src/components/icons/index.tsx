/**
 * Icon set.
 *
 * Hand-drawn SVG rather than emoji for anything structural — tab bars, path
 * nodes, exercise chrome. Emoji are kept only where the glyph *is* the content
 * (a word's picture, a gem, a heart), because those read as illustrations
 * rather than interface, and because they carry colour the UI wants.
 */

interface IconProps {
  size?: number;
  /** Stroke colour; defaults to the inherited text colour. */
  color?: string;
  /** Filled variants are used for the active tab. */
  filled?: boolean;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
});

const stroke = (color?: string) => ({
  stroke: color ?? 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function IconHome({ size = 24, color, filled }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z"
        {...stroke(color)}
        fill={filled ? (color ?? 'currentColor') : 'none'}
      />
    </svg>
  );
}

/** The Ge'ez letter ፊ, set as a glyph — the Fidel tab's natural mark. */
export function IconFidel({ size = 24, color, filled }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" {...stroke(color)} fill={filled ? (color ?? 'currentColor') : 'none'} />
      <text
        x="12"
        y="17.4"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fontFamily="var(--font-geez)"
        fill={filled ? 'var(--surface)' : (color ?? 'currentColor')}
      >
        ፊ
      </text>
    </svg>
  );
}

export function IconTarget({ size = 24, color, filled }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" {...stroke(color)} />
      <circle cx="12" cy="12" r="5" {...stroke(color)} />
      <circle cx="12" cy="12" r="1.6" fill={color ?? 'currentColor'} opacity={filled ? 1 : 0.6} />
    </svg>
  );
}

export function IconTrophy({ size = 24, color, filled }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M7 4h10v5a5 5 0 0 1-10 0V4Z"
        {...stroke(color)}
        fill={filled ? (color ?? 'currentColor') : 'none'}
      />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" {...stroke(color)} />
      <path d="M12 14v3.5M8.5 21h7l-.8-3.5h-5.4L8.5 21Z" {...stroke(color)} />
    </svg>
  );
}

export function IconPerson({ size = 24, color, filled }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="4" {...stroke(color)} fill={filled ? (color ?? 'currentColor') : 'none'} />
      <path
        d="M4.5 20.5a7.5 7.5 0 0 1 15 0"
        {...stroke(color)}
        fill={filled ? (color ?? 'currentColor') : 'none'}
      />
    </svg>
  );
}

// ─── Path node faces ─────────────────────────────────────────────────────

export function IconStar({ size = 24, color = '#fff' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="m12 3.6 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.6Z"
        fill={color}
      />
    </svg>
  );
}

export function IconCheck({ size = 24, color = '#fff' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m5 12.5 4.8 4.8L19 7.5" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLock({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.6" fill={color} />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconChest({ size = 24, color = '#fff' }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="9.5" width="18" height="10" rx="2" fill={color} />
      <path d="M3 11.5h18" stroke="var(--purple-ink)" strokeWidth="1.6" />
      <path d="M3.5 9.5a8.5 8.5 0 0 1 17 0" fill={color} />
      <rect x="10.4" y="8.4" width="3.2" height="5" rx="1.2" fill="var(--purple-ink)" />
    </svg>
  );
}

export function IconMedal({ size = 24, color = '#fff' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m8 2.5 2.4 6M16 2.5l-2.4 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="6.2" fill={color} />
      <path d="m12 11.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3 1-2.1Z" fill="var(--gold-ink)" />
    </svg>
  );
}

export function IconFlame({ size = 24, color = 'var(--gold)' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M12 2.5s1 3-1.2 5.3C8.6 10 6 11.3 6 14.6A6 6 0 0 0 18 15c0-3-1.6-4.4-2.6-6-.4 1-1 1.7-1.7 2 .6-3.3-1.7-6.9-1.7-8.5Z"
        fill={color}
      />
      <path d="M12 20a3 3 0 0 1-1.2-5.7c0 1.5 1.2 2 1.2 2s.2-1.4 1.4-2.3A3 3 0 0 1 12 20Z" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export function IconGem({ size = 24, color = 'var(--blue)' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 3h10l4 5.5-9 12.5L3 8.5 7 3Z" fill={color} />
      <path d="M3 8.5h18M12 21 7 3M12 21l5-18" stroke="#fff" strokeWidth="1.1" opacity="0.5" />
    </svg>
  );
}

export function IconHeart({ size = 24, color = 'var(--red)', filled = true }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSpeaker({ size = 24, color = '#fff', filled = true }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill={color} />
      {filled && (
        <>
          <path d="M15 9.5a3.6 3.6 0 0 1 0 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M17.6 7a7 7 0 0 1 0 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function IconMute({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill={color} />
      <path d="m16 9.5 5 5m0-5-5 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m6 6 12 12M18 6 6 18" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
