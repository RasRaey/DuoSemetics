import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfxTap } from '../audio/sfx';
import { haptic } from '../audio/speech';
import { IconFlame, IconGem, IconHeart, IconMute, IconSpeaker } from './icons';

/** Primary action button with the house "pressable slab" styling. */
export function Btn({
  children,
  onClick,
  tone = 'green',
  disabled,
  silent,
  style,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'green' | 'red' | 'blue' | 'gold' | 'purple' | 'ghost' | 'quiet';
  disabled?: boolean;
  silent?: boolean;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`btn ${tone} ${className}`}
      disabled={disabled}
      style={style}
      onClick={() => {
        if (disabled) return;
        if (!silent) {
          sfxTap();
          haptic(8);
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function Bar({
  value,
  tone = '',
  height = 16,
}: {
  /** 0–1. */
  value: number;
  tone?: '' | 'gold' | 'blue';
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`bar ${tone}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Bottom sheet with a scrim. Tapping the scrim closes it unless `sticky`. */
export function Sheet({
  open,
  onClose,
  children,
  sticky,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  sticky?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sticky) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, sticky]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={sticky ? undefined : onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        {!sticky && <div className="sheet-grip" />}
        {children}
      </div>
    </>
  );
}

/** The counters that sit above every main tab. */
export function TopStats({
  streak,
  gems,
  hearts,
  unlimited,
  onHearts,
  onStreak,
  onGems,
}: {
  streak: number;
  gems: number;
  hearts: number;
  unlimited: boolean;
  onHearts?: () => void;
  onStreak?: () => void;
  onGems?: () => void;
}) {
  return (
    <div className="topbar">
      <div className="topbar-row">
        <button className={`stat streak ${streak ? '' : 'dead'}`} onClick={onStreak} aria-label={`${streak} day streak`}>
          <IconFlame size={22} color={streak ? 'var(--gold)' : 'var(--locked)'} />
          {streak}
        </button>
        <button className="stat gems" onClick={onGems} aria-label={`${gems} gems`}>
          <IconGem size={21} />
          {gems}
        </button>
        <div className="grow" />
        <button
          className={`stat hearts ${hearts === 0 && !unlimited ? 'dead' : ''}`}
          onClick={onHearts}
          aria-label={unlimited ? 'Unlimited hearts' : `${hearts} hearts left`}
        >
          <IconHeart size={21} color={hearts === 0 && !unlimited ? 'var(--locked)' : 'var(--red)'} />
          {unlimited ? '∞' : hearts}
        </button>
      </div>
    </div>
  );
}

/** Ge'ez text with optional transliteration beneath. */
export function Geez({
  text,
  tr,
  size = 28,
  showTr = true,
  align = 'center',
}: {
  text: string;
  tr?: string;
  size?: number;
  showTr?: boolean;
  align?: 'center' | 'left';
}) {
  return (
    <div style={{ textAlign: align }}>
      <div className="geez" style={{ fontSize: size }}>
        {text}
      </div>
      {showTr && tr && <div className="tr" style={{ marginTop: 2 }}>{tr}</div>}
    </div>
  );
}

/** A speaker button that reports when no voice exists rather than doing nothing. */
export function SpeakerBtn({
  onPlay,
  available,
  size = 'md',
}: {
  onPlay: () => void;
  available: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const px = size === 'lg' ? 92 : size === 'md' ? 64 : 44;
  const [ping, setPing] = useState(false);
  return (
    <button
      aria-label={available ? 'Play audio' : 'Audio unavailable on this device'}
      onClick={() => {
        setPing(true);
        window.setTimeout(() => setPing(false), 320);
        onPlay();
      }}
      className={ping ? 'pop' : ''}
      style={{
        width: px,
        height: px,
        borderRadius: 16,
        background: available ? 'var(--blue)' : 'var(--line)',
        boxShadow: `0 4px 0 ${available ? 'var(--blue-ink)' : 'var(--line)'}`,
        color: available ? '#fff' : 'var(--locked-ink)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {available ? (
        <IconSpeaker size={px * 0.46} color="#fff" />
      ) : (
        <IconMute size={px * 0.46} color="var(--locked-ink)" />
      )}
    </button>
  );
}

/**
 * Counts up to a target — used for XP and gem totals on the summary screen so
 * the numbers feel earned rather than just appearing.
 */
export function CountUp({ to, ms = 700 }: { to: number; ms?: number }) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      // Ease out so it decelerates into the final number.
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to, ms]);
  return <>{n}</>;
}

/** Hearts rendered as a row, with the spent ones hollowed out. */
export function HeartRow({ hearts, max = 5 }: { hearts: number; max?: number }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <IconHeart
          key={i}
          size={19}
          filled={i < hearts}
          color={i < hearts ? 'var(--red)' : 'var(--line)'}
        />
      ))}
    </div>
  );
}
