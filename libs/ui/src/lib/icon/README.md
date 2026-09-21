# HmhaIcon

```html
<hmha-icon name="check" size="md" />
```

A custom element, not an attribute directive — no native element covers
"inline vector glyph." Markup is bundled at build time from a hand-authored
registry (`icon-registry.ts`); there is no sprite fetch and no runtime HTTP
request.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `HmhaIconName` (required) | — | One of the registered icon names: `check`, `close`, `chevron-down`, `spinner`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-icon-size`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-icon-size` | `var(--hmha-icon-md)` | base; re-pointed per `data-size` |

Set `--hmha-icon-size` directly on the host for a one-off size the `sm`/`md`/`lg`
scale doesn't cover; prefer the `size` input otherwise.

## Colour

The icon has no colour token of its own — it renders with `stroke="currentColor"`
and inherits `color` from its CSS context. Put it inside a tone-bearing
ancestor (a `button[hmhaButton]`, a coloured text run) rather than setting
colour on the icon directly.

## Accessibility

The inner `<svg>` is always `aria-hidden="true"` — `HmhaIcon` is decorative by
design. For an icon-only control, put the accessible name on the *interactive*
element (`aria-label` on the button), not on the icon.

## Adding an icon

Add an entry to `HMHA_ICONS` in `icon-registry.ts`: the inner markup of a
24x24 viewBox, using `stroke="currentColor"` (or `fill="currentColor"`) so it
inherits colour like the existing set. The `HmhaIconName` union updates
automatically — it is derived from the registry's keys.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set `--hmha-icon-size`
instead.
