/**
 * Fails CI when a surface/foreground token pair drops below its WCAG floor,
 * in EITHER mode. This is what stops a future theme from producing an
 * illegible combination nobody catches by eye.
 *
 * Reads the built CSS, resolves var() chains, and checks declared pairs.
 */
import { readFileSync } from 'node:fs';
import { wcagContrast, parse } from 'culori';

/** The ONE place the prefix is named. Renaming the system is this line. */
const PREFIX = 'hmha';

const VAR = `--${PREFIX}-`;
const MODE_ATTR = `data-${PREFIX}-mode`;
const BUILT_CSS = 'libs/tokens/src/lib/_all.css';

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

const css = readFileSync(BUILT_CSS, 'utf8');

/** Every custom property declared under one selector, keyed WITHOUT the prefix. */
function scope(selector) {
  const body = css.split(selector + ' {')[1]?.split('}')[0] ?? '';
  const decl = new RegExp(VAR + '([\\w-]+):\\s*([^;]+);', 'g');
  return Object.fromEntries(
    [...body.matchAll(decl)].map((m) => [m[1], m[2].trim()])
  );
}

const primitives = scope(':root, :host');
const modes = {
  light: scope(`:root, [${MODE_ATTR}="light"]`),
  dark:  scope(`[${MODE_ATTR}="dark"]`),
};

/** Resolve a var(--<prefix>-x) chain down to a literal colour. */
const VAR_CALL = `var(${VAR}`;
function resolve(value, mode) {
  let v = value, guard = 0;
  while (v.startsWith('var(') && guard++ < 10) {
    const key = v.slice(VAR_CALL.length, v.indexOf(')'));
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
