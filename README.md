# Half Man Half Ape Design System

A token-driven Angular 20+ design system and component library: DTCG token
source, the Style Dictionary build, the two token CI guards, and (phase 2) the
Angular workspace itself — `hmha-ui` (the component library) and `sandbox` (the
zoneless dog-food app). `CLAUDE.md` records the architectural invariants;
`DECISIONS.md` records why.

## Repository layout

```
tokens/                   DTCG JSON — source of truth (primitive + semantic tiers)
libs/
  tokens/                 build output (git-ignored) → @halfmanhalfape/hmha-tokens
  ui/                      Angular components         → @halfmanhalfape/hmha-ui
apps/
  sandbox/                 the dog-food app; runs zoneless
scripts/
  concat-layers.mjs        deterministic layer concatenation (order is load-bearing)
  check-contrast.mjs       resolves var() chains, fails CI on a bad pair
style-dictionary.config.mjs five filtered output layers + the TS type format
.stylelintrc.json         bans hex, raw colour functions, stray px units, ::ng-deep
reference/
  tokens.css               expected token build output
  hmha-tokens.ts            expected generated types
sandbox/index.html         static, component-free proof of the token/theming
                            architecture (the phase 1 gate) — kept for reference
```

## Getting started

```bash
npm install
npm run tokens             # writes libs/tokens/src/lib/_all.css
npm run tokens:contrast    # asserts every declared fill/foreground pair, both modes
npm start                  # serves the sandbox app at http://localhost:4200
```

Diff a fresh token build against `reference/tokens.css` — it should match modulo
whitespace; if it does not, the layer order or `outputReferences` is wrong, and
both matter more than they look.

## Commands

```bash
npm run tokens             # build the 5 token layers, concatenate in order
npm run tokens:contrast    # assert every declared fill/foreground pair, both modes
npm run tokens:watch       # rebuild tokens on token edits
npm run lint:css           # the no-literals guard (libs/ui only)
npm run lint:standalone    # fails if any @NgModule shows up in libs/ or apps/
npm run build:lib          # ng build hmha-ui (ng-packagr, partial-Ivy)
npm test                   # ng test
npm run ci                 # everything above, in CI order
```

## Status

**Phase 1 is done**: 37 primitives, 59 semantic roles, both theming axes, the
token build pipeline, and the two CI guards — proved with a plain-HTML sandbox
page (`sandbox/index.html`) with no components, where flipping
`data-hmha-mode`/`data-hmha-density` on `<html>` re-themes everything with no
rebuild.

**Phase 2 is in progress**: the Angular workspace, `hmha-ui` library and
`sandbox` application are scaffolded (`apps/`, `libs/ui`), zoneless via
`provideZonelessChangeDetection()`. Remaining: `hmha-core` token types + CDK
wiring, the two-version install matrix in CI, and `HmhaButton` as the first
component. See `CLAUDE.md` for the full brief and `DECISIONS.md` for the
sequencing of waves two and three.
