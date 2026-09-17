/**
 * Exercises the paths a clean playthrough never reaches: getting answers wrong,
 * running out of hearts, Fidel drills, chests, unit reviews and free practice.
 *
 *   npm run build && node scripts/stress.mjs
 */

import { mkdir, readFile, stat } from 'node:fs/promises';
import { globSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium, devices } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'shots');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml' };

const server = await new Promise((ok) => {
  const s = createServer(async (req, res) => {
    let f = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); }
    catch { f = join(DIST, 'index.html'); }
    try { res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' }); res.end(await readFile(f)); }
    catch { res.writeHead(404).end(); }
  });
  s.listen(4188, () => ok(s));
});
await mkdir(SHOTS, { recursive: true });

const PHONE = { ...devices['iPhone 13 Pro Max'], viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 };
const exe = globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const problems = [];
const check = (label, cond, detail = '') => {
  console.log(`   ${cond ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) problems.push(label);
};

/**
 * Opens a page with the given nodes already finished, and a starting gem and
 * heart balance.
 *
 * Seeding happens in an init script, before any app code runs. Writing to
 * localStorage from an already-loaded page races the store's own save and gets
 * silently overwritten.
 */
async function phone(doneNodes = [], gems = 400, startHearts = 5) {
  const ctx = await browser.newContext(PHONE);
  {
    await ctx.addInitScript(({ nodes, gems, startHearts }) => {
      const done = {};
      for (const id of nodes) done[id] = { completed: 1, crown: 1, lastPlayed: Date.now() };
      localStorage.setItem('duosemetics.progress.v1', JSON.stringify({
        version: 1, name: 'Tester', avatar: '🦁', joined: Date.now(),
        xp: 120, gems, hearts: startHearts, heartsAt: Date.now(),
        streak: 3, lastDay: null, bestStreak: 3, freezes: 0, xpByDay: {},
        nodes: done, srs: {}, mistakes: [],
        // installHintSeen suppresses the first-run "add to Home Screen" sheet,
        // whose scrim would otherwise swallow every click in these tests.
        settings: { sound: false, translit: true, theme: 'system', reduceMotion: false, dailyGoal: 30, unlimitedHearts: false, installHintSeen: true },
      }));
    }, { nodes: doneNodes, gems, startHearts });
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/ERR_CERT|ERR_FAILED|fonts\.googleapis/.test(m.text())) {
      problems.push(`console: ${m.text()}`);
    }
  });
  await page.goto('http://localhost:4188/?e2e=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  return page;
}

const hearts = (page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem('duosemetics.progress.v1') ?? '{"hearts":5}').hearts);

// ─── 1. Getting it wrong ─────────────────────────────────────────────────
console.log('\n▸ answering wrong: hearts, feedback, re-queue');
{
  const page = await phone();
  await page.getByRole('button', { name: /^Hello/ }).first().click();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);

  const firstKey = await page.evaluate(() => window.__e2e.type);
  await page.evaluate(() => window.__e2e.fail());
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Check' }).click();
  await page.waitForTimeout(400);

  check('shows "Not quite"', (await page.getByText('Not quite').count()) > 0);
  check('reveals the correct answer', (await page.getByText('Correct answer').count()) > 0);
  await page.screenshot({ path: join(SHOTS, 's1-wrong.png') });
  check('a heart is spent', (await hearts(page)) === 4, `hearts now ${await hearts(page)}`);

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(400);

  // A missed exercise must come back later in the same lesson.
  let cameBack = false;
  for (let i = 0; i < 12; i++) {
    if ((await page.evaluate(() => window.__e2e.type)) === firstKey && i > 1) { cameBack = true; break; }
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(140);
    const c = page.getByRole('button', { name: 'Check' });
    if (!(await c.count())) break;
    await c.click();
    await page.waitForTimeout(220);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(200);
  }
  check('missed exercise is re-queued', cameBack);
  await page.context().close();
}

// ─── 2. Running out of hearts ────────────────────────────────────────────
console.log('\n▸ burning all five hearts');
{
  const page = await phone();
  await page.getByRole('button', { name: /^Hello/ }).first().click();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);

  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.__e2e.fail());
    await page.waitForTimeout(140);
    await page.getByRole('button', { name: 'Check' }).click();
    await page.waitForTimeout(260);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(350);
  }
  check('hearts reach zero', (await hearts(page)) === 0, `hearts ${await hearts(page)}`);
  check('out-of-hearts sheet appears', (await page.getByText('You’re out of hearts').count()) > 0);
  check('offers a gem refill', (await page.getByText(/Refill hearts/).count()) > 0);
  await page.screenshot({ path: join(SHOTS, 's2-nohearts.png') });

  await page.getByRole('button', { name: /Refill hearts/ }).click();
  await page.waitForTimeout(600);
  check('refill restores hearts', (await hearts(page)) === 5, `hearts ${await hearts(page)}`);
  check('lesson continues after refill', (await page.getByRole('button', { name: 'Check' }).count()) > 0);
  await page.context().close();
}

// ─── 3. A Fidel drill ────────────────────────────────────────────────────
console.log('\n▸ a Fidel lesson');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4','u1c1','u1r1']);
  await page.getByRole('button', { name: /ሀ · ለ/ }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, 's3-fidel.png') });

  const seen = new Set();
  let steps = 0;
  while (steps++ < 40) {
    if (await page.getByText('Lesson complete').count()) break;
    seen.add(await page.evaluate(() => window.__e2e.type));
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(130);
    const c = page.getByRole('button', { name: 'Check' });
    if (!(await c.count())) break;
    await c.click();
    await page.waitForTimeout(230);
    if (await page.getByText('Not quite').count()) { problems.push('fidel: correct answer marked wrong'); break; }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(190);
  }
  check('fidel lesson completes', (await page.getByText('Lesson complete').count()) > 0, `${steps} steps`);
  check('drills all three fidel types', ['fidel_pick_sound','fidel_pick_char','fidel_order'].every((t) => seen.has(t)), [...seen].join(', '));
  await page.context().close();
}

// ─── 4. A chest ──────────────────────────────────────────────────────────
console.log('\n▸ opening a chest');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4']);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('duosemetics.progress.v1')).gems);
  await page.getByRole('button', { name: /^Chest/ }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Open chest/ }).click();
  await page.waitForTimeout(500);
  // The chest bobs continuously, so Playwright never sees it settle.
  await page.getByRole('button', { name: /Tap to open/ }).click({ force: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(SHOTS, 's4-chest.png') });
  await page.getByRole('button', { name: 'Collect' }).click();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('duosemetics.progress.v1')).gems);
  check('chest pays out gems', after > before, `${before} → ${after}`);
  await page.context().close();
}

// ─── 5. A unit review ────────────────────────────────────────────────────
console.log('\n▸ a unit review');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4','u1c1']);
  await page.getByRole('button', { name: /Unit 1 review/ }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);
  let steps = 0;
  while (steps++ < 50) {
    if (await page.getByText('Lesson complete').count()) break;
    const kind = await page.evaluate(() => window.__e2e.type);
    if (kind === 'match_pairs') {
      for (const pair of await page.evaluate(() => window.__e2e.pairs)) {
        await page.getByText(pair.ti, { exact: true }).first().click();
        await page.waitForTimeout(80);
        await page.getByText(pair.en, { exact: true }).first().click();
        await page.waitForTimeout(140);
      }
      await page.waitForTimeout(500);
      continue;
    }
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(130);
    const c = page.getByRole('button', { name: 'Check' });
    if (!(await c.count())) break;
    await c.click();
    await page.waitForTimeout(230);
    if (await page.getByText('Not quite').count()) { problems.push('review: correct answer marked wrong'); break; }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(190);
  }
  check('unit review completes', (await page.getByText('Lesson complete').count()) > 0, `${steps} steps`);
  await page.context().close();
}

// ─── 6. Free practice ────────────────────────────────────────────────────
console.log('\n▸ free practice from the Practice tab');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4','u1c1','u1r1']);
  await page.getByRole('button', { name: /Practice$/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, 's5-practice.png') });
  check('practice hub lists words', (await page.getByText(/words met/).count()) > 0);
  await page.getByText('Quick 5').click();
  await page.waitForTimeout(700);
  check('a practice session starts', (await page.evaluate(() => !!window.__e2e)) === true);

  const startHearts = await hearts(page);
  await page.evaluate(() => window.__e2e.fail());
  await page.waitForTimeout(140);
  await page.getByRole('button', { name: 'Check' }).click();
  await page.waitForTimeout(400);
  check('practice mistakes cost no hearts', (await hearts(page)) === startHearts,
    `${startHearts} → ${await hearts(page)}`);
  await page.context().close();
}

// ─── 7. Practice as the way back from zero hearts ────────────────────────
console.log('\n▸ practice with no hearts left');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4','u1c1','u1r1'], 0, 0);
  check('starts with no hearts', (await hearts(page)) === 0, `hearts ${await hearts(page)}`);

  // A locked lesson must refuse; practice must not.
  await page.getByRole('button', { name: /Practice$/ }).click();
  await page.waitForTimeout(600);
  await page.getByText('Quick 5').click();
  await page.waitForTimeout(800);
  check('practice still opens at zero hearts', (await page.evaluate(() => !!window.__e2e)) === true);
  check('no out-of-hearts sheet blocks it', (await page.getByText('You’re out of hearts').count()) === 0);
  await page.screenshot({ path: join(SHOTS, 's6-practice-zero.png') });

  await page.evaluate(() => window.__e2e.fail());
  await page.waitForTimeout(140);
  await page.getByRole('button', { name: 'Check' }).click();
  await page.waitForTimeout(400);
  check('a mistake does not end it', (await page.getByText('You’re out of hearts').count()) === 0);
  check('hearts stay at zero', (await hearts(page)) === 0, `hearts ${await hearts(page)}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(300);
  check('session continues', (await page.getByRole('button', { name: 'Check' }).count()) > 0);

  // Finish it: practice is only a real way out if it hands a heart back.
  let steps = 0;
  while (steps++ < 60) {
    if (await page.getByText('Lesson complete').count()) break;
    const kind = await page.evaluate(() => window.__e2e?.type ?? null);
    if (!kind) break;
    if (kind === 'match_pairs') {
      for (const pair of await page.evaluate(() => window.__e2e.pairs)) {
        await page.getByText(pair.ti, { exact: true }).first().click();
        await page.waitForTimeout(80);
        await page.getByText(pair.en, { exact: true }).first().click();
        await page.waitForTimeout(140);
      }
      await page.waitForTimeout(500);
      continue;
    }
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(130);
    const c = page.getByRole('button', { name: 'Check' });
    if (!(await c.count())) break;
    await c.click();
    await page.waitForTimeout(220);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(190);
  }
  check('practice session finishes', (await page.getByText('Lesson complete').count()) > 0, `${steps} steps`);
  check('summary shows the earned heart', (await page.getByText('+1 heart').count()) > 0);
  await page.screenshot({ path: join(SHOTS, 's7-heart-earned.png') });
  while ((await page.getByRole('button', { name: 'Continue' }).count()) > 0) {
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);
  }
  check('heart is actually banked', (await hearts(page)) === 1, `hearts ${await hearts(page)}`);
  await page.context().close();
}

