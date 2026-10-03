# Decisions of record

Fourteen architectural forks, decided. Each entry gives the decision, the
rejected alternatives, and the reasoning — so a later contributor can tell a
settled decision from an accident.

Team context: **one maintainer**. Several decisions are what they are because
maintenance capacity, not capability, is the binding constraint.

---

## 01 — Version floor: Angular 20 through current

**Decided:** one package, workspace built on Angular 20, peer range
`">=20.0.0 <22.0.0"`.

**Why it works:** a library published in partial-Ivy form — `ng-packagr`'s
default — is compiled by each consuming application's own compiler. Forward
compatibility is guaranteed; backward compatibility is not. Build on your floor
and it installs into every later major.

**What the 20 floor buys:** signal inputs and outputs; signal queries (which is
what makes Tabs, Menu and Select tractable); the `host` metadata object;
`linkedSignal`; and above all **zoneless readiness** — the one property you
cannot retrofit cheaply, because discovering a zone dependency later means
auditing every component.

**Rejected — a 16+ baseline:** would have cost signal inputs and zoneless for
consumers that do not exist. **Rejected — two release lines** (v1 for 16–17, v2
on signals): correct for a funded platform team, unmaintainable for one person.

**Caveat:** signals have not replaced `ControlValueAccessor`. Form controls still
implement it.

---

## 02 — Distribution: Angular components only

**Decided:** native Angular standalone components via `ng-packagr`. No custom
elements, no framework-agnostic core.

**Why:** custom elements solve exactly one problem — crossing a framework
boundary — and there is no boundary to cross. They would cost type-checked
bindings, content projection, DI, CDK overlays and native
`ControlValueAccessor` support.

**The portability that matters is already there:** the tokens are pure CSS with
no framework in them, so a marketing site, an email template or a native shell
can wear the identity without wearing the components.

**Escape hatch, deliberately deferred:** if a non-Angular surface ever needs real
components, wrap the few it needs with `createCustomElement` as a second build
target. Deferring costs nothing; designing for it up front would have cost the
entire API.

---

## 03 — Token pipeline: DTCG JSON → Style Dictionary

**Decided:** hand-authored DTCG JSON in the repo, compiled by Style Dictionary to
CSS custom properties, TypeScript union types, and a JSON manifest for docs.

**Why:** git gives review, history and CI for free, and there is no sync to own.
Because the source is already DTCG, adopting a Figma Variables pipeline later is
a change of *input*, not a migration — so defer it until the token set stops
moving and someone owns the round-trip.

**Rejected — SCSS maps as source of truth:** they resolve at build time, which
puts literal values back in the output and makes runtime theming impossible.
Directly contradicts the no-hard-coded-values constraint.

**The critical setting:** `outputReferences: true`. Without it `var(--hmha-blue-600)`
is flattened to a hex value and runtime theming cannot work. Teams usually
discover this the week dark mode is promised.

**Enforcement is mechanical, not cultural:** Stylelint fails CI on any literal
colour or raw pixel value in `libs/ui`. With one maintainer there is no reviewer,
so the linter is the reviewer.

---

## 04 — Theming: independent attribute axes

**Decided:** one token sheet. `data-hmha-mode` and `data-hmha-density` are separate
attributes that re-point semantic roles; primitives never change. A thin
`hmhaTheme` directive writes the attributes and knows nothing about colour.

**Why:** the axes compose instead of multiplying (mode × density would already be
four built stylesheets; a brand axis would make eight), they nest, and switching
is one attribute write with no rebuild and no flash.

**Rejected — a stylesheet per theme:** cannot nest, cannot compose, doubles
output per axis. **Rejected — theme objects through DI applied as inline
styles:** bypasses the cascade, so consumers can override nothing, and every
themed value becomes a binding to re-evaluate.

**Layer order is load-bearing.** Each axis emits its default on `:root` before its
attribute variants. See `CLAUDE.md`.

**Per-component override is not a theming feature** — it is fork 05.

---

## 05 — Encapsulation and the override contract

**Decided:** `ViewEncapsulation.Emulated` (the default), variants as `data-*`
attributes, and **component tokens as the entire published override API**.

**Rejected — Shadow DOM:** brings form association, focus delegation and
global-style problems, plus a second API surface in `::part` that would have to
be designed and versioned. Emulated encapsulation plus attribute selectors
already gives effective isolation.

**The contract, published beside the component docs:**

- **Supported**, in order of preference — set a documented component token on the
  host; use a provided variant; compose your own component from our primitives.
- **Unsupported and will break** — `::ng-deep`, selectors targeting internal DOM
  structure, overriding by specificity, or depending on any token absent from the
  published manifest.

Stylelint bans `::ng-deep` and `:host-context` in the library itself so it cannot
lead by bad example.

---

## 06 — Scope: three waves, Table out of v1

Thirteen components, sequenced. **Each wave goes into a real screen before the
next starts** — breadth built in isolation gets every API subtly wrong, and with
one maintainer there is no reviewer to catch it.

| Wave | Components | The shared foundation it establishes |
| --- | --- | --- |
| One | Icon system, Button, Card | The whole pipeline at the smallest scale. Button forces variants, sizes, states, focus rings, icon slots and disabled semantics. Icon first, because Button needs it. |
| Two | Field wrapper, Input, Checkbox, Radio, Switch | One `ControlValueAccessor` pattern and one error/hint/required model, shared by all five. Build together or they will disagree. |
| Three | Dialog, Menu, Tooltip, Toast, Tabs, then Select / Combobox | Overlay positioning and focus management, built once on `@angular/cdk` and reused. Combobox last — hardest a11y problem in the set, and it wants Menu's foundation working. |
| **Out** | Table / Data Grid | Post-v1. Ship a `hmhaTable` directive on a plain `<table>` as the stopgap — an afternoon's work. Sorting, virtualisation, selection and column resizing are a quarter. |

---

## 07 — Packaging: two packages, public on npm

