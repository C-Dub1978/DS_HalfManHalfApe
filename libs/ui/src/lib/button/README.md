# HmhaButton

```html
<button hmhaButton tone="primary" size="md">Save</button>
```

An attribute directive on the native `<button>` element — you keep native
keyboard behaviour, form submission and `type`.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'primary' \| 'danger' \| 'warning' \| 'success'` | `'neutral'` | Reflected as `data-tone`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-control-height*`. |
| `loading` | `boolean` | `false` | Sets `aria-busy` and disables the control. Does not change label content — pair with your own spinner/`aria-live` region if you need one. |
| `disabled` | `boolean` | `false` | Sets the native `disabled` attribute. |

## Component tokens — the override API

Declared on `:host` in `button.css`, consumed in the same file. Set these on
the host (or a variant's attribute selector) to override; do not reach past
them into internal structure.

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-button-bg` | `var(--hmha-color-surface-raised)` | base; re-pointed per `data-tone` |
| `--hmha-button-bg-hover` | `var(--hmha-color-bg-subtle)` | base; re-pointed per `data-tone` |
| `--hmha-button-bg-active` | `var(--hmha-color-bg-subtle)` | base; re-pointed per `data-tone` |
| `--hmha-button-fg` | `var(--hmha-color-text)` | base; re-pointed per `data-tone` |
| `--hmha-button-border` | `var(--hmha-color-border-strong)` | base; re-pointed per `data-tone` |

`danger`, `warning` and `success` have no hover/active token roles of their
own yet (see `tokens/semantic/color.*.json`), so their hover/active state
currently pins to the tone's base fill rather than shifting shade. Add
`*-hover`/`*-active` semantic roles first if that changes.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
