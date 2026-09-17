import { useCallback, useEffect, useMemo, useState } from 'react';
import { NODE_BY_ID, unitOfNode } from './data/curriculum';
import { generateLesson, generatePractice } from './engine/generator';
import type { Exercise } from './engine/types';
import {
  MAX_HEARTS,
  REFILL_COST,
  completeSession,
  currentNodeId,
  recordAnswer,
  refillHearts,
  scoreSession,
  spendHeart,
  todayKey,
  useProgress,
  type Settings,
} from './engine/store';
import { setSoundEnabled, unlockAudio } from './audio/sfx';
import { isIOS, isStandalone, requestPersistence } from './engine/storage';
import { Path } from './components/Path';
import { Lesson, type LessonOutcome } from './components/Lesson';
import { Complete, ChestScreen } from './components/Complete';
import { FidelBook } from './components/FidelBook';
import { Practice } from './components/Practice';
import { League } from './components/League';
import { Profile } from './components/Profile';
import { TopStats, Sheet, Btn, HeartRow } from './components/ui';
import { Mascot } from './components/Mascot';
import {
  IconFidel,
  IconHome,
  IconPerson,
  IconTarget,
  IconTrophy,
} from './components/icons';

type Tab = 'learn' | 'fidel' | 'practice' | 'league' | 'profile';

interface ActiveLesson {
  /** null for a free practice session, which doesn't advance the path. */
  nodeId: string | null;
  title: string;
  exercises: Exercise[];
}

interface Summary {
  xp: number;
  correct: number;
  total: number;
  seconds: number;
  gems?: number;
  streakExtended: boolean;
  heartEarned?: boolean;
}

type IconFn = (p: { size?: number; color?: string; filled?: boolean }) => React.ReactElement;

const TABS: { id: Tab; Icon: IconFn; label: string }[] = [
  { id: 'learn', Icon: IconHome, label: 'Learn' },
  { id: 'fidel', Icon: IconFidel, label: 'Fidel' },
  { id: 'practice', Icon: IconTarget, label: 'Practice' },
  { id: 'league', Icon: IconTrophy, label: 'League' },
  { id: 'profile', Icon: IconPerson, label: 'You' },
];

