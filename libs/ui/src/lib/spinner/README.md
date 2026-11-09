# HmhaSpinner

```html
<!-- Standalone: announced as a busy progress bar -->
<hmha-spinner label="Loading catalog" />

<!-- Inside a loading button: decorative, since the button says it's busy -->
<button hmhaButton tone="primary" [loading]="saving()">
  @if (saving()) {
    <hmha-spinner decorative size="sm" />
  }
  Save
</button>
```

A small custom element that rotates the icon set's own `spinner` glyph, so
its stroke matches every other `HmhaIcon`. It's a custom tag because no
native element draws a rotating arc. See `DECISIONS.md` fork 37 for why
it isn't a restyled `<progress>`.

## Two accessibility modes

- **Standalone (default):** `role="progressbar"` with no value, which is
  the standard spinner semantics and the same thing an `HmhaProgressBar`
  with no value is. It's named by `label`, `"Loading"` by default. Name
  what's loading where you can.
- **`decorative`:** no role, no name, `aria-hidden="true"`. Use it inside
  anything that already tells assistive tech it's busy. A loading
  `HmhaButton` sets `aria-busy`, so a second announced progress bar
  inside it would be noise and would leak into the button's name
  ("Save Loading").

A spinner says *something* is happening. If the wait is long, or the
result matters, also announce it in words through a live region: a
spinner on its own isn't announced when it appears.

## Colour and size

It draws in `currentColor`, so it matches the text beside it: white inside
a primary button, the normal text colour on a page. Set
`--hmha-spinner-color` to override it.

`size` follows the icon scale (16, 20 and 24px). For anything larger, a
page-level loader for instance, set `--hmha-spinner-size` to any length.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`. |
| `label` | `string` | `'Loading'` | The accessible name. Ignored when `decorative`. |
| `decorative` | `boolean` | `false` | Removes it from the accessibility tree. |

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-spinner-size` | `var(--hmha-icon-md)` | Re-pointed per `data-size`. Any length works. |
| `--hmha-spinner-color` | `currentColor` | |
| `--hmha-spinner-duration` | `calc(var(--hmha-duration-base) * 4)` | One full turn. |

## Motion

It rotates continuously. Under `prefers-reduced-motion: reduce` it stops
rotating and pulses in place instead, the same treatment as
`HmhaProgressBar`'s indeterminate state.

## Not in scope

A determinate, circular percentage indicator (use `HmhaProgressBar`), and
a show-after-a-delay option to avoid a flash on fast loads. The delay
could be added later in pure CSS, with no timers.

## Unsupported

`::ng-deep`, selectors targeting internal DOM (the icon inside), or
overriding by specificity, per the encapsulation contract in
`DECISIONS.md` fork 05. Set a component token instead.
