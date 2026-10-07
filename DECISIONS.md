# Decisions of record

Twenty architectural forks, decided. Each entry gives the decision, the
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

## 17 — Toast: a root-provided service, not a directive — and `hmhaOverlay` without a `ViewContainerRef`

**Decided:** `HmhaToast` is a plain `@Injectable({ providedIn: 'root' })`
with one method, `show(text, durationMs = 4000)` — not a directive or
component with a selector, the shape every other Wave 3 piece has taken so
far. It's triggered imperatively from anywhere (`inject(HmhaToast).show
(...)`), which is exactly CLAUDE.md's own stated reason for the two named
exceptions to "prefer an attribute selector on a native element": nothing
native fits a page-level, trigger-less notification, the same way nothing
native fit Dialog *before* fork 14 found one. Toast never found one either
— there genuinely isn't a host element for this component, so the service
shape is the honest one, not a workaround.

One visible toast at a time, queued (not stacked) when `show()` is called
again before the current one's duration elapses — the simplest behavior
that never silently drops a message. Real stacking can follow later if
it's actually needed; nothing here forecloses it.

**A foundation fix only a trigger-less consumer could surface:**
`hmhaOverlay()` unconditionally called `inject(ViewContainerRef)` — fine
for Menu and Tooltip, both real directives with a real host element, but a
root-provided service has no element and therefore no `ViewContainerRef` to
give it; injecting one there throws. CDK's own `ComponentPortal` already
anticipates this exact case — `attachComponentPortal` branches on whether
`portal.viewContainerRef` is set, falling back to `ApplicationRef.
attachView()` when it isn't. Fixed by injecting it as `{ optional: true }`
and threading `undefined` through; `TemplatePortal` has no such fallback
(an embedded view *requires* a container), so `open()` now throws clearly
if `TemplateRef` content is ever passed without one. `HmhaToast` only
opens a component (`HmhaToastPanel`, internal, unexported — the same
message-via-child-injector pattern as `HmhaTooltipPanel`), so this never
applies to it in practice; it exists so a `TemplateRef` misuse fails loudly
instead of silently.

**A testing note:** a `ComponentPortal` attached via `ApplicationRef.
attachView()` (the no-`ViewContainerRef` path) has no `fixture.
detectChanges()` to give it a first render — there's no fixture at all,
`HmhaToast` is tested as a plain injected service via `TestBed.inject()`.
`TestBed.inject(ApplicationRef).tick()` stands in for it. Also: the first
attempt at the queue/FIFO tests used overlapping wait windows (two 20ms
messages checked 60ms apart had both already cycled through and dismissed
by the time the assertion ran) — not a product bug, a test-timing bug;
fixed by spacing each check to land inside its message's own visible
window without overrunning into the next dismiss cycle.

**Rejected — giving `HmhaToast` its own injected `ViewContainerRef` by
requiring callers to provide one:** would have made `show()` take an
extra parameter every caller has to supply correctly, for a service whose
entire appeal is being callable from anywhere without any setup. Fixing
`hmhaOverlay` itself keeps the public API to one argument.

9 new unit tests in `toast.spec.ts` (153/153 total overall), `build:lib`/
`lint:css`/`lint:standalone` clean.

---

## 18 — Tabs: reading "needs a custom element name" as per-piece, not per-component

**Decided:** `HmhaTabs` is four pieces, every one an attribute selector on
a native element — `div[hmhaTabs]` (root, owns the selected `value` as a
required two-way `model<string>()`), `div[hmhaTabList]` (`role="tablist"`,
a CDK `FocusKeyManager` for Left/Right + Home/End with **automatic
activation** — arrow-key focus also selects), `button[hmhaTab]`
(`role="tab"`, real native click/Enter/Space for free), `div[hmhaTabPanel]`
(`role="tabpanel"`, hidden via the native `hidden` attribute). A tab and
its panel are matched by a shared string `value`, not DOM position, so
panels don't need to be interleaved with their tabs — both independently
inject the one `HMHA_TABS` context `HmhaTabs` provides, with ids generated
deterministically from `value` and namespaced per root instance (reusing
`_IdGenerator`, the same device fork 11's `HmhaRadioGroup` uses for its
`name`) rather than needing a lookup registry.

**Why no custom tag name, despite CLAUDE.md naming Tabs as needing one:**
applying the same per-piece reasoning already used throughout — a `<div>`
for a non-interactive container with no native analog (Menu's panel,
`div[hmhaMenu]`), a real `<button>` for anything actually clickable
(Switch, `button[hmhaSwitch]`) — leads here, and avoids hand-rolling
Enter/Space activation that a real `<button>` gives for free. Worth
noting: neither of CLAUDE.md's two named exceptions (Dialog, Toast) ended
up needing a custom tag either in practice — Dialog found the native
`<dialog>` element fit after all (fork 14), and Toast has no element at
all (fork 17). This reads that guidance as "no single native element
covers the composite Tabs *widget*" (true, and why the exception exists)
rather than "invent a tag for each of its parts" — not a departure from it.

**Rejected — nesting `HmhaTabPanel`s inside `HmhaTabList`** so DI could
resolve the normal way: would tangle two separable concerns (the trigger
strip and the content panels) into one container for a DI technicality,
and break the natural visual/DOM separation most ARIA Tabs examples show.
Providing the shared context on the outer `HmhaTabs` root instead — which
both `HmhaTabList`/`HmhaTab` and `HmhaTabPanel` are genuine descendants
of — needed no portal/injector-passthrough trick at all, unlike Menu.

**A test-writing note, not a design decision:** the host template's
`[(value)]="active"` two-way binding threw `NG0100` whenever a test
mutated `active` directly as a plain field (`fixture.componentInstance.
active = 'x'`) and called `detectChanges()` again — but never when the
*component itself* changed it (a click, an arrow key). `ɵɵtwoWayProperty`
expects the bound expression to participate in the reactive graph; a
plain field doesn't, even though a one-way `[value]="active"` binding
tolerates exactly this pattern everywhere else in this codebase. Fixed by
binding to a real `signal()` and mutating it with `.set()` — which
`dialog.spec.ts`'s `[(open)]="isOpen"` was already quietly doing
correctly; this is the first time another spec's host needed the same
two-way binding and copied the pattern without knowing why it mattered.

**A real CSS bug the axe check caught, not a test artifact:** `tab-panel.
css` set no `color` at all, so panel text inherited plain black
regardless of mode — invisible against a dark-mode background. Every
other floating-content component (Menu, Dialog, Toast, Tooltip) had
already declared both `background` and `color` together on `:host` and
never hit this; `HmhaTabPanel` is the first inline (non-floating,
non-"owns-its-own-surface") piece, where only `color` turned out to be
needed. Fixed by adding `color: var(--hmha-color-text)`.

18 new unit tests across `tabs.spec.ts`/`tab-list.spec.ts`/`tab.spec.ts`/
`tab-panel.spec.ts` (171/171 total), `build:lib`/`lint:css`/
`lint:standalone` clean.

**Step 6B (stories) hit the same `keyCode` gap as Menu's, plus a new
render-timing one.** `userEvent.keyboard('{ArrowRight}')` needed the same
manual-dispatch-with-`keyCode` workaround as Menu's arrow-key stories
(fork 15's note). More specifically here: `aria-selected` reflects a
signal updated via `FocusKeyManager`'s RxJS `change` subscription, while
`.focus()` (asserted via `toHaveFocus()`) is a synchronous DOM side
effect called directly by the key manager — the two don't settle on the
same tick, so `toHaveFocus()` passed immediately but `aria-selected`
needed a `waitFor(...)` around it. Four new component files in one
dev-server session also re-triggered the brand-new-file restart quirk
(this time the original styleUrl-error shape, not Toast's "No Preview"
one) — restarted, and found/cleared an orphaned duplicate `npm run
storybook` process left over from an earlier session restart in the
process. All 9 Tabs stories plus the full existing suite (81 stories)
pass `test-run` (incl. a11y).

---

## 19 — Select: built on `@angular/cdk/listbox`, not hand-rolled key handling

**Decided:** `HmhaSelect` is three pieces, each stacking our own styling
component with a CDK `listbox` directive on the *same* host element
rather than re-implementing anything CDK already does —
`button[hmhaSelectTrigger]` (the `ControlValueAccessor` surface, built on
`hmhaOverlay()`), `div[hmhaSelectListbox][cdkListbox]` (bridges
`CdkListbox`'s own value/selection to the trigger), `div[hmhaSelectOption]
[cdkOption]` (pure styling — `CdkOption` already supplies `role="option"`,
`aria-selected`, `aria-disabled`, and click handling). CLAUDE.md names
`@angular/cdk`'s `listbox` module explicitly alongside `a11y`/`overlay` as
something to use, not hand-roll (unlike Menu and Tabs, where no dedicated
CDK module exists and a raw `FocusKeyManager` was the right level to build
on) — this is the first component to reach for it, and it is as complete
as advertised: full keyboard nav (arrows, Home/End, typeahead), a
selection model (single or multi), and `ControlValueAccessor` built in.
`HmhaSelectListbox`'s own job shrinks to almost nothing as a result: sync
the trigger's value in, forward `cdkListboxValueChange` back out, and
close the popup on pick (matching native `<select>` — unlike Menu, where
every item click closes regardless of "selection").

Reopening re-focuses whichever option is currently selected, not always
the first — `CdkListbox.focus()`'s own documented behavior
(`_setNextFocusToSelectedOption`), not something built here.

**A real accessibility gap the axe check caught:** `role="listbox"` is an
ARIA input role and needs an accessible name of its own — easy to miss
since the *options* inside it already have names (their own text), and
nothing flagged it until axe's `aria-input-field-name` rule did. Fixed by
giving the trigger a stable `id` (falling back to a self-generated one via
`_IdGenerator` when not wrapped in an `HmhaField`, same device as fork
11's `HmhaRadioGroup`) and pointing the listbox's `aria-labelledby` at it
— the trigger's own visible text is the listbox's accessible name.

**Rejected — having `HmhaSelect` auto-derive the trigger's closed-state
label from the options:** the options only exist inside the overlay while
it's open (same lazy-render shape as Menu), so there's no persistent
registry to read a label from without keeping a second, always-rendered
copy of the options around defeating that. Scoped out for v1 — the
trigger's content is the consumer's own binding, same data they already
have to feed the `FormControl`. Documented in the README as a deliberate
scope decision, not an oversight.

**A test-writing note:** interpolating `FormControl.value` directly in a
template (`{{ control.value || 'placeholder' }}`) threw `NG0100` on a
second `detectChanges()` after `setValue()` — a plain mutable property
read, not a signal, behaving differently here than `[formControl]`'s own
internal wiring does elsewhere in this codebase. Not a product bug;
rewrote the test host to keep static trigger text and assert `control.
value` directly instead of through the template.

17 new unit tests across `select-trigger.spec.ts`/`select-listbox.spec.ts`/
`select-option.spec.ts` (188/188 total), `build:lib`/`lint:css`/
`lint:standalone` clean.

**Step 7B (stories) caught a real color-contrast failure the unit suite
never could — `axe-core` in Karma was always scoped to a single fixed
mode per assertion, but Storybook's a11y panel checks the actual rendered
page as composed, including a state unit tests hadn't isolated: an option
that is both selected AND active/hovered at once (blue `--hmha-color-
action` text on the `--hmha-color-bg-subtle` active background, 4.46:1,
just under the 4.5:1 AA floor for normal text).** Per the storybook
skill's a11y guidelines, color contrast is a visual/design call, not an
auto-fix — asked the user for a direction rather than silently picking
one. Fixed by dropping the colored-text selection indicator entirely and
adding a trailing `<hmha-icon name="check">` instead, which sidesteps
text-on-variable-background contrast altogether. Also hit the brand-new-
file restart quirk again (expected — Select is new this session) and
found yet another orphaned duplicate `npm run storybook` process in the
process, same as fork 18's story step. All 10 Select stories plus the
full existing suite (91 stories) pass `test-run` (incl. a11y).

---

## 20 — Combobox: active-descendant mode, and why it needs keydown forwarding

**Decided:** `HmhaCombobox` mirrors `HmhaSelect`'s three-piece shape —
`input[hmhaCombobox]` (the `ControlValueAccessor`, built on
`hmhaOverlay()`), `div[hmhaComboboxListbox][cdkListbox]` (bridges
`CdkListbox` to the input), `div[hmhaComboboxOption][cdkOption]` (styling
only, no "selected" state — a combobox's options are suggestions, not a
persistent choice) — but with `CdkListbox` configured in **active-
descendant mode** (`cdkListboxUseActiveDescendant="true"`) instead of
Select's default real-focus-movement mode. Real DOM focus has to stay in
the input the entire time — the user is still typing — so the highlighted
suggestion is tracked virtually via `aria-activedescendant` instead of
actual focus.

**The mechanical consequence, and the one genuinely new piece of
plumbing this component needed:** `CdkListbox`'s own `(keydown)` host
listener lives on *its own* element. In Select, real focus moving into
the options meant keydowns landed there naturally. Here, focus never
leaves the input, so those keydowns never reach the listbox via bubbling
at all — `HmhaComboboxInput` has to construct a fresh `KeyboardEvent` and
`dispatchEvent()` it directly at the listbox's native element whenever
the user presses Arrow/Home/End/Enter. `dispatchEvent()` is synchronous,
so every listener on that element — including `CdkListbox`'s own — has
finished running by the time it returns, which is also what makes reading
the resulting active option back immediately afterward safe.

**A real bug the first test attempt caught: `computed()`/`effect()`
can't see `CdkOption.isActive()` change, because nothing it reads is a
signal.** `isActive()` resolves to a plain `listKeyManager.activeItem ===
this` comparison — true state, but not reactive state. Wrapping it in a
`computed()` (the first attempt) meant Angular's dependency tracking saw
only the `contentChildren` signal, which never changes across navigation,
so the computed's cached value never updated after its first (null)
evaluation — a convincing-looking fix that silently never ran again. The
working fix drops reactive derivation entirely in favor of what fork 15
already established the mechanism for: a plain, non-memoized method
(`HmhaComboboxListbox.getActiveOptionId()`) called imperatively,
synchronously, right after the forwarded keydown's `dispatchEvent()`
returns — correctness guaranteed by dispatch ordering, not by hoping
Angular's reactivity graph noticed something it structurally couldn't.

**A second real bug, same root cause (two directives, one attribute):**
`CdkListbox` binds its own host `[id]` (auto-generating one if unset) —
adding a *second*, competing `[attr.id]` binding from `HmhaComboboxListbox`
lost silently to CDK's own, breaking the `aria-controls` the input needs
to point at it correctly. Fixed by setting `cdkListbox.id` imperatively
in the constructor instead of adding a competing host binding — let the
directive that already owns an attribute keep owning it.

**A third, narrower bug caught only once Enter selected an option:**
reading the active id unconditionally after every forwarded dispatch
crashed on Enter specifically — `triggerOption()` fires `cdkListbox
ValueChange` synchronously *inside* that same dispatch, which flows
through `selectValue()` → `close()` → nulls the registered listbox
reference before the dispatch call even returns. Fixed by checking the
listbox reference is still non-null before reading from it, rather than
assuming the popup is still open just because its own keydown handler
hasn't returned yet.

**Rejected — giving Combobox a code/label split like Select's:** there's
no "display text vs. underlying value" distinction possible for a plain
text field the way a button-triggered Select can have one — whatever's
in the box *is* the value. An option's `cdkOption` value is simply its
own display text.

17 new unit tests across `combobox-input.spec.ts`/
`combobox-listbox.spec.ts`/`combobox-option.spec.ts` (205/205 total),
`build:lib`/`lint:css`/`lint:standalone` clean.

**Step 8B (stories) found a fourth real bug, worse than the three above —
this one only a real pointer interaction could catch.** Storybook's
`userEvent.click()` on an option left `document.activeElement` on
`<body>`, not the input — a real browser's default behavior when a
non-focusable `<div>` is clicked, which blurs whatever was previously
focused unless something prevents it. This breaks the one guarantee the
whole component is built on (real focus never leaves the input).
Confirmed as a genuine gap in the *Karma* suite, not a false alarm: with
the fix temporarily removed, every existing Karma test — including one
written specifically to try to catch this via a dispatched `mousedown` —
kept passing anyway. Neither `.click()` nor a synthetic
`dispatchEvent(new MouseEvent('mousedown'))` reproduces the browser's
actual default focus-shift action; only a real pointer interaction does.
Fixed with `(mousedown)` → `preventDefault()` on `HmhaComboboxOption`
(standard technique: blocks the browser's default focus-shift, while
`CdkOption`'s own later `(click)` handler still fires normally). The
ineffective Karma test was removed rather than kept as false coverage;
the real verification lives in `ComboboxInput`'s `SelectionInteraction`
story. General lesson recorded in CLAUDE.md, next to the `<dialog>`
close-event quirk it mirrors: know which layer — an event firing vs. its
actual default action — Karma can and can't verify.

Also hit two Storybook-only issues, both resolved without touching the
component: the brand-new-file restart quirk (expected, Combobox is new
this session), and a genuine test-logic bug in two of the component's own
stories — `KeyboardNavigationInteraction` and `EnterCommitsInteraction`
assumed the *first* `ArrowDown` both opens the popup and activates an
option, when it only opens (confirmed by the Karma spec's own `openListbox()`
helper, which opens via a simulated `input` event instead, so its first
ArrowDown has always had something open to navigate). A failing `waitFor`
assertion that never becomes true renders in Storybook's test runner as a
generic "No Preview" page, not a normal assertion failure — worth knowing,
since that symptom otherwise looks identical to the brand-new-file restart
quirk and sent the first round of debugging in the wrong direction.

All 10 Combobox stories plus the full existing suite (101 stories) pass
`test-run` (incl. a11y).

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
9. [x] **5A.** Build Toast + tests — `libs/ui/src/lib/toast/` (`toast.ts`,
   `toast.css`, `toast.spec.ts`, `README.md`). A root-provided service, not
   a directive — the other named exception to "prefer a native element"
   alongside Dialog. Needed a foundation fix (fork 17): `hmhaOverlay()`
   unconditionally required a `ViewContainerRef`, which a service with no
   host element doesn't have — now optional, leaning on CDK's own
   `ApplicationRef.attachView()` fallback for component content.
   9 new unit tests (153/153 total), `build:lib`/`lint:css`/
   `lint:standalone` clean.
10. [x] **5B.** Story: Toast — `toast.stories.ts`. Since `HmhaToast` has no
   selector of its own, the story wraps it in a small demo host component
   (`ToastDemo`, local to the story file, two buttons calling `show()` with
   distinct messages) rather than setting `component:` to the service
   directly. Covers the live region (role/aria-live), auto-dismiss, and
   queueing. Hit the brand-new-file dev-server quirk in a new shape (a
   silent "No Preview" page rather than the usual styleUrl error) — now in
   CLAUDE.md. All 3 Toast stories plus the full existing suite (72 stories)
   pass `test-run` (incl. a11y).
11. [x] **6A.** Build Tabs + tests — `libs/ui/src/lib/tabs/` (`tabs.ts`,
   `tab-list.ts`, `tab.ts`, `tab-panel.ts`, four CSS files, four spec
   files, `README.md`). Four native-element attribute selectors, no custom
   tag names — recorded as fork 18, including why that reads as consistent
   with CLAUDE.md's "Tabs needs a custom element name" rather than against
   it. Found a real CSS bug via the axe check (panel text had no explicit
   `color`, invisible in dark mode) and a test-writing gotcha with
   `[(value)]` two-way bindings needing a real signal, not a plain field.
   18 new unit tests (171/171 total), `build:lib`/`lint:css`/
   `lint:standalone` clean.
12. [x] **6B.** Story: Tabs — four colocated files (`tabs.stories.ts`,
    `tab-list.stories.ts`, `tab.stories.ts`, `tab-panel.stories.ts`),
    matching the one-file-per-component-filename convention. Covers the
    composed widget (selection by click, keyboard navigation with a
    disabled tab skipped), Home/End, individual tab/panel states, and
    visibility switching. All 9 Tabs stories plus the full existing suite
    (81 stories) pass `test-run` (incl. a11y).
13. [x] **7A.** Build Select + tests — `libs/ui/src/lib/select/`
    (`select-trigger.ts`, `select-listbox.ts`, `select-option.ts`, three
    CSS files, three spec files, `README.md`). First component built on
    `@angular/cdk/listbox` directly (recorded as fork 19) rather than a
    raw `FocusKeyManager` — CLAUDE.md names it explicitly, unlike Menu/
    Tabs where no dedicated CDK module existed. Found a real a11y gap via
    the axe check (the listbox itself had no accessible name) and a
    test-writing-only `NG0100` from interpolating `FormControl.value`
    directly in a template. 17 new unit tests (188/188 total), `build:lib`/
    `lint:css`/`lint:standalone` clean.
14. [x] **7B.** Story: Select — three colocated files
    (`select-trigger.stories.ts`, `select-listbox.stories.ts`,
    `select-option.stories.ts`). Covers open/close, the fork-15
    toggle-close regression, selection, keyboard navigation with a
    disabled option skipped, Escape, the listbox's own `aria-labelledby`,
    and reopen-highlights-selected. Caught a real color-contrast failure
    (fixed — see fork 19's update above) that the unit suite's per-mode
    assertions never surfaced. All 10 Select stories plus the full
    existing suite (91 stories) pass `test-run` (incl. a11y).
15. [x] **8A.** Build Combobox + tests — `libs/ui/src/lib/combobox/`
    (`combobox-input.ts`, `combobox-listbox.ts`, `combobox-option.ts`,
    three CSS files, three spec files, `README.md`). `CdkListbox` in
    active-descendant mode — real focus stays in the input, so keydowns
    have to be forwarded to the listbox's own element via `dispatchEvent`
    rather than relying on bubbling (recorded as fork 20, the hardest a11y
    problem in Wave 3 per fork 06, saved for last as planned). Found and
    fixed three real bugs while testing: `computed()` can't see
    `CdkOption.isActive()` change (not signal-backed), `CdkListbox`'s own
    `[id]` binding silently wins over a second one, and reading the active
    option after Enter-selects crashes since selection itself nulls the
    registered listbox mid-dispatch. 17 new unit tests (205/205 total),
    `build:lib`/`lint:css`/`lint:standalone` clean.
16. [x] **8B.** Story: Combobox — three colocated files
    (`combobox-input.stories.ts`, `combobox-listbox.stories.ts`,
    `combobox-option.stories.ts`). Found and fixed a fourth real bug only
    a real pointer interaction could catch (clicking an option blurred the
    input — see fork 20's update above), plus a test-logic bug in two
    stories that assumed the first ArrowDown both opens and navigates.
    All 10 Combobox stories plus the full existing suite (101 stories)
    pass `test-run` (incl. a11y).
17. [x] **9.** Wave 3 gate — a real "Team" screen in `apps/sandbox`
    (`app.ts`/`app.html`/`app.css`), composing all seven: `HmhaTabs` holds
    three panels (Members, Invite, Danger zone); each member's role is an
    `HmhaSelect` bound to a real per-member `FormControl`; a kebab
    `HmhaMenu`'s "Remove from team" opens an `HmhaDialog`, confirming
    removes the member and fires an `HmhaToast`; an info `HmhaTooltip`
    explains what the roles mean; the Invite tab's `HmhaCombobox` searches
    teammates by name and sending an invite fires its own `HmhaToast`; the
    Danger zone's "Delete workspace" is the same Dialog→Toast shape again.
    11 new sandbox tests (DOM-only, matching Wave 2's gate style) exercise
    every path: tab switching, role selection, the full remove-member
    flow (menu → dialog → toast) and its cancel path, the invite flow, and
    the delete-workspace flow; 216/216 total across the whole workspace.

    No browser-automation tool was available this session to drive it
    live the way Wave 2's gate was (Playwright, per that step's entry
    above) — `build:lib`, `ng build sandbox`, `lint:css`, `lint:standalone`
    and the full test suite are all clean, and the dev server was run and
    left serving the real screen for manual visual confirmation, but that
    is a real gap against this wave's gate relative to Wave 2's, not
    something to paper over.

    **A real test-writing bug, not a product one:** querying
    `[hmhaMenuTrigger]`/`input[hmhaCombobox]` by attribute selector — the
    pattern used throughout every component's own specs — returned `null`
    here. The difference: those specs always wrote the attribute as a
    *bare* string (`cdkOption="us"`), which Angular leaves in the compiled
    DOM because it was typed there directly. This app's template binds
    both via `[hmhaMenuTrigger]="memberMenu"`/`[hmhaCombobox]="listboxTpl"`
    — a *property* binding to a template-ref variable, which never
    reflects as a DOM attribute at all, regardless of whether the
    directive matched correctly. Fixed by querying each directive's own
    static host attribute instead (`[aria-haspopup="menu"]`,
    `[role="combobox"]`) — attributes actually guaranteed to be present,
    rather than an attribute that happens to exist only when a consumer's
    binding style leaves it there.

**Wave 3 is complete.** All seven components (Dialog, Menu, Tooltip,
Toast, Tabs, Select, Combobox) are built, unit-tested, documented in
Storybook, and proven together in a real screen — the gate fork 06
requires before a Wave 4 could start.

---

## 21 — Wave 4 scope: Pagination, Table, Data Grid — consumer owns data/state

**Decided:** Wave 4 pursues fork 06's deferred "Table / Data Grid" line, plus
a `HmhaPagination` control fork 06 never named at all. Build order: Pagination,
then Table, then Data Grid — smallest and most independent first, the same
rationale Wave 1 used for Icon-before-Button.

**Why Pagination first, and why it's a real separate component, not a grid
feature:** fork 06 scoped Table and Data Grid as a pair but said nothing about
pagination. A page control is useful anywhere there's a page concept — a
plain list, search results — not only next to a grid. Building it
independent of the grid is what keeps it reusable there too.

**Architectural call made now, not mid-build: all three components stay
purely structural — the consumer owns the data array and the paging state.**
`HmhaPagination` takes a current page and a page count and emits page
changes; it never sees how many rows exist or what a "page size" means.
`HmhaTable` only brands native table elements with tokens — no model at all.
`HmhaDataGrid` (sort/select/resize/virtualize, still "a quarter" per fork 06)
renders whatever rows it's handed and emits sort/select intents; it does not
own, slice or cache the backing array. This matches Select's trigger-label
and Combobox's filtering — both already left to the consumer rather than the
component — and it keeps every piece composable outside a grid context too
(Pagination reused for a search-results list with no grid in sight).

**Rejected — Data Grid owning paging/sort state internally:** less code at
the call site for the common in-memory-array case, but it ties the
component to one data shape and fights any consumer doing server-side
paging or sorting, where "the current page" is a network request, not a
slice of an array already in memory.

---

## 22 — Data Grid: `HmhaTable`'s own pieces + plain `@for`, not `@angular/cdk/table`

**Decided, after a reconsideration before any code was written:** the
first proposal was `CdkTable` stacked directly on `HmhaTable`'s pieces,
reasoning that both expose native-element selectors
(`table[cdk-table]`/`tr[cdk-row]`/etc. alongside
`table[hmhaTable]`/`tr[hmhaTableRow]`/etc.). That reasoning only checked
selector overlap, not a harder Angular constraint: at most one *component*
(anything with its own template) may match a given host element — unlike
directives, which stack freely. `HmhaIconButton` stacking on `HmhaButton`
works only because `HmhaIconButton` has no template of its own. Checking
CdkTable's actual compiled source showed `CdkTable`, `CdkRow` and
`CdkHeaderRow` are all full components with their own internal templates
(`CdkTable` generates its own `<thead>`/`<tbody>`/`<tfoot>` and outlet
directives; `CdkRow`/`CdkHeaderRow`'s template is `<ng-container
cdkCellOutlet>`) — so `<table hmhaTable cdk-table>` and `<tr hmhaTableRow
cdk-row>` would both be two components matching one element, which Angular
refuses to compile. (Cells were never a problem: `CdkCell`/`CdkHeaderCell`
*are* plain directives, so `HmhaTableCell`/`HmhaTableHeaderCell` stack on
them fine — the conflict is specific to the table root and the row.)

The only real fix at that level is subclassing (`class HmhaDataGrid
extends CdkTable { ... }`, giving the subclass its own selector and a copy
of CdkTable's internal template/outlets — how Angular Material's own
`MatTable` does it) — workable, but meaningfully riskier and more involved
than the original proposal conveyed, with real chances of further
surprises once actually built. Given the team context (fork 06: one
maintainer, maintenance capacity is the binding constraint), the user
chose to play it safer: hand-roll instead of taking on that risk for a
library dependency that was never load-bearing for the parts that
actually matter.

**What's actually built on real CDK, and what's hand-rolled:**
- **Rendering** — plain `@for`/`track` directly over `HmhaTable`'s
  existing pieces (`table[hmhaTable]`, `tr[hmhaTableRow]`,
  `th[hmhaTableHeaderCell]`, `td[hmhaTableCell]`) — no conflict, since
  there's no competing component. `@for`'s own `track` already handles row
  identity/reordering; `CdkTable`'s diffing engine wasn't buying anything
  beyond that.
- **Virtualization** — still real CDK, just not `CdkTable`:
  `@angular/cdk/scrolling`'s `CdkVirtualScrollViewport`/`*cdkVirtualFor`
  are structural directives, not competing components, so they're
  independent of the whole conflict above. Opt-in; composed in the
  consumer's own template, documented rather than built as a new
  component. No *component* conflict doesn't mean no composition
  gotcha, though — the viewport has to wrap the whole table, not just
  the body rows, or CSS breaks every column's layout anyway. See step
  3f below for what that actually looked like and how it was found.
- **Sort** — no CDK primitive exists regardless of foundation; sorting
  UI/state (`MatSort`) is Material-only. Hand-rolled: a header click emits
  a sort intent, the grid never sorts anything itself. The consumer
  re-sorts their own array and feeds back which column/direction is
  active so the indicator renders — same input-reflects/output-emits shape
  `HmhaPagination` already uses.
- **Selection** — `SelectionModel` (`@angular/cdk/collections`) is real
  CDK, not Material, and has no template/component-conflict surface at
  all (it's a plain TypeScript class, not a directive) — used as internal
  bookkeeping. The actual selected-ids set is still consumer-owned via a
  bound model (fork 21); checkboxes reuse `HmhaCheckbox` rather than new
  markup.
- **Resize** — `@angular/cdk-experimental/column-resize` exists upstream
  but isn't installed here, and pulling in an "experimental" package for a
  core interaction was already rejected as a stability risk before the
  CdkTable reconsideration, independent of it. Hand-rolled via native
  Pointer Events.

---

## Wave 4 progress — the step tracker

**This section is the single source of truth for Wave 4 status**, the same
way Wave 2 progress and Wave 3 progress were for their waves. Update the
checklist and the CURRENT STEP marker at the end of every step. The process
rule itself (one step at a time, stop-and-wait between steps, the done
criteria) lives in `CLAUDE.md`'s "Working through a wave" section — this
section only tracks where we are.

Component order follows fork 21: Pagination, then Table, then Data Grid.
Data Grid's own sub-steps aren't itemized yet — it gets broken down the way
Select/Combobox were, once step 3 actually arrives, not now.

1. [x] **1A.** Build Pagination + tests — `libs/ui/src/lib/pagination/`
   (`pagination.ts`, `pagination.css`, `pagination.spec.ts`, `README.md`).
   An attribute directive on native `<nav>`, purely structural per fork 21:
   `page` is a required `model()`, `pageCount` a required `input()` the
   consumer computes from their own data — the component never sees the
   backing array. Internally composes the existing `HmhaButton`/
   `HmhaIconButton`/`HmhaIcon` rather than hand-rolling button markup, so it
   inherits their focus ring, disabled handling and tone styling for free;
   its own CSS is just a flex layout plus the non-interactive ellipsis.
   Page window is a fixed default (first, last, current ± 1, one ellipsis
   per gap) — not exposed as a tunable input. 10 new unit tests (215/215
   total), `build:lib`/`lint:css`/`lint:standalone` clean.

   Two issues surfaced while writing the spec, both test bugs rather than
   component bugs: an assertion that assumed the last page renders as
   plain text instead of a real button (it's a genuine page button, same
   as any other), and a missing `settle()` wait before sampling colours in
   the axe loop — nested `HmhaButton` instances transition `background` on
   a token change (mode switch), the same timing gap `button.spec.ts`
   already documents and guards against. Reused its exact fix rather than
   treating it as new.
2. [x] **1B.** Story: Pagination — `pagination.stories.ts` (Playground,
   Sizes, ManyPages, EdgeStates, Disabled, PageClickInteraction,
   PreviousNextInteraction). Hit the documented "every Storybook MCP call
   times out" quirk, but broader than usual: `test-run` timed out even for
   an existing, already-passing story (Button's Playground), while
   `docs-list`/`stories-preview` kept responding — pointed at the separate
   `addon-vitest` process specifically (alive since Oct 3), not a problem
   with the new component. Restarted the dev server (killed `npm run
   storybook`/`ng run hmha-ui:storybook`/the vitest process, cleared
   `node_modules/.cache/storybook`), which cleared it. Caught one real,
   if minor, a11y finding: the Sizes and EdgeStates stories each render
   three `<nav aria-label="Pagination">` instances side by side, which
   axe's `landmark-unique` rule correctly flags — fixed by giving each
   instance a distinct `ariaLabel`, the input that exists for exactly
   this case (documented in the component's own README). All 7 Pagination
   stories plus the full existing suite (102 stories) pass `test-run`
   (incl. a11y).
3. [x] **2A.** Build Table + tests — `libs/ui/src/lib/table/` (`table.ts`,
   `table-row.ts`, `table-header-cell.ts`, `table-cell.ts`, four CSS files,
   `table.spec.ts`, `README.md`). Four attribute-selector pieces on native
   table elements (`table[hmhaTable]`, `tr[hmhaTableRow]`,
   `th[hmhaTableHeaderCell]`, `td[hmhaTableCell]`) — the same multi-piece
   shape fork 18 used for Tabs, for the same reason: a component with no
   template of its own can't reach past `<ng-content>` into projected
   children with scoped CSS, so each native sub-element that needs its own
   visual treatment gets its own small component. `HmhaTableRow` is meant
   for body rows only — striping (`:host(:nth-child(even))`) and hover
   don't apply to a header row, which needs no directive; all header
   styling lives on `HmhaTableHeaderCell` instead, which also defaults
   `scope="col"` (settable to `"row"`) since real screen readers benefit
   from it and native tables don't set it themselves. Purely visual per
   fork 21 — no sort/select/resize/data model, row padding comes from the
   already density-aware `--hmha-control-padding-y/x` tokens for free.

   **A real bug, not a test artifact:** the first draft assumed `<table>`'s
   text color would inherit from the app's global `body { color: var(
   --hmha-color-text) }` (set in `apps/sandbox/src/styles.css` and
   mirrored in Storybook's `preview.css`) — but Karma's test environment
   never loads that global stylesheet, so the table fell back to the
   browser's black default against a dark-mode background, an axe
   `color-contrast` failure. Every other component in the library sets its
   own color explicitly rather than relying on ambient page inheritance
   (Button's `--hmha-button-fg`, Card's `--hmha-card-fg`); fixed by doing
   the same here (`--hmha-table-fg`, consumed as `color` on `:host`) rather
   than leaning on a global stylesheet a real consumer could just as
   easily forget to wire up. 7 new unit tests (221/221 total), `build:lib`/
   `lint:css`/`lint:standalone` clean.
4. [x] **2B.** Story: Table — `table.stories.ts` (Playground, RowHeaderScope,
   Densities). Hit the documented brand-new-component styleUrl quirk again
   on the first story written against `HmhaTable`; same fix (restart the
   dev server, clear the cache) cleared it. A genuinely new finding this
   time: an attempted `HoverInteraction` story asserting `:host(:hover)`'s
   background swap failed in both environments, because `userEvent.hover()`
   dispatches synthetic pointer events without updating the browser's own
   `:hover` pseudo-class tracking — CSS's reverse of the already-documented
   Combobox focus-shift gap (fork 20), and with no JS-level workaround
   available since `:hover` has no event behind it to dispatch directly.
   Deleted the story rather than keep a play function asserting something
   this layer structurally can't produce; documented the gap in
   `CLAUDE.md` next to the `<dialog>`/Combobox notes. All 3 Table stories
   plus the full existing suite (105 stories) pass `test-run` (incl.
   a11y).
5. [x] **3a.** Propose Data Grid's foundation (options + recommendation) —
   approved, then corrected before any code: the first proposal (`CdkTable`
   stacked on `HmhaTable`'s pieces) turned out to need two components on
   one element, which Angular doesn't allow; revised to a plain `@for`
   over `HmhaTable`'s existing pieces instead, with `@angular/cdk/
   scrolling`/`SelectionModel` kept for virtualization/selection since
   those have no such conflict. See fork 22 for the full reconsideration.
6. [x] **3b.** Core grid — `libs/ui/src/lib/data-grid/` (`data-grid.ts`,
   `data-grid.spec.ts`, `README.md`). `HmhaDataGrid` is a thin `@Directive`
   (not a component — stacks on `table[hmhaTable]` with no conflict) that
   sets `table-layout: fixed`, the anchor every later piece (sort button,
   resize handle) belongs to. No CSS file of its own — all visual styling
   stays in `HmhaTable`'s existing component tokens. Rendering itself is
   just `HmhaTable`'s pieces plus the consumer's own `@for`; nothing new
   needed there, confirmed by a real composition test (a plain array
   signal, `@for`/`track`, removing a row and reflecting it) rather than
   just asserting the directive exists — that test is the actual proof
   fork 22's revised foundation holds up, not merely an assumption. 6 new
   unit tests (227/227 total), `build:lib`/`lint:css`/`lint:standalone`
   clean, first try — no real bugs found this step, unlike Pagination and
   Table.
7. [x] **3c.** Sorting — `HmhaDataGridSortButton`
   (`button[hmhaDataGridSortButton]`, `data-grid-sort-button.ts`/`.css`/
   `.spec.ts`). A pure intent emitter: clicking never sorts anything,
   it suggests the next direction as a two-state cycle (ascending ⇄
   descending, never a third "unsorted" state) via `sortRequest`, and the
   consumer decides what to actually do — re-sort their own array, feed
   the real state back through `active`/`direction`. No cross-column
   coordination — confirmed by the component having no dependency on
   siblings at all, not just by design intent. Also extended
   `HmhaTableHeaderCell` (built in step 2A) with an optional `sort` input
   reflecting `aria-sort`, unset by default so a plain header stays
   non-sortable — a small, backward-compatible addition, not a new piece.
   `HmhaSortDirection` added to `core/types.ts` alongside `HmhaTone`/
   `HmhaSize`. 11 new unit tests (238/238 total), `build:lib`/`lint:css`/
   `lint:standalone` clean, first try.
8. [x] **3d.** Selection — no new `Hmha*` component at all.
   `HmhaCheckbox` is reused directly in header (select-all) and body
   cells, bound via `[ngModel]`/`(ngModelChange)` rather than `[checked]`/
   `(change)` (which `HmhaCheckbox` already claims for its own Forms
   integration) — works on any `ControlValueAccessor` without a
   `FormGroup`/`FormControl` per row. Added `indeterminate` to
   `HmhaCheckbox` itself (a small, backward-compatible addition, same
   shape as 3c's `HmhaTableHeaderCell.sort` — a plain DOM property, not an
   attribute, and unrelated to the checked value/CVA). The select-all
   tri-state is a `computed()` the consumer writes themselves from their
   own rows + selected set; `SelectionModel` (`@angular/cdk/collections`)
   is real CDK used as bookkeeping convenience, bridged to a signal via
   `takeUntilDestroyed()` since its `changed` stream is RxJS. No DI
   context needed, confirmed the same way as 3c: the test host has no
   coordination machinery at all, just plain bindings.

   **A real a11y bug, caught by axe, not invented for coverage:** the
   first draft of both the test and the README's own example had neither
   checkbox wrapped in a `<label>` nor given an `aria-label` — axe's
   `label` rule failed immediately (`critical` impact), correctly, since
   a screen reader user would have had no idea what either checkbox was
   for. Fixed both the test and the README example with explicit
   `aria-label`s, the per-row one naming the row rather than repeating
   identical text for every row. 16 new unit tests across
   `checkbox.spec.ts` and the new `data-grid-selection.spec.ts` (246/246
   total), `build:lib`/`lint:css`/`lint:standalone` clean.
9. [x] **3e.** Column resizing — `HmhaDataGridResizeHandle`
   (`div[hmhaDataGridResizeHandle]`, `data-grid-resize-handle.ts`/`.css`/
   `.spec.ts`). Sits inside the header cell it resizes and finds its own
   column via `closest('th')` — a plain DOM query, not DI, same reasoning
   as 3c/3d's "nothing to coordinate with a parent for." `width` is a
   `model()`, internal-by-default (works with zero bindings) but
   two-way so a consumer can persist it. Implements the WAI-ARIA
   `separator` pattern for real — keyboard (ArrowLeft/ArrowRight) resize
   alongside pointer drag, not just the pointer half, since a drag-only
   handle is unusable from the keyboard. Required `HmhaTableHeaderCell`
   to gain `position: relative` (table step, small and backward
   compatible) so the handle can anchor to its trailing edge. 19 new unit
   tests (262/262 total), `build:lib`/`lint:css`/`lint:standalone` clean.

   **Two real findings, both from the test writing, not invented for
   coverage:**
   1. `aria-valuenow` was being omitted entirely until the first resize —
      WAI-ARIA requires it whenever a `separator` is focusable, which this
      one always is. Fixed by always reporting the *effective* current
      width, measuring the rendered column via `getBoundingClientRect()`
      as a fallback when the `width` model is still unset, rather than
      reporting nothing until a first interaction.
   2. The test's own first attempt to establish a "known starting width"
      via a `<col style="width:200px">` under `table-layout:fixed` wasn't
      reliable — measured widths drifted upward across sequential test
      runs (396px, then 406px, then 436px), consistent with the test
      runner's own page accumulating un-destroyed fixtures from prior
      tests rather than any product bug. Fixed by binding `[width]`
      explicitly in the test host instead of depending on real CSS table
      layout for a precise starting pixel value — the one test that
      genuinely needs to exercise the real-measurement fallback path
      compares against a fresh `getBoundingClientRect()` read at
      assertion time instead of a hard-coded pixel constant.
10. [x] **3f.** Story: Data Grid — `data-grid.stories.ts` (Playground,
    SortingInteraction, SelectionInteraction, ResizingInteraction,
    Virtualization). Playground/the three interaction stories compose
    sort + selection + resize together in one realistic demo
    (`DataGridDemo`), the same way the real consumer would — nothing in
    that demo belongs to any Hmha component. Hit the brand-new-component
    styleUrl quirk again on the first story; the usual restart cleared
    it.

    **The virtualization story found that the README's own guidance,
    written back in step 3b before any of this was built, was wrong —
    not just incomplete.** The original claim was "wrap the body in
    `<cdk-virtual-scroll-viewport>`, swap `@for` for `*cdkVirtualFor`,
    it just works." It compiles and renders with no error that way, but
    actually measuring rendered widths (not just checking the story
    didn't crash) showed every column's layout broken — CSS's
    anonymous-table-object rules squeeze a div-shaped viewport placed
    directly inside `<tbody>` into roughly one column's width instead of
    the table's full width. Root-caused with two throwaway Karma
    experiments (deleted after use, per the established discipline of
    not keeping diagnostic-only specs) before touching the real story:
    one isolating `CdkVirtualScrollViewport` completely outside any
    table (which also surfaced a second, independent finding below),
    one testing the fix. The fix is structural: the viewport wraps the
    **entire table** with a sticky `<thead>`, not just the body rows —
    confirmed by that second experiment measuring header and body
    column widths as identical before it replaced the broken version in
    both the story and the README. `CLAUDE.md` now documents the
    specific breakage mechanism so the next person doesn't have to
    re-derive it from a passing-looking-but-wrong story.

    **A second, independent finding from the same investigation:**
    `CdkVirtualScrollViewport` renders nothing on the first tick in a
    zoneless app — confirmed in isolation outside any table, so it's a
    real `@angular/cdk/scrolling` gap under zoneless change detection,
    not caused by this library's own composition. Fixed the story's
    assertions with a `waitFor` poll rather than asserting immediately
    after creation.

    **A third, smaller finding:** axe's `scrollable-region-focusable`
    rule correctly flagged the viewport itself for having no keyboard
    path to reach it — fixed with `tabindex="0"`, now called out in the
    README so it isn't silently dropped by a future consumer copying the
    pattern.

    All 5 Data Grid stories plus the full existing suite (110 stories)
    pass `test-run` (incl. a11y).
11. [x] **4.** Wave 4 gate — a real "Directory" screen in `apps/sandbox`
    (`app.ts`/`app.html`/`app.css`), composing all three: a `HmhaTable`/
    `HmhaDataGrid` of 23 people with a sortable Name column
    (`HmhaDataGridSortButton`), resizable Name/Email columns
    (`HmhaDataGridResizeHandle`), row + select-all-on-page checkboxes
    (`HmhaCheckbox` + `SelectionModel`) feeding a real "Remove selected"
    bulk action that updates the array and fires an `HmhaToast`, and
    `HmhaPagination` slicing the same sorted array into pages of 8. The
    array, the sort direction, the selected ids and the current page all
    live in `App` itself, not in any Hmha component — fork 21 held for
    real, end to end, not just in isolated stories. 7 new sandbox tests
    (pagination slicing, sort reversing the page, select-all-on-page +
    indeterminate, the full remove flow asserting the toast text, and
    keyboard resize), `build:lib`/`ng build sandbox`/`lint:css`/
    `lint:standalone` and the full test suite all clean — 18/18 in
    `sandbox`, 262/262 in `hmha-ui`.

    **A real bug, found only by this gate, not by any prior story or
    unit test:** the Directory table's first draft gave its resizable
    columns both a `<colgroup>` (for clean initial proportions) and
    `HmhaDataGridResizeHandle`s. Resizing moved the handle's own model,
    its `aria-valuenow`, everything the component owns — and the column
    never visibly changed width, because a `<col>`'s declared width is
    authoritative under `table-layout: fixed` and wins over a cell's own
    `style.width`. Every prior test of the resize handle happened to use
    either a model-bound width or a bare `<th>`, never a `<colgroup>` in
    the same table — this gate is the only place that combination
    actually occurred. Fixed by setting initial widths on the `<th>`
    elements instead and dropping the `<colgroup>`; documented in
    `CLAUDE.md` and the Data Grid README so the next consumer doesn't
    lose an afternoon to it.

    Also hit the familiar "table has no explicit width, so
    `table-layout: fixed` redistributes extra space proportionally and
    the Resizing test's `before` measurement drifts across sequential
    tests in the same file" issue — same root cause as the Storybook
    `ResizingInteraction` story and the resize handle's own unit tests,
    fixed the same way: give the table an explicit width matching its
    columns' sum, which also happens to be a reasonable real design
    choice here, not only a test convenience.

**Wave 4 is complete.** `HmhaPagination`, `HmhaTable` (4 pieces) and
`HmhaDataGrid` (core + sort + selection + resize + a verified
virtualization pattern) are all built, unit-tested, documented in
Storybook, and proven together in a real screen — fork 06's deferred
Table/Data Grid line, plus the `HmhaPagination` control fork 06 never
named, both delivered.

---

## 23 — IconButton: three icon/text layouts, one new input, no breaking change

**Decided:** `HmhaIconButton` gains `iconPosition: 'only' | 'leading' |
'trailing'`, defaulting to `'only'` — today's entire behavior, unchanged.
Every existing call site (`HmhaPagination`'s prev/next buttons, and all
four icon-only usages in `apps/sandbox`) keeps compiling and rendering
identically with zero edits.

- **`'only'`** — `data-icon-only` is set (square sizing, `button.css`
  unchanged); `label` is required in substance, though no longer at the
  type level (see below).
- **`'leading'` / `'trailing'`** — no `data-icon-only`; `HmhaButton`'s
  existing `:host` `gap` already spaces icon and text correctly, so
  nothing new was needed in `button.css` for either. The icon/text
  *order* is entirely the consumer's own content order
  (`<hmha-icon/>Save` vs. `Next<hmha-icon/>`) — the directive has no
  template of its own (it stacks on `HmhaButton`, itself a component;
  two components can't share one host element, the fork 22 lesson
  applying again here), so it has no way to reorder projected content
  and doesn't try to.

**`label` moves from `input.required<string>()` to optional, enforced
instead by a `throw new Error(...)` inside an `effect()` when
`iconPosition() === 'only'` and no label is set.** It couldn't stay a
compile-time required input because requiredness now depends on another
input's value, which Angular's `input.required()` has no way to express.
Forcing a `label` on a `'leading'`/`'trailing'` button was rejected for a
sharper reason than redundancy: `HmhaIcon`'s SVG is unconditionally
`aria-hidden`, so a label there would set an `aria-label` that silently
overrides the button's own visible text as its accessible name — a real
WCAG 2.5.3 (Label in Name) violation, not just an unnecessary prop. The
runtime throw matches this codebase's existing convention for a missing
mandatory value (`hmhaOverlay`'s two `throw new Error('ComponentName:
...')` checks) rather than letting an icon-only button silently ship
with no accessible name at all.

**Rejected — turning `HmhaIconButton` into the icon-rendering component
itself** (taking an `icon` input and an `<ng-content>` slot for the
text, rendering the icon in the right position itself): would need its
own template, and a second component can't stack on `HmhaButton` for the
same reason CdkTable couldn't stack on `HmhaTable` (fork 22). Keeping it
a plain directive, with the consumer placing `<hmha-icon>` themselves in
whichever order they intend, was the only option that didn't also
require giving up stacking on `HmhaButton` entirely.

---

## 24 — Wave 5 scope: Chip, Expansion Panel, Stepper, Sidenav/Drawer

**Decided:** a new wave, outside fork 06's original three-wave v1 plan —
the same precedent as Wave 4's Pagination/Table/Data Grid, post-v1 scope
the user chose to pursue rather than something fork 06 ever named. Build
order: Chip, then Expansion Panel, then Stepper, then Sidenav/Drawer —
smallest and most architecturally settled first, the same "smallest scale
first" reasoning every prior wave kickoff used.

- **Chip** — default, removable (a nested icon-button — fork 23's
  `iconPosition="trailing"` fits directly) and selectable/toggleable
  variants, plus a `ChipSet` container for roving-tabindex arrow-key
  navigation between chips, similar in spirit to `RadioGroup`'s shared
  container role (fork 11).
- **Expansion Panel** — WAI-ARIA's Disclosure pattern (one trigger,
  `aria-expanded`/`aria-controls`, one region) plus an Accordion grouping
  on top, single-open or multi-open.
