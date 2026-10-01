# HmhaSwitch

```html
<label>
  <button hmhaSwitch [formControl]="notifications"></button>
  Enable notifications
</label>
```

An attribute directive on the native `<button>` — but unlike `HmhaInput`/
`HmhaCheckbox`/`HmhaRadio`, there is no reliable native `<input type="switch">`
to build on. This follows WAI-ARIA's own switch pattern instead:
`role="switch"` plus `aria-checked`, on a real `<button type="button">` so
you keep native keyboard activation (Space/Enter) and focus handling.
`type="button"` is forced by the directive to guard against accidental form
submission on click. `ControlValueAccessor` works with reactive forms
(`[formControl]`/`formControlName`) or template-driven forms (`ngModel`).

Because `<button>` *is* a labelable element (unlike `<fieldset>`, see
`radio/README.md`), it works with a plain wrapping `<label>` (shown above)
or with `HmhaField`'s normal `for`/`id` association — no special-casing
needed.

`aria-checked` is always present as the literal string `"true"` or
`"false"` — never omitted, since (unlike `aria-busy`) it's a required state
for the `switch` role, not an optional one. `data-checked` is a separate,
presence-based attribute for styling, kept apart from the ARIA state on
principle even though the two are always in sync.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-switch-size`. |
| `disabled` | `boolean` | `false` | Combines with Forms' `setDisabledState` — either can disable the control. |
| `invalid` | `boolean` | `false` | Combines with a wrapping `HmhaField`'s `error` — either sets `aria-invalid`/`data-invalid`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-switch-track-bg` | `var(--hmha-color-border-strong)` | base; re-pointed to `var(--hmha-color-danger)` when invalid |
| `--hmha-switch-track-bg-checked` | `var(--hmha-color-action)` | base; applied when `data-checked` |
| `--hmha-switch-thumb-bg` | `var(--hmha-color-surface)` | base |
| `--hmha-switch-size` | `var(--hmha-icon-md)` | base; re-pointed per `data-size` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
