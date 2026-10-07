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
- **Karma's `ChromeHeadlessNoSandbox` launcher doesn't fire a native
  `<dialog>`'s `close` event when `.close()` is called** — confirmed via a
  direct Playwright/Chromium check that real browsers do fire it; this is a
  launcher-specific gap, not a bug in whatever component you're testing. The
  `dialog.open` *property* still updates correctly either way. Test your own
  reaction to the event by dispatching it directly
  (`element.dispatchEvent(new Event('close'))`) rather than relying on
  `.close()`'s own internal firing; save the real end-to-end proof (does a
  genuine user interaction actually close it) for a real-browser check —
  Storybook's `test-run`, or driving the sandbox — not the Karma unit suite.
- **Neither Karma's `.click()` nor a synthetic `dispatchEvent(new
  MouseEvent('mousedown'))` reproduces the browser's default focus-shift
  behavior** (moving focus to `<body>` when a non-focusable element is
  clicked, unless `mousedown`'s default is prevented) — confirmed on
  `HmhaComboboxOption` (fork 20) by temporarily removing its
  `preventDefault()` fix and finding every Karma test, including an
  explicit dispatched-`mousedown` attempt, still passed. This class of
  bug — anything depending on a real default UA action, not just an event
  firing — only surfaces through Storybook's `userEvent`-driven real
  pointer interaction. Same underlying lesson as the `<dialog>` quirk
  above: know which layer (event firing vs. its actual default action)
  Karma can and can't verify, and say so in the test file rather than
  writing a test that silently verifies nothing.
- **The reverse case: `userEvent.hover()` doesn't update the CSS `:hover`
  pseudo-class at all**, in Storybook's `test-run` or Karma — confirmed on
  `HmhaTableRow`'s `:host(:hover)` rule (a background swap with no JS
  behind it). `:hover` is the browser's own pointer-position tracking, not
  something any `dispatchEvent`-based tool (including `userEvent`) can set;
  only genuine OS/CDP-level pointer movement does. Unlike the `<dialog>`/
  Combobox gaps above, there's no JS reaction to test your own handling
  of here — it's pure CSS, so there's no workaround, only the same
  rule: don't write a play function asserting something this layer
  structurally cannot produce. A component whose only interactive state
  is CSS-`:hover`-driven gets a non-interactive showcase story (so a human
  can still hover the real rendered story and see it), not a play
  function.
- **`CdkVirtualScrollViewport`/`*cdkVirtualFor` render nothing on the
  first tick in a zoneless app** — confirmed in complete isolation,
  outside any table context, so it's a real `@angular/cdk/scrolling`
  gap under zoneless change detection, not something this library's own
  composition causes. The viewport's initial measurement happens on a
  later frame that a single `whenStable()`/`detectChanges()` doesn't
  wait for. Don't assert on rendered virtual-scroll content immediately
  after creating a fixture; wait for it first (`waitFor`, or an extra
  frame).
- **A `<cdk-virtual-scroll-viewport>` placed directly inside `<tbody>`
  (wrapping only the rows) compiles and renders with no error, but
  breaks every column's layout** — confirmed by measuring actual
  rendered widths (`data-grid/data-grid.stories.ts`'s `Virtualization`
  story, fork 22). CSS's anonymous-table-object rules treat that
  div-shaped element as needing to fit inside the column grid, squeezing
  it to roughly one column's width instead of the table's full width.
  The fix is structural, not a style tweak: the viewport wraps the
  **entire table**, with a sticky `<thead>` (`position: sticky` works
  fine, since the viewport is the nearest scrolling ancestor), not just
  the body rows. No error or warning hints at this — the only way to
  catch it is to actually measure rendered widths, which is exactly what
  the first attempt here skipped before this fix.
- **A `<colgroup>` with explicit column widths silently wins over
  `HmhaDataGridResizeHandle`'s own `th.style.width` mutation under
  `table-layout: fixed`** — confirmed in the Wave 4 gate
  (`apps/sandbox`'s Directory screen): the resize handle's `width` model
  updated correctly, its `effect()` set the style, `aria-valuenow`
  reflected the new value — and the column's rendered width never
  moved, because the `<colgroup>` is the authoritative width source
  under fixed layout and a `<col>` wins over any one cell's own
  `style.width`. No error, no console warning — the test caught it
  purely by measuring `getBoundingClientRect()` and finding it
  unchanged. Set initial column widths on the `<th>` elements
  themselves (`style="width: …"`, as the Data Grid README's resize
  section already does) when a column is resizable; don't also give it
  a `<col>`. A `<colgroup>` is fine for a non-resizable column in the
  same table.

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
- **If a story fails with `Component '...' is not resolved: styleUrl: ...
  Did you run and wait for 'resolveComponentResources()'?`**, don't assume
  the styleUrl is actually the problem — this is Angular JIT's generic
  failure message. In practice here it has fired for the *first* story
  written against any brand-new component file in a given dev-server
  session (seen for both `HmhaField`, which added a new `@angular/cdk/*`
  import, and `HmhaInput`, which didn't) — the long-running Storybook dev
  server seems to need a restart to pick up a component it's never loaded
  before. A page reload alone isn't enough; restart the dev server
  (`npm run storybook`) and clear `node_modules/.cache/storybook` first if
  a restart alone doesn't fix it. Ask before killing it if someone has it
  open — a restart briefly disconnects any open preview.
- **The same brand-new-file quirk can also surface as a silent "No
  Preview" / "check the Storybook config" page instead of the styleUrl
  error above** — seen for Toast's story (`toast.stories.ts`, fork 17),
  where the story was listed correctly in `docs-list` but wouldn't render.
  Confirmed it wasn't a real error first by running an *unrelated, already-
  working* story through the same session (it still passed, so the index
  itself wasn't broken) before restarting. Same fix: restart the dev
  server, clearing `node_modules/.cache/storybook` first.
- **If every Storybook MCP call times out (not the styleUrl error above)**,
  check for a *second* `npm run storybook` process before assuming the
  server is just slow: `ps aux | grep storybook` and `lsof -i :6006`. Only
  one process can actually bind the port; a second one started on top of it
  (yours or someone else's) stays running but unreachable, and MCP calls
  hang instead of erroring cleanly. Kill every matching process (`ng run
  hmha-ui:storybook`, `addon-vitest/dist/node/vitest.js`, the wrapping `npm
  run storybook`), clear `node_modules/.cache/storybook`, then start exactly
  one instance.
- **A narrower variant of the same symptom**: only `test-run` times out
  (repeatedly, for both a brand-new story and an existing, previously-
  passing one), while `docs-list` and `stories-preview` keep responding
  normally. That split points at the separate `addon-vitest` process
  specifically — it had been running since the start of a prior session —
  rather than the main dev server being down. Same fix still works
  (restart everything, clearing the cache); `lsof -i :6006` alone won't
  show this one, since the main server is still bound and answering.
- **A `*.stories.ts` file Storybook's glob matches but that has no real CSF
  export (no `export default meta`) breaks the entire index** — every
  Storybook MCP call fails with `Unable to index <path>`, not just that
  file's own stories. If a placeholder/notes file needs to exist before its
  real stories are written, keep it out of the `../src/**/*.stories.@(js|…)`
  glob (e.g. a `.md` file) rather than `.stories.ts` with no exports.
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

## Working through a wave

Every wave (this started as a Wave 2 rule; it applies to Wave 3 and beyond
too) is built **one step at a time**, not in a batch:

- Work on exactly one step from that wave's tracker (in `DECISIONS.md`) at a
  time. When a step is complete, summarize what you did, update the
  tracker's checklist and CURRENT STEP marker, and **stop**. Do not start the
  next step until explicitly told to continue, even if the next step seems
  obvious.
- A step counts as **done** only when all four hold:
  1. Unit tests pass.
  2. `libs/ui` builds (`npm run build:lib`).
  3. Lint is clean (`npm run lint:css`, `npm run lint:standalone`).
  4. Its Storybook story renders without errors.
- `DECISIONS.md`'s progress-tracker section for the current wave is the
  single source of truth for what step is current — read it before doing any
  work on that wave, and update it as part of finishing each step. A new
  session picking up wave work starts there. If a wave has no tracker
  section yet, write one (mirroring Wave 2 progress's format) before
  starting its first step.

## Current state

Phases 1 and 2 are done (token foundation; workspace scaffold,
`provideZonelessChangeDetection()`, the two-version install matrix,
`HmhaButton`). Phase 3 wave 1 is done too: the Icon system (generated from
Lucide via `scripts/generate-icons.mjs`), `HmhaButton`, `HmhaIconButton` and
`HmhaCard` — all composed together in the sandbox, satisfying the wave gate.

**Wave 2 is done.** `HmhaField`, `HmhaInput`, `HmhaCheckbox`,
`HmhaRadioGroup`/`HmhaRadio` and `HmhaSwitch` all share one
`ControlValueAccessor` composable (`hmhaValueAccessor`, fork 08) and one
`HMHA_FIELD` DI contract for hint/error/required wiring (fork 09) — every
control also still works standalone, outside a field. The wave gate is a
real "Create account" form in `apps/sandbox` backed by an actual
`FormGroup`, not static markup — see `DECISIONS.md` step 17. Forks 08–12
cover the wave's real architectural decisions; read those before touching
any of these components, especially fork 11 (Radio's asymmetric
group/individual-radio split) and fork 12 (Switch has no native element to
build on).

**Wave 3 is done.** Dialog, Menu, Tooltip, Toast, Tabs, Select and
Combobox (fork 06's full scope) are all built, unit-tested, documented in
Storybook, and proven together in a real "Team" screen in `apps/sandbox`
— see `DECISIONS.md`'s **Wave 3 progress** section, step 9, for the gate
write-up. Forks 13–20 cover the wave's real architectural decisions,
including `hmhaOverlay()` (fork 13, amended by 15–17) — the shared
positioning/dismissal foundation every floating-content component but
Dialog is built on — and two Karma-can't-verify-this notes (the
`<dialog>` close event, fork 14; a real-pointer-interaction-only focus bug
in Combobox, fork 20) worth reading before writing a test that looks like
it covers something but doesn't.

**Wave 4 is done.** `HmhaPagination`, `HmhaTable` (four native-element
pieces) and `HmhaDataGrid` (sort/selection/resize, plus a verified
virtualization composition pattern) are all built, unit-tested,
documented in Storybook, and proven together in a real "Directory" screen
in `apps/sandbox` — fork 06's deferred Table/Data Grid line, plus the
`HmhaPagination` control fork 06 never named, both delivered. Forks 21–22
cover the wave's real architectural decisions, including a genuine
mid-wave correction (fork 22: the first Data Grid proposal would have
needed two components on one element, caught before any code was
written) and three real CDK/table composition gaps the gate itself
surfaced, all now in this file's Storybook-stories section: the
zoneless-timing gap in `CdkVirtualScrollViewport`, the
viewport-must-wrap-the-whole-table finding, and the `<colgroup>`-beats-
resize-handle conflict. Read fork 21/22 before touching any of these
components: all three stay purely structural, with the consumer owning
the data array, sort state, selection and paging state — the same
pattern Select's trigger-label and Combobox's filtering already
established.

**`HmhaIconButton` now supports three icon/text layouts** — `only`
(unchanged default), `leading` and `trailing` — with `label` moved from a
compile-time-required input to an optional one enforced instead by a
runtime throw when `iconPosition` is `only` and no label is given. See
fork 23 before touching this component: the reasoning turns on WCAG
Label in Name, not just convenience.

**Wave 5 is done.** `HmhaChip`/`HmhaChipSet`, `HmhaExpansionPanel`/
`HmhaAccordion`, the four-piece `HmhaStepper` (`HmhaStepper`/
`HmhaStepList`/`HmhaStep`/`HmhaStepPanel`) and `HmhaDrawer` are all built,
unit-tested, documented in Storybook, and proven together in a real "New
project" drawer screen in `apps/sandbox` — see `DECISIONS.md`'s **Wave 5
progress** section for the full step-by-step write-up. Forks 24–26 cover
the wave's real architectural decisions — read fork 26 before assuming
Drawer is its own component: it's a `@Directive` stacking on
`HmhaDialog`, not a new one, and there is deliberately no persistent/push
variant. Two recurring lesson classes showed up again this wave, not for
the first time: a Karma-launcher event gap on `<details>`'s native
`toggle` (fork 25, the same class as `<dialog>`'s own `close` gap, fork
14), and `:host-context()` being blocked by stylelint for the same
encapsulation reason as `::ng-deep` (fork 05) — both already fixed with
their established remedies, not rediscovered from scratch.
