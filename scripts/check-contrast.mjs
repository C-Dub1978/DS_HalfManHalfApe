/**
 * Fails CI when a surface/foreground token pair drops below its WCAG floor,
 * in EITHER mode. This is what stops a future theme from producing an
 * illegible combination nobody catches by eye (Fork 04).
 *
 * Reads the built CSS, resolves var() chains, and checks declared pairs.
 */
import { readFileSync } from 'node:fs';
import { wcagContrast, parse } from 'culori';

// [ foreground role, background role, minimum ratio ]
const PAIRS = [
  ['text',            'bg',              4.5],
  ['text',            'surface',         4.5],
  ['text-muted',      'surface',         4.5],
  ['text-subtle',     'surface',         3.0],  // metadata only, never body copy
  ['text-on-action',  'action',          4.5],
  ['text-on-danger',  'danger',          4.5],
  ['text-on-warning', 'warning',         4.5],
  ['text-on-success', 'success',         4.5],
  ['danger-text',     'danger-subtle',   4.5],
  ['warning-text',    'warning-subtle',  4.5],
  ['success-text',    'success-subtle',  4.5],
  ['border-strong',   'surface',         3.0],  // interface chrome
  ['focus',           'bg',              3.0],  // the focus ring must be visible
];

const css = readFileSync('libs/tokens/src/lib/_all.css', 'utf8');

function scope(selector) {
  const body = css.split(selector + ' {')[1]?.split('}')[0] ?? '';
  return Object.fromEntries(
    [...body.matchAll(/--ds-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
}

const primitives = scope(':root, :host');
const modes = {
  light: scope(':root, [data-ds-mode="light"]'),
  dark:  scope('[data-ds-mode="dark"]'),
};

/** Resolve a var(--ds-x) chain down to a literal colour. */
function resolve(value, mode) {
  let v = value, guard = 0;
  while (v.startsWith('var(') && guard++ < 10) {
    const key = v.slice(6, v.indexOf(')'));
    v = modes[mode][key] ?? primitives[key] ?? '';
  }
  return v;
}

let failures = 0;
for (const mode of Object.keys(modes)) {
  for (const [fg, bg, min] of PAIRS) {
    const a = parse(resolve(modes[mode]['color-' + fg], mode));
    const b = parse(resolve(modes[mode]['color-' + bg], mode));
    if (!a || !b) {
      console.error(`✗ ${mode}: could not resolve ${fg} on ${bg}`);
      failures++;
      continue;
    }
    const ratio = wcagContrast(a, b);
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(
      `${ok ? '✓' : '✗'} ${mode.padEnd(5)} ${fg.padEnd(16)} on ${bg.padEnd(16)} ${ratio.toFixed(2)}:1 (min ${min})`
    );
  }
}

if (failures) {
  console.error(`\n${failures} contrast failure(s). Fix the token, not the test.`);
  process.exit(1);
}
console.log('\nAll token pairs pass.');
