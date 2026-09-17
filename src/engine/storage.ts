/**
 * Storage health.
 *
 * Progress lives in `localStorage`, and on iOS that is more fragile than it
 * looks. Three things bite, in rough order of likelihood:
 *
 *  1. **A Safari tab and a Home Screen app are different storage.** iOS gives an
 *     installed web app its own website-data store, so a lesson played in the
 *     Safari tab is invisible to the installed app and vice versa. This looks
 *     exactly like "it reset itself".
 *  2. **Eviction.** Safari clears script-writable storage for sites that have
 *     not been used for seven days, unless the site has been granted persistent
 *     storage.
 *  3. **Private browsing**, where writes either throw or vanish on close.
 *
 * None of these are bugs in the app, and all of them are indistinguishable from
 * one at the moment a learner opens it and sees zero. So the app measures what
 * it can and says so, rather than leaving someone to guess.
 */

const PROBE_KEY = 'duosemetics.probe';
const SAVED_AT_KEY = 'duosemetics.savedAt';

export interface StorageHealth {
  /** localStorage can be written and read back right now. */
  works: boolean;
  /**
   * The browser has promised not to evict this origin under storage pressure.
   * `null` when the browser does not implement the API, which is not a failure.
   */
  persisted: boolean | null;
  /** Bytes currently held by the progress record. */
  bytes: number;
  /** Running as an installed app rather than inside browser chrome. */
  standalone: boolean;
  /** Epoch ms of the last successful save, if one has been recorded. */
  savedAt: number | null;
  /** iOS or iPadOS, where the tab-versus-app split applies. */
  ios: boolean;
}

/** True when launched from the Home Screen rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS predates the standard and only exposes the non-standard flag.
  const legacy = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return legacy === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS reports as Macintosh, so touch points disambiguate it.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Write, read back and clean up — the only honest test of whether storage works. */
function probe(): boolean {
  try {
    const token = String(Date.now());
    localStorage.setItem(PROBE_KEY, token);
    const back = localStorage.getItem(PROBE_KEY);
    localStorage.removeItem(PROBE_KEY);
    return back === token;
  } catch {
    return false;
  }
}

export function noteSaved(): void {
  try {
    localStorage.setItem(SAVED_AT_KEY, String(Date.now()));
  } catch {
    // Already handled by save()'s own try/catch.
  }
}

export async function health(progressKey: string): Promise<StorageHealth> {
  let bytes = 0;
  let savedAt: number | null = null;
  try {
    bytes = localStorage.getItem(progressKey)?.length ?? 0;
    const raw = localStorage.getItem(SAVED_AT_KEY);
    savedAt = raw ? Number(raw) : null;
  } catch {
    // Left at the defaults; `works` below will report the real problem.
  }

  let persisted: boolean | null = null;
  try {
    if (navigator.storage?.persisted) persisted = await navigator.storage.persisted();
  } catch {
    persisted = null;
  }

  return {
    works: probe(),
    persisted,
    bytes,
    standalone: isStandalone(),
    savedAt,
    ios: isIOS(),
  };
}

/**
 * Ask the browser to keep this origin's data. Safari grants it silently to
 * sites the user has installed or engaged with, and refuses otherwise; either
 * way it costs nothing to ask and meaningfully reduces eviction risk.
 */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
