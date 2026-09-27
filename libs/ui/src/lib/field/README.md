# HmhaField

```html
<hmha-field label="Email" hint="We'll never share it." required="true">
  <input hmhaInput type="email" />
</hmha-field>
```

A custom element — no native element wraps a label, a control, and
conditional hint/error text as one unit. Renders a `<label>`, projects the
control via the default content slot, then either the error (if present) or
the hint below it — never both, error takes precedence.

`HmhaField` renders no background of its own — it's a transparent layout
wrapper, not a surface. Its hint/error text tokens are only guaranteed
adequate contrast against a page that has already applied
`--hmha-color-bg` (or a surface like `HmhaCard`'s `--hmha-card-bg`) —
exactly what `apps/sandbox/src/styles.css`'s body reset does. Don't drop a
bare `<hmha-field>` onto an unstyled page with no token CSS loaded.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` (required) | — | Rendered in the `<label>`. |
| `hint` | `string` | — | Shown when there is no `error`. |
| `error` | `string` | — | Shown instead of `hint`, in `role="alert"`. Presence drives `invalid`. |
| `required` | `boolean` | `false` | Shows an `aria-hidden` `*` next to the label. |

## The `HMHA_FIELD` contract — how a control wires itself up

`HmhaField` doesn't know what it's wrapping. Instead it provides
`HMHA_FIELD`, an `InjectionToken<HmhaFieldContext>`, that any control
optionally injects to reflect the field's state onto itself:

```ts
export interface HmhaFieldContext {
  readonly controlId: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly describedBy: Signal<string | null>;
}
```

A control consumes it like this:

```ts
export class HmhaInput {
  private readonly field = inject(HMHA_FIELD, { optional: true });
  // host: {
  //   '[attr.id]': 'field?.controlId() ?? null',
  //   '[attr.aria-invalid]': 'field?.invalid() ? true : null',
  //   '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  //   '[attr.aria-required]': 'field?.required() ? true : null',
  // }
}
```

`optional: true` matters — every control must also work standalone, outside
an `HmhaField`, with `field` simply `null`. This is the same contract
`HmhaInput`, `HmhaCheckbox`, `HmhaRadioGroup` and `HmhaSwitch` all consume;
build a custom control the same way to integrate with `HmhaField` too.

For a plain native element you don't control the class of (or in a
template, without writing a directive), `HmhaField` also exports itself as
`hmhaField` (`exportAs`), so a template reference works instead:

```html
<hmha-field label="Company" hint="Optional." #f="hmhaField">
  <input [attr.id]="f.controlId()" [attr.aria-describedby]="f.describedBy()" />
</hmha-field>
```

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-field-label-fg` | `var(--hmha-color-text)` | base |
| `--hmha-field-hint-fg` | `var(--hmha-color-text-muted)` | base |
| `--hmha-field-error-fg` | `var(--hmha-color-danger-text)` | base |
| `--hmha-field-required-fg` | `var(--hmha-color-danger)` | base |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
