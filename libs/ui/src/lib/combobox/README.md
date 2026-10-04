# HmhaCombobox

```html
<input [hmhaCombobox]="countryListbox" [formControl]="country" />
<ng-template #countryListbox>
  <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
    @for (option of filteredCountries(); track option) {
      <div hmhaComboboxOption [cdkOption]="option">{{ option }}</div>
    }
  </div>
</ng-template>
```

Three pieces, mirroring `HmhaSelect`'s shape but swapping the button
trigger for a real `<input>` — the hardest a11y problem in Wave 3 (fork
06), saved for last because it wants Menu's and Select's foundations
already proven. Built on `@angular/cdk/listbox`, same as Select, but in
**active-descendant mode**: real DOM focus never leaves the input while
suggestions are open — that's the whole point of a combobox, since the
user has to keep typing. `aria-activedescendant` on the input tracks the
highlighted suggestion virtually instead.

- **`HmhaComboboxInput`** (`input[hmhaCombobox]`) is the
  `ControlValueAccessor` surface. `role="combobox"`,
  `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` (the
  listbox's id), `aria-activedescendant` (the highlighted option's id).
  Opens on every `input` event (typing) and on `ArrowDown` when closed.
  Because CdkListbox's own `(keydown)` host listener lives on the listbox
  element — which never gets real focus in this mode — this input
  forwards Arrow/Home/End/Enter keydowns to it directly via
  `dispatchEvent()` rather than relying on bubbling, and reads the
  resulting active option back synchronously right after (`dispatchEvent`
  is synchronous, so by the time it returns every listener — including
  CdkListbox's — has already run).
- **`HmhaComboboxListbox`** (`div[hmhaComboboxListbox]`, stacked with
  `cdkListbox` — **must** also carry `cdkListboxUseActiveDescendant="true"`)
  forwards a committed selection (`cdkListboxValueChange`) back to the
  input, which closes the popup and sets the input's text — picking an
  option always closes it, same as Select.
- **`HmhaComboboxOption`** (`div[hmhaComboboxOption]`, stacked with
  `cdkOption`) is mostly a styling wrapper, simpler than
  `HmhaSelectOption`: nothing here ever renders a "selected" checkmark,
  because nothing is ever persistently selected the way a Select option
  can be — a combobox's options are suggestions; picking one replaces the
  input's text rather than leaving an option checked. It does one other
  thing: calls `preventDefault()` on its own `(mousedown)`. A `<div>`
  isn't focusable by mouse by default, so without this, clicking an
  option blurs the input — moving real focus to `<body>`, since nothing
  else claims it — which breaks the one guarantee this whole component is
  built on. Only caught via a real pointer interaction (Storybook's
  `userEvent`, not Karma's `.click()` or a synthetic `dispatchEvent`,
  neither of which reproduces the browser's actual default focus-shift).

## No code/label split, and filtering is the consumer's job

Unlike `HmhaSelect`, there's no separate "value vs. display label" here —
this is a plain text field, so its `ControlValueAccessor` value is simply
whatever text ends up in the box, same as `HmhaInput`. An option's
`cdkOption` value **is** its display text; picking one sets the input to
that exact string. And exactly like Select's options, filtering which
suggestions render as the user types is the consumer's own job — this
component only wires the ARIA mechanics and keyboard interaction, never
text matching. Different apps filter differently (case sensitivity, fuzzy
matching, debounced remote search); baking in one approach would be
presumptuous.

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-combobox-input-bg` | `var(--hmha-color-surface)` | `HmhaComboboxInput` |
| `--hmha-combobox-input-fg` | `var(--hmha-color-text)` | `HmhaComboboxInput` |
| `--hmha-combobox-listbox-bg` | `var(--hmha-color-surface-raised)` | `HmhaComboboxListbox` |
| `--hmha-combobox-listbox-fg` | `var(--hmha-color-text)` | `HmhaComboboxListbox` |
| `--hmha-combobox-option-bg-active` | `var(--hmha-color-bg-subtle)` | `HmhaComboboxOption`; applied on `.cdk-option-active` or hover |
| `--hmha-combobox-option-fg` | `var(--hmha-color-text)` | `HmhaComboboxOption` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
