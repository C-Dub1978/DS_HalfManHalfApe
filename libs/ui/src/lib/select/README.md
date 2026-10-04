# HmhaSelect

```html
<button [hmhaSelectTrigger]="countryListbox" [formControl]="country">
  Choose a country
</button>
<ng-template #countryListbox>
  <div hmhaSelectListbox cdkListbox>
    <div hmhaSelectOption cdkOption="us">United States</div>
    <div hmhaSelectOption cdkOption="ca">Canada</div>
    <div hmhaSelectOption cdkOption="mx" cdkOptionDisabled>Mexico</div>
  </div>
</ng-template>
```

Three pieces, each built on `@angular/cdk/listbox` directly rather than
re-implementing selection or keyboard handling — `CdkListbox`/`CdkOption`
already supply full ARIA (`role="listbox"`/`"option"`, `aria-selected`,
`aria-disabled`) and keyboard navigation (arrows, Home/End, typeahead).
Every piece here stacks our own component with CDK's directive on the
same host element; ours only styles and bridges, per CLAUDE.md's "use
`@angular/cdk`... do not hand-roll" guidance.

- **`HmhaSelectTrigger`** (`button[hmhaSelectTrigger]`) is the
  `ControlValueAccessor` surface — bind `[formControl]`/`formControlName`
  or `ngModel` here, the same as `HmhaInput`. Built on `hmhaOverlay()`,
  connected-positioned below the trigger. `aria-haspopup="listbox"` +
  `aria-expanded`, and returns focus to itself when the listbox closes by
  any path (Escape, an outside click, an option picked, or `close()`).
- **`HmhaSelectListbox`** (`div[hmhaSelectListbox]`, stacked with
  `cdkListbox`) bridges `CdkListbox`'s own value/selection to the trigger:
  syncs the trigger's current value in, and calls back into the trigger
  on `cdkListboxValueChange`, which closes the popup — picking an option
  always closes it, matching native `<select>`. Reopening re-focuses
  whichever option is currently selected, not always the first — that's
  `CdkListbox.focus()`'s own built-in behavior.
- **`HmhaSelectOption`** (`div[hmhaSelectOption]`, stacked with
  `cdkOption`) styles mostly by hooking into CDK's own `.cdk-option-active`/
  `[aria-disabled]` rather than tracking either state again. The one piece
  of real content it adds itself: a trailing `<hmha-icon name="check">`
  for the selected option. An earlier colored-text treatment failed WCAG
  AA contrast specifically when an option was both selected and
  active/hovered (blue text on the active background, 4.46:1) — a
  checkmark sidesteps text-contrast entirely.

## What the trigger displays when closed is the consumer's job

Unlike a native `<select>`, the options here only exist inside the
overlay while it's open — there's no persistent registry to pull a label
from automatically. The trigger's own content (`<ng-content />`) is
whatever the consumer puts there; showing the selected option's text
(e.g. `{{ selectedLabel() }}`, computed from the same value the
`FormControl` holds) is on the consumer side. A future iteration could
auto-derive this; it isn't in scope now.

## Inputs

| Component | Input | Type | Notes |
| --- | --- | --- | --- |
| `HmhaSelectTrigger` | `hmhaSelectTrigger` | `TemplateRef<unknown>` (required) | The listbox content. |
| `HmhaSelectTrigger` | `invalid` | `boolean` | Combines with a wrapping `HmhaField`'s `error` — either sets `aria-invalid`/`data-invalid`. |
| `HmhaSelectTrigger` | `disabled` | `boolean` | Combines with Forms' `setDisabledState`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-select-trigger-bg` | `var(--hmha-color-surface)` | `HmhaSelectTrigger` |
| `--hmha-select-trigger-fg` | `var(--hmha-color-text)` | `HmhaSelectTrigger` |
| `--hmha-select-listbox-bg` | `var(--hmha-color-surface-raised)` | `HmhaSelectListbox` |
| `--hmha-select-listbox-fg` | `var(--hmha-color-text)` | `HmhaSelectListbox` |
| `--hmha-select-option-bg-active` | `var(--hmha-color-bg-subtle)` | `HmhaSelectOption`; applied on `.cdk-option-active` or hover |
| `--hmha-select-option-fg` | `var(--hmha-color-text)` | `HmhaSelectOption` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
