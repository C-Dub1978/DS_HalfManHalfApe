/**
 * Style Dictionary writes one file per layer; the layer ORDER is load-bearing
 * (see style-dictionary.config.mjs), so concatenate them deterministically
 * rather than letting an import graph decide.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'libs/tokens/src/lib/';
const ORDER = ['base', 'mode-light', 'mode-dark', 'density-comfortable', 'density-compact'];

const header = `/* ds-tokens — GENERATED. Do not edit. Source: tokens/**/*.json */\n\n`;
const body = ORDER.map((name) => readFileSync(DIR + '_' + name + '.css', 'utf8')).join('\n');

// Honour the OS preference only when the app has not pinned a mode.
const darkBlock = readFileSync(DIR + '_mode-dark.css', 'utf8')
  .replace('[data-ds-mode="dark"]', ':root:not([data-ds-mode])')
  .split('\n').map((l) => '  ' + l).join('\n');

writeFileSync(
  DIR + '_all.css',
  header + body + '\n@media (prefers-color-scheme: dark) {\n' + darkBlock + '\n}\n'
);
