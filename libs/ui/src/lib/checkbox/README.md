# HmhaCheckbox

```html
<label>
  <input type="checkbox" hmhaCheckbox [formControl]="subscribed" />
  Subscribe to updates
</label>
```

An attribute directive on the native `<input type="checkbox">` — `type` is
forced by the directive itself (unlike `HmhaInput`, its whole identity
depends on it), everything else stays native. `ControlValueAccessor` works
with reactive forms (`[formControl]`/`formControlName`) or template-driven
forms (`ngModel`).

For a single checkbox with an inline label, wrap it in a plain native
`<label>` — no `id`/`for` wiring needed, the browser associates them for
free. For hint/error/required support, wrap it in `HmhaField` instead — see
`field/README.md`'s `HMHA_FIELD` contract, which `HmhaCheckbox` consumes the
same way `HmhaInput` does. `HmhaCheckbox` also works fully standalone.

The check mark is rendered by the browser via CSS `accent-color`, not a
custom SVG — see `DECISIONS.md` fork 10 for why.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-checkbox-size` (reuses the `--hmha-icon-*` scale). |
| `disabled` | `boolean` | `false` | Combines with Forms' `setDisabledState` — either can disable the control. |
| `invalid` | `boolean` | `false` | Combines with a wrapping `HmhaField`'s `error` — either sets `aria-invalid`/`data-invalid`. |
| `indeterminate` | `boolean` | `false` | Sets the native `indeterminate` DOM property (not an attribute — it isn't one). Purely visual, unrelated to the checked value/CVA; used for a "select all" checkbox when only some items are selected (see `data-grid/README.md`). |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-checkbox-accent` | `var(--hmha-color-action)` | base; re-pointed to `var(--hmha-color-danger)` when invalid |
| `--hmha-checkbox-size` | `var(--hmha-icon-md)` | base; re-pointed per `data-size` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead. Because the check mark is browser-rendered via `accent-color`,
its shape/style can't be restyled beyond that token — see fork 10 for the
trade-off.
