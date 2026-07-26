#!/usr/bin/env node
// Guards the design rules in docs/ui-patterns.md that are mechanically checkable.
// Grep-level on purpose: an AST rule would be more precise and far more code, and
// these two patterns are the ones that actually regressed.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/pages', 'src/components'];
const EXTS = ['.tsx', '.ts'];

const CHECKS = [
  {
    id: 'raw-currency',
    // A currency glyph immediately followed by an interpolation is a figure being
    // hand-assembled. A bare ₱ is fine — an InputAdornment or prose is not a figure.
    pattern: /₱\s*(\{|\$\{)/,
    message:
      'hand-assembled currency figure. Render <Money amount={…} /> or call ' +
      'formatMoney() where a string is required (§3 of docs/ui-patterns.md).',
  },
  {
    id: 'card-per-record',
    // Anti-pattern 1: a list row wrapping itself in a Card. Item components are
    // adapters over LedgerRow and must not own elevation or a border.
    pattern: /<Card\b/,
    appliesTo: (path) => /(Item|Row)\.tsx$/.test(path),
    message:
      'item component wrapping a record in a Card. Rows compose LedgerRow and let ' +
      'LedgerGroupCard own the card and dividers (§2, anti-pattern 1).',
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const failures = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative('.', file);
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const check of CHECKS) {
      if (check.appliesTo && !check.appliesTo(rel)) continue;
      lines.forEach((line, i) => {
        // Skip comment lines: the rules describe themselves in prose all over the
        // codebase, and a doc comment quoting a bad pattern is not a violation.
        const t = line.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        if (check.pattern.test(line)) {
          failures.push({ file: rel, line: i + 1, check, text: t });
        }
      });
    }
  }
}

if (failures.length === 0) {
  console.log('check-ui: clean');
  process.exit(0);
}

console.error(`check-ui: ${failures.length} violation(s)\n`);
for (const f of failures) {
  console.error(`  ${f.file}:${f.line}  [${f.check.id}]`);
  console.error(`    ${f.text.slice(0, 100)}`);
  console.error(`    → ${f.check.message}\n`);
}
console.error('What this cannot catch: a hand-rolled group card, a re-implemented');
console.error('row spec, or a badge on a majority state. Read docs/ui-patterns.md.');
process.exit(1);
