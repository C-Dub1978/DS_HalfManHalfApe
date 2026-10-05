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

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
