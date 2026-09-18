# DuoSemetics — handover

Written 18 September 2026, at commit `40648af`, for whoever picks this up next.

`CLAUDE.md` in the repository root holds the working rules — conventions, and the
specific traps that have already cost time. **Read it before changing anything.**
This document is the wider context that doesn't belong there: what exists, why it
is shaped this way, what is unfinished, and what to do next.

---

## 1. What it is

A course app for **Tigrinya (ትግርኛ)** and the **Ge'ez script**, built in the shape
of a daily-streak language game — a winding lesson path, hearts, XP, a weekly
league, spaced repetition underneath.

- **Live:** https://rasraey.github.io/DuoSemetics/
- **Repository:** https://github.com/RasRaey/DuoSemetics (public)
- **Default branch:** `claude/tigrigna-learning-app-tiw5q3` — there is no `main`.
  GitHub made the first pushed branch the default and it stayed that way.
- **Deploys on every push** to that branch, via `.github/workflows/deploy.yml`.
  **A push is a publish.** There is no staging.

Built for **iPhone 15 Pro Max** first (430×932pt, Dynamic Island, home
indicator), installed through Safari → Share → Add to Home Screen. It runs as a
standalone PWA and works offline once installed over HTTPS.

React + TypeScript + Vite. **Two runtime dependencies: `react` and `react-dom`.**
Nothing else. Sound effects are synthesised with Web Audio, icons are inline SVG,
there is no CSS framework and no state library. Keep it that way unless there is
a real reason not to — the whole app is ~107 kB gzipped.

---

## 2. Where it stands

| | |
| --- | --- |
| Source | 29 files, ~7,200 lines |
| Test scripts | 3 files, ~900 lines |
| Vocabulary | 163 words |
| Sentences | 55 |
| Fidel | 231 characters, the full chart |
| Path | 3 sections, 11 units, 60 nodes — 35 lessons, 11 reviews, 7 Fidel drills, 7 chests |
| Exercise types | 9 |
| Bundle | 348 kB raw, 107 kB gzipped |
| Commits | 15 |

**Working and verified:** the whole lesson loop, all nine exercise types, hearts
and the practice escape hatch, streaks with freezes, XP with bonuses, gems and a
shop, spaced repetition, the weekly league, the Fidel chart, progress
backup/restore across origins, storage diagnostics, light and dark themes,
offline support.

**Not built:** audio of any kind (see §6), speaking exercises, any server or
account, any real multiplayer.

---

## 3. Running it

```bash
npm install
npm run dev          # dev server
npm run phone        # production build served on the LAN, for a real phone
npm run build        # production build into dist/
npm run build:pages  # same, with the /DuoSemetics/ base path for GitHub Pages
npm run typecheck    # tsc, no emit
npm run lint         # oxlint
npm run icons        # regenerate every icon and splash from scripts/icons.mjs
```

### The three test layers

```bash
npm run check:content    # generates every node, asserts each is solvable
npm run test:e2e         # build + scripts/smoke.mjs
npm run test:stress      # build + scripts/stress.mjs
```

They cover different things and you want all three:

- **`check-content.mjs`** generates all 53 playable nodes twice over and asserts
  every one of ~1,500 exercises grades its own solution as correct, offers at
  least three options, contains the answer exactly once, and never shows two
  options sharing an English gloss. Pure logic, no browser, runs in a second.
- **`smoke.mjs`** drives Chromium at 430×932 through two full lessons, visits
  every tab, checks progress survives a reload, and fails on any same-origin
  runtime error. Writes screenshots to `shots/`.
- **`stress.mjs`** covers what a clean playthrough never reaches: wrong answers,
  hearts running to zero, gem refills, Fidel drills, chests, unit reviews,
  practice, the match round's highlighting, and the skip-ahead behaviour. 38
  assertions.

CI (`.github/workflows/ci.yml`) runs all of it on every push. The **deploy
workflow does not** — it runs lint, typecheck and the content check only. So a
push can publish while the browser tests are red. Run them yourself first.

---

## 4. The map

