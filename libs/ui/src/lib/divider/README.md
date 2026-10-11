# HmhaDivider

```html
<!-- horizontal (default) -->
<hr hmhaDivider />

<!-- vertical — needs a sized ancestor (e.g. a flex row) to be visible -->
<div style="display: flex; align-items: stretch; height: 2rem;">
  <span>Left</span>
  <hr hmhaDivider orientation="vertical" />
  <span>Right</span>
</div>

<!-- a shorter rule, a custom color, and inset for use beside a list avatar -->
<hr hmhaDivider length="60%" color="var(--hmha-color-danger)" inset="true" />
```

An attribute directive on the native `<hr>` — its implicit ARIA role is
already `separator`, so no `role` needs setting. `aria-orientation` is
always reflected explicitly, matching how `data-tone`/`data-size` are
always set on `HmhaButton` regardless of whether the value is the
default.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Reflected as `data-orientation` and `aria-orientation`. Horizontal sizes by `width`; vertical sizes by `height` — the other dimension is the divider's own thickness. |
| `length` | `string \| null` | `null` | A real CSS length (`'50%'`, `'4rem'`, …) — your own runtime value, not a token. Sets `width` when horizontal, `height` when vertical. `null` leaves the dimension unset, so the token-driven default (100%, or the `inset` `calc()`) applies instead. |
| `color` | `string \| null` | `null` | Forwarded straight into the `--hmha-divider-color` component token — a convenience on top of the same override API below, not a second mechanism. |
| `inset` | `boolean` | `false` | Reflected as `data-inset`. Shrinks the divider and adds a *start* margin (`margin-inline-start` horizontal, `margin-block-start` vertical) — for a divider used beside a list item's leading icon/avatar, so it doesn't span the full width. |

## Component tokens — the override API

Declared on `:host` in `divider.css`, consumed in the same file.

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-divider-color` | `var(--hmha-color-border)` | Also settable directly (the `color` input is a convenience on top of this, not a replacement for it). |
| `--hmha-divider-thickness` | `var(--hmha-border-width)` | No dedicated input — override the token directly if you need a thicker rule. |
| `--hmha-divider-inset` | `var(--hmha-control-padding-x)` | The inset amount when `inset="true"`. Density-aware by default (it's the same token every control's own horizontal padding uses), so it tightens automatically under `data-hmha-density="compact"`. |

Rendered via `background`, sized by `width`/`height` — not `border` —
so both orientations share one sizing model instead of swapping which
border side is used.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity — per the encapsulation contract in `DECISIONS.md` fork 05.
Set a component token instead.
