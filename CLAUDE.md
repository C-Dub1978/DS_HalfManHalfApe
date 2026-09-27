# Working agreement — Half Man Half Ape Design System

You are a design architect and expert, and a frontend engineer fluent in Typescript
and Angular.You are working in a
**token-driven Angular design system and component library**. Phase 1 (the token
foundation) is complete and checked in. Read this file before making changes; it
records decisions that are already settled.

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
   duration and font value resolves to a `var(--hmha-*)` custom property. Stylelint
   enforces this and CI fails on a violation. If a component needs a value that
   no token carries, **a token is missing** — add it to `tokens/` and rebuild.
   Do not inline the literal.
6. **Angular components, not custom elements.** No `createCustomElement`, no
   `ViewEncapsulation.ShadowDom`. Emulated encapsulation everywhere.

## Token architecture

Three tiers. **References point one direction only: down.**

| Tier | Example | Who may reference it |
| --- | --- | --- |
| primitive | `--hmha-blue-600`, `--hmha-space-4` | semantic tier ONLY |
| semantic | `--hmha-color-action`, `--hmha-control-height` | components and applications |
| component | `--hmha-button-bg` | declared by one component; consumers may set it |

- Source of truth is DTCG JSON in `tokens/`. Never edit the built CSS.
- `tokens/semantic/color.light.json` and `color.dark.json` must define the
  **same 29 role names**. Adding a role to one means adding it to both.
- Density owns exactly seven roles (`control.height`, `height-sm`, `height-lg`,
  `padding-x`, `padding-y`, `gap`, `space.stack`). Resist growing that set — the
  more density touches, the more it becomes a second theme to maintain.
- Name tokens by **role, not appearance**. `--hmha-color-action`, never
  `--hmha-color-blue`.
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

- `data-hmha-mode="light|dark"` — re-points semantic colour roles.
- `data-hmha-density="comfortable|compact"` — re-points the control roles.

Both nest. A dark panel inside a light page requires no extra CSS.
`prefers-color-scheme` applies only under `:root:not([data-hmha-mode])`, so the OS
preference works until an app pins a mode and then gets out of the way.

## Component conventions

- **Prefer an attribute selector on a native element**: `button[hmhaButton]`, not
  `<hmha-button>`. You inherit real semantics, keyboard behaviour, form submission
  and `type`. Use a custom element name only where no native element fits
  (Dialog, Tabs, Toast).
- **Variants are `data-*` attributes, not classes** — set via the `host` object,
  styled with `:host([data-tone="primary"])`. A consumer's stray class cannot
  collide with an attribute selector.
- **Class names drop the suffix**: `HmhaButton`, not `HmhaButtonComponent`.
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
  selector: 'button[hmhaButton]',
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
export class HmhaButton {
  readonly tone = input<HmhaTone>('neutral');
  readonly size = input<HmhaSize>('md');
  readonly loading  = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
```

```css
/* button.css — declare the override API, then consume it.
   Not one literal value in the file. */
:host {
  --hmha-button-bg: var(--hmha-color-surface-raised);
  --hmha-button-fg: var(--hmha-color-text);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--hmha-control-gap);
  min-height: var(--hmha-control-height);
  padding-inline: var(--hmha-control-padding-x);
  background: var(--hmha-button-bg);
  color: var(--hmha-button-fg);
  border-radius: var(--hmha-radius-control);
  border: var(--hmha-border-width) solid transparent;
}
:host([data-tone="primary"]) {
  --hmha-button-bg: var(--hmha-color-action);
  --hmha-button-fg: var(--hmha-color-text-on-action);
}
:host([data-tone="primary"]:hover) { --hmha-button-bg: var(--hmha-color-action-hover); }
:host([data-size="sm"]) { min-height: var(--hmha-control-height-sm); }
:host(:focus-visible) {
  outline: var(--hmha-focus-width) solid var(--hmha-color-focus);
  outline-offset: var(--hmha-focus-offset);
}
```

## Repository layout

```
tokens/                   DTCG JSON — the source of truth
libs/
  tokens/                 build output (git-ignored) → @halfmanhalfape/hmha-tokens
  ui/                     Angular components         → @halfmanhalfape/hmha-ui
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

## Storybook stories

The component library lives in `libs/ui`, and its Storybook config is in `libs/ui/.storybook`.

- **`libs/ui/.storybook/preview.ts` is what injects global styling** — the
  generated token CSS (`libs/tokens/src/lib/_all.css`) and a small canvas
  reset (`preview.css`, mirroring `apps/sandbox/src/styles.css`). The
  `storybook`/`build-storybook` architect targets point at `hmha-ui:build`
  (the `ng-packagr` library build), which has no global-styles concept —
  only `preview.ts` can provide one. If a story ever renders with no colors,
  wrong font, or a white canvas, check that these imports are still there
  before assuming a component regressed.
- **Every component in `libs/ui` needs a colocated story file**, in the same
  folder as its component/template/stylesheet, named after the component's
  own filename — `button.ts` → `button.stories.ts`,
  `icon-button.ts` → `icon-button.stories.ts`. Mirror the real filename, not a
  generic `<component-name>` guess.
- **Before writing or updating any story, call the
  `get-storybook-story-instructions` tool from the `storybook` MCP server and
  follow it exactly.** Don't write stories from memory. If that MCP server
  doesn't respond, stop and say so rather than guessing at the story format —
  Storybook is probably not running.
- Each story file showcases **all** of the component's variants, sizes, and
  states (disabled, error, loading, etc.), with Storybook controls
  (`argTypes`) wired to its inputs — not just one default example.
- After writing stories, use the `storybook` MCP tools to preview them and
  confirm they render without errors.

## Working through Wave 2

Wave 2 is built **one step at a time**, not in a batch:

- Work on exactly one step from the Wave 2 tracker (in `DECISIONS.md`) at a
  time. When a step is complete, summarize what you did, update the
  tracker's checklist and CURRENT STEP marker, and **stop**. Do not start the
  next step until explicitly told to continue, even if the next step seems
  obvious.
- A step counts as **done** only when all four hold:
  1. Unit tests pass.
  2. `libs/ui` builds (`npm run build:lib`).
  3. Lint is clean (`npm run lint:css`, `npm run lint:standalone`).
  4. Its Storybook story renders without errors.
- `DECISIONS.md`'s **Wave 2 progress** section is the single source of truth
  for what step is current — read it before doing any Wave 2 work, and update
  it as part of finishing each step. A new session picking up Wave 2 work
  starts there.

## Current state

Phases 1 and 2 are done (token foundation; workspace scaffold,
`provideZonelessChangeDetection()`, the two-version install matrix,
`HmhaButton`). Phase 3 wave 1 is done too: the Icon system (generated from
Lucide via `scripts/generate-icons.mjs`), `HmhaButton`, `HmhaIconButton` and
`HmhaCard` — all composed together in the sandbox, satisfying the wave gate.

**Wave 2 is in progress.** See `DECISIONS.md`'s **Wave 2 progress** section
for the live step tracker and current step — don't rely on this file for
Wave 2 status, it will go stale; that section is the source of truth.
