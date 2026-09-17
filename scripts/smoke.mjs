/**
 * End-to-end smoke test at iPhone 15 Pro Max size.
 *
 * Plays a real lesson from the path to the streak screen, visits every tab, and
 * fails on any runtime error. Screenshots land in `shots/`.
 *
 *   npm run build && node scripts/smoke.mjs
 */

import { globSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium, devices } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'shots');
const PORT = 4178;
/**
 * Which Chromium to drive.
 *
 * In CI, Playwright installs and finds its own, so nothing is passed. In a
 * sandbox that pre-installs one at a fixed path, point at it rather than
 * downloading a second copy. An empty CHROME_PATH counts as unset.
 */
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const preinstalled = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome');
  return preinstalled[0];
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

/** Static server for dist/, falling back to index.html. */
function serve() {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      let file = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      } catch {
        file = join(DIST, 'index.html');
      }
      try {
        res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(await readFile(file));
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    s.listen(PORT, () => ok(s));
  });
}

/** iPhone 15 Pro Max: 430x932 CSS px at DPR 3. */
const PHONE = {
  ...devices['iPhone 13 Pro Max'],
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
};

const server = await serve();
await mkdir(SHOTS, { recursive: true });

const exe = chromePath();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  // A blocked CDN (the Google Fonts stylesheet) is an environment problem, not
  // an app bug — the Ge'ez text falls back to a system face either way.
  if (/ERR_CERT|ERR_FAILED|ERR_NAME_NOT_RESOLVED|fonts\.googleapis/.test(m.text())) return;
  errors.push(`console: ${m.text()}`);
});

const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
  console.log(`  📸 ${name}`);
};

console.log('▸ opening the path');
await page.goto(`http://localhost:${PORT}/?e2e=1`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('01-path');

/**
 * Plays one lesson to its summary screen, then clicks through the reward
 * sequence back to the path.
 *
 * `shotPrefix` is set for the first lesson only — the second run exists to
 * cover exercise types the opening lesson doesn't contain (word banks, typed
 * answers, fill-in-the-blank), not to produce more screenshots.
 */
async function playLesson(nodeName, shotPrefix) {
  await page.getByRole('button', { name: nodeName }).first().click();
  await page.waitForTimeout(400);
  if (shotPrefix) await shot(`${shotPrefix}-node-sheet`);
  await page.getByRole('button', { name: /Start|Practice again/ }).click();
  await page.waitForTimeout(500);
  if (shotPrefix) await shot('03-lesson');

  const seen = new Set();
  let steps = 0;
  let feedbackShot = false;
  let matchShot = false;

  while (steps++ < 90) {
    if (await page.getByText('Lesson complete').count()) break;

    const kind = await page.evaluate(() => window.__e2e?.type ?? null);
    if (!kind) throw new Error('test hook missing — is ?e2e=1 set?');
    seen.add(kind);

    if (kind === 'match_pairs') {
      if (shotPrefix && !matchShot) {
        await shot('06-match');
        matchShot = true;
      }
      const pairs = await page.evaluate(() => window.__e2e.pairs);
      for (const pair of pairs) {
        await page.getByText(pair.ti, { exact: true }).first().click();
        await page.waitForTimeout(90);
        await page.getByText(pair.en, { exact: true }).first().click();
        await page.waitForTimeout(160);
      }
      await page.waitForTimeout(600);
      continue;
    }

    // solve() sets the same React state a tap or a keystroke would, so the
    // textarea and the option tiles both pick it up.
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(160);

    const check = page.getByRole('button', { name: 'Check' });
    if (await check.isDisabled()) throw new Error(`Check stayed disabled for ${kind}`);
    await check.click();
    await page.waitForTimeout(260);

    // Every exercise is answered correctly, so any "Not quite" is a grading bug.
    if (await page.getByText('Not quite').count()) {
      throw new Error(`${kind} marked a known-correct answer wrong`);
    }

    if (shotPrefix && !feedbackShot) {
      await shot('05-feedback');
      feedbackShot = true;
    }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(220);
  }

  if (!(await page.getByText('Lesson complete').count())) {
    throw new Error(`lesson never finished (stopped after ${steps} steps)`);
  }
  console.log(`  finished in ${steps} steps · types: ${[...seen].sort().join(', ')}`);

  await page.waitForTimeout(600);
  if (shotPrefix) await shot('07-complete');

  // Click through however many reward screens this session earned.
  for (let i = 0; i < 4; i++) {
    const next = page.getByRole('button', { name: 'Continue' });
    if (!(await next.count())) break;
    if (shotPrefix && i < 2) await shot(i === 0 ? '08-goal' : '09-streak');
    await next.click();
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(400);
  return seen;
}

console.log('▸ lesson 1: Hello');
await playLesson(/^Hello/, '02');
await shot('10-path-after');

// The opening lesson is all multiple choice. The second introduces sentences,
// which is where word banks, typed answers and gap-fills live.
console.log('▸ lesson 2: How are you?');
const seen2 = await playLesson(/^How are you\?/, null);
for (const required of ['translate_bank', 'translate_type']) {
  if (!seen2.has(required)) {
    throw new Error(`lesson 2 never produced a ${required} exercise`);
  }
}

console.log('▸ visiting the other tabs');
for (const [tab, name] of [
  ['Fidel', '11-fidel'],
  ['Practice', '12-practice'],
  ['League', '13-league'],
  ['You', '14-profile'],
]) {
  await page.getByRole('button', { name: new RegExp(`${tab}$`) }).click();
  await page.waitForTimeout(500);
  await shot(name);
}

console.log('▸ checking progress survives a reload');
await page.getByRole('button', { name: /Learn$/ }).click();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const xpKept = await page.evaluate(() => {
  const raw = localStorage.getItem('duosemetics.progress.v1');
  return raw ? JSON.parse(raw).xp : 0;
});
if (!xpKept) throw new Error('XP did not persist across a reload');
console.log(`  stored XP after reload: ${xpKept}`);

console.log('▸ dark mode');
const darkCtx = await browser.newContext({ ...PHONE, colorScheme: 'dark' });
const dark = await darkCtx.newPage();
await dark.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await dark.waitForTimeout(800);
await dark.screenshot({ path: join(SHOTS, '15-dark.png') });
console.log('  📸 15-dark');

await browser.close();
server.close();

if (errors.length) {
  console.error(`\n❌ ${errors.length} runtime error(s):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('\n✅ smoke passed — full lesson played, all tabs render, no runtime errors');