```
src/data/        content only — no logic
  lexicon.ts       163 words: Ge'ez, transliteration, gloss, emoji, learner note
  sentences.ts     55 sentences with token-level structure for word banks
  fidel.ts         the 33 Ge'ez consonant rows × 7 orders, numerals, punctuation
  curriculum.ts    sections → units → nodes; declares what each node covers

src/engine/      logic only — no React, no DOM
  generator.ts     turns a node into a playable queue of exercises
  check.ts         one entry point for grading; also solutionAnswer/wrongAnswer
  grading.ts       lenient text matching (typos and filler words forgiven)
  srs.ts           spaced repetition, strength 0–5
  store.ts         all learner state, localStorage persistence, migrations
  storage.ts       storage health probing — is it saving, and where
  rng.ts           seeded PRNG so a lesson attempt is reproducible
  types.ts         the exercise union

src/audio/
  sfx.ts           synthesised sound effects, no audio files
  speech.ts        speech synthesis attempt + honest capability reporting

src/components/  screens and exercises
  App.tsx          screen state machine, tab bar, global effects
  Lesson.tsx       the lesson player — the queue, hearts, feedback, skip-ahead
  Path.tsx         the winding lesson path
  Complete.tsx     end-of-lesson reward sequence, chest screen
  Practice.tsx     practice hub and the word list / dictionary
  FidelBook.tsx    the browsable Ge'ez chart
  League.tsx       weekly league (rivals generated locally — the UI says so)
  Profile.tsx      profile, shop, settings, backup/restore, diagnostics
  ui.tsx           Btn, Bar, Sheet, TopStats, Geez, SpeakerBtn, CountUp…
  Mascot.tsx       Anbi the lion, inline SVG with mood states
  icons/           the SVG interface icon set
  exercises/       Choice.tsx (multiple choice family), Bank.tsx (word bank,
                   typing, match pairs)
```

**The data/engine/components split is load-bearing.** Adding a unit should mean
editing `curriculum.ts` and nothing else — the generator decides how to drill
whatever a node declares. Resist putting content in components or logic in data.

### How a lesson actually works

1. `generateLesson(nodeId, { attempt })` reads what the node declares and builds
   a queue, seeded by node id and attempt number so a replay differs but a
   resumed session doesn't reshuffle.
2. `Lesson.tsx` walks the queue. A wrong answer is **pushed back three slots and
   the denominator grows**, so the progress bar only advances on genuine recall.
   A lesson ends when the queue empties, not after a fixed count.
3. `checkAnswer` grades. Typed answers can come back `almost` — accepted, heart
   kept, corrected spelling shown.
4. Every answer updates the SRS immediately. **XP, streak and node completion are
   only written when the lesson finishes** — quitting saves nothing. This is
   deliberate, and it is also the second most likely explanation for a "my
   progress vanished" report (the first is in `CLAUDE.md`).

---

## 5. Decisions worth knowing

Most of the hard-won detail is in `CLAUDE.md`. The reasoning behind it:

**Three real bugs reached the live site and were caught by the owner's phone,
not by the tests.** The tab bar covering the lesson Start button; the match round
highlighting both tiles of a pair and so handing over every answer; a listening
exercise that printed the answer in writing. All three passed CI.

The pattern is worth internalising: **the tests drove the UI without ever looking
at it.** They tapped the right tiles from known data and asserted the lesson
finished. They never asked what was on screen. Chromium also renders
`env(safe-area-inset-*)` as zero, so nothing ever collided with the tab bar in a
test run.

What came out of that:

- The stress test now makes assertions about *appearance* — how many tiles are
  highlighted, whether a button is hittable at both edges — not just flow.
- Layout work must emulate the real insets: `:root{--sat:59px;--sab:34px}` via
  `addInitScript`.
- **Screenshots from a real device are the highest-value feedback this project
  gets.** Ask for them.

**Other decisions:** hearts exist but practice is always free and hands one back,
so running dry is a detour rather than a wall. The league is honest about its
rivals being generated. Correct answers skip ahead after 650ms, but never when
there is a correction or a grammar tip to read.

