# @halfmanhalfape/hmha-ui

A standalone, signals-based Angular component library for the Half Man
Half Ape design system — 24 components, zero `NgModule`s, every visual
value overridable at runtime through CSS custom properties.

- [Install](#install)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Theming](#theming)
- [Components](#components)
- [Forms](#forms)
- [Accessibility](#accessibility)

## Install

```bash
npm install @halfmanhalfape/hmha-ui @halfmanhalfape/hmha-tokens
```

Both packages together — `hmha-ui` is the components, `hmha-tokens` is
the design tokens (CSS custom properties + TypeScript types) they all
consume. `hmha-ui` has no visual styling at all without `hmha-tokens`'
CSS loaded somewhere on the page.

## Requirements

- **Angular 20 or 21** (`@angular/core`, `@angular/common`,
  `@angular/forms`, `@angular/platform-browser`, all in the same
  range), plus **`@angular/cdk`** 20–21. These are peer dependencies —
  npm will tell you if any are missing.
- **Standalone only.** There's no `NgModule` to import, anywhere in
  this library — import the component/directive classes you need
  directly into your own standalone component's `imports` array.
- **Works with or without Zone.js.** Every component is built on
  signals (`input()`, `model()`, `computed()`) and never depends on
  zone patching to update — so it's equally correct in a
  `provideZonelessChangeDetection()` app or a traditional one. Nothing
  further to configure either way.

## Quickstart

**1. Load the token CSS.** In `angular.json`, add it to your app's
`styles` array, before your own global stylesheet:

```json
"styles": [
  "node_modules/@halfmanhalfape/hmha-tokens/src/lib/_all.css",
  "src/styles.css"
]
```

**2. Import and use a component.** Every component is an attribute
directive on a native element (not a custom tag) — you get real
semantics, keyboard behaviour and form integration for free:

```ts
import { Component } from '@angular/core';
import { HmhaButton } from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'app-root',
  imports: [HmhaButton],
  template: `<button hmhaButton tone="primary">Save</button>`,
})
export class AppRoot {}
```

That's it — no providers, no setup beyond the CSS import. Light mode
and `comfortable` density are the defaults; see [Theming](#theming) to
change either.

## Theming

Full writeup: **[`docs/theming.md`](./docs/theming.md)**.

The short version: everything resolves to a `var(--hmha-*)` custom
property, nothing is hard-coded, and you can override any of it from
your own app's CSS — no fork, no new release needed. Two axes ship out
of the box:

```html
<html data-hmha-mode="dark" data-hmha-density="compact">
```

| Attribute | Values |
| --- | --- |
| `data-hmha-mode` | `light` (default) \| `dark` |
| `data-hmha-density` | `comfortable` (default) \| `compact` |

Both nest — a dark panel inside an otherwise-light page needs no extra
CSS. For overriding colours, fonts, or a single component's own look,
see the theming doc.

## Components

Each component documents its own inputs and its component-token
override API alongside its source — follow the link in the table for
the full reference.

| Component | Selector | Docs |
| --- | --- | --- |
| Button | `button[hmhaButton]` | [`src/lib/button/README.md`](./src/lib/button/README.md) |
| IconButton | `button[hmhaButton][hmhaIconButton]` | [`src/lib/button/README.md`](./src/lib/button/README.md) |
| Card | `hmha-card` | [`src/lib/card/README.md`](./src/lib/card/README.md) |
| Checkbox | `input[hmhaCheckbox]` | [`src/lib/checkbox/README.md`](./src/lib/checkbox/README.md) |
| Chip / ChipSet | `span[hmhaChip]`, `button[hmhaChip]`, `div[hmhaChipSet]` | [`src/lib/chip/README.md`](./src/lib/chip/README.md) |
| Combobox | `input[hmhaCombobox]`, `div[hmhaComboboxListbox]`, `div[hmhaComboboxOption]` | [`src/lib/combobox/README.md`](./src/lib/combobox/README.md) |
| Data Grid | `table[hmhaDataGrid]` (stacks on `HmhaTable`) | [`src/lib/data-grid/README.md`](./src/lib/data-grid/README.md) |
| Dialog | `dialog[hmhaDialog]` | [`src/lib/dialog/README.md`](./src/lib/dialog/README.md) |
| Drawer | `dialog[hmhaDialog][hmhaDrawer]` | [`src/lib/dialog/README.md`](./src/lib/dialog/README.md) |
| Divider | `hr[hmhaDivider]` | [`src/lib/divider/README.md`](./src/lib/divider/README.md) |
| Expansion Panel / Accordion | `details[hmhaExpansionPanel]`, `div[hmhaAccordion]` | [`src/lib/expansion-panel/README.md`](./src/lib/expansion-panel/README.md) |
| Field | `hmha-field` | [`src/lib/field/README.md`](./src/lib/field/README.md) |
| Icon | `hmha-icon` | [`src/lib/icon/README.md`](./src/lib/icon/README.md) |
| Input | `input[hmhaInput]` | [`src/lib/input/README.md`](./src/lib/input/README.md) |
| Menu | `div[hmhaMenu]`, `button[hmhaMenuTrigger]`, `button[hmhaMenuItem]` | [`src/lib/menu/README.md`](./src/lib/menu/README.md) |
| Pagination | `nav[hmhaPagination]` | [`src/lib/pagination/README.md`](./src/lib/pagination/README.md) |
| Radio / RadioGroup | `input[hmhaRadio]`, `fieldset[hmhaRadioGroup]` | [`src/lib/radio/README.md`](./src/lib/radio/README.md) |
| Select | `button[hmhaSelectTrigger]`, `div[hmhaSelectListbox]`, `div[hmhaSelectOption]` | [`src/lib/select/README.md`](./src/lib/select/README.md) |
| Stepper | `div[hmhaStepper]`, `div[hmhaStepList]`, `button[hmhaStep]`, `div[hmhaStepPanel]` | [`src/lib/stepper/README.md`](./src/lib/stepper/README.md) |
| Switch | `button[hmhaSwitch]` | [`src/lib/switch/README.md`](./src/lib/switch/README.md) |
| Table | `table[hmhaTable]`, `tr[hmhaTableRow]`, `th[hmhaTableHeaderCell]`, `td[hmhaTableCell]` | [`src/lib/table/README.md`](./src/lib/table/README.md) |
| Tabs | `div[hmhaTabs]`, `div[hmhaTabList]`, `button[hmhaTab]`, `div[hmhaTabPanel]` | [`src/lib/tabs/README.md`](./src/lib/tabs/README.md) |
| Toast | service-based, injected — see docs | [`src/lib/toast/README.md`](./src/lib/toast/README.md) |
| Tooltip | `[hmhaTooltip]` | [`src/lib/tooltip/README.md`](./src/lib/tooltip/README.md) |

Prefer a native-element attribute selector over a custom tag wherever
one fits (`button[hmhaButton]`, not `<hmha-button>`) — you keep real
keyboard behaviour, form submission and semantics for free. A custom
tag name only shows up where no native element fits (Dialog aside,
which is a real `<dialog>`; `hmha-card`, `hmha-field`, `hmha-icon` are
the only true custom elements in the library).

## Forms

Every form control (`Checkbox`, `Input`, `Radio`/`RadioGroup`,
`Switch`, `Combobox`) implements Angular's `ControlValueAccessor` — use
them with `formControlName`, `[formControl]`, or `[(ngModel)]` exactly
like a native form element:

```html
<form [formGroup]="form">
  <input hmhaInput formControlName="name" />
  <input type="checkbox" hmhaCheckbox formControlName="agree" />
</form>
```

Pair any control with `HmhaField` for a label, hint text and error
display wired together automatically — see
[`src/lib/field/README.md`](./src/lib/field/README.md).

## Accessibility

Every focusable component ships a token-driven `:focus-visible` ring,
and interactive patterns build on `@angular/cdk`'s `a11y`/`overlay`/
`listbox` rather than hand-rolled keyboard handling — roving tabindex,
focus trapping and ARIA roles follow established CDK/WAI-ARIA patterns
throughout. Every component has a Storybook story, and every story is
checked against `axe-core` (via Storybook's a11y addon) as part of this
repo's own test workflow. Several components (Dialog, Drawer, Field,
and others — check a component's own `.spec.ts`) additionally run a
dedicated `axe-core` pass in both colour modes at the unit-test level;
that's not yet uniform across every component.