// ─── 8. The out-of-hearts sheet routes to practice ───────────────────────
console.log('\n▸ out-of-hearts sheet offers practice');
{
  const page = await phone(['u1l1','u1l2','u1l3','u1l4','u1c1','u1r1'], 0, 1);
  await page.getByRole('button', { name: /ሀ · ለ/ }).first().click();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__e2e.fail());
  await page.waitForTimeout(140);
  await page.getByRole('button', { name: 'Check' }).click();
  await page.waitForTimeout(260);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(500);

  check('sheet appears at zero', (await page.getByText('You’re out of hearts').count()) > 0);
  check('refill is disabled with no gems', await page.getByRole('button', { name: /Refill hearts/ }).isDisabled());
  const practiceBtn = page.getByRole('button', { name: /Practise/ });
  check('practice is offered as a way out', (await practiceBtn.count()) > 0);
  await page.screenshot({ path: join(SHOTS, 's8-sheet-practice.png') });
  await practiceBtn.click();
  await page.waitForTimeout(700);
  check('it lands on the Practice tab', (await page.getByText(/words met/).count()) > 0);
  await page.context().close();
}

// ─── 9. The match round must not give the answer away ────────────────────
console.log('\n▸ match round does not leak answers');
{
  const page = await phone();
  await page.getByRole('button', { name: /^Hello/ }).first().click();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Start/ }).click();
  await page.waitForTimeout(500);

  // Skip ahead to the match round, which always closes a lesson.
  let n = 0;
  while (n++ < 40 && (await page.evaluate(() => window.__e2e?.type)) !== 'match_pairs') {
    await page.evaluate(() => window.__e2e.solve());
    await page.waitForTimeout(120);
    const c = page.getByRole('button', { name: 'Check' });
    if (!(await c.count())) break;
    await c.click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(170);
  }
  const reached = (await page.evaluate(() => window.__e2e?.type)) === 'match_pairs';
  check('reached the match round', reached);

  if (reached) {
    const pairs = await page.evaluate(() => window.__e2e.pairs);
    const tiles = () => page.locator('.sheet-layer .card, .page .card');

    // Tap one Tigrinya tile. Exactly one tile may look selected — its partner
    // lighting up would be the answer handed over for free.
    await page.getByText(pairs[0].ti, { exact: true }).first().click();
    await page.waitForTimeout(250);
    const selected = await page.locator('.card.sel').count();
    check('tapping one tile selects exactly one', selected === 1, `${selected} highlighted`);
    const partnerLit = await page
      .locator('.card.sel')
      .filter({ hasText: pairs[0].en })
      .count();
    check('its English partner is not highlighted', partnerLit === 0);
    await page.screenshot({ path: join(SHOTS, 's9-match-select.png') });

    // Now tap a *wrong* partner. The red flash must not mark all four tiles.
    await page.getByText(pairs[1].en, { exact: true }).first().click();
    await page.waitForTimeout(200);
    const flashed = await page.locator('.card.bad').count();
    check('a wrong pair flashes exactly two tiles', flashed === 2, `${flashed} flashed`);
    await page.screenshot({ path: join(SHOTS, 's9-match-wrong.png') });
    void tiles;
  }
  await page.context().close();
}

await browser.close();
server.close();

if (problems.length) {
  console.error(`\n❌ ${problems.length} problem(s):`);
  for (const p of [...new Set(problems)]) console.error(`  · ${p}`);
  process.exit(1);
}
console.log('\n✅ stress test passed');
