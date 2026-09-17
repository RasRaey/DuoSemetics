import { useCallback, useEffect, useMemo, useState } from 'react';
import { NODE_BY_ID, NODE_ORDER, UNITS, nodeWordIds } from '../data/curriculum';
import { review as srsReview, type WordState } from './srs';

/**
 * All learner state, persisted to localStorage.
 *
 * One object, one key, one version number — migrations are a plain switch in
 * `migrate`, which keeps the app usable across schema changes instead of
 * silently resetting someone's streak.
 */

const KEY = 'duosemetics.progress.v1';
const VERSION = 1;

export const MAX_HEARTS = 5;
/** Minutes to regenerate one heart. */
export const HEART_REGEN_MIN = 30;
/** Gems it costs to refill hearts from the shop. */
export const REFILL_COST = 350;

export interface NodeState {
  /** Times this node has been completed. Drives the crown level. */
  completed: number;
  /** 0–5, matching Duolingo-style crowns. */
  crown: number;
  lastPlayed: number;
}

export interface Settings {
  sound: boolean;
  /** Show Latin transliteration under Ge'ez text. */
  translit: boolean;
  theme: 'system' | 'light' | 'dark';
  reduceMotion: boolean;
  /** Daily XP target. */
  dailyGoal: number;
  /** Hearts off — for learners who find them stressful. */
  unlimitedHearts: boolean;
}

export interface Progress {
  version: number;
  name: string;
  avatar: string;
  joined: number;

  xp: number;
  gems: number;
  hearts: number;
  /** Epoch ms the heart counter was last settled. */
  heartsAt: number;

  streak: number;
  /** YYYY-MM-DD of the last day a goal-counting session happened. */
  lastDay: string | null;
  bestStreak: number;
  freezes: number;

  /** XP earned per day, keyed YYYY-MM-DD. Keeps the last 60 days. */
  xpByDay: Record<string, number>;

  nodes: Record<string, NodeState>;
  srs: Record<string, WordState>;
  /** Word ids the learner has got wrong and not yet re-earned. */
  mistakes: string[];

  settings: Settings;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return todayKey(y);
}

export function initialProgress(): Progress {
  return {
    version: VERSION,
    name: 'Learner',
    avatar: '🦁',
    joined: Date.now(),
    xp: 0,
    gems: 50,
    hearts: MAX_HEARTS,
    heartsAt: Date.now(),
    streak: 0,
    lastDay: null,
    bestStreak: 0,
    freezes: 0,
    xpByDay: {},
    nodes: {},
    srs: {},
    mistakes: [],
    settings: {
      sound: true,
      translit: true,
      theme: 'system',
      reduceMotion: false,
      dailyGoal: 30,
      unlimitedHearts: false,
    },
  };
}

function migrate(raw: unknown): Progress {
  const base = initialProgress();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<Progress>;
  // Merge field-by-field so a stored object from an older build keeps whatever
  // it does have and picks up defaults for anything new.
  return {
    ...base,
    ...p,
    version: VERSION,
    settings: { ...base.settings, ...(p.settings ?? {}) },
    nodes: p.nodes ?? {},
    srs: p.srs ?? {},
    mistakes: p.mistakes ?? [],
    xpByDay: p.xpByDay ?? {},
  };
}

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialProgress();
    return settleHearts(migrate(JSON.parse(raw)));
  } catch {
    // Private mode, cleared storage, or corrupt JSON — start fresh rather than
    // leaving the app unusable.
    return initialProgress();
  }
}

export function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Quota or blocked storage: the session still works, it just won't persist.
  }
}

/** Apply offline heart regeneration. Pure — returns a new object when it changes. */
export function settleHearts(p: Progress, now = Date.now()): Progress {
  if (p.hearts >= MAX_HEARTS) return p.heartsAt === now ? p : { ...p, heartsAt: now };
  const elapsedMin = (now - p.heartsAt) / 60000;
  const gained = Math.floor(elapsedMin / HEART_REGEN_MIN);
  if (gained <= 0) return p;
  const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
  const heartsAt = hearts >= MAX_HEARTS ? now : p.heartsAt + gained * HEART_REGEN_MIN * 60000;
  return { ...p, hearts, heartsAt };
}