**Decided:** publish `@halfmanhalfape/hmha-tokens` (pure CSS + TS types, zero dependencies)
and `@halfmanhalfape/hmha-ui` (the Angular components) as two public npm packages.

**Why two:** they have different dependency sets and different cadences. Tokens
change weekly and depend on nothing; components change slowly and depend on
Angular and the CDK. One package would force a token fix to ship as a component
release, and would put an Angular peer dependency on something that deliberately
has no framework in it — which is exactly the portability fork 02 preserved.

**Why `hmha-tokens` is not an Angular library:** it is CSS and types. Running it
through `ng-packagr` would add a peer dependency it does not need and block the
non-Angular consumers (marketing site, email templates, a native shell) that are
the reason tokens are framework-free in the first place.

**Rejected — one package:** couples the cadences and breaks the framework-free
token story. **Rejected — three packages** (splitting out `hmha-core`): `hmha-core`
has no independent consumers, and a package nobody installs directly is pure
maintenance overhead for one person.

**Rejected — secondary entry points** (`@halfmanhalfape/hmha-ui/button`): standalone
components already tree-shake correctly from a single entry point. Secondary
entry points are real ng-packagr complexity for no measurable gain.

**Scope and package names — decided:** `@halfmanhalfape`, confirmed available on
npm. `libs/ui/package.json` and `libs/tokens/package.json` carry the names.

**Still to decide:** the license (MIT unless there is a reason not to).
`CLAUDE.md` carries the publishing mechanics.

---

## 08 — Form-control foundation: a composable factory, not a base class

**Decided:** `hmhaValueAccessor<T>()` in `libs/ui/src/lib/core/value-accessor.ts`
— a plain factory function, not a class to extend. It returns signal-backed
`value`/`disabled` state plus the four `ControlValueAccessor` methods. Each
form control (Input, Checkbox, Switch, and `HmhaRadioGroup`) composes one
instance as a private field and delegates the four CVA methods in one line
each. Not exported from `public-api.ts` — it's internal to `libs/ui`, not
part of the published API surface.

**Why a factory over a base class:** the `NG_VALUE_ACCESSOR` provider still
needs `forwardRef(() => <concrete class>)` per component either way, so a
base class doesn't fully DRY up the boilerplate — it only removes four
delegation lines at the cost of a rigid inheritance chain. Composition avoids
that cost and reads as a natural extension of how this codebase already
prefers functions over class hierarchies (`hmhaColor()`, the icon registry).

**Rejected — abstract base class** (`HmhaFormControl<T>` to `extends`):
marginally less boilerplate per component, but locks every control into one
linear hierarchy. Doesn't fit Radio (see below), where the real CVA
integration point is the group, not the individual control.

**Rejected — `hostDirectives` composition:** cleanest in theory, but more
novel machinery than anything else in the codebase, with more subtle edges
forwarding signal state across the host-directive boundary. Not worth it for
a one-maintainer project when the factory gets nearly the same benefit.

**The one correctness rule this centralizes:** `writeValue` (Forms →
component) never calls `onChange`; only `setValue` (component → Forms, i.e.
a user-driven edit) does. Getting this backwards — the most common CVA bug —
now only has to be gotten right once, not five times.