---

## 6. Audio — the biggest gap

**There is none, and the listening exercise was removed rather than faked.**

Without a voice it fell back to printing the transliteration of the answer above
three options that each showed their own transliteration. A string-matching
puzzle wearing a headphone icon, inflating accuracy while teaching nothing.

Sources checked, none usable from the build sandbox:

| Source | Result |
| --- | --- |
| Platform speech synthesis | No OS ships a `ti` voice. Amharic exists on some devices — same script, most of the same consonants, wrong rhythm. |
| espeak-ng 1.51 | 126 voices. Tigrinya is not one of them. |
| Meta MMS-TTS `tir` | Exists on HuggingFace, which the sandbox's egress policy blocks. **Try this from an unrestricted machine.** |
| Commercial TTS | No major provider offers Tigrinya as far as I could establish. |

### To bring it back

The work is about a day, and the plumbing is identical whichever source you use:

1. **Manifest and playback.** An `audio/manifest.json` mapping lexicon and
   sentence ids to clip paths; a player that prefers a recorded clip and falls
   back to nothing. Lazy-load per lesson so the first launch stays small.
2. **Fill it.** Either run MMS-TTS `tir` offline and commit the clips (~1–2 MB of
   Opus for ~230 items), or record a native speaker — roughly 170 words and 55
   sentences, about an hour. A recorder page that walks the list, allows
   re-takes, and exports files plus manifest would make that painless.
3. **Reinstate `listen_pick`** — and this time it must not display the
   transliteration of what is playing.

`SpeakerBtn` already renders nothing when there is no voice. Keep that: a dead
icon invites a tap and promises a feature that isn't there.

---

## 7. What to do next, in order

1. **Get the content reviewed by a native speaker.** Higher value than any
   feature below. It was written carefully, favouring patterns that generalise
   and avoiding constructions where agreement is easy to get subtly wrong, but
   **no fluent speaker has checked it.** The whole course rests on it being
   right. Start with `lexicon.ts` and `sentences.ts`; both are plain data and
   readable by a non-programmer.
2. **Audio**, per §6.
3. **More content.** The path ends after Section 3. The structure scales — a new
   section is data in `curriculum.ts`. Obvious next topics: work and jobs, travel
   and directions, the body and health, past tense, possessives.
4. **Grammar notes.** Sentences carry an optional `tip`, shown after a correct
   answer. Few use it. Tigrinya verb conjugation and the gendered address forms
   both deserve proper explanation somewhere.
5. **Speaking exercises**, once audio exists — though note there is no Tigrinya
   speech *recognition* either, so this may stay out of reach.

### Deliberately not done

A backend, accounts, or sync — the app is local-first and better for it. Real
leaderboards would need all three. Leeches, crown levels beyond 5, and a
"legendary" tier were considered and left out as premature.

---

## 8. Constraints you'll hit

- **iOS Safari tab and Home Screen app have separate storage.** The single most
  common cause of an apparent progress reset. `CLAUDE.md` has the detail.
- **Progress is per-origin.** Moving between a LAN address and the hosted URL
  loses everything unless carried across with **You → Back up or move**.
- **Offline needs HTTPS.** No service worker on a plain `http://192.168.x.x`
  address, so the LAN route needs the host machine awake every time.
- **GitHub Pages cannot be enabled from a workflow.** Tried twice, on both a
  private and a public repository. `GITHUB_TOKEN` lacks the right regardless.
- **Chromium lies about safe areas.** Emulate them when testing layout.

---

## 9. Ten-minute orientation

Read in this order:

1. `CLAUDE.md` — the rules and the traps.
2. `src/data/curriculum.ts` — the shape of the course in one file.
3. `src/engine/generator.ts` — how a node becomes exercises.
4. `src/components/Lesson.tsx` — the queue, hearts, feedback, skip-ahead.
5. `scripts/stress.mjs` — what is actually guaranteed to work.

Then `npm run phone`, open it on an actual phone, and play a unit. The app is
small enough to hold in your head; do that before changing it.