/** Milliseconds until the next heart, or null when full. */
export function msToNextHeart(p: Progress, now = Date.now()): number | null {
  if (p.hearts >= MAX_HEARTS) return null;
  return Math.max(0, p.heartsAt + HEART_REGEN_MIN * 60000 - now);
}

// ─── Derived progress ────────────────────────────────────────────────────

/** A node is unlocked once the one before it in the path is complete. */
export function isUnlocked(p: Progress, nodeId: string): boolean {
  const i = NODE_ORDER.indexOf(nodeId);
  if (i <= 0) return true;
  return (p.nodes[NODE_ORDER[i - 1]]?.completed ?? 0) > 0;
}

export function isComplete(p: Progress, nodeId: string): boolean {
  return (p.nodes[nodeId]?.completed ?? 0) > 0;
}

/** The furthest unlocked-but-unfinished node — where the path scrolls to. */
export function currentNodeId(p: Progress): string {
  return NODE_ORDER.find((id) => !isComplete(p, id)) ?? NODE_ORDER[NODE_ORDER.length - 1];
}

export function unitProgress(p: Progress, unitId: string): { done: number; total: number } {
  const unit = UNITS.find((u) => u.id === unitId);
  if (!unit) return { done: 0, total: 0 };
  return {
    done: unit.nodes.filter((n) => isComplete(p, n.id)).length,
    total: unit.nodes.length,
  };
}

