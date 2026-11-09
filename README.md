# HMHA Design System

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

**v1 is released** on npm — `@halfmanhalfape/hmha-tokens` and
`@halfmanhalfape/hmha-ui` — and supports **Angular 20, 21 and 22**, each
verified by the CI install matrix (`scripts/verify-install-matrix.sh`).

Phases 1 and 2 (the token foundation, the zoneless workspace and the install
matrix) and six component waves are done: Icon, Button/IconButton (with a
pressed toggle state), Card, Field, Input/Textarea (with a character
counter), Checkbox, Radio, Switch, Dialog/Drawer, Menu, Tooltip, Toast,
Tabs, Select, Combobox, Pagination, Table, Data Grid, Chip, Expansion
Panel/Accordion, Stepper, Divider, Slider, Progress Bar, Spinner,
Skeleton, Avatar, Badge, File Upload, Alert, Empty State, Segmented
Control and Nav List. `libs/ui/README.md` has the full
consumer-facing catalog; `DECISIONS.md` has each wave's step tracker and the
reasoning behind every component.
