# Working agreement — Acme Design System

You are working in a **token-driven Angular design system and component library**.
Phase 1 (the token foundation) is complete and checked in. Read this file before
making changes; it records decisions that are already settled.

## Non-negotiable invariants

Six architectural decisions are made. **Do not relitigate them or quietly work
around them.** If a task appears to require breaking one, stop and say so.

1. **Angular 20 is the floor; the library must work on 20 through current and
   forward.** The workspace is built on Angular 20 so that `ng-packagr`'s
   partial-Ivy output stays forward-compatible. Never raise the workspace's own
   Angular version to gain an API. Peer range: `">=20.0.0 <22.0.0"`.
2. **Standalone only. Zero `NgModule`s** — not even one convenience re-export.
   Do not add `standalone: true`; it is the default from v19 and stating it is
   noise.
3. **Signals only for reactivity.** `input()`, `input.required()`, `output()`,
   `model()`, `viewChild()`, `contentChildren()`, `linkedSignal`. No
   `@Input()`/`@Output()` decorators, no `EventEmitter`, no `QueryList`.
4. **Zoneless-safe, always.** The sandbox runs `provideZonelessChangeDetection()`.
   Never drive a view update from `setTimeout`, `NgZone.onStable`, or anything
   that assumes zone patching.
5. **No hard-coded values in `libs/ui`.** Every colour, dimension, radius,
   duration and font value resolves to a `var(--ds-*)` custom property. Stylelint
   enforces this and CI fails on a violation. If a component needs a value that
   no token carries, **a token is missing** — add it to `tokens/` and rebuild.
   Do not inline the literal.
6. **Angular components, not custom elements.** No `createCustomElement`, no
   `ViewEncapsulation.ShadowDom`. Emulated encapsulation everywhere.

## Token architecture

Three tiers. **References point one direction only: down.**

| Tier | Example | Who may reference it |
| --- | --- | --- |
| primitive | `--ds-blue-600`, `--ds-space-4` | semantic tier ONLY |
| semantic | `--ds-color-action`, `--ds-control-height` | components and applications |
| component | `--ds-button-bg` | declared by one component; consumers may set it |

- Source of truth is DTCG JSON in `tokens/`. Never edit the built CSS.
- `tokens/semantic/color.light.json` and `color.dark.json` must define the
  **same 29 role names**. Adding a role to one means adding it to both.
- Density owns exactly seven roles (`control.height`, `height-sm`, `height-lg`,
  `padding-x`, `padding-y`, `gap`, `space.stack`). Resist growing that set — the
  more density touches, the more it becomes a second theme to maintain.
- Name tokens by **role, not appearance**. `--ds-color-action`, never
  `--ds-color-blue`.
- Every fill role has a matching `text-on-*` foreground role, and
  `scripts/check-contrast.mjs` asserts the pair in both modes. Adding a fill
  means adding its foreground.
- **`outputReferences: true` in `style-dictionary.config.mjs` is load-bearing.**
  It keeps `var()` chains in the output; flattening them to literals breaks
  runtime theming entirely. Do not remove it.
- **Output layer order is load-bearing.** Each axis emits its default on `:root`
  BEFORE its attribute variants, so a pinned root attribute wins on source order
  while a nested subtree resolves from its nearest ancestor. `concat-layers.mjs`
  exists to guarantee that order. Do not reorder, and do not replace it with an
  `@import` graph.

## Theming

Two independent, composable axes as attributes — never as separate stylesheets,
and never as a theme object injected through DI:

- `data-ds-mode="light|dark"` — re-points semantic colour roles.
- `data-ds-density="comfortable|compact"` — re-points the control roles.

Both nest. A dark panel inside a light page requires no extra CSS.
`prefers-color-scheme` applies only under `:root:not([data-ds-mode])`, so the OS
preference works until an app pins a mode and then gets out of the way.

## Component conventions

- **Prefer an attribute selector on a native element**: `button[dsButton]`, not
  `<ds-button>`. You inherit real semantics, keyboard behaviour, form submission
  and `type`. Use a custom element name only where no native element fits
  (Dialog, Tabs, Toast).