export default function App() {
  const { p, set, reset } = useProgress();
  const [tab, setTab] = useState<Tab>('learn');
  const [active, setActive] = useState<ActiveLesson | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chest, setChest] = useState<{ nodeId: string; gems: number } | null>(null);
  const [heartsSheet, setHeartsSheet] = useState(false);
  const [streakSheet, setStreakSheet] = useState(false);

  const current = useMemo(() => currentNodeId(p), [p]);

  // On iOS a Safari tab and an installed app keep *separate* storage, so
  // progress made in one is invisible to the other. That is the single most
  // likely reason someone finds their streak "reset", so say it up front.
  const showInstallHint =
    isIOS() && !isStandalone() && !p.settings.installHintSeen && !active && !summary;

  // ─── Global side effects ───────────────────────────────────────────────

  useEffect(() => {
    setSoundEnabled(p.settings.sound);
  }, [p.settings.sound]);

  useEffect(() => {
    const root = document.documentElement;
    if (p.settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', p.settings.theme);
  }, [p.settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-motion',
      p.settings.reduceMotion ? 'reduced' : 'full',
    );
  }, [p.settings.reduceMotion]);

  // Ask the browser to keep this origin's data rather than evicting it under
  // storage pressure. Refusal is fine; it costs nothing to ask.
  useEffect(() => {
    void requestPersistence();
  }, []);

  // iOS blocks the audio context until the page has been touched once.
  useEffect(() => {
    const go = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', go);
    };
    window.addEventListener('pointerdown', go, { once: true });
    return () => window.removeEventListener('pointerdown', go);
  }, []);

  // ─── Starting sessions ─────────────────────────────────────────────────

  const startNode = useCallback(
    (nodeId: string) => {
      const node = NODE_BY_ID[nodeId];
      if (!node) return;

      if (node.kind === 'chest') {
        setChest({ nodeId, gems: node.gems ?? 10 });
        return;
      }
      if (!p.settings.unlimitedHearts && p.hearts <= 0) {
        setHeartsSheet(true);
        return;
      }
      const attempt = p.nodes[nodeId]?.completed ?? 0;
      const exercises = generateLesson(nodeId, { attempt });
      if (!exercises.length) return;
      setActive({ nodeId, title: node.title, exercises });
    },
    [p.hearts, p.nodes, p.settings.unlimitedHearts],
  );

  const startPractice = useCallback(
    (wordIds: string[], label: string) => {
      if (!wordIds.length) return;
      const exercises = generatePractice(wordIds, `${label}:${Date.now()}`);
      if (!exercises.length) return;
      // Practice never costs hearts — it is the way back from running out.
      setActive({ nodeId: null, title: label, exercises });
    },
    [],
  );

  // ─── Finishing a session ───────────────────────────────────────────────

  const finish = useCallback(
    (o: LessonOutcome) => {
      const lesson = active;
      setActive(null);
      if (!lesson) return;

      // A quit or a heart-out ends the session without credit, but the SRS
      // updates already applied stay — the learner did answer those.
      if (!o.completed) return;

      const isPractice = lesson.nodeId === null;
      const replay = lesson.nodeId ? (p.nodes[lesson.nodeId]?.completed ?? 0) > 0 : true;
      const base = isPractice ? 5 : replay ? 5 : 10;
      const xp = scoreSession(o.correct, o.total, o.seconds, base);
      const streakExtended = p.lastDay !== todayKey();

      // Finishing practice hands back one heart. That is what makes practice a
      // real way out of zero rather than just somewhere to pass the time.
      //
      // Read from this render's progress rather than from inside the updater:
      // React runs updaters after this function returns, so a flag set in there
      // would still be false by the time the summary is built.
      const heartEarned =
        isPractice && !p.settings.unlimitedHearts && p.hearts < MAX_HEARTS;

      set((prev) => {
        const next = completeSession(prev, {
          nodeId: lesson.nodeId,
          xp,
          correct: o.correct,
          total: o.total,
          seconds: o.seconds,
        });
        if (!heartEarned) return next;
        return {
          ...next,
          hearts: Math.min(MAX_HEARTS, next.hearts + 1),
          // Restart the regen clock so the free heart doesn't also bank time.
          heartsAt: Date.now(),
        };
      });
      setSummary({
        xp,
        correct: o.correct,
        total: o.total,
        seconds: o.seconds,
        streakExtended,
        heartEarned,
      });
    },
    [active, p.nodes, p.lastDay, p.hearts, p.settings.unlimitedHearts, set],
  );

  const collectChest = useCallback(() => {
    if (!chest) return;
    const streakExtended = p.lastDay !== todayKey();
    set((prev) =>
      completeSession(prev, {
        nodeId: chest.nodeId,
        xp: 5,
        correct: 1,
        total: 1,
        seconds: 0,
        gems: chest.gems,
      }),
    );
    setChest(null);
    setSummary({
      xp: 5,
      correct: 1,
      total: 1,
      seconds: 0,
      gems: chest.gems,
      streakExtended,
    });
  }, [chest, p.lastDay, set]);

  // ─── Screens ───────────────────────────────────────────────────────────

  if (chest) {
    return <ChestScreen gems={chest.gems} onDone={collectChest} />;
  }

  if (summary) {
    return (
      <Complete
        xp={summary.xp}
        correct={summary.correct}
        total={summary.total}
        seconds={summary.seconds}
        gems={summary.gems}
        heartEarned={summary.heartEarned}
        streak={p.streak}
        streakExtended={summary.streakExtended}
        xpToday={p.xpByDay[todayKey()] ?? 0}
        dailyGoal={p.settings.dailyGoal}
        onDone={() => setSummary(null)}
      />
    );
  }

  if (active) {
    return (
      <Lesson
        key={active.title + active.exercises.length}
        exercises={active.exercises}
        title={active.title}
        hearts={p.hearts}
        unlimitedHearts={p.settings.unlimitedHearts}
        autoContinue={p.settings.autoContinue}
        // Free practice has no node, and never spends hearts.
        costHearts={active.nodeId !== null}
        showTr={p.settings.translit}
        onAnswer={(ids, ok) => set((prev) => recordAnswer(prev, ids, ok))}
        onHeartLost={() => set(spendHeart)}
        onFinish={finish}
        onRefill={() => set((prev) => refillHearts(prev, true))}
        canRefill={p.gems >= REFILL_COST}
        onPracticeInstead={
          active.nodeId === null
            ? undefined
            : () => {
                setActive(null);
                setTab('practice');
              }
        }
      />
    );
  }

  // ─── Main tabs ─────────────────────────────────────────────────────────

  const unit = unitOfNode[current];

  return (
    <div className="app">
      {tab !== 'profile' && (
        <TopStats
          streak={p.streak}
          gems={p.gems}
          hearts={p.hearts}
          unlimited={p.settings.unlimitedHearts}
          onHearts={() => setHeartsSheet(true)}
          onStreak={() => setStreakSheet(true)}
          onGems={() => setTab('profile')}
        />
      )}

      {tab === 'learn' && <Path p={p} currentId={current} onStart={startNode} />}
      {tab === 'fidel' && <FidelBook />}
      {tab === 'practice' && <Practice p={p} onPractice={startPractice} />}
      {tab === 'league' && <League p={p} />}
      {tab === 'profile' && (
        <Profile
          p={p}
          onRefill={() => set((prev) => refillHearts(prev, true))}
          onBuyFreeze={() =>
            set((prev) =>
              prev.gems >= 200 && prev.freezes < 2
                ? { ...prev, gems: prev.gems - 200, freezes: prev.freezes + 1 }
                : prev,
            )
          }
          onSettings={(patch: Partial<Settings>) =>
            set((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
          }
          onRename={(name, avatar) => set((prev) => ({ ...prev, name, avatar }))}
          onReset={reset}
          onRestore={(restored) => set(() => restored)}
        />
      )}

      <nav className="tabbar">
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={tab === id ? 'on' : ''}
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
          >
            <span className="ico">
              <Icon size={25} filled={tab === id} />
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* ─── Quick-look sheets ──────────────────────────────────────────── */}
      <Sheet open={heartsSheet} onClose={() => setHeartsSheet(false)}>
        <div className="col center" style={{ gap: 13, paddingBottom: 6 }}>
          <HeartRow hearts={p.settings.unlimitedHearts ? MAX_HEARTS : p.hearts} />
          <div className="h2">
            {p.settings.unlimitedHearts
              ? 'Unlimited hearts'
              : p.hearts > 0
                ? `${p.hearts} hearts left`
                : 'Out of hearts'}
          </div>
          <div className="small muted" style={{ textAlign: 'center', maxWidth: 290 }}>
            {p.settings.unlimitedHearts
              ? 'Mistakes won’t cost you anything. Switch this off in You → Settings for the full challenge.'
              : 'You lose a heart for each mistake. One comes back every 30 minutes, or practise old words to keep going for free.'}
          </div>
          {!p.settings.unlimitedHearts && p.hearts < MAX_HEARTS && (
            <Btn
              tone="gold"
              disabled={p.gems < REFILL_COST}
              onClick={() => {
                set((prev) => refillHearts(prev, true));
                setHeartsSheet(false);
              }}
            >
              💎 {REFILL_COST} · Refill now
            </Btn>
          )}
          <Btn
            tone="ghost"
            onClick={() => {
              setHeartsSheet(false);
              setTab('practice');
            }}
          >
            Practise instead
          </Btn>
        </div>
      </Sheet>

      <Sheet
        open={showInstallHint}
        onClose={() =>
          set((prev) => ({
            ...prev,
            settings: { ...prev.settings, installHintSeen: true },
          }))
        }
      >
        <div className="col" style={{ gap: 12, paddingBottom: 6 }}>
          <div className="row" style={{ gap: 12 }}>
            <Mascot mood="think" size={56} />
            <div className="h2 grow">Add this to your Home Screen</div>
          </div>
          <div className="small muted" style={{ lineHeight: 1.55 }}>
            You’re in a Safari tab. On iPhone an installed app gets its own
            storage, separate from Safari’s — so anything you learn here
            <strong> will not appear </strong> once you install it, and it can be
            cleared when Safari tidies up unused sites.
          </div>
          <div
            className="small"
            style={{
              background: 'var(--surface-2)',
              padding: '12px 15px',
              borderRadius: 'var(--r-md)',
              color: 'var(--ink-2)',
              lineHeight: 1.6,
            }}
          >
            Tap <strong>Share</strong> at the bottom of Safari, then{' '}
            <strong>Add to Home Screen</strong>. Open it from there from now on.
          </div>
          <Btn
            onClick={() =>
              set((prev) => ({
                ...prev,
                settings: { ...prev.settings, installHintSeen: true },
              }))
            }
          >
            Got it
          </Btn>
        </div>
      </Sheet>

      <Sheet open={streakSheet} onClose={() => setStreakSheet(false)}>
        <div className="col center" style={{ gap: 12, paddingBottom: 6 }}>
          <div style={{ fontSize: 56 }}>🔥</div>
          <div className="h1">{p.streak}</div>
          <div className="h3">{p.streak === 1 ? 'day streak' : 'day streak'}</div>
          <div className="small muted" style={{ textAlign: 'center', maxWidth: 290 }}>
            {p.lastDay === todayKey()
              ? 'You’ve already practised today — come back tomorrow to extend it.'
              : 'Finish any lesson today to keep your streak alive.'}
          </div>
          <div className="row" style={{ gap: 18, marginTop: 4 }}>
            <div className="col center">
              <span className="h2">{p.bestStreak}</span>
              <span className="tiny muted">best streak</span>
            </div>
            <div className="col center">
              <span className="h2">🧊 {p.freezes}</span>
              <span className="tiny muted">freezes</span>
            </div>
          </div>
          {unit && (
            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <Mascot mood="wave" size={48} />
              <div className="small muted">Up next: {unit.title} — {NODE_BY_ID[current]?.title}</div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
