import { useEffect, useState } from 'react';
import { Bar, Btn, CountUp } from './ui';
import { Mascot } from './Mascot';
import { sfxReward, sfxStreak } from '../audio/sfx';

/**
 * End-of-lesson summary.
 *
 * Shown as a short sequence rather than one screen: the stats land first, then
 * the daily goal, then the streak. Splitting it gives each reward its own beat
 * instead of burying the streak under a wall of numbers.
 */

export interface CompleteProps {
  xp: number;
  correct: number;
  total: number;
  seconds: number;
  /** Gems awarded, for chest nodes. */
  gems?: number;
  streak: number;
  /** True when this session is what extended the streak. */
  streakExtended: boolean;
  xpToday: number;
  dailyGoal: number;
  onDone: () => void;
}

export function Complete({
  xp,
  correct,
  total,
  seconds,
  gems,
  streak,
  streakExtended,
  xpToday,
  dailyGoal,
  onDone,
}: CompleteProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const accuracy = total ? Math.round((correct / total) * 100) : 100;
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const goalMet = xpToday >= dailyGoal;

  useEffect(() => {
    sfxReward();
  }, []);

  useEffect(() => {
    if (step === 2 && streakExtended) sfxStreak();
  }, [step, streakExtended]);

  const next = () => {
    if (step === 0) setStep(1);
    else if (step === 1 && streakExtended) setStep(2);
    else onDone();
  };

  return (
    <div className="app">
      <div className="page center" style={{ paddingTop: 'calc(var(--sat) + 20px)' }}>
        {step === 0 && (
          <div className="col center pop" style={{ gap: 20, width: '100%' }}>
            <Mascot mood="cheer" size={150} idle />
            <div className="h1" style={{ color: 'var(--gold-ink)', textAlign: 'center' }}>
              ግሩም! Lesson complete
            </div>

            <div className="row" style={{ gap: 10, width: '100%' }}>
              <StatTile label="Total XP" value={<><CountUp to={xp} /></>} tone="gold" icon="⚡" />
              <StatTile
                label={accuracy >= 90 ? 'Amazing' : accuracy >= 70 ? 'Good' : 'Keep going'}
                value={`${accuracy}%`}
                tone="green"
                icon="🎯"
              />
              <StatTile label="Speedy" value={mmss} tone="blue" icon="⏱️" />
            </div>

            {gems ? (
              <div
                className="row pop"
                style={{
                  gap: 8,
                  padding: '12px 18px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--blue-soft)',
                  color: 'var(--blue-ink)',
                  fontWeight: 800,
                }}
              >
                <span style={{ fontSize: 22 }}>💎</span> +{gems} gems
              </div>
            ) : null}
          </div>
        )}

        {step === 1 && (
          <div className="col center pop" style={{ gap: 18, width: '100%' }}>
            <div style={{ fontSize: 60 }}>{goalMet ? '🏅' : '⚡'}</div>
            <div className="h1" style={{ textAlign: 'center' }}>
              {goalMet ? 'Daily goal reached' : 'Daily goal'}
            </div>
            <div className="col" style={{ gap: 8, width: '100%' }}>
              <Bar value={xpToday / dailyGoal} tone="gold" height={20} />
              <div className="row">
                <div className="small muted grow">{Math.min(xpToday, dailyGoal)} / {dailyGoal} XP today</div>
                {goalMet && <div className="small" style={{ color: 'var(--gold-ink)' }}>Complete</div>}
              </div>
            </div>
            <Mascot mood={goalMet ? 'cheer' : 'happy'} size={110} />
          </div>
        )}

        {step === 2 && (
          <div className="col center pop" style={{ gap: 16, width: '100%' }}>
            <div style={{ fontSize: 76 }}>🔥</div>
            <div className="h1" style={{ color: 'var(--gold-ink)', fontSize: 46 }}>
              <CountUp to={streak} />
            </div>
            <div className="h2" style={{ textAlign: 'center' }}>
              {streak === 1 ? 'Day one. ጽቡቕ ጅማሮ!' : `${streak} day streak`}
            </div>
            <div className="small muted" style={{ textAlign: 'center', maxWidth: 280 }}>
              {streak === 1
                ? 'Come back tomorrow to keep it alive.'
                : 'Practise tomorrow to keep it going.'}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 'none',
          padding: '14px max(var(--gutter), var(--sal)) calc(var(--sab) + 14px)',
          borderTop: '2px solid var(--line-2)',
        }}
      >
        <Btn onClick={next}>Continue</Btn>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone: 'gold' | 'green' | 'blue';
  icon: string;
}) {
  return (
    <div
      className="grow col"
      style={{
        borderRadius: 'var(--r-md)',
        background: `var(--${tone})`,
        padding: 2,
        boxShadow: `0 3px 0 var(--${tone}-ink)`,
      }}
    >
      <div className="tiny upper center" style={{ color: '#fff', padding: '5px 0 4px' }}>
        {label}
      </div>
      <div
        className="center col"
        style={{
          background: 'var(--surface)',
          borderRadius: 'calc(var(--r-md) - 2px)',
          padding: '9px 4px',
          gap: 1,
        }}
      >
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: `var(--${tone}-ink)` }}>{value}</span>
      </div>
    </div>
  );
}

/** Standalone chest-opening screen for reward nodes. */
export function ChestScreen({ gems, onDone }: { gems: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <div className="page center col" style={{ gap: 22 }}>
        <button
          onClick={() => {
            if (open) return;
            setOpen(true);
            sfxReward();
          }}
          className={open ? 'pop' : 'bob'}
          style={{ fontSize: 110, lineHeight: 1 }}
          aria-label={open ? 'Chest opened' : 'Tap to open the chest'}
        >
          {open ? '🎉' : '🎁'}
        </button>
        {open ? (
          <div className="col center pop" style={{ gap: 8 }}>
            <div className="h1" style={{ color: 'var(--blue)' }}>+<CountUp to={gems} /> 💎</div>
            <div className="small muted">Spend them on heart refills and streak freezes.</div>
          </div>
        ) : (
          <div className="h2 muted">Tap to open</div>
        )}
      </div>
      <div
        style={{
          flex: 'none',
          padding: '14px max(var(--gutter), var(--sal)) calc(var(--sab) + 14px)',
        }}
      >
        <Btn onClick={onDone} disabled={!open}>Collect</Btn>
      </div>
    </div>
  );
}
