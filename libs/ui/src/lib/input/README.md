# HmhaInput

```html
<hmha-field label="Email" required="true">
  <input hmhaInput type="email" [formControl]="email" />
</hmha-field>
```

An attribute directive on the native `<input>` — you keep native keyboard
behaviour, `type`, `placeholder`, autofill, and `ControlValueAccessor` works
with reactive forms (`[formControl]`/`formControlName`) or template-driven
forms (`ngModel`) the same as any native control. `type` is whatever you set
natively; `HmhaInput` doesn't own or restrict it.

Inside an `HmhaField`, `id`/`aria-describedby`/`aria-required` and the
invalid state wire themselves up automatically via the `HMHA_FIELD` contract
— see `field/README.md`. `HmhaInput` also works standalone, outside any
`HmhaField`.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-control-height*`. |
| `disabled` | `boolean` | `false` | Combines with Forms' `setDisabledState` — either can disable the control. |
| `invalid` | `boolean` | `false` | Combines with a wrapping `HmhaField`'s `error` — either sets `aria-invalid`/`data-invalid`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-input-bg` | `var(--hmha-color-surface)` | base |
| `--hmha-input-fg` | `var(--hmha-color-text)` | base |
| `--hmha-input-border` | `var(--hmha-color-border)` | base; re-pointed to `var(--hmha-color-danger)` when invalid |
| `--hmha-input-border-focus` | `var(--hmha-color-focus)` | base |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