- **Variants are `data-*` attributes, not classes** — set via the `host` object,
  styled with `:host([data-tone="primary"])`. A consumer's stray class cannot
  collide with an attribute selector.
- **Class names drop the suffix**: `DsButton`, not `DsButtonComponent`.
- **Component tokens are the public override API.** Declare them on `:host`, then
  consume them in the same file. Document them in the component's README.
- `ChangeDetectionStrategy.OnPush` on every component.
- Every focusable component ships a token-driven `:focus-visible` ring. No
  exceptions.
- Use `@angular/cdk` (`a11y`, `overlay`, `listbox`) for focus traps, overlay
  positioning and keyboard interaction patterns. Do not hand-roll them.
- Forms: `ControlValueAccessor` is still the integration point in Angular 20 —
  signals have not replaced it. Hold the value in a signal internally and let the
  CVA methods write to it.

### The canonical component

```ts
@Component({
  selector: 'button[dsButton]',
  template: '<ng-content />',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.aria-busy]': 'loading() || null',
    '[disabled]': 'disabled() || loading()',
  },
})
export class DsButton {
  readonly tone = input<DsTone>('neutral');
  readonly size = input<DsSize>('md');
  readonly loading  = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
```

```css
/* button.css — declare the override API, then consume it.
   Not one literal value in the file. */
:host {
  --ds-button-bg: var(--ds-color-surface-raised);
  --ds-button-fg: var(--ds-color-text);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-control-gap);
  min-height: var(--ds-control-height);
  padding-inline: var(--ds-control-padding-x);
  background: var(--ds-button-bg);
  color: var(--ds-button-fg);
  border-radius: var(--ds-radius-control);
  border: var(--ds-border-width) solid transparent;
}
:host([data-tone="primary"]) {
  --ds-button-bg: var(--ds-color-action);
  --ds-button-fg: var(--ds-color-text-on-action);
}
:host([data-tone="primary"]:hover) { --ds-button-bg: var(--ds-color-action-hover); }
:host([data-size="sm"]) { min-height: var(--ds-control-height-sm); }
:host(:focus-visible) {
  outline: var(--ds-focus-width) solid var(--ds-color-focus);
  outline-offset: var(--ds-focus-offset);
}
```

## Repository layout

```
tokens/                   DTCG JSON — the source of truth
libs/
  tokens/                 build output (git-ignored) → @acme/ds-tokens
  ui/                     Angular components         → @acme/ds-ui
  icons/                  SVG sprite + typed registry
apps/
  sandbox/                the dog-food app; runs zoneless
  docs/                   Storybook
scripts/                  token build + CI guards
```

## Commands

```bash
npm run tokens            # build the 5 layers, concatenate in order
npm run tokens:contrast   # assert every declared pair, both modes
npm run tokens:watch      # rebuild on token edits
npm run lint:css          # the no-literals guard
npm run ci                # everything, in CI order
```

## Current state

**Phase 1 is done**: 37 primitives, 59 semantic roles, both axes, the build
pipeline, and the two CI guards. `reference/tokens.css` is a checked-in copy of
the expected output — compare against it after your first `npm run tokens`.

**Phase 1's remaining gate**: a sandbox page containing *no components* — plain
divs and buttons styled only with `var(--ds-*)` — where flipping
`data-ds-mode` and `data-ds-density` on `<html>` re-themes everything with no
rebuild, and a nested panel can hold the opposite mode. Build that before any
component.

## Next task — phase 2

1. Scaffold the workspace on Angular 20:
   `npx @angular/cli@20 new ds-workspace --create-application=false --style=css`
   then `ng generate library ds-ui` and `ng generate application sandbox`.
2. `provideZonelessChangeDetection()` in the sandbox's app config.
3. `ds-core`: the generated types from `libs/tokens`, plus CDK setup.
4. Wire `npm run ci` into CI, including a **two-version install matrix**:
   install the packed library into an Angular 20 app and a current-version app
   and assert both render. This is the gate that ends phase 2.
5. Build `DsButton` per the recipe above, with a documented component-token
   table and an axe-clean interaction test.

Then phase 3 wave 1: Icon system, Button, Card. Waves and scope are in
`DECISIONS.md` — **Table / Data Grid is explicitly out of v1.**
