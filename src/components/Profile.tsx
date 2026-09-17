import { useMemo, useState } from 'react';
import {
  MAX_HEARTS,
  REFILL_COST,
  msToNextHeart,
  todayKey,
  type Progress,
  type Settings,
} from '../engine/store';
import { NODES } from '../data/curriculum';
import { WORDS } from '../data/lexicon';
import { Bar, Btn, HeartRow, Sheet } from './ui';
import { Mascot } from './Mascot';
import { isApproximate, supported as ttsSupported } from '../audio/speech';
import { sfxReward, sfxTap } from '../audio/sfx';

const FREEZE_COST = 200;

interface Props {
  p: Progress;
  onRefill: () => void;
  onBuyFreeze: () => void;
  onSettings: (patch: Partial<Settings>) => void;
  onRename: (name: string, avatar: string) => void;
  onReset: () => void;
}

/** Profile, shop and settings — everything that isn't learning. */
export function Profile({ p, onRefill, onBuyFreeze, onSettings, onRename, onReset }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [name, setName] = useState(p.name);
  const [avatar, setAvatar] = useState(p.avatar);

  const lessonsDone = Object.values(p.nodes).reduce((n, s) => n + s.completed, 0);
  const nodesDone = Object.keys(p.nodes).length;
  const wordsMet = Object.keys(p.srs).length;
  const xpToday = p.xpByDay[todayKey()] ?? 0;
  const nextHeart = msToNextHeart(p);

  const last7 = useMemo(() => {
    const out: { day: string; xp: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      out.push({ day: key, xp: p.xpByDay[key] ?? 0, label: 'SMTWTFS'[d.getDay()] });
    }
    return out;
  }, [p.xpByDay]);
  const peak = Math.max(20, ...last7.map((d) => d.xp));

  return (
    <div className="page page-pad-bottom">
      {/* ─── Identity ───────────────────────────────────────────────────── */}
      {/* This tab has no top bar of its own, so it owns the status-bar inset. */}
      <header
        className="col center"
        style={{ padding: 'calc(var(--sat) + 20px) 0 16px', gap: 8 }}
      >
        <button
          onClick={() => {
            sfxTap();
            setEditing(true);
          }}
          style={{ fontSize: 66, lineHeight: 1 }}
          aria-label="Change name and avatar"
        >
          {p.avatar}
        </button>
        <div className="h1">{p.name}</div>
        <div className="tiny muted">
          Learning Tigrinya since {new Date(p.joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </header>

      {/* ─── Headline stats ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        <Stat icon="🔥" value={p.streak} label={`day streak${p.bestStreak > p.streak ? ` · best ${p.bestStreak}` : ''}`} />
        <Stat icon="⚡" value={p.xp} label="total XP" />
        <Stat icon="📖" value={wordsMet} label={`of ${WORDS.length} words`} />
        <Stat icon="🏁" value={`${nodesDone}/${NODES.length}`} label="path complete" />
      </div>

      {/* ─── This week ──────────────────────────────────────────────────── */}
      <h3 className="h3" style={{ marginBottom: 8 }}>This week</h3>
      <div
        className="row"
        style={{ gap: 6, alignItems: 'flex-end', height: 96, marginBottom: 8 }}
      >
        {last7.map((d, i) => (
          <div key={d.day} className="col grow center" style={{ gap: 5, height: '100%', justifyContent: 'flex-end' }}>
            <span className="tiny muted" style={{ fontSize: 10 }}>{d.xp || ''}</span>
            <div
              style={{
                width: '100%',
                height: `${Math.max(4, (d.xp / peak) * 62)}px`,
                borderRadius: 6,
                background: i === 6 ? 'var(--green)' : d.xp ? 'var(--green-soft)' : 'var(--line-2)',
                transition: 'height 0.4s ease',
              }}
            />
            <span className="tiny muted">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="col" style={{ gap: 5, marginBottom: 24 }}>
        <Bar value={xpToday / p.settings.dailyGoal} tone="gold" height={12} />
        <div className="tiny muted">{xpToday} / {p.settings.dailyGoal} XP today</div>
      </div>

      {/* ─── Shop ───────────────────────────────────────────────────────── */}
      <h3 className="h3" style={{ marginBottom: 8 }}>Shop · 💎 {p.gems}</h3>
      <div className="col" style={{ gap: 10, marginBottom: 24 }}>
        <ShopRow
          icon="❤️"
          title="Refill hearts"
          sub={
            p.settings.unlimitedHearts
              ? 'You have unlimited hearts switched on'
              : p.hearts >= MAX_HEARTS
                ? 'Your hearts are already full'
                : nextHeart !== null
                  ? `Next heart free in ${Math.ceil(nextHeart / 60000)} min`
                  : ''
          }
          cost={REFILL_COST}
          affordable={p.gems >= REFILL_COST}
          disabled={p.settings.unlimitedHearts || p.hearts >= MAX_HEARTS}
          onBuy={onRefill}
          extra={!p.settings.unlimitedHearts && <HeartRow hearts={p.hearts} />}
        />
        <ShopRow
          icon="🧊"
          title="Streak freeze"
          sub={`Covers one missed day · you have ${p.freezes}`}
          cost={FREEZE_COST}
          affordable={p.gems >= FREEZE_COST}
          disabled={p.freezes >= 2}
          onBuy={() => {
            sfxReward();
            onBuyFreeze();
          }}
        />
      </div>

      {/* ─── Settings ───────────────────────────────────────────────────── */}
      <h3 className="h3" style={{ marginBottom: 8 }}>Settings</h3>
      <div className="col" style={{ gap: 2, marginBottom: 20 }}>
        <Toggle
          label="Sound effects"
          on={p.settings.sound}
          onChange={(v) => onSettings({ sound: v })}
        />
        <Toggle
          label="Show transliteration"
          sub="Latin spelling under Ge’ez text"
          on={p.settings.translit}
          onChange={(v) => onSettings({ translit: v })}
        />
        <Toggle
          label="Unlimited hearts"
          sub="Practise without losing hearts for mistakes"
          on={p.settings.unlimitedHearts}
          onChange={(v) => onSettings({ unlimitedHearts: v })}
        />
        <Toggle
          label="Reduce motion"
          on={p.settings.reduceMotion}
          onChange={(v) => onSettings({ reduceMotion: v })}
        />

        <Row label="Theme">
          <div className="row" style={{ gap: 5 }}>
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  sfxTap();
                  onSettings({ theme: t });
                }}
                style={{
                  padding: '6px 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  background: p.settings.theme === t ? 'var(--green)' : 'var(--surface-2)',
                  color: p.settings.theme === t ? '#fff' : 'var(--muted)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Daily goal">
          <div className="row" style={{ gap: 5 }}>
            {[10, 20, 30, 50].map((g) => (
              <button
                key={g}
                onClick={() => {
                  sfxTap();
                  onSettings({ dailyGoal: g });
                }}
                style={{
                  padding: '6px 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  background: p.settings.dailyGoal === g ? 'var(--gold)' : 'var(--surface-2)',
                  color: p.settings.dailyGoal === g ? 'var(--ink)' : 'var(--muted)',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </Row>
      </div>

      {/* ─── Audio honesty note ─────────────────────────────────────────── */}
      <div
        className="col"
        style={{
          gap: 6,
          padding: '13px 15px',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)',
          marginBottom: 20,
        }}
      >
        <div className="h3" style={{ fontSize: 14 }}>About the audio</div>
        <div className="tiny muted" style={{ lineHeight: 1.55 }}>
          {!ttsSupported()
            ? 'This device has no Tigrinya or Amharic speech voice, so listening exercises fall back to reading the transliteration. Nothing is played rather than playing the wrong language.'
            : isApproximate()
              ? 'No Tigrinya speech voice exists on this device, so audio uses the Amharic voice. It shares the Ge’ez script and most consonants, but some sounds and the rhythm will be off — treat it as a guide, not a model accent.'
              : 'Using this device’s Tigrinya speech voice.'}
        </div>
      </div>

      <Btn tone="quiet" onClick={() => setConfirmReset(true)}>Reset all progress</Btn>
      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        {lessonsDone} lessons finished · everything is stored on this device only
      </p>

      {/* ─── Sheets ─────────────────────────────────────────────────────── */}
      <Sheet open={editing} onClose={() => setEditing(false)}>
        <div className="col" style={{ gap: 14, paddingBottom: 6 }}>
          <div className="h2">Your profile</div>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
            {['🦁', '🐆', '🦅', '🐘', '🦒', '🐫', '🦊', '🌟', '☕', '⛰️'].map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                style={{
                  fontSize: 30,
                  padding: 7,
                  borderRadius: 12,
                  background: avatar === a ? 'var(--green-soft)' : 'transparent',
                  border: `2px solid ${avatar === a ? 'var(--green)' : 'transparent'}`,
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Your name"
            style={{
              padding: 13,
              fontSize: 16,
              fontWeight: 700,
              background: 'var(--surface-2)',
              border: '2px solid var(--line)',
              borderRadius: 'var(--r-md)',
              outline: 'none',
            }}
          />
          <Btn
            onClick={() => {
              onRename(name.trim() || 'Learner', avatar);
              setEditing(false);
            }}
          >
            Save
          </Btn>
        </div>
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="col center" style={{ gap: 14, paddingBottom: 6 }}>
          <Mascot mood="sad" size={90} />
          <div className="h2">Reset everything?</div>
          <div className="small muted" style={{ textAlign: 'center' }}>
            Your streak, XP, gems and every word’s strength will be cleared. This can’t be undone.
          </div>
          <Btn
            tone="red"
            onClick={() => {
              onReset();
              setConfirmReset(false);
            }}
          >
            Yes, reset
          </Btn>
          <Btn tone="quiet" onClick={() => setConfirmReset(false)}>Keep my progress</Btn>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: React.ReactNode; label: string }) {
  return (
    <div className="card row" style={{ gap: 11, padding: '13px 14px', borderBottomWidth: 2 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div className="col" style={{ gap: 0, minWidth: 0 }}>
        <span className="h3" style={{ fontSize: 19 }}>{value}</span>
        <span className="tiny muted" style={{ fontSize: 11 }}>{label}</span>
      </div>
    </div>
  );
}

function ShopRow({
  icon,
  title,
  sub,
  cost,
  affordable,
  disabled,
  onBuy,
  extra,
}: {
  icon: string;
  title: string;
  sub: string;
  cost: number;
  affordable: boolean;
  disabled?: boolean;
  onBuy: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="card row" style={{ gap: 13, padding: '13px 14px', opacity: disabled ? 0.55 : 1 }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="h3" style={{ fontSize: 15 }}>{title}</span>
        {sub && <span className="tiny muted">{sub}</span>}
        {extra}
      </div>
      <button
        disabled={disabled || !affordable}
        onClick={onBuy}
        style={{
          flex: 'none',
          padding: '8px 13px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 900,
          color: disabled || !affordable ? 'var(--locked-ink)' : '#fff',
          background: disabled || !affordable ? 'var(--line)' : 'var(--blue)',
          boxShadow: disabled || !affordable ? 'none' : '0 3px 0 var(--blue-ink)',
        }}
      >
        💎 {cost}
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row" style={{ padding: '12px 2px', borderBottom: '2px solid var(--line-2)' }}>
      <span className="grow h3" style={{ fontSize: 15 }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => {
        sfxTap();
        onChange(!on);
      }}
      className="row"
      style={{
        padding: '12px 2px',
        borderBottom: '2px solid var(--line-2)',
        textAlign: 'left',
        width: '100%',
      }}
      role="switch"
      aria-checked={on}
    >
      <div className="col grow" style={{ gap: 1 }}>
        <span className="h3" style={{ fontSize: 15 }}>{label}</span>
        {sub && <span className="tiny muted">{sub}</span>}
      </div>
      <span
        style={{
          flex: 'none',
          width: 48,
          height: 29,
          borderRadius: 999,
          background: on ? 'var(--green)' : 'var(--line)',
          position: 'relative',
          transition: 'background 0.18s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 22 : 3,
            width: 23,
            height: 23,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.18s cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
        />
      </span>
    </button>
  );
}
