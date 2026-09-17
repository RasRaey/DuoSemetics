import { useMemo } from 'react';
import { Rng } from '../engine/rng';
import { todayKey, type Progress } from '../engine/store';
import { Mascot } from './Mascot';

/**
 * Weekly league.
 *
 * The rival learners are generated locally from a seed derived from the week
 * number — there is no server here, and inventing one would mean pretending the
 * app has users it doesn't. What it does give is the real mechanic: a ranked
 * board that resets weekly, with promotion and relegation zones, which is what
 * makes a daily XP target feel like it is for something. The screen says
 * plainly that the rivals are practice opponents.
 */

const NAMES = [
  'Rahwa', 'Dawit', 'Senait', 'Yonas', 'Feven', 'Tesfay', 'Luwam', 'Abel',
  'Selam', 'Mehari', 'Winta', 'Haile', 'Saba', 'Nebiat', 'Eyob', 'Tsega',
  'Amanuel', 'Hiwet', 'Kidane', 'Mulu',
];
const AVATARS = ['🦁', '🐆', '🦅', '🐘', '🦒', '🐫', '🦌', '🐐', '🦊', '🐻'];

const TIERS = [
  { name: 'Bronze', icon: '🥉', color: 'gold' },
  { name: 'Silver', icon: '🥈', color: 'blue' },
  { name: 'Gold', icon: '🥇', color: 'gold' },
  { name: 'Sapphire', icon: '💠', color: 'blue' },
  { name: 'Ruby', icon: '♦️', color: 'red' },
] as const;

/** ISO-ish week key, so the board resets every Monday. */
function weekKey(d = new Date()): string {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return todayKey(t);
}

interface Row {
  name: string;
  avatar: string;
  xp: number;
  you: boolean;
}

export function League({ p }: { p: Progress }) {
  const week = weekKey();

  // XP earned since Monday is what ranks the learner.
  const weekXp = useMemo(() => {
    const start = week;
    return Object.entries(p.xpByDay)
      .filter(([d]) => d >= start)
      .reduce((n, [, v]) => n + v, 0);
  }, [p.xpByDay, week]);

  // Tier rises with lifetime XP, so the board grows with the learner.
  const tier = TIERS[Math.min(TIERS.length - 1, Math.floor(p.xp / 400))];

  const rows = useMemo<Row[]>(() => {
    const rng = new Rng(`league:${week}:${tier.name}`);
    const pool = rng.shuffle(NAMES).slice(0, 14);
    // Rivals cluster around a plausible weekly pace for the tier, so the board
    // is competitive rather than hopeless or trivial.
    const centre = 60 + TIERS.indexOf(tier) * 70;
    const others = pool.map((name, i) => ({
      name,
      avatar: AVATARS[rng.int(AVATARS.length)],
      xp: Math.max(0, Math.round(centre + (rng.next() - 0.45) * centre * 1.8 - i * 2)),
      you: false,
    }));
    return [...others, { name: p.name || 'You', avatar: p.avatar, xp: weekXp, you: true }].sort(
      (a, b) => b.xp - a.xp,
    );
  }, [week, tier, weekXp, p.name, p.avatar]);

  const myRank = rows.findIndex((r) => r.you) + 1;
  const promote = 5;
  const relegate = rows.length - 4;

  return (
    <div className="page page-pad-bottom">
      <header className="col center" style={{ padding: '20px 0 14px', gap: 6 }}>
        <div style={{ fontSize: 54 }}>{tier.icon}</div>
        <div className="h1">{tier.name} League</div>
        <div className="small muted" style={{ textAlign: 'center' }}>
          Top {promote} move up · bottom 4 move down · resets Monday
        </div>
      </header>

      <div
        className="row"
        style={{
          gap: 10,
          padding: '12px 14px',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)',
          marginBottom: 14,
        }}
      >
        <Mascot mood={myRank <= promote ? 'cheer' : 'think'} size={46} />
        <div className="col grow" style={{ gap: 1 }}>
          <span className="h3">
            {myRank <= promote
              ? `You’re #${myRank} — promotion zone`
              : myRank > relegate
                ? `You’re #${myRank} — earn XP to stay up`
                : `You’re #${myRank} this week`}
          </span>
          <span className="tiny muted">{weekXp} XP since Monday</span>
        </div>
      </div>

      <div className="col" style={{ gap: 4 }}>
        {rows.map((r, i) => {
          const rank = i + 1;
          const zone = rank <= promote ? 'up' : rank > relegate ? 'down' : '';
          return (
            <div
              key={`${r.name}-${i}`}
              className="row"
              style={{
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--r-sm)',
                background: r.you ? 'var(--green-soft)' : 'transparent',
                borderLeft: `4px solid ${
                  zone === 'up' ? 'var(--green)' : zone === 'down' ? 'var(--red)' : 'transparent'
                }`,
              }}
            >
              <span
                className="center"
                style={{
                  width: 24,
                  fontWeight: 900,
                  fontSize: 15,
                  color: zone === 'up' ? 'var(--green-ink)' : zone === 'down' ? 'var(--red-ink)' : 'var(--muted)',
                }}
              >
                {rank}
              </span>
              <span style={{ fontSize: 24 }}>{r.avatar}</span>
              <span className="grow h3" style={{ fontSize: 15 }}>
                {r.you ? `${r.name} (you)` : r.name}
              </span>
              <span className="small muted">{r.xp} XP</span>
            </div>
          );
        })}
      </div>

      <p className="tiny muted" style={{ marginTop: 18, textAlign: 'center', lineHeight: 1.5 }}>
        This board runs entirely on your device. The other learners are practice
        opponents generated for the week, not real people.
      </p>
    </div>
  );
}