- **Stepper** — conceptually close to `Tabs`' one-panel-visible-at-a-time
  mechanic (fork 18), but linear — a consumer can't jump ahead
  arbitrarily the way a tab can be clicked directly — and needs distinct
  per-step states (completed/active/upcoming/error) Tabs never needed.
- **Sidenav/Drawer** — deliberately last, and its real foundation
  question deliberately **not** resolved here: a drawer can be a modal
  overlay (slides over content, backdrop, focus-trapped —
  `hmhaOverlay()`'s existing territory, fork 13/15–17) or a persistent/
  push panel that coexists with page content and resizes the layout
  around it, which native `<dialog>` (Dialog's own foundation, fork 14)
  cannot do at all. Gets its own proposal once step 4a actually arrives,
  the same way Data Grid's foundation got fork 22 rather than being
  decided in passing during fork 21.

---

## 25 — Expansion Panel: native `<details>`/`<summary>`, native `name` grouping

**Decided:** `HmhaExpansionPanel` is built on the native `<details>`
element, `HmhaExpansionPanelTrigger` on `<summary>` — expanded/collapsed
state, keyboard operability and a real `toggle` event all come for free,
no ARIA needed, the same "use the native element" call as Dialog (fork
14). `expanded` is a `model()` kept in sync with the native `open`
property in both directions: `[open]="expanded()"` one way,
`(toggle)="onToggle($event)"` reading `event.target.open` back into the
model the other.

**Accordion grouping (single-open vs. multi-open) is entirely native
too — a shared `name` attribute on sibling `<details>` elements, the
same mechanism radio buttons use.** No input for this on
`HmhaExpansionPanel` at all; `name` is a plain HTML attribute with
nothing Angular-specific to wrap. This isn't common-knowledge enough to
take on faith, so it was verified directly before relying on it: a
throwaway Karma spec confirmed opening one `<details name="faq">`
natively closes a sibling sharing that name, including when `open` is
set *programmatically* (`a.open = true`), not only via a real click —
deleted after confirming, per the established discipline of not keeping
diagnostic-only specs around. `HmhaAccordion` itself ended up with zero
JS logic for grouping; it's purely the visual wrapper (one outer border
around the stacked group instead of each panel's own).

**A real Karma-launcher gap, the same class as `<dialog>`'s own `close`
event (fork 14): `summary.click()` never fires `<details>`'s native
`toggle` event in Karma's `ChromeHeadlessNoSandbox` launcher**, confirmed
with a direct listener — the native `open` property itself still flips
correctly (real, launcher-independent behavior), only the event is
missing. Fixed the same way fork 14 established: test the reaction to
the event by dispatching it directly
(`details.dispatchEvent(new Event('toggle'))` after setting `.open`
manually) rather than relying on a synthetic click's internal firing to
reach it.

**A real encapsulation-boundary violation caught by lint, not just a
rule to work around: the first draft of the chevron-rotation and
accordion-border-suppression CSS used `:host-context()`**, which this
project's own stylelint config blocks via
`selector-disallowed-list` — the same reasoning as `::ng-deep` being
blocked (fork 05): a component reaching outside its own encapsulation
boundary to read ancestor context is exactly the kind of override this
contract exists to prevent, not an arbitrary tooling restriction.
Fixed with the established, correct pattern instead: `inject()` the
relevant ancestor directly (`HmhaExpansionPanelTrigger` injects
`HmhaExpansionPanel` for its `expanded` state;
`HmhaExpansionPanel` optionally injects `HmhaAccordion` for its own
grouped-or-not state) and reflect a `data-*` host attribute the CSS
reads via a plain `:host([data-x])` selector — self-referential, no
ancestor-reaching needed. Neither file imports the other back in either
case, so no separate context-token file was needed the way Menu's/
ChipSet's parent-child relationships require one.

---

## 26 — Drawer: a directive stacking on `HmhaDialog`, not a new component

**Decided:** `HmhaDrawer` is a `@Directive` with selector
`dialog[hmhaDialog][hmhaDrawer]` — it stacks on the *existing*
`HmhaDialog`, the exact compositional shape fork 23's `HmhaIconButton`
established for `HmhaButton`. It adds exactly one input, `placement:
'start' | 'end'` (default `'start'`), reflected as `data-placement` on
the shared host element, and its own visual rules live inside
`dialog.css` gated on `[data-placement]` — because a `@Directive` has no
`styleUrl` of its own (confirmed from `HmhaIconButton`: all its visuals
already live in `button.css`, consumed via the `data-icon-only`
attribute it sets on `HmhaButton`'s host). No new component, no
duplicated open/dismiss/focus-trap/backdrop logic at all.

**Why this resolves cleanly, where fork 24 deliberately left it open:**
a modal edge-anchored drawer and a centered dialog need *identical*
machinery — a real focus trap, Escape-to-close, backdrop click,
top-layer rendering, implicit `role="dialog"`/`aria-modal` — all of
which `HmhaDialog` already gets for free from native `<dialog>` +
`showModal()` (fork 14). The only actual difference is positioning:
anchored to an edge and full-height instead of centered with a max
width. That's a CSS-only difference, which is exactly the shape fork 23
already solved (a variant that's "the same component, arranged
differently" gets an input on top of the existing piece, not a parallel
component reimplementing its behavior).

- **`placement`** only takes `'start'`/`'end'` — not `'top'`/`'bottom'`.
  A *sidenav* is a side panel by definition; a top/bottom sliding sheet
  is a materially different, separately-named pattern (a "bottom
  sheet") that wasn't asked for and isn't speculatively built now.
- **No persistent/push mode was built, and none is planned.** That
  variant isn't modal at all — no focus trap, no backdrop, content
  coexists with it instead of being blocked by it — and native
  `<dialog>` cannot produce that behavior regardless of CSS. Once you
  take modality away, what's left ("a toggleable-width `<nav>`/`<aside>`
  that participates in page layout") has close to zero component logic
  of its own — the same "don't build a component when plain composition
  already does the job" reasoning fork 21 used to keep Data Grid
  selection out of a dedicated piece. A consumer who wants that layout
  reaches for a plain `<nav>`/`<aside>` and the density/control tokens
  already in the library — no `Hmha*` component gap to fill.
- **Width is a component token (`--hmha-drawer-width`), not a new
  input** — the established "component tokens are the public override
  API" convention (`CLAUDE.md`), consistent with every other
  size-ish override in the library (`--hmha-chip-bg`, etc.) rather than
  adding an Angular input for something CSS already owns cleanly.
- **No open/close slide animation, at least not yet — reconsidered
  before writing any CSS, the same way fork 22's first Data Grid
  proposal got corrected before any code.** The initial draft of this
  decision reached for `@starting-style` + `transition-behavior:
  allow-discrete` to animate a native `<dialog>`'s own
  show/showModal/close lifecycle. That's real, shipped CSS, but it's
  also new enough, and subtle enough in exactly how the browser times
  the "still rendered while transitioning out" step, that nothing in
  this project's own tooling can actually verify it animates
  correctly — Karma has no visual rendering to assert against, and a
  Storybook play function can check a `translate`/attribute value at
  an instant, not "did this animate smoothly." Shipping an unverifiable
  claim about a visual effect is worse than not having the effect.
  `HmhaDialog` itself already ships with zero open/close animation
  (confirmed in `dialog.css`) — matching that exactly, instant
  position change, no transition, keeps the drawer consistent with the
  component it stacks on rather than introducing an asymmetry. Adding a
  slide later is a pure CSS addition, not a breaking change, if it's
  ever actually asked for and can be checked by eye.

**Naming:** "sidenav" and "drawer" are the same UI pattern under two
common names (Angular Material itself ships `MatSidenav`/`MatDrawer` as
aliases for one component) — `HmhaDrawer` was picked as the one name
actually built; no separate `HmhaSidenav` alias.

---

## Wave 5 progress — the step tracker

**This section is the single source of truth for Wave 5 status**, the
same way Wave 2/3/4 progress were for their waves. Update the checklist
and the CURRENT STEP marker at the end of every step. The process rule
itself (one step at a time, stop-and-wait between steps, the done
criteria) lives in `CLAUDE.md`'s "Working through a wave" section — this
section only tracks where we are.

Component order follows fork 24: Chip, Expansion Panel, Stepper, then
Sidenav/Drawer. Sidenav/Drawer's own sub-steps aren't itemized yet beyond
its foundation proposal — it gets broken down further once step 4a
actually arrives, the same way Data Grid's step 3 was.

1. [x] **1A.** Build Chip (+ ChipSet) + tests — `libs/ui/src/lib/chip/`
   (`chip.ts`/`.css`/`.spec.ts`, `chip-set.ts`/`.css`/`.spec.ts`,
   `chip-set-context.ts`, `README.md`). `HmhaChip` works on either a
   native `<span>` (display/removable — never itself interactive) or
   `<button>` (selectable/toggleable, native `aria-pressed`, no custom
   role). Removal has no dedicated input at all — a nested
   `HmhaIconButton` the consumer projects themselves, the same
   "composition over a new component" precedent as Wave 4's selection
   step. `HmhaChipSet` is purely a `FocusKeyManager` over its `HmhaChip`
   content children (horizontal roving tabindex, `.withWrap()`/
   `.withHomeAndEnd()`), structured exactly like Menu's own key manager
   (fork 15) including the separate `chip-set-context.ts` file to avoid
   the same circular-import shape `menu-context.ts` solves. `HmhaChip`'s
   own `selected` stays a `model()` it owns directly — distinguished
   explicitly from the kind of *collection* state ("which chips are
   selected in a group") fork 21 keeps out of every component; a single
   chip's own on/off state is the same shape as `HmhaCheckbox`'s checked
   value, not that. 19 new unit tests (289/289 total), `build:lib`/
   `lint:css`/`lint:standalone` clean.

   **Three real bugs, caught by running the tests, not by inspection:**
   1. `[disabled]` as a property binding threw `NG0303` on the `<span>`
      variant — spans have no native `disabled` DOM property, and
      Angular's binding throws rather than silently no-opping the way a
      raw JS property assignment would have. Fixed with `[attr.disabled]`
      instead, which works universally and a real `<button>` still
      reflects into its own `.disabled` property.
   2. `disabledInput` (the alias-plus-getter shape `FocusableOption`
      needs, same as `HmhaMenuItem`'s) was `protected`, matching Menu's
      own code — but a bare `disabled="true"` template attribute
      resolves to that aliased input ahead of the native button
      property of the same name, and Angular's strict template checking
      requires it be accessible from the template for that resolution to
      type-check. Menu's own specs never exercised a bare-attribute
      `disabled` anywhere, so this was a latent gap there too, just
      never triggered — fixed here by making the field public; Menu's
      own file wasn't touched, since nothing asked for that and nothing
      here depends on it.
   3. `data-selected` was `'[attr.data-selected]': 'selected() || null'`
      — for `selected() === true`, Angular stringifies the literal
      boolean to the attribute value `"true"`, not an empty string,
      unlike every other boolean `data-*` attribute already in this
      library (Card's `data-elevated`, Menu's `data-active`), which all
      use `? '' : null` explicitly. Harmless for the CSS attribute
      selector either way, but inconsistent with the rest of the
      codebase — fixed to match.

   Also needed `await fixture.whenStable()` after click/keydown
   interactions in both new spec files — the same zoneless-effect-timing
   pattern this session has hit repeatedly (Resize Handle, Data Grid
   selection), not a new discovery, just applied again.
2. [x] **1B.** Story: Chip — `chip.stories.ts` (Playground, Display,
   Removable, Selectable, SelectionInteraction,
   ChipSetKeyboardNavigationInteraction). Hit the already-documented
   `keyCode` gap proactively (fixed before running anything, not
   rediscovered) and a new, closely-related timing gap: the key
   manager's "activate the first item" effect needs a render flush to
   land, the same lesson Tabs' own `KeyboardNavigationInteraction` story
   already recorded — fixed with the same `waitFor` pattern. All 6 Chip
   stories plus the full existing suite (120 stories) pass `test-run`
   (incl. a11y).
3. [x] **2A.** Build Expansion Panel (+ Accordion grouping) + tests —
   `libs/ui/src/lib/expansion-panel/` (`expansion-panel.ts`/`.css`/
   `.spec.ts`, `expansion-panel-trigger.ts`/`.css`/`.spec.ts`,
   `expansion-panel-content.ts`/`.css`/`.spec.ts`, `accordion.ts`/`.css`/
   `.spec.ts`, `README.md`). Full writeup in fork 25: built on native
   `<details>`/`<summary>`, single-open/multi-open grouping entirely via
   native `name` (verified with a throwaway experiment, not assumed),
   plus two real findings — a new Karma-launcher gap matching `<dialog>`'s
   own `close` event (fork 14), and a genuine encapsulation-boundary
   violation (`:host-context`, caught by stylelint, fixed with `inject()`
   + `data-*` attributes instead). 17 new unit tests (306/306 total),
   `build:lib`/`lint:css`/`lint:standalone` clean.
4. [x] **2B.** Story: Expansion Panel — `expansion-panel.stories.ts`
   (Playground, AccordionSingleOpen, AccordionMultiOpen,
   ToggleInteraction, AccordionSingleOpenInteraction). Caught a real
   test-coverage gap during the story, not a component bug: the existing
   unit test for the trigger's chevron rotation only checked an *initial*
   bound value, never a *live* post-render toggle — added a real Karma
   test for that (confirmed the DI-based cross-component signal
   propagation genuinely works), then hit the familiar async-settling
   gap in the Storybook story specifically (same class as `HmhaChipSet`'s
   own key-manager story), fixed with `waitFor`. All 5 stories plus the
   full suite (131 stories) pass `test-run` (incl. a11y).
5. [x] **3A.** Build Stepper + tests — `libs/ui/src/lib/stepper/`
   (`stepper.ts`/`.css`/`.spec.ts`, `step-list.ts`/`.css`/`.spec.ts`,
   `step-list-context.ts`, `step.ts`/`.css`/`.spec.ts`,
   `step-panel.ts`/`.css`/`.spec.ts`, `README.md`). Four pieces mirroring
   `HmhaTabs`/`HmhaTabList`/`HmhaTab`/`HmhaTabPanel`'s exact DI shape
   (fork 18), adapted for linear, ordered progress: `HmhaStepList` reads
   `contentChildren(HmhaStep)` and exposes ordered `value`s via a new
   `HMHA_STEP_LIST` context (its own file, same circular-import reasoning
   as `chip-set-context.ts`/`menu-context.ts`); `HmhaStep` injects both
   `HMHA_STEPPER` and `HMHA_STEP_LIST` to derive its own
   `completed`/`active`/`upcoming` state from index comparison. `hasError`
   is a separate, independent-of-state input (`data-error`), reflected as
   a `triangle-alert` icon in place of the check/number regardless of
   state. `aria-current="step"` on the active step — there's no official
   WAI-ARIA stepper pattern the way there is for Tabs, so this is the
   closest documented token. `HmhaStepper.select()` deliberately doesn't
   enforce reachability itself — only `HmhaStep`'s own click handler does
   — so a consumer's own Next/Back buttons keep free control over
   `value`, the same "consumer owns progression" principle as fork 21. No
   `FocusKeyManager`/roving-tabindex: deliberately simpler than
   `HmhaChipSet`/`HmhaTabList`, since linear progression has no "move
   freely between all steps" interaction to manage. 20 new unit tests
   (326/326 total), `build:lib`/`lint:css`/`lint:standalone` clean, no
   new bugs or launcher gaps found this step — the design mirrored
   already-settled patterns closely enough that nothing novel surfaced.
6. [x] **3B.** Story: Stepper — `stepper.stories.ts` (Playground,
   AllPriorStepsCompleted, ErrorOnACompletedStep, DisabledStep,
   NavigationInteraction). One file covering all four pieces together
   (meta component `HmhaStepper`), matching Chip/Expansion Panel's own
   precedent rather than Tabs' older one-file-per-piece layout.

   **Two real a11y findings from `test-run`, not caught by Karma (no
   a11y checking there) — both fixed, no visual change:**
   1. `aria-required-children` (critical): `HmhaStepList`'s own
      `role="list"` host attribute requires `listitem` children, which
      its `HmhaStep` buttons never had. There's no official WAI-ARIA
      stepper pattern requiring a list structure at all (already noted
      in the README) — the role was my own unforced addition. Fixed by
      removing it entirely rather than adding `listitem` (which would
      conflict with each step's own native `button` role).
   2. Each step's accessible name included its visible position number
      — "3 Payment" instead of "Payment" — because the number-badge
      `<span>` wasn't hidden from assistive tech the way the check/error
      icon's own `<svg aria-hidden="true">` already was. Fixed by adding
      `aria-hidden="true"` to the whole `.hmha-step-indicator` span; the
      position is already conveyed by DOM order and `aria-current`/
      `data-state`, so the number is purely a sighted-UI affordance.

   All 5 Stepper stories plus the full existing suite (136 stories) pass
   `test-run` (incl. a11y).
7. [x] **4a.** Propose Sidenav/Drawer's foundation — resolved: `HmhaDrawer`
   is a `@Directive` stacking on `dialog[hmhaDialog]` (fork 23's
   directive-on-component shape), not a new component, and not a
   persistent/push variant either. Full reasoning in fork 26.
8. [x] **4b.** Build Drawer + tests — `libs/ui/src/lib/dialog/drawer.ts`/
   `.spec.ts`, plus new `[data-placement]` rules in the existing
   `dialog.css` (a `@Directive` has no `styleUrl` of its own — confirmed
   from `HmhaIconButton`). `placement: 'start' | 'end'`, default
   `'start'`, using logical properties for automatic RTL correctness.
   Added a new token: primitive `space.80` (320px, following the
   existing `space.N` = `N*4px` naming) → semantic
   `layout.drawer-width` → component token `--hmha-drawer-width` — the
   first new primitive/semantic dimension pair added since Phase 1,
   needed because no existing token was anywhere near a sensible drawer
   width (`CLAUDE.md` invariant 5: "a token is missing — add it to
   `tokens/` and rebuild," not inline the literal). `npm run
   tokens`/`tokens:contrast` clean. 5 new unit tests (331/331 total),
   `build:lib`/`lint:css`/`lint:standalone` clean.

   **One real bug, caught by running the tests:** the first draft of
   `drawer.spec.ts` mutated the host's plain `placement` field *after*
   the shared `beforeEach`'s initial `detectChanges()`, then called
   `detectChanges()` again — `NG0100` in zoneless mode, the exact
   constraint `card.spec.ts` already documents (mutate a plain field
   before the fixture's *first* check, never on an already-checked
   one). Fixed by switching to the same per-test `create()` factory
   this session has used for every other new spec file in Wave 5,
   setting `placement` before that fixture's first `detectChanges()`.
9. [x] **4c.** Story: Drawer — `drawer.stories.ts` (Playground,
   PlacementEnd, OpenInteraction, BackdropDismissInteraction). Hit the
   documented brand-new-component quirk again, but in a new shape: a
   plain static `placement="end"` attribute in `PlacementEnd`'s own
   dedicated `render` resolved to `data-placement="start"` — the
   *wrong* value — even with no `args`/argTypes involved at all (ruled
   out as a Storybook-args merge bug by that elimination). A full dev
   server restart + cache clear fixed it with no code change, so this
   was the dev server not having picked up `HmhaDrawer` at all yet, the
   same remedy as every prior instance of this quirk, just a new
   trigger shape (a hardcoded template attribute on a component the
   server has genuinely never loaded, not merely an args-binding
   issue). All 4 Drawer stories plus the full existing suite (141
   stories) pass `test-run` (incl. a11y).
10. [x] **5.** Wave 5 gate — a real "New project" drawer in `apps/sandbox`
    (`app.ts`/`app.html`/`app.css`), composing all four: a "New project"
    button opens an `HmhaDrawer` (`placement="end"`) holding an
    `HmhaStepper` (Details → Tags → Review); Details gates its own Next
    button on a name being entered; Tags uses an `HmhaChipSet` of
    selectable tag chips, each one's own `selected` driven by the app's
    own `Set<string>` via `[selected]`/`(selectedChange)` (not two-way
    sugar, since a `@for`-looped chip has no single lvalue to bind);
    Review surfaces the entered name and tag summary, tucking a Switch
    behind an `HmhaExpansionPanel` ("Advanced options"), and a "Create
    project" button closes the drawer and fires an `HmhaToast` naming
    the project. The current step, the entered name, the selected tags
    and the private flag all live in `App` itself, not in any Hmha
    component — fork 21 held for real, end to end, the same proof every
    prior gate has required. 6 new sandbox tests (opens on Details;
    Next gated on a name then advances to Tags; selecting a Chip tracks
    it into the Review summary; Back preserves the entered name;
    Expansion Panel toggle, using the same dispatch-the-event-directly
    pattern as fork 25 since Karma still doesn't fire a real `toggle`
    from `summary.click()`; Create project closes the drawer and fires
    the toast), `build:lib`/`ng build sandbox`/`lint:css`/
    `lint:standalone` and the full test suite all clean — 24/24 in
    `sandbox`, 331/331 in `hmha-ui`. No new bugs found at this step —
    every piece composed exactly as its own isolated story already
    proved it would.

**Wave 5 is complete.** `HmhaChip`/`HmhaChipSet`, `HmhaExpansionPanel`/
`HmhaAccordion`, the four-piece `HmhaStepper`, and `HmhaDrawer` (a
directive on `HmhaDialog`, fork 26) are all built, unit-tested,
documented in Storybook, and proven together in a real screen —
post-v1 scope the user chose to pursue (fork 24), the same precedent
Wave 4 set.

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
