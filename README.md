# Acme Design System — phase 1 starter

A token foundation for an Angular 20+ design system and component library:
DTCG token source, the Style Dictionary build, and the two CI guards that keep it
honest. **No components yet** — that is phase 2, and `CLAUDE.md` has the brief.

## Open this in VS Code with the Claude extension

```bash
unzip handoff.zip -d hmha-workspace && cd hmha-workspace
git init && git add -A && git commit -m "Phase 1: token foundation"
code .
```

`CLAUDE.md` is picked up automatically as project context, so Claude starts with
the six architectural decisions, the token tier rules, the component recipe and
the next task already loaded. Ask it to *"read CLAUDE.md and scaffold phase 2"*
and it will follow the agreement rather than inventing its own conventions.

Keep `CLAUDE.md` current as decisions change — it is the highest-leverage file in
the repo for a solo maintainer, because it is the only thing standing between you
and a well-meaning suggestion that quietly breaks an invariant.

## What is here

```
CLAUDE.md          the working agreement — invariants, conventions, next task
DECISIONS.md       the six forks, with rejected alternatives and reasoning
tokens/            DTCG source of truth (primitive + semantic tiers)
style-dictionary.config.mjs   five filtered output layers + the TS type format
scripts/
  concat-layers.mjs   deterministic layer concatenation (order is load-bearing)
  check-contrast.mjs  resolves var() chains, fails CI on a bad pair
.stylelintrc.json  bans hex, raw colour functions, stray px units, ::ng-deep
package.json       the scripts, including a single `npm run ci`
reference/
  tokens.css       expected build output — compare after your first build
  hmha-tokens.ts     expected generated types
```

## Getting started

```bash
npm install
npm run tokens            # writes libs/tokens/src/lib/_all.css
npm run tokens:contrast    # 13 pairs, both modes
```

Then diff your output against `reference/tokens.css`. It should match modulo
whitespace; if it does not, the layer order or `outputReferences` is wrong, and
both matter more than they look.

## Phase 1's remaining gate

A sandbox page with **no components** — plain divs and buttons styled only with
`var(--hmha-*)` — where flipping `data-hmha-mode` and `data-hmha-density` on `<html>`
re-themes everything with no rebuild, and a nested panel holds the opposite mode.
Ship that before writing a single component; it is what proves the architecture
while it is still cheap to change.
