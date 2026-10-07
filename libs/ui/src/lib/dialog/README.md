# HmhaDialog

```html
<button type="button" (click)="confirmOpen.set(true)">Delete item</button>

<dialog hmhaDialog [(open)]="confirmOpen" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete item?</h2>
  <p>This action cannot be undone.</p>
  <button type="button" (click)="confirmOpen.set(false)">Cancel</button>
  <button hmhaButton tone="danger" (click)="delete(); confirmOpen.set(false)">Delete</button>
</dialog>
```

An attribute directive on the native `<dialog>` element, opened via
`.showModal()` — not `hmhaOverlay`/CDK Overlay, unlike the rest of Wave 3.
The native element already gives a real focus trap, Escape-to-close,
top-layer rendering above everything else on the page, and an implicit
`role="dialog"` with `aria-modal="true"` exposed automatically. See
`DECISIONS.md` fork 14 for why.

## Accessible name — your job, not this component's

`HmhaDialog` projects arbitrary content and doesn't know what's inside it,
so it doesn't auto-wire a title. Give the dialog an accessible name
yourself: put `id="..."` on a heading inside and point `aria-labelledby` at
it on the `<dialog hmhaDialog>` element, as in the example above. This is a
plain native attribute — no component API needed for it.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` (`model`) | `false` | Two-way bindable — `[(open)]="signal"`. Setting it calls `showModal()`/`close()`; closing by any means (Escape, backdrop click, a native `close()` call) syncs it back to `false`. |
| `dismissible` | `boolean` | `true` | `false` blocks both Escape and backdrop-click dismissal — for a dialog that must be resolved through its own content (a required choice), not dismissed casually. Content-driven `close()` calls (e.g. your own Cancel button calling `open.set(false)`) still work either way. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-dialog-bg` | `var(--hmha-color-surface-raised)` | base |
| `--hmha-dialog-fg` | `var(--hmha-color-text)` | base |

The backdrop uses `--hmha-color-backdrop` (not a component token — a
semantic one, since every overlay-ish surface will want the same scrim;
see `DECISIONS.md` fork 14).

## HmhaDrawer — an edge-anchored, full-height HmhaDialog

```html
<button type="button" (click)="navOpen.set(true)">Menu</button>

<dialog hmhaDialog hmhaDrawer [(open)]="navOpen" aria-labelledby="nav-title">
  <h2 id="nav-title">Navigation</h2>
  <nav>…</nav>
</dialog>

<!-- placement="end" — slides in from the trailing edge instead -->
<dialog hmhaDialog hmhaDrawer placement="end" [(open)]="filtersOpen" aria-labelledby="filters-title">
  <h2 id="filters-title">Filters</h2>
  …
</dialog>
```

A second attribute directive that stacks on `hmhaDialog` on the same native
`<dialog>` — it carries no logic of its own at all. `open`, `dismissible`,
the focus trap, Escape-to-close and backdrop-click dismissal all still come
from `HmhaDialog` + native `showModal()`, completely unchanged; `hmhaDrawer`
only changes where it sits (full height, anchored to an edge instead of
centered) via `dialog.css`'s own `[data-placement]` rules. See `DECISIONS.md`
fork 26 for why this is a directive, not a new component, and why there is no
separate persistent/push variant.

There is no open/close slide animation (yet) — it appears/disappears exactly
as instantly as a plain `HmhaDialog` does today; see fork 26 for why that was
the deliberate, reconsidered call rather than an oversight.

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `placement` | `'start' \| 'end'` | `'start'` | Which edge it's anchored to, using logical properties — `'start'` is the left edge in LTR, the right edge in RTL, and vice versa for `'end'`. |

`open` and `dismissible` both still come from `hmhaDialog`.

### Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-drawer-width` | `var(--hmha-layout-drawer-width)` (320px) | Declared on `:host([data-placement])` in `dialog.css`; override on your own `dialog[hmhaDialog][hmhaDrawer]` selector to resize it. |

`--hmha-dialog-bg`/`--hmha-dialog-fg` still apply — a drawer is still a
dialog visually, just repositioned.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
