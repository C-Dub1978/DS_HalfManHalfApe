# @halfmanhalfape/hmha-ui

Standalone Angular components for the Half Man Half Ape design system. See the
repository root `CLAUDE.md` for the architectural invariants (standalone only,
signals only, zoneless-safe, no hard-coded values, component tokens as the
override API) and `DECISIONS.md` for why.

Build: `npm run build:lib` (ng-packagr, partial-Ivy, from the repo root).

## Components

| Component | Selector | Docs |
| --- | --- | --- |
| Button | `button[hmhaButton]` | [`src/lib/button/README.md`](./src/lib/button/README.md) |

Each component documents its inputs and its component-token override API
alongside its source, per the contract in `DECISIONS.md` fork 05.

## Changing fonts

Font family is a token, same three-tier shape as everything else:

- `tokens/primitive/type.json` — `font-family.<name>`, one entry per
  actual typeface. Named by identity (`raleway`, `geist`, …), not role —
  the same convention the colour ramps use (`blue`, `green`, …).
- `tokens/semantic/type.json` — three roles point at exactly one
  primitive each: `font.family` (body/UI text), `font.family-heading`
  (`<h1>`–`<h6>`, anywhere — set globally in `apps/sandbox/src/
  styles.css` and `libs/ui/.storybook/preview.css`, the same place
  `body`'s own font-family lives, so every heading gets it with no
  per-component work), and `font.family-mono`. These three are the
  values every component/page actually consumes
  (`var(--hmha-font-family)`/`-heading`/`-mono`), so this is the file to
  edit to switch fonts — then `npm run tokens`.

**Eight fonts are already loaded via CDN, so picking any of them needs
no further work beyond the token edit:**

| Primitive token | Typeface | Generic fallback |
| --- | --- | --- |
| `font-family.raleway` | Raleway | `sans-serif` — **today's default** (`font.family`) |
| `font-family.geist` | Geist | `sans-serif` |
| `font-family.cormorant` | Cormorant | `serif` |
| `font-family.fraunces` | Fraunces | `serif` — **today's default** (`font.family-heading`) |
| `font-family.recursive` | Recursive | `monospace` — **today's default** (`font.family-mono`) |
| `font-family.geist-mono` | Geist Mono | `monospace` |
| `font-family.jetbrains-mono` | JetBrains Mono | `monospace` |
| `font-family.ibm-plex-mono` | IBM Plex Mono | `monospace` |

Weights 400/500/600/700 are loaded for each — matching
`font-weight.regular`/`.medium`/`.semibold`/`.bold`, the full set this
library's type roles actually use.

**Why Fraunces for headings, Raleway for body — the pairing logic, if
you're not sure what to look for:** a distinctive serif for headings
plus a plain, highly-legible sans for body copy is a very common,
safe pairing (the serif gives short bursts of text — headlines, section
titles — personality; the sans keeps dense UI text/paragraphs fast to
scan). The risk to watch for if you swap either: don't put a display/
decorative serif (Cormorant, Fraunces) on **body** text — they're
optimized for being read at a glance at large sizes, not for paragraphs
at 14–16px, and reading speed suffers. Keep the heading face for
headings only — the global `h1`–`h6` rule above already enforces that
split for you; you'd have to deliberately override it to break it.

**Changing `font.family`/`.family-heading`/`.family-mono` alone does
nothing for a 9th font.** The token only sets a CSS `font-family`
*name* — the browser
still needs the actual font file available, or it silently falls back
to the generic (no error, no warning). That loading lives outside the
token build, in two separate places that both need updating together
for a font not already in the table above:

- `apps/sandbox/src/index.html` — the app shell.
- `libs/ui/.storybook/preview-head.html` — Storybook's own preview
  iframe head (its documented convention for exactly this; mirrors the
  sandbox app's link rather than importing it, the same reason
  `preview.css` mirrors `apps/sandbox/src/styles.css` instead of
  importing it).

`font.family-mono` isn't consumed by any component's CSS yet — no
`<code>`-style component exists to need it — but it's loaded and wired
through regardless, ready for one.
