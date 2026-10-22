# Theming @halfmanhalfape/hmha-ui

Every visual value in this library — colour, spacing, radius, type —
resolves to a CSS custom property (`var(--hmha-*)`). No component ever
hard-codes a colour, a size, or a font. That's not an implementation
detail; it's the whole point: **you can re-theme this entire library at
runtime, from your own app's CSS, without forking anything or waiting on
a new release.**

This doc explains the three-tier architecture behind that, the two axes
you flip to theme the library out of the box, and exactly how to go
further and override anything yourself.

- [The three tiers](#the-three-tiers)
- [The two built-in axes: mode and density](#the-two-built-in-axes-mode-and-density)
- [Overriding colours — three ways, same mechanism](#overriding-colours--three-ways-same-mechanism)
- [Typography: three font roles, eight fonts ready to go](#typography-three-font-roles-eight-fonts-ready-to-go)
- [The full color role reference](#the-full-color-role-reference)
- [The full type role reference](#the-full-type-role-reference)
- [Component tokens — the per-component override API](#component-tokens--the-per-component-override-api)

## The three tiers

| Tier | Example | Who sets it |
| --- | --- | --- |
| **Primitive** | `--hmha-color-blue-600`, `--hmha-space-4` | Nobody consumes this directly except the semantic tier. Raw values — a colour ramp, a spacing scale. |
| **Semantic** | `--hmha-color-action`, `--hmha-control-height` | **Components and your app.** This is the tier you actually interact with. |
| **Component** | `--hmha-button-bg` | Declared by one component; you can override it on that component alone. |

References only ever point one direction: component → semantic →
primitive. That direction is what makes overriding safe — redeclaring a
semantic value (`--hmha-color-action`) doesn't touch the primitive ramp
it was built from, and every component reading that semantic value just
picks up your new one automatically.

The one thing that makes all of this actually work at runtime: the
build keeps `var()` chains in the output instead of flattening them to
literal values. `--hmha-color-action` is a `var()` reference to a
primitive, not `oklch(0.55 0.19 255)` baked in — so redeclaring it
anywhere downstream genuinely changes what every component renders.

## The two built-in axes: mode and density

Two independent attributes, meant to be set on `<html>` (or any
ancestor — they nest):

```html
<html data-hmha-mode="dark" data-hmha-density="compact">
```

| Attribute | Values | What it re-points |
| --- | --- | --- |
| `data-hmha-mode` | `light` (default) \| `dark` | All 29 semantic colour roles. |
| `data-hmha-density` | `comfortable` (default) \| `compact` | 7 control-sizing roles: `control.height`/`height-sm`/`height-lg`/`padding-x`/`padding-y`/`gap`, `space.stack`. |

Both compose freely and nest independently — a `data-hmha-mode="dark"`
panel inside an otherwise-light page needs no extra CSS; the nested
subtree just resolves from its own nearest ancestor attribute. Leaving
either attribute off a page entirely means: mode follows
`prefers-color-scheme` until you pin one, and density defaults to
`comfortable`.

There's no third "theme" axis (no `data-hmha-theme="ocean"` or similar)
— and deliberately so. Picking a brand colour isn't a preset-selection
problem this library needs to solve for you; it's one CSS override away
(next section).

## Overriding colours — three ways, same mechanism

All three are just "redeclare the custom property somewhere" — the
difference is scope.

**1. Override a semantic role for your whole app** — the broadest,
simplest override. Put this in your own global stylesheet, after the
token CSS is loaded:

```css
:root {
  --hmha-color-action: oklch(0.55 0.2 300); /* your brand purple instead of the default blue */
}
```

Every component that uses the `action` role (buttons, focus rings,
links, chip selection, …) picks this up immediately. No rebuild, no new
package version.

**2. Override a component token on one component only** — every
component declares its own override surface on `:host` (documented in
that component's own README under "Component tokens"). Target it with
an ordinary CSS selector:

```css
.danger-zone button[hmhaButton] {
  --hmha-button-bg: var(--hmha-color-danger);
}
```

This changes *only* buttons inside `.danger-zone` — nothing else on the
page.

**3. Override via a real input, when the component exposes one** — a
few components (currently just `HmhaDivider`) take a plain value as an
`@Input()` that forwards straight into their own component token, for
convenience:

```html
<hr hmhaDivider color="var(--hmha-color-danger)" />
```

This isn't a separate mechanism from #2 — it's the same component
token, just settable from a template binding instead of a stylesheet
rule, for the cases where that's more convenient.

**What you can't do:** reach *into* a component's internal DOM with
`::ng-deep` or a specificity war — components use Angular's emulated
view encapsulation on purpose, and `::ng-deep`/`:host-context()` are
both blocked by this repo's own stylelint config. If a component
doesn't expose a token for the thing you want to change, that's a real
gap — open an issue rather than fighting the CSS.

## Typography: three font roles, eight fonts ready to go

Three semantic roles, each pointing at one primitive `font-family.<name>`:

| Role | Default | Used for |
| --- | --- | --- |
| `font.family` → `--hmha-font-family` | Raleway | Body text, every control's own label text. |
| `font.family-heading` → `--hmha-font-family-heading` | Fraunces | `<h1>`–`<h6>`, anywhere — applied globally, not per-component. |
| `font.family-mono` → `--hmha-font-family-mono` | Recursive | Reserved for code/monospace content; not yet consumed by any shipped component. |

**Eight fonts are already loaded via CDN** (weights 400/500/600/700),
so pointing a role at any of these needs no further work:

| Primitive token | Typeface | Fallback |
| --- | --- | --- |
| `font-family.raleway` | Raleway | sans-serif |
| `font-family.geist` | Geist | sans-serif |
| `font-family.cormorant` | Cormorant | serif |
| `font-family.fraunces` | Fraunces | serif |
| `font-family.recursive` | Recursive | monospace |
| `font-family.geist-mono` | Geist Mono | monospace |
| `font-family.jetbrains-mono` | JetBrains Mono | monospace |
| `font-family.ibm-plex-mono` | IBM Plex Mono | monospace |

**The gotcha to know about before you reach for a 9th font:** a
`font-family` token only sets a CSS *name*. If the actual font file
isn't loaded somewhere, the browser silently falls back to the generic
(`sans-serif`/`serif`/`monospace`) — no error, no console warning, it
just quietly isn't the font you asked for. For any of the eight above,
that's already handled. For anything else, you're responsible for
loading it yourself (a `<link>` to Google Fonts, or self-hosted
`@font-face`) in your own app's HTML.

**Pairing advice, if you're picking your own:** a distinctive serif for
headings against a plain, highly-legible sans for body text is a safe,
common pairing — personality in short bursts (titles), speed in the
dense stuff (paragraphs, UI labels). Avoid putting a display/decorative
serif (like Cormorant or Fraunces) on *body* text specifically — they're
tuned for being glanced at large sizes, not read in paragraphs at
14–16px, and reading speed suffers.

## The full color role reference

All 29 roles, same names in both `light` and `dark` — set via
`var(--hmha-color-<role>)`:

| Category | Roles |
| --- | --- |
| Surfaces | `bg`, `bg-subtle`, `surface`, `surface-raised`, `surface-sunken` |
| Text | `text`, `text-muted`, `text-subtle` |
| Borders | `border`, `border-strong` |
| Action (brand) | `action`, `action-hover`, `action-active`, `action-subtle`, `action-disabled`, `text-on-action`, `focus` |
| Danger | `danger`, `danger-subtle`, `danger-text`, `text-on-danger` |
| Warning | `warning`, `warning-subtle`, `warning-text`, `text-on-warning` |
| Success | `success`, `success-subtle`, `success-text`, `text-on-success` |

Every fill role has a matching `text-on-*` foreground that's contrast-
checked (WCAG AA) in both modes as part of this repo's own CI — if you
override a fill, override its foreground to match, or text on top of it
may no longer be readable.

## The full type role reference

Each role is a `size`/`line-height`/`weight` triple —
`var(--hmha-type-<role>-size/-line/-weight)`:

| Role | Size | Weight | Typical use |
| --- | --- | --- | --- |
| `heading-lg` | 30px | bold | Page titles. |
| `heading-md` | 20px | semibold | Section headers, card titles. |
| `heading-sm` | 18px | semibold | Subsection headers. |
| `body-md` | 16px | regular | Default paragraph text. |
| `body-sm` | 14px | regular | Secondary/supporting paragraph text. |
| `label-md` | 14px | medium | Every control's own text — buttons, chips, form labels, pagination, headers. |
| `label-sm` | 12px | medium | A smaller label — dense UI, small chips. |
| `caption` | 12px | regular | Fine print, timestamps, metadata. Carries no colour of its own — that's a separate, composable choice. |

There's deliberately no size above `heading-lg` (no "display" role) and
no separate `overline` role — see `DECISIONS.md` fork 31 if you want
the full reasoning; short version, neither had a concrete consumer
asking for it yet.

## Component tokens — the per-component override API

Every component's own README documents its specific override tokens
under a "Component tokens" heading, with their defaults. Start there for
anything role-level overriding above doesn't cover — e.g. `HmhaButton`'s
`--hmha-button-bg-hover`/`-active`, which vary by `tone` and have no
direct semantic-role equivalent.
