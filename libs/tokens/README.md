# @halfmanhalfape/hmha-tokens

The design tokens behind the Half Man Half Ape design system — plain
CSS custom properties and matching TypeScript types. Pure CSS, zero
dependencies, **no Angular required.** This is what
`@halfmanhalfape/hmha-ui`'s components all consume, but it's published
separately so you can use the design language — colours, spacing,
typography, the light/dark and comfortable/compact theming axes — in
any project, Angular or not.

## Install

```bash
npm install @halfmanhalfape/hmha-tokens
```

## Usage

**Plain CSS** — import the stylesheet once, globally:

```css
@import '@halfmanhalfape/hmha-tokens/src/lib/_all.css';
```

Or in an Angular app's `angular.json`:

```json
"styles": ["node_modules/@halfmanhalfape/hmha-tokens/src/lib/_all.css"]
```

Every token is now a real custom property on `:root` — use any of them
directly:

```css
.card {
  background: var(--hmha-color-surface-raised);
  color: var(--hmha-color-text);
  padding: var(--hmha-control-padding-y) var(--hmha-control-padding-x);
  border-radius: var(--hmha-radius-surface);
}
```

**TypeScript** — typed accessors and role unions, for anywhere you'd
rather reference a role by name than type out a `var()` string by
hand:

```ts
import { hmhaColor, type HmhaColorRole, type HmhaMode, type HmhaDensity } from '@halfmanhalfape/hmha-tokens';

const bg = hmhaColor('surface-raised'); // "var(--hmha-color-surface-raised)"
```

`HmhaColorRole` is a union of all 29 semantic colour role names —
useful for typing a prop/parameter that should only ever accept a real
role (`'action' | 'danger' | 'surface' | …`), so a typo gets caught at
compile time instead of silently rendering nothing.

## Theming: two axes, set as attributes

```html
<html data-hmha-mode="dark" data-hmha-density="compact">
```

| Attribute | Values | Re-points |
| --- | --- | --- |
| `data-hmha-mode` | `light` (default) \| `dark` | All 29 semantic colour roles. |
| `data-hmha-density` | `comfortable` (default) \| `compact` | 7 control-sizing roles. |

Both nest — set either on any ancestor, and everything underneath
resolves from its nearest one. Leave `data-hmha-mode` off entirely and
the page follows the OS's `prefers-color-scheme` until you pin a value.

## Overriding tokens

Every token is a plain custom property — redeclare it anywhere
downstream and everything consuming it (every `hmha-ui` component,
your own CSS) picks up the new value immediately:

```css
:root {
  --hmha-color-action: oklch(0.55 0.2 300); /* your own brand colour instead of the default blue */
}
```

No new package version, no rebuild — this works because the build
deliberately keeps `var()` chains in the output instead of flattening
them to literal values.

## What's inside

Three tiers — primitive (raw ramps/scales, not meant to be consumed
directly), semantic (the tier above — colour/spacing/type *roles*,
these are what you actually use), and component (declared by individual
`hmha-ui` components for their own override surface, documented in
each component's own README).

For the full architecture writeup — why three tiers, the complete
colour/type/font role reference, and the deeper override story — see
`@halfmanhalfape/hmha-ui`'s **[theming guide](https://github.com/C-Dub1978/DS_HalfManHalfApe/blob/main/libs/ui/docs/theming.md)**.
That doc is written against the components package, but every token it
describes lives here and works the same with or without Angular.
