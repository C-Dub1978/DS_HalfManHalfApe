# HmhaInput

```html
<hmha-field label="Email" required="true">
  <input hmhaInput type="email" [formControl]="email" />
</hmha-field>
```

An attribute directive on the native `<input>` (or `<textarea>`, below) — you keep native keyboard
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
| `autoGrow` | `boolean` | `false` | `<textarea>` only. Grows with the content, then scrolls past `--hmha-input-max-block-size`. See below. |
| `maxCharacters` | `number \| null` | `null` | A soft character limit, counted and announced by a wrapping `HmhaField`. See below. |

## Multi-line text: `<textarea hmhaInput>`

```html
<hmha-field label="Description" hint="Shown on the title's detail page.">
  <textarea hmhaInput rows="4" [formControl]="description"></textarea>
</hmha-field>
```

The same component on a native `<textarea>`: the same Forms integration,
`HmhaField` wiring, `disabled`/`invalid`, focus ring and tokens. There's
no separate textarea component.

- **`rows`** sets the starting height, natively.
- **It resizes vertically only.** The user can drag it taller; sideways
  would break the layout around it.
- **`size`** doesn't apply: it only sets a single-line input's minimum
  height, which `rows` overrides.

**`autoGrow`** makes it grow with its content as the user types, then
scroll once it reaches `--hmha-input-max-block-size` (no cap by default).
It's plain CSS (`field-sizing: content`), so no script runs as people
type. Because `field-sizing` ignores `rows`, the starting height comes from
`--hmha-input-auto-grow-rows` (3 lines by default), and the drag handle is
removed, since dragging would fix the height and stop it growing. Verified
in Chromium and Firefox. A browser without `field-sizing` keeps `rows` and
the drag handle instead: nothing breaks, it just doesn't grow by itself.

```html
<textarea hmhaInput autoGrow style="--hmha-input-max-block-size: 20rem" [formControl]="description"></textarea>
```

## Character limits: `maxCharacters`

```html
<hmha-field label="Description" hint="Shown on the title's detail page.">
  <textarea hmhaInput autoGrow [maxCharacters]="500" [formControl]="description"></textarea>
</hmha-field>
```

A wrapping `HmhaField` shows "You have 20 characters remaining" under the
control, tied to it with `aria-describedby`, and updates as the user types
or as your form sets the value. It works on `<input hmhaInput>` too.

**It's a soft limit.** Typing and pasting past it still work. Over the
limit the message turns to the error colour and says "You have 12
characters too many", and the control goes invalid (`aria-invalid`, red
border). There's no native `maxlength`, which silently cuts off pasted
text so someone can lose the end of what they pasted without noticing.
**To stop saving, add your own validator** with the same number:
`Validators.maxLength(500)`.

**Screen readers** hear the count when they reach the field. While typing,
it's announced politely only once 20% or less of the limit remains, or it's
over, and only after typing pauses, so "460 remaining" isn't read out at
every pause.

**Characters are counted as people see them:** an emoji counts as one, not
the two units JavaScript's `.length` reports. Count the same way on your
server (`[...text].length` in JavaScript, or code points in Java) so the
two limits agree. `characterCount` is also a public signal on the
component, if you want the number yourself.

Without a wrapping `HmhaField` there's nowhere to show the message: the
control still goes invalid over the limit, and you can render
`characterCount` yourself.

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-input-bg` | `var(--hmha-color-surface)` | base |
| `--hmha-input-fg` | `var(--hmha-color-text)` | base |
| `--hmha-input-border` | `var(--hmha-color-border)` | base; re-pointed to `var(--hmha-color-danger)` when invalid |
| `--hmha-input-border-focus` | `var(--hmha-color-focus)` | base |
| `--hmha-input-auto-grow-rows` | `3` | `<textarea autoGrow>`: the starting height, in lines. |
| `--hmha-input-max-block-size` | `none` | `<textarea autoGrow>`: the height where it stops growing and scrolls. |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