/** Every word the learner has been taught so far. */
export function knownWordIds(p: Progress): string[] {
  const out = new Set<string>();
  for (const id of NODE_ORDER) {
    if (!isComplete(p, id)) break;
    nodeWordIds(NODE_BY_ID[id]).forEach((w) => out.add(w));
  }
  // Words from a node in progress count too, once they've been answered.
  Object.keys(p.srs).forEach((w) => out.add(w));
  return [...out];
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function spendHeart(p: Progress): Progress {
  if (p.settings.unlimitedHearts) return p;
  const hearts = Math.max(0, p.hearts - 1);
  // Start the regen clock the moment the first heart is lost.
  const heartsAt = p.hearts >= MAX_HEARTS ? Date.now() : p.heartsAt;
  return { ...p, hearts, heartsAt };
}

export function refillHearts(p: Progress, payGems: boolean): Progress {
  if (payGems && p.gems < REFILL_COST) return p;
  return {
    ...p,
    hearts: MAX_HEARTS,
    heartsAt: Date.now(),
    gems: payGems ? p.gems - REFILL_COST : p.gems,
  };
}

export function recordAnswer(p: Progress, wordIds: string[], correct: boolean): Progress {
  if (!wordIds.length) return p;
  const srs = { ...p.srs };
  const now = Date.now();
  for (const id of wordIds) srs[id] = srsReview(srs[id], correct, now);

  let mistakes = p.mistakes;
  if (!correct) {
    mistakes = [...new Set([...mistakes, ...wordIds])].slice(-60);
  } else {
    // Getting it right twice in a row clears it from the mistakes list.
    const cleared = wordIds.filter((id) => (srs[id]?.strength ?? 0) >= 3);
    if (cleared.length) mistakes = mistakes.filter((id) => !cleared.includes(id));
  }
  return { ...p, srs, mistakes };
}

export interface SessionResult {
  nodeId: string | null;
  xp: number;
  correct: number;
  total: number;
  /** Seconds the lesson took. */
  seconds: number;
  gems?: number;
}

/** Roll a finished lesson into streak, XP, gems and the node's crown. */
export function completeSession(p: Progress, r: SessionResult): Progress {
  const day = todayKey();
  const next: Progress = { ...p };

  // Streak: only advances once per day, and a missed day either burns a freeze
  // or resets to 1.
  if (next.lastDay !== day) {
    if (next.lastDay === yesterdayKey() || next.lastDay === null) {
      next.streak = next.streak + 1;
    } else if (next.freezes > 0) {
      next.freezes -= 1;
      next.streak = next.streak + 1;
    } else {
      next.streak = 1;
    }
    next.lastDay = day;
    next.bestStreak = Math.max(next.bestStreak, next.streak);
  }

  next.xp = p.xp + r.xp;
  next.gems = p.gems + (r.gems ?? 0);

  const xpByDay = { ...p.xpByDay, [day]: (p.xpByDay[day] ?? 0) + r.xp };
  // Keep the map from growing without bound.
  const keys = Object.keys(xpByDay).sort();
  next.xpByDay = Object.fromEntries(keys.slice(-60).map((k) => [k, xpByDay[k]]));

  if (r.nodeId) {
    const prev = p.nodes[r.nodeId] ?? { completed: 0, crown: 0, lastPlayed: 0 };
    next.nodes = {
      ...p.nodes,
      [r.nodeId]: {
        completed: prev.completed + 1,
        crown: Math.min(5, prev.crown + 1),
        lastPlayed: Date.now(),
      },
    };
  }
  return next;
}

/** XP for a finished lesson, with the same shape of bonuses a course app uses. */
export function scoreSession(correct: number, total: number, seconds: number, base = 10): number {
  let xp = base;
  if (total > 0 && correct === total) xp += 5; // flawless
  if (seconds > 0 && seconds < total * 8) xp += 3; // quick
  return xp;
}

// ─── React binding ───────────────────────────────────────────────────────

export interface Store {
  p: Progress;
  set: (fn: (p: Progress) => Progress) => void;
  reset: () => void;
}

export function useProgress(): Store {
  const [p, setP] = useState<Progress>(() => load());

  const set = useCallback((fn: (prev: Progress) => Progress) => {
    setP((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = initialProgress();
    save(fresh);
    setP(fresh);
  }, []);

  // Settle heart regeneration on mount, on a timer, and whenever the app comes
  // back to the foreground (iOS suspends timers in background tabs).
  useEffect(() => {
    const tick = () => setP((prev) => {
      const next = settleHearts(prev);
      if (next !== prev) save(next);
      return next;
    });
    const t = window.setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return useMemo(() => ({ p, set, reset }), [p, set, reset]);
}

// ─── Backup & restore ────────────────────────────────────────────────────

/**
 * Progress lives in localStorage, which is scoped to an origin. Moving the app
 * between origins — a LAN address to a hosted URL, say — leaves the old
 * progress behind, so it has to be carried across by hand.
 */

export interface Backup {
  app: 'duosemetics';
  version: number;
  exportedAt: string;
  progress: Progress;
}

export function exportProgress(p: Progress): string {
  const backup: Backup = {
    app: 'duosemetics',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    progress: p,
  };
  return JSON.stringify(backup, null, 2);
}

export interface ImportResult {
  ok: boolean;
  progress?: Progress;
  error?: string;
  /** A short human summary of what the backup holds, for the confirm step. */
  summary?: string;
}

/**
 * Parse and validate a backup. Deliberately strict about the envelope and
 * forgiving about the contents: `migrate` fills in anything a backup from an
 * older build is missing, so a valid-but-outdated file still restores.
 */
export function importProgress(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json.trim());
  } catch {
    return { ok: false, error: 'That does not look like a backup file — it is not valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'That backup is empty.' };
  }
  const b = parsed as Partial<Backup>;
  if (b.app !== 'duosemetics' || !b.progress) {
    return { ok: false, error: 'That is a JSON file, but not a DuoSemetics backup.' };
  }

  const progress = settleHearts(migrate(b.progress));
  const words = Object.keys(progress.srs).length;
  const lessons = Object.values(progress.nodes).reduce((n, s) => n + s.completed, 0);
  const when = b.exportedAt ? new Date(b.exportedAt).toLocaleDateString() : 'an unknown date';

  return {
    ok: true,
    progress,
    summary: `${progress.xp} XP · ${progress.streak} day streak · ${words} words · ${lessons} lessons · saved ${when}`,
  };
}