**Combining with standalone (non-Forms) usage:** a control's `disabled`
state should combine the accessor's `setDisabledState`-driven signal with
its own `disabled` input — `computed(() => this.disabledInput() ||
this.accessor.disabled())` — mirroring `HmhaButton`'s existing `loading() ||
disabled()` pattern, so a control still works with a plain `disabled`
attribute outside a `FormGroup`.

**Two things flagged for later steps, deliberately not decided here:**

- **Radio doesn't fit the "one CVA per component" shape.** The real
  form-integration point is `HmhaRadioGroup` (one selected value); individual
  `HmhaRadio` children will inject the group via a DI token to read/select,
  not hold their own accessor. Step 6A's concern.
- **Field wrapper's error/hint/required model is a separate, related
  design** — an ARIA-context problem (`aria-describedby`/`aria-invalid`
  wiring), not a CVA problem. Deferred to step 3A, when `HmhaField`'s own
  shape gets designed, rather than invented sight-unseen here.

---

## 09 — Field/control contract: DI-provided context, not imperative wiring

**Decided:** `HmhaField` provides `HMHA_FIELD` (`InjectionToken<HmhaFieldContext>`)
via `providers: [{ provide: HMHA_FIELD, useExisting: HmhaField }]`. Any
wrapped control injects it with `inject(HMHA_FIELD, { optional: true })` and
reflects `controlId`/`invalid`/`describedBy`/`required` onto its own host
attributes (`id`, `aria-invalid`, `aria-describedby`, `aria-required`).
`HmhaField` itself never inspects or manipulates its projected content.

**Why:** decouples `HmhaField` from knowing what it wraps — Input, Checkbox,
`HmhaRadioGroup`, Switch, and any consumer's own custom control all
integrate the same way, and `HmhaField` doesn't grow a case per control
type. `optional: true` on the inject call keeps every control's standalone
(outside-`HmhaField`) usage working unchanged — `field` is simply `null`.

**Rejected — `HmhaField` reads its projected child via `contentChild()` and
sets attributes on it imperatively:** requires `HmhaField` to know the
concrete child type (or introspect the DOM) to know which element/attributes
to target, breaking encapsulation and coupling the wrapper to every control
it might ever wrap.

**Unique IDs use `@angular/cdk/a11y`'s `_IdGenerator`, not a hand-rolled
counter:** per CLAUDE.md's "use CDK for a11y, don't hand-roll it" — the CDK
already solves exactly this (the same mechanism Angular Material uses
internally for label/description association), and it's SSR-safe for free.

**`HmhaField` renders no background of its own.** It's a layout wrapper, not
a surface — `HmhaCard` and the page body own backgrounds. This means the
hint/error text's contrast is only guaranteed against a page that has
already applied `--hmha-color-bg` (or a card's `--hmha-card-bg`). This
surfaced as a real gap while writing `field.spec.ts`'s axe check — the Karma
test fixture has no body background, unlike `apps/sandbox/src/styles.css` —
fixed in the test (give the fixture a realistic background before asserting
contrast) rather than the component. Documented in the component's README so
it isn't mistaken for a bug later.

**Error takes precedence over hint, never both:** one `aria-describedby`
target at a time, simpler mental model, and avoids a sighted user reading
stale help text alongside an active error.

---

## 10 — Checkbox/Radio rendering: native `accent-color`, not a custom-drawn box

**Decided:** `HmhaCheckbox` (and, when built, `HmhaRadio`) keep the browser's
native checkbox/radio rendering and rec­olour it with the CSS `accent-color`
property, rather than `appearance: none` plus a hand-drawn box and checkmark
(SVG background-image or a CSS-border checkmark trick).

**Why:** `accent-color` is supported in every current browser, needs zero
drawing code, and keeps the native widget's behaviour for free —
`indeterminate` state, forced-colors/high-contrast mode, platform focus
handling, and screen-reader semantics. Fork 06 already lists
Dialog/Menu/Overlay work as the hard a11y problems worth CDK's help; a
checkbox's check mark isn't one of them, so it doesn't need bespoke
rendering either.

**Rejected — `appearance: none` + custom SVG/CSS checkmark:** the standard
approach when a design calls for a check mark shape the OS can't render
(a custom glyph, an animated draw-in, etc.). Nothing in this design system
calls for that yet, and hand-rolling it now would be exactly the kind of
premature complexity the "don't design for hypothetical requirements"
principle warns against. Revisit if a real design ever needs it — the
component token (`--hmha-checkbox-accent`) stays the same either way, only
the CSS behind it changes.

**The trade-off, stated plainly:** the box's shape and the check mark's
exact style are the browser's to draw, not ours — `--hmha-checkbox-accent`
can retint them, `--hmha-checkbox-size` can resize them, but neither can
restyle them further. Documented in the component's README so it reads as a
decision, not a limitation nobody noticed.

---

## 11 — Radio group: `fieldset` + shared `name`, required DI, no fallback

**Decided:** `HmhaRadioGroup` (`fieldset[hmhaRadioGroup]`) is the real form
control — it holds the selected value, implements `ControlValueAccessor`,
and generates the `name` every radio in it must share (native radio
grouping — arrow-key navigation, "only one checked" — is driven entirely by
matching `name` attributes, not DOM nesting). `HmhaRadio`
(`input[hmhaRadio]`) holds no state; it injects the group with
`inject(HMHA_RADIO_GROUP)` — **required, not optional** — to read the
shared name/value and select itself. Fulfills the shape fork 09 flagged but
deliberately didn't design at the time.

**Why `fieldset`, not a custom element:** it's the correct native element
for "a set of related form controls with one accessible name" — `<legend>`
is its native labeling mechanism, and native fieldset-disable cascades to
every descendant control for free. No custom element does any of that.

**Why required injection, not optional with a fallback:** a radio divorced
from a group has no value to compare itself against and no `name` to share
— it cannot function, the same way a native `<input type="radio">` alone
with no siblings sharing its `name` doesn't make sense. An optional
injection with silent fallback behavior would let a broken usage render
without error instead of failing loudly at the point of the mistake.

**`HMHA_FIELD`'s contract, extended:** `<fieldset>` isn't a labelable
element — `<label for>` cannot target it at all. `HmhaRadioGroup` uses
`aria-labelledby` bound to `HmhaFieldContext.labelId` (added to the
contract for exactly this) instead of `controlId`/`for`. It also sets
`role="radiogroup"` — required because axe correctly flagged
`aria-required`/`aria-invalid` as disallowed on a bare `<fieldset>`'s
implicit "group" role; "radiogroup" is the WAI-ARIA role that supports
them, and is the role the Authoring Practices' own radio-group pattern
uses.

**`required` propagates past the fieldset to each radio's native
`required` attribute**, not just the fieldset's `aria-required` — so the
browser's own "you must pick one" constraint validation works per radio,
matching how native radio groups actually validate.

**A testing note, not a design decision, worth recording anyway:** native
`<fieldset disabled>` cascades to descendants for *interaction*,
`:disabled` CSS matching, and form submission — but a descendant's own
`.disabled` **property getter** keeps reflecting only its own attribute,
never the cascade. Asserting the cascade in a test means
`radio.matches(':disabled')`, not `radio.disabled`. Cost real time to
track down in `radio-group.spec.ts`; left as a comment there too.

---

## 12 — Switch: `role="switch"` on a native `<button>`, not a styled checkbox

**Decided:** `HmhaSwitch` (`button[hmhaSwitch]`) is a native `<button
type="button">` with `role="switch"` and `aria-checked`, per WAI-ARIA's own
switch pattern — not `<input type="checkbox">` restyled to look like a
toggle. First control in the library with no matching native form element
at all (Input, Checkbox and Radio all wrap one; Switch can't).

**Why not a styled checkbox:** a checkbox and a switch are different
widgets to assistive tech even when they look identical — a checkbox
communicates "checked/unchecked," a switch communicates "on/off," and
screen readers announce the two differently. Restyling a checkbox to look
like a switch would make the visual lie about what AT actually hears.
`role="switch"` says what it visually claims to be.

**Why `<button>`, not a `<div>` with the same role:** button gets Enter/Space
activation, focus handling and disabled semantics for free, matching every
other control in the library's "native element carries the keyboard/focus
work" ethos. `<button>` is also labelable (unlike `<fieldset>`, fork 11) —
`HmhaField`'s normal `for`/`id` association works unmodified.

**`aria-checked` is always the literal string `"true"`/`"false"`, never
omitted.** Unlike `aria-busy` (fine absent when not busy), `aria-checked`
is a required state for the `switch` role — an absent value is different
from `"false"` to assistive tech. `data-checked` is kept as a *separate*,
presence-based attribute purely for styling, per the data-\* variant
convention, even though it's always in sync with `aria-checked`.

**The thumb is a real templated `<span>`, not a CSS pseudo-element** —
unique among the form controls in this wave. `<input>` is a void element
and cannot hold children, which is why `HmhaInput`/`HmhaCheckbox`/`HmhaRadio`
all have empty templates; `<button>` isn't void, so `HmhaSwitch` gets an
actual template (`<span class="hmha-switch-thumb" aria-hidden="true">`) to
animate, avoiding a `::before`/`::after` trick for no reason.

---

## Wave 2 progress — the step tracker

**This section is the single source of truth for Wave 2 status.** Update the
checklist and the CURRENT STEP marker at the end of every step. The process
rule itself (one step at a time, stop-and-wait between steps, the done
criteria) lives in `CLAUDE.md` — this section only tracks where we are.

1. [x] **1a.** Propose a shared form-control foundation (options +
   recommendation) that reduces `ControlValueAccessor` boilerplate across
   Field wrapper, Input, Checkbox, Radio and Switch. Wait for approval before
   building anything. — Approved: Option B (composable factory).
2. [x] **1b.** Build the approved foundation. Recorded as fork 08 above.
   `hmhaValueAccessor<T>()` in `libs/ui/src/lib/core/value-accessor.ts`, 7
   passing unit tests, `libs/ui` builds clean, lint clean. No story required
   — not a UI component.
3. [x] **2a.** Story: `HmhaIcon` — `icon.stories.ts` (Playground, Sizes,
   Gallery). All pass `test-run` (incl. a11y).
4. [x] **2b.** Story: `HmhaButton` — `button.stories.ts` (Playground, Tones,
   Sizes, Loading, Disabled, WithIcon, ClickInteraction). All pass
   `test-run` (incl. a11y and the click/aria-state play functions).
5. [x] **2c.** Story: `HmhaIconButton` — `icon-button.stories.ts`
   (Playground, TonesAndSizes). All pass `test-run` (incl. a11y and the
   aria-label/data-icon-only play function).
6. [x] **2d.** Story: `HmhaCard` — `card.stories.ts` (Playground, Elevated,
   BodyOnly, FlatAndElevated). Along the way, Storybook's a11y check caught a
   real bug in `HmhaCard`'s markup: `<header>`/`<footer>` outside a
   sectioning element become page-level `banner`/`contentinfo` landmarks, so
   every card on a page was a duplicate, unlabeled landmark. Fixed by
   switching to plain `<div class="hmha-card-header/footer">` — purely
   structural, no visual or CSS change (styling was already class-based).
   All stories pass `test-run` (incl. a11y) after the fix; full suite (all
   17 stories across Icon/Button/IconButton/Card) re-verified clean.
7. [x] **3A.** Build Field wrapper + tests — `libs/ui/src/lib/field/`
   (`field.ts`, `field.css`, `field.spec.ts`, `README.md`). Recorded as
   fork 09. 11 new unit tests (42/42 total), `build:lib`/`lint:css`/
   `lint:standalone` clean.
8. [x] **3B.** Story: Field wrapper — `field.stories.ts` (Playground,
   WithHint, WithError, Required, FormExample). Added `exportAs: 'hmhaField'`
   to `HmhaField` along the way, so a template reference can read the field
   context without a custom control class — used by FormExample to wire
   plain `<input>` stand-ins to their real `id`/`aria-*`, which is also what
   surfaced the need (axe flagged an unlabeled input otherwise). All 22
   stories across the library pass `test-run` (incl. a11y).
9. [x] **4A.** Build Input + tests — `libs/ui/src/lib/input/` (`input.ts`,
   `input.css`, `input.spec.ts`, `README.md`). `input[hmhaInput]` on the
   native `<input>`, composes `hmhaValueAccessor` (fork 08) and optionally
   consumes `HMHA_FIELD` (fork 09) — no new architectural decision, both
   patterns applied as designed. 12 new unit tests (5 reactive-forms
   integration via `[formControl]`, 7 standalone/field-DI/a11y; 54/54
   total), `build:lib`/`lint:css`/`lint:standalone` clean.
10. [x] **4B.** Story: Input — `input.stories.ts` (Playground, Sizes,
    Disabled, Invalid, WithField, TypingInteraction). WithField is the
    first story to prove the HMHA_FIELD contract end to end with a real
    control instead of a stand-in. All 28 stories across the library pass
    `test-run` (incl. a11y).
11. [x] **5A.** Build Checkbox + tests — `libs/ui/src/lib/checkbox/`
    (`checkbox.ts`, `checkbox.css`, `checkbox.spec.ts`, `README.md`).
    `input[hmhaCheckbox]` on native `<input type="checkbox">` (type forced
    by the directive), same `hmhaValueAccessor`/`HMHA_FIELD` pattern as
    Input. Rendering uses native `accent-color`, not a custom-drawn box —
    recorded as fork 10 (will also govern Radio). 12 new unit tests (5
    reactive-forms integration, 7 standalone/field-DI/a11y; 66/66 total),
    `build:lib`/`lint:css`/`lint:standalone` clean.
12. [x] **5B.** Story: Checkbox — `checkbox.stories.ts` (Playground, Sizes,
    Disabled, Invalid, WithField, ToggleInteraction). Hit two environment
    issues along the way, both now documented in CLAUDE.md: a duplicate
    `npm run storybook` process bound nothing and made every MCP call time
    out (killed both, started one), and a `.stories.ts` file with no real
    CSF export (a stray planning note) broke Storybook's entire index, not
    just its own stories (renamed to `.md`, out of the stories glob). All
    34 stories across the library pass `test-run` (incl. a11y).
13. [x] **6A.** Build Radio + tests — `libs/ui/src/lib/radio/`
    (`radio-group.ts`/`.css`, `radio.ts`/`.css`, two spec files, `README.md`).
    `fieldset[hmhaRadioGroup]` holds the CVA state and generates the shared
    `name`; `input[hmhaRadio]` holds none, requiring (not optionally)
    injecting the group. Extended `HmhaFieldContext` with `labelId` (fields
    can't `label[for]` a fieldset) and added `role="radiogroup"` (axe
    caught `aria-required` as disallowed on the implicit "group" role
    otherwise). Recorded as fork 11. 20 new unit tests (5 extending
    `field.spec.ts`, 9 for the group, 6 for the radio; 86/86 total),
    `build:lib`/`lint:css`/`lint:standalone` clean.
14. [x] **6B.** Story: Radio — `radio-group.stories.ts` (Playground, Disabled,
    Invalid, WithField, SelectionInteraction) and `radio.stories.ts`
    (Playground, Sizes, IndividuallyDisabled) — split per CLAUDE.md's
    one-file-per-component rule, group-level vs individual-radio concerns
    kept apart to avoid redundancy. No dev-server restart needed this time.
    All 42 stories across the library pass `test-run` (incl. a11y).
15. [x] **7A.** Build Switch + tests — `libs/ui/src/lib/switch/`
    (`switch.ts`, `switch.css`, `switch.spec.ts`, `README.md`).
    `button[hmhaSwitch]` with `role="switch"`/`aria-checked` (WAI-ARIA's own
    pattern — no native `<input type="switch">` exists), same
    `hmhaValueAccessor`/`HMHA_FIELD` pattern as the others. Templated thumb
    `<span>` instead of a CSS pseudo-element, since `<button>` (unlike
    `<input>`) isn't a void element. Recorded as fork 12. 13 new unit tests
    (5 reactive-forms integration, 8 standalone/field-DI/a11y; 99/99 total),
    `build:lib`/`lint:css`/`lint:standalone` clean — all passed first try.
16. [x] **7B.** Story: Switch — `switch.stories.ts` (Playground, Sizes,
    Disabled, Invalid, WithField, ToggleInteraction). Dev server had
    stopped entirely since the last step (nothing running, no active
    viewer) — started it fresh, no restart-mid-session needed this time.
    Visually confirmed the track/thumb toggle (off: gray track, thumb
    left; on: blue track, thumb right) via a real browser check. All 48
    stories across the library pass `test-run` (incl. a11y).
17. [x] **8.** Wave 2 gate — a real "Create account" form in `apps/sandbox`
    (`app.ts`/`app.html`/`app.css`), backed by an actual Angular
    `ReactiveFormsModule` `FormGroup` with real validators — not static
    markup. Composes all five: `HmhaField` wraps `HmhaInput` (name, email
    with `Validators.email`), `HmhaRadioGroup`/`HmhaRadio` (plan, required),
    `HmhaSwitch` (notifications), `HmhaCheckbox` (terms,
    `Validators.requiredTrue`), submitting via `(ngSubmit)`. Driven live in
    a real browser (Playwright): submitting empty shows all four expected
    error messages with red-bordered invalid fields; filling every field
    and resubmitting clears every error and shows a success banner — zero
    console errors either path. 2 new sandbox tests (DOM-only assertions,
    matching this wave's black-box testing style) exercise both paths;
    103/103 total across the whole workspace.

**Wave 2 is complete.** All five components (Field, Input, Checkbox,
RadioGroup/Radio, Switch) are built, unit-tested, documented in Storybook,
and proven together in a real screen — the gate fork 06 requires before
Wave 3 can start.

---

## 13 — Overlay foundation: positioning + dismissal only, never focus

**Decided:** `hmhaOverlay(options)` in `libs/ui/src/lib/core/overlay.ts` —
a plain factory function (same shape as fork 08's `hmhaValueAccessor`),
wrapping `@angular/cdk/overlay`'s `Overlay` service. It handles overlay
creation, one of three position strategies (`'connected'` — anchored to a
trigger via CDK's own `STANDARD_DROPDOWN_BELOW_POSITIONS` preset, not
hand-rolled offsets; `'global-center'`; `'global-fixed-corner'`), scroll
strategy per position, and dismissal (Escape, outside click, backdrop
click when `hasBackdrop` is set). Exposes `isOpen: Signal<boolean>` and
`open()`/`close()`. Not exported from `public-api.ts` — internal to
`libs/ui`, like `hmhaValueAccessor`.

**Why it stops exactly there:** Menu/Tooltip/Toast/Select/Combobox (Dialog
turned out not to use this foundation at all — see fork 14) all need the
same creation-and-dismissal mechanics, but their focus behaviour genuinely
diverges — Menu/Select/Combobox move focus in with arrow-key navigation and
no trap, Tooltip/Toast touch focus not at all. A shared foundation that
also owned focus would have to grow an escape hatch for most of its own API
on any given consumer — the same shape of mistake fork 08 avoided by not
making `hmhaValueAccessor` a base class. Each component builds its own key
manager (Menu/Select/Combobox) directly; this foundation doesn't know one
exists.

**Written when Dialog was still assumed to be a consumer — it isn't.**
This fork's reasoning (and the three options below) still holds for the
five components that do use `hmhaOverlay`; only the consumer list changed,
not the decision.

**`global-fixed-corner` pins to the corner at zero offset, not a spacing
value.** The composable has no CSS layer to draw from — the token-driven
spacing a real corner-anchored toast needs is the *consuming component's*
to own, via its own component token on its own root, the same as every
other component in this library owns its own spacing. Baking a number in
here would have meant guessing at Toast's design before Toast exists.

**`'connected'`'s small gap between trigger and overlay is a literal
number, not a token** — the one deliberate exception to "no hard-coded
values," because `ConnectedPosition.offsetY` is a plain `number` in CDK's
own API, not a CSS property; there is nothing for a `var()` reference to
resolve against at that layer. Using CDK's own `STANDARD_DROPDOWN_BELOW_POSITIONS`
preset instead of inventing one avoided needing to pick that number at
all.

**Rejected — an abstract base class each overlay component extends:**
same reasoning as fork 08's rejection of Option A for CVA — Toast's shape
(no trigger, fixed position, timer-driven) and Menu's shape (anchored,
arrow-key nav) differ enough that a shared base would need unused surface
on every subclass.

**Rejected — no shared foundation, each component calls CDK Overlay
directly:** tempting under "don't design for hypothetical requirements,"
but the overlay-creation-plus-three-dismiss-subscriptions boilerplate is
identical across six *named, real* consumers in fork 06 — not a guess at
the future the way a premature abstraction would be.

---

## 14 — Dialog: the native `<dialog>` element, not `hmhaOverlay`

**Decided:** `HmhaDialog` (`dialog[hmhaDialog]`) is an attribute directive
on the native `<dialog>` element, opened via `.showModal()` — not
`hmhaOverlay`/CDK Overlay like the rest of Wave 3 (fork 13). This was
decided *during* step 2A, not step 1a, because the native-element option
only became obvious once Dialog's actual requirements were in front of us
— fork 13 was written assuming Dialog would be a sixth `hmhaOverlay`
consumer, and that assumption turned out wrong.

**Why:** `<dialog>` + `showModal()` already gives, for free, everything a
modal needs and fork 13 deliberately left out: a real focus trap, native
Escape-to-close, focus restored to the trigger on close, rendering in the
top layer (no z-index stacking to manage), and an implicit
`role="dialog"` with `aria-modal="true"` exposed automatically — zero ARIA
wiring required. This is the exact pattern CLAUDE.md's component
conventions already establish ("prefer an attribute selector on a native
element") and fork 10/12 already applied to Checkbox/Radio/Switch; Dialog
is simply the case where the native element happens to solve the *overlay*
problem too, not just the *control* problem.

**Rejected — `hmhaOverlay` with `global-center` positioning plus
`ConfigurableFocusTrapFactory` layered on top:** this was the original
plan (fork 13 names it explicitly). It would have meant hand-building
focus trapping, Escape handling, backdrop-click handling, and
`role="dialog"`/`aria-modal` wiring — all things `<dialog>` already does,
tested across every browser engine instead of by us. Routing Dialog
through CDK Overlay anyway, when a correct native element exists, would
have been exactly the kind of hand-rolling CLAUDE.md's "use CDK, don't
hand-roll" guidance exists to prevent in the *other* direction — CDK is
there for what native doesn't solve, not as a default reached for out of
habit.

**New token: `--hmha-color-backdrop`.** Added to `tokens/semantic/effect.json`
(mode-independent, next to `elevation` — it dims whatever page is behind
it, light or dark) and `tokens/primitive/effect.json` (a new `scrim`
primitive: `oklch(0.176 0.011 260 / 0.5)`, the same hue shadow primitives
already use, just at backdrop-strength alpha). Styled via `::backdrop` in
`dialog.css`. Semantic, not a component token — every future overlay-ish
surface wanting a scrim should reuse this role, not invent its own.

**A testing note, not a design decision, worth recording anyway:** Karma's
`ChromeHeadlessNoSandbox` launcher doesn't fire `<dialog>`'s `close` event
when `.close()` is called, though the `.open` property still updates
correctly and a real Chromium (confirmed via Playwright) fires it fine —
see CLAUDE.md's component-conventions section for how `dialog.spec.ts`
works around it.

---

## 15 — Menu: `hmhaOverlay`'s first real consumer, and two foundation fixes it forced

**Decided:** `HmhaMenu` is three pieces —`HmhaMenuTrigger` (`button[hmhaMenuTrigger]`,
owns the `hmhaOverlay()` handle), `HmhaMenu` (`div[hmhaMenu]`, owns a CDK
`FocusKeyManager`), `HmhaMenuItem` (`button[hmhaMenuItem]`, implements
`FocusableOption`) — mirroring the Radio/RadioGroup trigger/panel/item split,
with a dedicated `menu-context.ts` for `HMHA_MENU` to avoid a circular import
between `menu.ts` (needs the concrete `HmhaMenuItem` class for
`contentChildren`) and `menu-item.ts` (needs `HMHA_MENU`'s token value).

Being `hmhaOverlay`'s first actual consumer (Dialog took the native-element
path instead — fork 14) surfaced two bugs in the foundation itself that no
amount of reviewing fork 13 in the abstract had caught:

**Fix 1 — `open()` now takes an optional `injector`.** A `TemplatePortal`'s
embedded view is injected, by default, from wherever the `<ng-template>` is
*lexically declared* — in the consumer's own template, a sibling of the
trigger, not a descendant of it. `HmhaMenu` injecting `HMHA_MENU_TRIGGER`
threw NG0201 at runtime because the trigger directive was never an ancestor
of the template in the DOM tree DI actually walks. Fixed by having
`HmhaMenuTrigger` build a child `Injector` (providing itself as
`HMHA_MENU_TRIGGER`) and pass it through `hmhaOverlay().open(origin,
content, injector)` into the `TemplatePortal`/`ComponentPortal` constructor's
own `injector` parameter. Any future connected-overlay trigger whose panel
needs to inject the trigger (Select, Combobox) will need this same handle.

**Fix 2 — outside-interaction dismissal now excludes the origin element.**
CDK's `OverlayOutsideClickDispatcher` listens on `document.body` in the
*capture* phase. For a connected overlay, clicking the trigger again (to
toggle-close it) is indistinguishable from clicking anywhere else outside
the panel — the dispatcher's capture-phase handler fires and closes the
overlay *before* the trigger's own bubble-phase `(click)` listener ever
runs. Unguarded, the trigger's click handler then reads `isOpen()` as
already `false` and reopens what was just closed — a menu that visually
never closes on a second trigger click. Fixed in `hmhaOverlay` itself (not
just worked around in Menu) by checking `origin.contains(event.target)` in
the `outsidePointerEvents()` subscription and skipping the auto-close when
true — the origin element now owns dismissal of clicks on itself. This
applies to every future connected consumer, not only Menu.

Also added: `getLabel()` on `HmhaMenuItem` (returns trimmed `textContent`),
without which `FocusKeyManager`'s `.withTypeAhead()` would silently match
nothing — it skips items missing `getLabel` rather than throwing once any
item is present, so the gap would have shipped invisibly instead of failing
loudly.

**Rejected — fixing the toggle-close bug only inside `HmhaMenuTrigger`**
(e.g. a local flag ignoring the next click after a dismiss): would have
left the same bug for Select and Combobox to rediscover independently.
Fixing it in `hmhaOverlay` means every future connected-position trigger
gets correct toggle behavior for free.

A test-writing note: CDK's `ListKeyManager.onKeydown` switches on the
legacy numeric `event.keyCode`, which a synthetic `KeyboardEvent(...,  {key:
'ArrowDown'})` never populates in Chrome — `keyCode` has to be forced on
with `Object.defineProperty` for dispatched test events. And because
zoneless signal writes triggered from inside an RxJS subscription (the key
manager's `change` emitter) don't synchronously patch bound DOM attributes,
`fixture.detectChanges()` is needed after dispatching a keyboard event
before asserting on `data-active`/`tabindex` — `document.activeElement`
itself updates synchronously (a direct side effect of `.focus()`), so only
the attribute-reflecting assertions needed it. The same `keyCode` gap hit
the Storybook interaction tests too (step 3B): `@testing-library/user-event`
v14 (what `storybook/test`'s `userEvent` wraps) deliberately never sets
`keyCode` either, so `userEvent.keyboard('{ArrowDown}')` needed the same
manual-dispatch-with-keyCode workaround there. Letter keys for typeahead
were unaffected (CDK's `Typeahead` reads `event.key`, not `keyCode`) but
needed `waitFor` instead, since `Typeahead` debounces keystrokes (200ms
default) before acting — a real end user is unaffected either way, since a
genuine hardware key press always populates `keyCode` correctly.

21 new unit tests across `menu-trigger.spec.ts`/`menu.spec.ts`/
`menu-item.spec.ts` (139/139 total), `build:lib`/`lint:css`/
`lint:standalone` clean.

---

## 16 — Tooltip: `AriaDescriber`, not `aria-describedby` on the bubble itself

**Decided:** `HmhaTooltip` (`[hmhaTooltip]`, an attribute directive with no
element-name requirement — it applies to anything) shows a small
`hmhaOverlay`-positioned bubble on `mouseenter`/`focus`, hidden on
`mouseleave`/`blur`/Escape. The bubble (`HmhaTooltipPanel`, an internal,
unexported component in the same file) gets the message via the same
child-injector pattern Menu's trigger uses to hand `HmhaMenu` the
`HMHA_MENU_TRIGGER` token (fork 15) — the only way a `ComponentPortal` can
receive data from whatever opened it.

The accessible description is **not** `aria-describedby` pointed at that
bubble. It's `@angular/cdk/a11y`'s `AriaDescriber`, which maintains its own
hidden, always-present text node per message and wires the host's
`aria-describedby` to it — independent of whether the visible bubble is
currently mounted. `AriaDescriber` is reference-counted across hosts
describing identical text, so `HmhaTooltip` must call `removeDescription()`
with the exact previous message on every change and on destroy, not just
`describe()` with the new one.

**Why:** a `ComponentPortal` mounts and unmounts on every hover — pointing a
persistent ARIA reference at something that comes and goes that often is
unreliable, and some assistive tech doesn't reliably announce content
rendered through a portal at all. This is the same approach Angular
Material's own tooltip takes, for the same documented reason — CLAUDE.md's
"use CDK, don't hand-roll" pointed straight at reusing the exact service
built for this, rather than re-deriving the ARIA mechanics ourselves.

**Rejected — pointing `aria-describedby` directly at the floating bubble's
own generated id:** simpler to write, but ties the accessible description's
presence to the bubble's mount lifecycle and to portal-content screen-reader
support that isn't guaranteed. `AriaDescriber` sidesteps both.

**A foundation fix this component needed, found before it could hide
again:** `hmhaOverlay()` never disposed an open overlay when its host was
destroyed — each consumer was expected to remember to call `close()` itself
in `ngOnDestroy`, which neither `HmhaMenuTrigger` nor `HmhaDialog` actually
needed to care about in practice (both are click-driven, closed by explicit
user action long before anything would destroy them mid-open). A
hover-driven Tooltip has no such guarantee — nothing stops the host element
from being removed from the DOM (an `*ngFor` update, a route change) while
the mouse is still over it, with no `mouseleave` ever firing. Fixed with one
`inject(DestroyRef).onDestroy(() => close())` inside `hmhaOverlay()` itself,
covering every current and future consumer, not just this one — the same
"fix it once in the foundation" reasoning as fork 15's two overlay fixes.
One new regression test in `overlay.spec.ts` (destroying the host disposes
an open overlay); 8 new tests in `tooltip.spec.ts` (148/148 total overall).
`build:lib`/`lint:css`/`lint:standalone` clean.

---

## Wave 3 progress — the step tracker

**This section is the single source of truth for Wave 3 status**, the same
way Wave 2 progress (above) was for Wave 2. Update the checklist and the
CURRENT STEP marker at the end of every step. The process rule itself (one
step at a time, stop-and-wait between steps, the done criteria) lives in
`CLAUDE.md`'s "Working through a wave" section — this section only tracks
where we are.

Component order follows fork 06's wave table: Dialog, Menu, Tooltip, Toast,
Tabs, then Select, then Combobox — Combobox explicitly last, since it wants
Menu's foundation already working and is "the hardest a11y problem in the
set." Whether Select and Combobox end up as two components or one with a
mode is a question for when step 8 arrives, not now.

1. [x] **1a.** Propose a shared CDK-overlay foundation (options +
   recommendation) — positioning and dismissal, built once on
   `@angular/cdk/overlay`, reused by Dialog/Menu/Tooltip/Toast/Select/
   Combobox. Focus-trapping deliberately excluded (diverges too much per
   component). — Approved: Option A (composable factory), scoped to
   positioning + dismissal only.
2. [x] **1b.** Build the approved foundation. `hmhaOverlay()` in
   `libs/ui/src/lib/core/overlay.ts`. Recorded as fork 13 above. 10 new
   unit tests covering all three position modes (connected/global-center/
   global-fixed-corner), Escape, outside-click, backdrop-click, and
   `dismissOnOutsideInteraction: false` (109/109 total), `build:lib`/
   `lint:css`/`lint:standalone` clean — all passed first try.
3. [x] **2A.** Build Dialog + tests — `libs/ui/src/lib/dialog/` (`dialog.ts`,
   `dialog.css`, `dialog.spec.ts`, `README.md`). Uses the native `<dialog>`
   element + `showModal()`, not `hmhaOverlay` — a real mid-step
   reconsideration, recorded as fork 14 (and fork 13 amended to match: Menu
   is `hmhaOverlay`'s actual first consumer now, not Dialog). Added
   `--hmha-color-backdrop` (new semantic token) for the `::backdrop` scrim.
   Found and documented a Karma-launcher-specific quirk (`<dialog>`'s
   `close` event doesn't fire there, confirmed fine in real Chromium) —
   now in CLAUDE.md. 10 new unit tests (118/118 total), `build:lib`/
   `lint:css`/`lint:standalone` clean.
4. [x] **2B.** Story: Dialog — `dialog.stories.ts` (Playground,
   OpenInteraction, CloseViaContentInteraction, BackdropDismissInteraction,
   NonDismissible). These interaction tests run in a real browser context
   (Storybook's own test runner, not Karma), so their passing is additional
   independent confirmation the native `showModal()`/`close()` mechanics
   work correctly — consistent with the earlier Playwright check, not just
   the Karma-adjusted unit tests. Visually confirmed the `::backdrop` scrim
   and centered modal render correctly. All 53 stories across the library
   pass `test-run` (incl. a11y).
5. [x] **3A.** Build Menu + tests — `libs/ui/src/lib/menu/` (`menu-trigger.ts`,
   `menu-context.ts`, `menu-item.ts`, `menu.ts`, two CSS files, three spec
   files, `README.md`). First real `hmhaOverlay` consumer — surfaced and
   fixed two bugs in the foundation itself, recorded as fork 15: a missing
   `injector` passthrough for `TemplatePortal`/`ComponentPortal` (NG0201 on
   `HMHA_MENU_TRIGGER` otherwise), and an outside-click dismissal that
   closed-then-reopened on a second trigger click because CDK's dispatcher
   runs in the capture phase. 21 new unit tests (139/139 total), `build:lib`/
   `lint:css`/`lint:standalone` clean.
6. [x] **3B.** Story: Menu — three colocated files (`menu-trigger.stories.ts`,
   `menu.stories.ts`, `menu-item.stories.ts`), matching the one-file-per-
   component-filename convention. Covers open/close, the fork-15
   toggle-close regression, keyboard navigation (with a disabled item
   skipped), typeahead, selection, Escape, and outside-click dismissal.
   Surfaced a second, Storybook-only instance of the `keyCode` test gap
   (see fork 15's note above) plus a typeahead-debounce timing gap, both
   fixed in the story files. All 12 Menu stories plus the full existing
   suite (65 stories) pass `test-run` (incl. a11y).
7. [x] **4A.** Build Tooltip + tests — `libs/ui/src/lib/tooltip/` (`tooltip.ts`,
   `tooltip.css`, `tooltip.spec.ts`, `README.md`). Uses `@angular/cdk/a11y`'s
   `AriaDescriber` for the real accessible description (independent of the
   bubble's mount/unmount) rather than pointing `aria-describedby` at the
   floating bubble itself — recorded as fork 16, along with a foundation fix
   `hmhaOverlay` needed for a hover-driven trigger specifically: it never
   disposed an open overlay on host destroy, a real gap for Tooltip (no
   guaranteed `mouseleave` before removal) even though Menu/Dialog never hit
   it. 9 new unit tests (1 in `overlay.spec.ts`, 8 in `tooltip.spec.ts`;
   148/148 total), `build:lib`/`lint:css`/`lint:standalone` clean.
8. [x] **4B.** Story: Tooltip — `tooltip.stories.ts` (Playground,
   HoverInteraction, FocusInteraction, EscapeDismissInteraction). Escape
   needed no `keyCode` workaround here (unlike Menu's arrow-key stories) —
   `hmhaOverlay`'s own Escape handling reads `event.key`, not the legacy
   `keyCode` CDK's `ListKeyManager` still switches on. All 4 Tooltip stories
   plus the full existing suite (69 stories) pass `test-run` (incl. a11y).
9. [ ] **5A.** Build Toast + tests **← CURRENT STEP**
10. [ ] **5B.** Story: Toast
11. [ ] **6A.** Build Tabs + tests
12. [ ] **6B.** Story: Tabs
13. [ ] **7A.** Build Select + tests
14. [ ] **7B.** Story: Select
15. [ ] **8A.** Build Combobox + tests
16. [ ] **8B.** Story: Combobox
17. [ ] **9.** Wave 3 gate — compose Dialog, Menu, Tooltip, Toast, Tabs,
    Select and Combobox together in `apps/sandbox`, per the wave-gate rule
    in fork 06 (mirrors Wave 2's step 8 — a real screen, not just stories).

---

## Open items

- **The blue is a placeholder.** Swap the hue in `tokens/primitive/color.json`
  and every ramp regenerates in place; the structure is the deliverable.
- **Compact's 4px vertical control padding is tight.** If the apps are
  dense-data rather than dense-chrome, consider 32px controls with 8px padding.
- **Amber-500 is the one base fill needing dark foreground text.** A small
  asymmetry you could design away by darkening it.
- **High-contrast mode** is a third value on the mode axis, not new machinery.
  The architecture supports it; do the ramp work once real components exist to
  test against.
