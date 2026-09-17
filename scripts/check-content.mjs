/**
 * Content check.
 *
 * Generates every node in the curriculum and asserts each produces a full,
 * solvable lesson. Catches the failure mode the browser smoke test can't reach:
 * a single node whose word pool is too thin to build distractors, or whose
 * exercise mix collapses, which would only surface when a learner got there.
 *
 *   node scripts/check-content.mjs
 */

import { build } from 'rolldown';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');

// The engine is plain TypeScript with no React, so it bundles for Node directly.
// Rolldown is already present as Vite's bundler, which keeps this dependency-free.
const dir = await mkdtemp(join(tmpdir(), 'duosemetics-'));
const outfile = join(dir, 'engine.mjs');
const bundle = await build({
  input: join(ROOT, 'scripts/entry.ts'),
  platform: 'node',
  output: { file: outfile, format: 'esm' },
  logLevel: 'warn',
});
await bundle?.close?.();

const {
  NODES,
  NODE_BY_ID,
  generateLesson,
  generatePractice,
  checkAnswer,
  solutionAnswer,
  WORDS,
  SENTENCES,
  ALL_CHARS,
} = await import(pathToFileURL(outfile).href);

const problems = [];
const seenTypes = new Set();
let exerciseCount = 0;

for (const node of NODES) {
  if (node.kind === 'chest') continue;

  // Two attempts, because attempt number reseeds the generator.
  for (const attempt of [0, 1]) {
    const lesson = generateLesson(node.id, { attempt });
    const where = `${node.id} (${node.title}, attempt ${attempt})`;

    if (lesson.length < 8) {
      problems.push(`${where}: only ${lesson.length} exercises`);
      continue;
    }

    const keys = new Set(lesson.map((e) => e.key));
    if (keys.size !== lesson.length) problems.push(`${where}: duplicate exercise keys`);

    for (const ex of lesson) {
      exerciseCount++;
      seenTypes.add(ex.type);

      // Every exercise must be solvable: the known-correct answer must grade
      // as correct, and any option list must contain the answer exactly once.
      if (ex.type !== 'match_pairs') {
        const r = checkAnswer(ex, solutionAnswer(ex));
        if (!r.correct) problems.push(`${where}: ${ex.type} rejects its own solution`);
        if (!r.solution) problems.push(`${where}: ${ex.type} has no solution text`);
      }

      const options = ex.options ?? null;
      if (options) {
        if (options.length < 3) problems.push(`${where}: ${ex.type} has ${options.length} options`);
        const values = options.map((o) => (typeof o === 'string' ? o : o.id));
        const hits = values.filter((v) => v === ex.answer).length;
        if (hits !== 1) problems.push(`${where}: ${ex.type} has ${hits} correct options`);
        if (new Set(values).size !== values.length) {
          problems.push(`${where}: ${ex.type} has duplicate options`);
        }
        // Two options with the same English gloss would make the task unfair.
        const glosses = options.map((o) => (typeof o === 'string' ? o : o.en));
        if (new Set(glosses).size !== glosses.length) {
          problems.push(`${where}: ${ex.type} has options sharing a gloss`);
        }
      }

      if (ex.type === 'translate_bank') {
        for (const t of ex.answerTokens) {
          if (!ex.bank.includes(t)) problems.push(`${where}: bank is missing token "${t}"`);
        }
      }

      if (ex.type === 'match_pairs') {
        const ti = ex.pairs.map((p) => p.ti);
        const en = ex.pairs.map((p) => p.en);
        if (new Set(ti).size !== ti.length || new Set(en).size !== en.length) {
          problems.push(`${where}: match round has ambiguous pairs`);
        }
      }
    }
  }
}

// Practice sessions are built from an arbitrary word set, so exercise that too.
const sample = WORDS.slice(0, 40).map((w) => w.id);
for (const n of [1, 3, 8, 20, 40]) {
  const ids = sample.slice(0, n);
  const p = generatePractice(ids, `check-${n}`);
  if (!p.length) problems.push(`practice with ${n} word(s) produced nothing`);
  for (const ex of p) {
    if (ex.type === 'match_pairs') continue;
    if (!checkAnswer(ex, solutionAnswer(ex)).correct) {
      problems.push(`practice(${n}): ${ex.type} rejects its own solution`);
    }
  }
}

// Every node id referenced by the path must exist.
for (const node of NODES) {
  if (!NODE_BY_ID[node.id]) problems.push(`node ${node.id} missing from the index`);
}

console.log(
  `checked ${NODES.length} nodes · ${exerciseCount} generated exercises · ` +
    `${WORDS.length} words · ${SENTENCES.length} sentences · ${ALL_CHARS.length} Fidel characters`,
);
console.log(`exercise types exercised: ${[...seenTypes].sort().join(', ')}`);

await rm(dir, { recursive: true, force: true });

if (problems.length) {
  console.error(`\n❌ ${problems.length} problem(s):`);
  for (const p of [...new Set(problems)].slice(0, 40)) console.error(`  · ${p}`);
  process.exit(1);
}
console.log('\n✅ every lesson generates a full, solvable set');
