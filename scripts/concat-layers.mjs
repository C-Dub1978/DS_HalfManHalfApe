/**
 * Style Dictionary writes one file per layer; the layer ORDER is load-bearing
 * (see style-dictionary.config.mjs), so concatenate them deterministically
 * rather than letting an import graph decide.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Must match the prefix in style-dictionary.config.mjs and check-contrast.mjs. */
const PREFIX = 'hmha';

const MODE_ATTR = `data-${PREFIX}-mode`;
const DIR = 'libs/tokens/src/lib/';
const ORDER = ['base', 'mode-light', 'mode-dark', 'density-comfortable', 'density-compact'];

// NOTE: do not spell the source glob as "tokens/**/*.json" in this comment —
// that string contains a literal "*/", which closes the CSS comment early.
// The browser's parser then treats the stray "*.json */" as a malformed rule
// and, by CSS error-recovery rules, consumes the ENTIRE next block (the base
// layer) while skipping to the next valid "}". The output still byte-diffs
// close to expectations, so this only shows up once the CSS actually runs in
// a browser — exactly what the sandbox page is for.
const header = `/* tokens — GENERATED. Do not edit. Source: every *.json file under tokens/, recursively */\n\n`;
const body = ORDER.map((name) => readFileSync(DIR + '_' + name + '.css', 'utf8')).join('\n');

// Honour the OS preference only when the app has not pinned a mode.
// NOTE: this string must match the selector the config emits exactly — if the
// two drift, the replace silently no-ops and the media query is dead CSS.
const darkSelector = `[${MODE_ATTR}="dark"]`;
const darkLayer = readFileSync(DIR + '_mode-dark.css', 'utf8');
if (!darkLayer.includes(darkSelector)) {
  throw new Error(`concat-layers: expected "${darkSelector}" in _mode-dark.css — prefix mismatch?`);
}
const darkBlock = darkLayer
  .replace(darkSelector, `:root:not([${MODE_ATTR}])`)
  .split('\n').map((l) => '  ' + l).join('\n');

writeFileSync(
  DIR + '_all.css',
  header + body + '\n@media (prefers-color-scheme: dark) {\n' + darkBlock + '\n}\n'
);
