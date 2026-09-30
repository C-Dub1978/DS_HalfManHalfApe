# HmhaRadioGroup / HmhaRadio

```html
<fieldset hmhaRadioGroup [formControl]="plan">
  <legend>Choose a plan</legend>
  <label><input type="radio" hmhaRadio value="basic" /> Basic</label>
  <label><input type="radio" hmhaRadio value="pro" /> Pro</label>
</fieldset>
```

Two components, deliberately asymmetric — see `DECISIONS.md` fork 09. The
**group** (`fieldset[hmhaRadioGroup]`) is the real form control: it holds
the selected value, implements `ControlValueAccessor`, and generates the
shared `name` every radio in it needs (native radio grouping — arrow-key
navigation, "only one checked" — is driven entirely by matching `name`
attributes, not DOM nesting). Individual **radios**
(`input[hmhaRadio]`) hold no state of their own; each injects the group
(required, not optional) to read its shared name/value and to select
itself.

**A lone `hmhaRadio` outside an `hmhaRadioGroup` throws at creation time.**
That's deliberate — a radio button divorced from a group has no value to
compare itself against and no name to share, so it cannot function. This
isn't a limitation to work around; it's the same reason a native
`<input type="radio">` alone, with no siblings sharing its `name`, doesn't
make sense either.

Give the group a `<legend>` for its own label — that's what `<fieldset>`
uses natively, and neither component needs any extra API for it. Give each
radio its own `<label>Text</label>` wrapper the same way `HmhaCheckbox`
does. For hint/error/required support, wrap the group in `HmhaField`
instead of using `<legend>` — see below.

The check mark is rendered by the browser via CSS `accent-color`, same as
`HmhaCheckbox` — see `DECISIONS.md` fork 10.

## `HmhaRadioGroup` inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Sets the native `disabled` attribute on the `<fieldset>`, which cascades to every radio inside it for free. |
| `invalid` | `boolean` | `false` | Combines with a wrapping `HmhaField`'s `error` — either sets `aria-invalid`/`data-invalid` on the fieldset. |

Because `<fieldset>` isn't a labelable element, wrapping the group in
`HmhaField` uses `aria-labelledby` (via `HmhaFieldContext.labelId`) instead
of `for`/`id` — see `field/README.md`. `required` on a wrapping `HmhaField`
propagates to the fieldset's `aria-required` **and** to every individual
radio's native `required` attribute, so the browser's own "you must pick
one" validation works per radio, the way native radio groups expect it.

## `HmhaRadio` inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` (required) | — | The value this radio represents when selected. String-typed for v1 — stringify if you need something else. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-radio-size` (reuses the `--hmha-icon-*` scale, like `HmhaCheckbox`). |
| `disabled` | `boolean` | `false` | This radio only — doesn't affect its siblings. For disabling the whole group, set `disabled` on the group, not each radio. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-radio-accent` | `var(--hmha-color-action)` | base (declared on `HmhaRadio`) |
| `--hmha-radio-size` | `var(--hmha-icon-md)` | base; re-pointed per `data-size` |
| `--hmha-radio-group-gap` | `var(--hmha-space-stack)` | base (declared on `HmhaRadioGroup`) |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead. Because the check mark is browser-rendered via `accent-color`,
its shape/style can't be restyled beyond that token — see fork 10.
