# Decisions of record

Twenty architectural forks, decided. Each entry gives the decision, the
rejected alternatives, and the reasoning — so a later contributor can tell a
settled decision from an accident.

Team context: **one maintainer**. Several decisions are what they are because
maintenance capacity, not capability, is the binding constraint.

---

## 01 — Version floor: Angular 20 through current

**Decided:** one package, workspace built on Angular 20, peer range
`">=20.0.0 <22.0.0"` — ceiling since raised to `<23.0.0` (fork 33); the
floor is unchanged.

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

**License — decided: MIT**, the default this entry originally named, with
no reason found not to. Copyright Christopher Wilson. One `LICENSE` at the
repo root, copied into `libs/ui/` (ng-packagr copies it into
`dist/hmha-ui`) and `libs/tokens/` (npm always packs a root `LICENSE`,
whatever `files` says), plus `"license": "MIT"` in both `package.json`s.

**Publishing — decided: npm trusted publishing from GitHub Actions, no
tokens.** `.github/workflows/publish.yml` (a `v*` tag push or a manual run,
in a GitHub environment named `npm`) runs the full `npm run ci` gate, then
`scripts/publish-if-new.sh` publishes each package only if its version
isn't already on npm. Tokens go first, because `hmha-ui` peers on them.
Both packages trust that one workflow file plus environment on npmjs.com,
so renaming either breaks publishing until the trusted publisher is
recreated (npm can't edit one in place). Provenance comes free for a
public package from a public repo. Publishing from a laptop is no longer
the path, and package settings disallow tokens once the first OIDC
publish works.

**Addendum — `hmha-tokens` is a peer dependency of `hmha-ui` (`^1.0.0`),
not a regular dependency, and never the reverse.** Before this, the two
packages only knew about each other through their READMEs: npm neither
installed `hmha-tokens` alongside `hmha-ui` nor warned when it was missing,
even though `hmha-ui` renders with no styling at all without it.

- **Peer, not `dependencies`:** the consumer references the token CSS
  directly by path in their own `angular.json`, so it has to be a
  top-level package they own. A transitive dependency only appears at
  `node_modules/@halfmanhalfape/hmha-tokens` through hoisting, which pnpm's
  strict layout doesn't do. A peer also keeps exactly one copy and lets
  the consumer move tokens on its own cadence, the reason for two
  packages in the first place. `^1.0.0` follows the token package's own
  semver, not Angular's.
- **Never the reverse:** `hmha-tokens` stays at zero dependencies.
  It's framework-free on purpose (fork 02, above), and a non-Angular
  consumer must never pull Angular in through it.
- Both packages also gained `repository` (with `directory`), `homepage`,
  `bugs` and `keywords`, so their npm pages link back to the repo. The
  CI install matrix now installs both local tarballs and asserts the
  token CSS actually applies (fork 33's smoke app), so the documented
  two-package install is tested, not just written down.

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

## 27 — Kitchen Sink: demonstrating runtime overrides, not shipping new presets

**Decided:** the Kitchen Sink showcase's "6 color themes" and "typography
themes" are **pure demo-local data in `kitchen-sink.ts`** — plain
TypeScript objects holding override *values*, applied at runtime via
`[ngStyle]` setting CSS custom properties directly on the component's own
host. Nothing is added to `tokens/`. No new primitive hue ramps, no new
semantic roles, no third `data-hmha-*` theming axis, no change to
`CLAUDE.md`'s "two independent, composable axes" theming section.

**Why — this isn't a missing feature, it's the system already working
as designed.** Every semantic role is already a live `var(--hmha-*)`
custom property (the whole point of `outputReferences: true`, and
exactly the thing the **Open items** note at the end of this file has
said since Phase 1: *"The blue is a placeholder... the structure is the
deliverable."*). Any consumer — `apps/sandbox`, a real app, or this
showcase — can already override `--hmha-color-action` (or any other
role) by redeclaring it at whatever scope they want, with zero rebuild
and zero new token work. The first draft of this task proposed building
a shipped `data-hmha-theme="ocean|forest|…"` feature with two brand-new
primitive hue ramps — caught and corrected before writing any token
code, once it became clear the user's actual question was "does
overriding work at all," not "ship more presets." Building the bigger
feature would have been solving a problem that doesn't exist, at the
cost of a real architecture change (new ramps, per-theme contrast
checking across 6×2 combinations, a `CLAUDE.md` invariant rewrite) that
nobody asked for.

- **Color presets** (`COLOR_THEMES` in `kitchen-sink.ts`) override
  exactly the six roles that encode "brand hue" and nothing else —
  `action`, `action-hover`, `action-active`, `action-subtle`, `focus`,
  `text-on-action`. `danger`/`warning`/`success` stay fixed across every
  preset on purpose: those are status colors, not brand colors, and a
  real app retheming its brand shouldn't also be retheming what "error"
  means. Four of the six presets (Forest/Sunset/Crimson/Slate) reuse
  already-shipped, already-contrast-verified pairs from this library's
  own `success`/`warning`/`danger` roles (e.g. Sunset's
  `text-on-action` reuses `text-on-warning`'s already-passing
  amber.500/neutral.950 pairing) — not because reuse is required, but
  because it comes with a free, already-proven-safe contrast guarantee.
  Violet is the one genuinely invented value (no matching existing
  role), picked at the same lightness/chroma as `action`'s own
  default (`blue.600`, L 0.550 C 0.192) so it inherits the same
  contrast margin against white text without a new check being run.
  Ocean is today's real default, included as the implicit "reset" card.
- **Typography presets** (`TYPE_THEMES`) override heading size/weight
  only, never `font-family` — adding a second real typeface is a new
  external dependency (a font to load) that nobody asked for here, and
  three presets (Standard/Compact/Bold) already demonstrate the
  mechanism just as well as a font swap would.
- **Density is the one real, applied choice in this flow** — it already
  exists as a genuine token axis (`data-hmha-density`), so Step 2 sets
  the real attribute, not a demo override.
- Applied via `[ngStyle]` (not individual `[style.--x]` bindings) purely
  for conciseness — `NgStyle` already supports custom-property keys.
  Set on the showcase component's own host, wrapping the entire page
  (header, stepper, tabs), so picking a card re-themes everything live,
  not just a sample swatch.

Scoped specifically to `libs/ui/src/showcase/` — none of this is public
API, none of it is exported from `public-api.ts`, and the literal
color/typography values living in `kitchen-sink.ts` are deliberately
exempt from invariant 5's "no hard-coded values" (that invariant governs
`libs/ui`'s own *components*, which must stay themeable; a demo whose
entire point is "look, arbitrary override values work" is the one place
inventing a literal value is the correct move, not a violation of it).

---

## Kitchen Sink progress — the step tracker

**This section is the single source of truth for Kitchen Sink showcase
status**, the same role Wave 2–5 progress sections played for their
waves — same process too (`CLAUDE.md`'s "Working through a wave": one
step at a time, stop-and-wait between steps, the done criteria), even
though this isn't a numbered component-building wave. Update the
checklist and the CURRENT STEP marker at the end of every step.

Scope, per the user's own request and fork 27's resolution: a master
layout component at `libs/ui/src/showcase/kitchen-sink.ts`, mounted by
the already-present (empty) `kitchen-sink.stories.ts`. A centered "Kitchen
Sink" header with a light/dark mode switch; the tabs hidden behind a
3-step onboarding stepper (color theme → typography + density →
confirmation) until completed; 6 blank, generically-labeled tab panels
("Tab 1"–"Tab 6") to be filled in later, outside this scope.

1. [x] **1A.** Build the `KitchenSink` component + tests —
   `libs/ui/src/showcase/kitchen-sink.ts`/`.html`/`.css`/`.spec.ts`
   (template split into its own `.html` file — the markup is sizable
   enough, between the header, a 3-step onboarding stepper and the
   6-tab shell, that an inline `template:` string would have hurt
   readability for no real gain, unlike most `libs/ui` components'
   deliberately tiny templates). Header (centered `<h1>` via a 3-column
   CSS grid, not a flex spacer hack; right-aligned `HmhaSwitch` for
   mode, starting light, wired live). Gated onboarding `HmhaStepper`:
   step 1 is 6 color-theme cards (`HmhaCard` wrapped in a plain trigger
   `<button>`, since `HmhaCard` itself isn't interactive), each a 2x2
   swatch grid; step 2 is 3 typography-preset cards plus two density
   toggle buttons (real `data-hmha-density`, not a demo value); step 3
   is a summary + "Enter the Kitchen Sink!". Picking a card applies
   live immediately (not deferred to step 3) — the whole point is
   watching the page re-theme as you go. 6 blank `HmhaTabPanel`s
   (`Tab 1`–`Tab 6`) replace the stepper once onboarding completes.
   Fork 27 covers the theming approach (demo-local override values, no
   new `tokens/` work) in full. 8 new unit tests (339/339 total),
   `build:lib`/`lint:css`/`lint:standalone` clean.

   **Two real mistakes caught before/while running tests, not by
   inspection:**
   1. First draft bound `'[ngStyle]': 'activeStyleOverrides()'` in the
      component's own `host: {}` metadata — invalid: `host` bindings
      are Angular's own property/attribute/class/style/event DSL, not
      a way to attach an arbitrary directive (`NgStyle`) to `:host`.
      The IDE's own diagnostics caught it immediately (`NG8002`, "Can't
      bind to 'ngStyle'"). Fixed with the native `'[style]':
      'activeStyleOverrides()'` host binding instead, which accepts an
      object of style declarations — including custom-property keys —
      directly, making the `NgStyle` import unnecessary entirely.
   2. The first spec file's `clickButton(el, 'Next')` helper searched
      the *whole* rendered page for a button by text, but
      `HmhaStepPanel` hides inactive panels with `[hidden]`, not
      `@if` — they stay in the DOM. Since both the Theme and Typography
      panels have their own "Next" button, `.find()` was silently
      matching the Theme panel's "Next" (a no-op once already on
      Typography) instead of the visible panel's own button. Caught by
      a failing assertion, not by inspection; fixed by scoping every
      ambiguous button lookup to the specific step panel being acted
      on, the same pattern already used for the Wave 5 sandbox gate's
      own multi-panel tests.
2. [x] **1B.** Story: Kitchen Sink — `kitchen-sink.stories.ts`
   (Playground, DarkModeInteraction, ThemeSelectionInteraction,
   TypographyAndDensityInteraction, CompletesOnboardingInteraction),
   titled `'Overview/Kitchen Sink'` per `kitchen-sink.md`'s own
   planning note, its own top-level sidebar section. `component:
   KitchenSink` with no custom `render` — the component is fully
   self-contained, nothing for a story to pass in.

   Hit the documented "every Storybook MCP call times out" quirk on
   the very first `test-run` — the dev server/`addon-vitest` process
   had been running since Oct 6 (per `ps aux`), well past any single
   session. Restarted it (killed all three processes, cleared
   `node_modules/.cache/storybook`), which cleared it immediately —
   the known remedy, not a new investigation.

   **One real test-authoring bug, caught by `test-run`, not by
   inspection:** `CompletesOnboardingInteraction`'s first draft used
   `canvas.getByText('Ocean', { exact: false })` to check the Confirm
   step's summary — but `getByText` (unlike `getByRole`) does **not**
   respect the `hidden` attribute the way accessibility-tree-aware
   role queries do, so it matched both the Confirm panel's visible
   summary *and* the Theme panel's own still-in-DOM, still-hidden
   "Ocean" card header, throwing on the ambiguity. Confirms the same
   lesson the Karma spec's `clickButton` bug (step 1A) already taught,
   from the opposite direction: `getByRole` queries are hidden-safe
   here, but not every testing-library query is — `getByText` isn't,
   so an ambiguous one needs scoping to a specific container instead.
   Fixed by reading `confirmPanel.textContent` directly rather than a
   page-wide text query. All 5 Kitchen Sink stories plus the full
   existing suite (146 stories) pass `test-run` (incl. a11y).

**Kitchen Sink step 1 is complete.** The master layout — header, live
mode switch, the gated 3-step onboarding stepper (demonstrating runtime
color/typography/density overrides per fork 27), and the 6 blank tabs —
is built, unit-tested, and proven in Storybook. Filling in each tab's
real content is explicitly out of scope here, per the user's own "leave
these blank for now" — no further step is tracked until that's asked
for.

3. [x] **2.** First real tab: Typography — `Tab 1` renamed to
   `Typography` (its value stays `'tab1'`; only the label text
   changed). One instance of **every** type role that exists after
   forks 29–31: the 7 type-scale roles (`heading-lg`/`-md`/`-sm`,
   `body-md`/`-sm`, `label-md`, `caption`) and the 3 font-family roles
   (`family`/`family-heading`/`family-mono`), each demoed via a plain
   `data-role`/`data-family` attribute on one shared `.type-sample-text`
   class — the same attribute-driven-variant convention every real
   `libs/ui` component already uses, kept consistent even in demo-only
   showcase code. Two real section headings (`<h2>` "Type scale"/"Font
   families", styled via the same `data-role="heading-sm"` attribute
   the decorative samples use — a real heading element takes a type
   role exactly the same way a `<p>` swatch does) keep the page's
   heading hierarchy honest (one real `<h1>` in the header, `<h2>`s
   under it, no skipped levels) rather than reusing `<h1>`/`<h2>` for
   every decorative sample, which would have put multiple same-level
   headings with no real document-structure meaning on the page.
   `caption`'s demo deliberately doesn't add muted text color — the
   token itself only defines size/line/weight, and tinting the example
   would have implied color is part of the role when it isn't; color
   stays a separate, composable choice same as always. No new
   component, no new tokens — purely composing what forks 27/29–31
   already built. 347/347 unit tests (only text/comment changes, no
   new logic to test), `build:lib`/`lint:css`/`lint:standalone` clean,
   all 5 Kitchen Sink stories plus the full suite (151 stories) pass
   `test-run` (incl. a11y) on the first run.

---

## 28 — Divider: `hr[hmhaDivider]`, color/length as real inputs, not just tokens

**Decided:** `HmhaDivider` is an attribute directive on native `<hr>` —
`hr[hmhaDivider]` — the same "inherit real semantics for free" bias as
every prior native-element choice (Dialog/fork 14, Expansion Panel/fork
25, Chip-on-`<button>`/fork 24). `<hr>`'s implicit ARIA role is already
`separator`; no `role` attribute needs setting. `aria-orientation` is
set explicitly either way (not only for the non-default `vertical`
value) for clarity, matching how `data-tone`/`data-size` are always
reflected on `HmhaButton` regardless of whether the value is the
default.

Inputs, each mapping onto the existing conventions rather than
inventing a new one:

- **`orientation: 'horizontal' | 'vertical'`** (new shared type,
  `HmhaOrientation` in `core/types.ts`), default `'horizontal'`.
  Reflected as `data-orientation` and `aria-orientation`. Horizontal
  sizes by `width`; vertical sizes by `height` — the inverse dimension
  defaults to the divider's own thickness token either way.
- **`length`** — a real, consumer-supplied runtime value (a CSS length
  string: `'50%'`, `'4rem'`, …), not a token. This doesn't relitigate
  invariant 5: that invariant is about this library's own source never
  hardcoding a value it owns, not about blocking a consumer from
  passing their own arbitrary value through a legitimate input — the
  same shape as `HmhaDataGridResizeHandle`'s own user-driven pixel
  width. Applied via `[style.width]`/`[style.height]`, whichever
  matches `orientation()`; `null` (the default) leaves the dimension
  unset, so the token-driven CSS default (100% / the inset `calc()`)
  applies instead — inline style always outranks either.
- **`color`** — a real `string` input, but it doesn't bypass the
  component-token override API `CLAUDE.md` requires; it reflects
  straight into `--hmha-divider-color` via `[style.--hmha-divider-color]`.
  A consumer gets both a convenient Angular input *and* the same
  override surface every other component exposes (they could also just
  set the custom property on an ancestor themselves — the input is a
  convenience, not a second mechanism). Defaults to
  `var(--hmha-color-border)`, the same semantic role `HmhaCard`'s own
  border already uses.
- **`inset`** — `boolean`, default `false`, reflected as `data-inset`
  (fork 05's variants-are-attributes convention). Shrinks the divider
  and adds a *start* margin, using logical properties
  (`margin-inline-start` horizontal, `margin-block-start` vertical) so
  it's correct in RTL too, via a `--hmha-divider-inset` component token
  defaulting to `var(--hmha-control-padding-x)` — a density-aware
  default, reused rather than inventing a fixed amount, so the inset
  automatically tightens under `data-hmha-density="compact"` the same
  way every control's own padding does.
- **Thickness has a component token (`--hmha-divider-thickness`,
  default `var(--hmha-border-width)`) but no dedicated input** — the
  same "token-only override, no input needed for everything" shape
  `HmhaButton`'s hover/active fills already use.

Rendered via `background` (sized by `width`/`height`), not `border` —
avoids fighting `<hr>`'s own default border-box rendering and gives one
consistent sizing model for both orientations, rather than a
border-side swap between `border-top`/`border-left`.

**Built in two steps, same as fork 23's IconButton work:** 1A —
`divider.ts`/`.css`/`.spec.ts`/`README.md`, 8 new unit tests
(347/347 total), `build:lib`/`lint:css`/`lint:standalone` clean, no bugs
found. 1B — `divider.stories.ts` (Playground, Vertical, CustomLength,
CustomColor, InsetInAList — the last one the real-world case `inset`
exists for, a divider between two list rows with a leading icon). Hit
the documented brand-new-component `test-run` timeout on the first
call; the dev server had live Chrome connections (someone had it open),
so confirmed with the user before restarting rather than doing it
unilaterally — cleared immediately once restarted. All 5 Divider
stories plus the full existing suite (151 stories) pass `test-run`
(incl. a11y). No component bugs found in either step.

---

## 29 — Typography: 8 named font-family primitives, CDN-loaded, Raleway/Recursive as the new defaults

**Decided:** `tokens/primitive/type.json`'s single `font-family.sans`/
`.mono` pair became eight named primitives — `raleway`, `geist`,
`cormorant`, `fraunces` (sans/serif) and `recursive`, `geist-mono`,
`jetbrains-mono`, `ibm-plex-mono` (mono) — named by identity, the same
convention the colour ramps already use (`blue`, `green`, …), not by
role (role naming is a *semantic*-tier rule). `tokens/semantic/
type.json`'s `font.family`/`font.family-mono` — the only font tokens
any component actually consumes — now point at `raleway`/`recursive` as
the new defaults, replacing the old system-font stacks. This is the
**Open items** note at the very end of this file ("swap the hue… the
structure is the deliverable") realized for typography instead of
colour — the three-tier shape was already built to take this.

**Token value and font *availability* are two separate concerns, and
only the first is `tokens/`'s job.** A `font-family` token is just a
CSS name string; nothing in the Style Dictionary build touches font
files or the network. All eight are pre-loaded via one Google Fonts
CDN link (weights 400/500/600/700, matching the existing
`font-weight.regular/medium/semibold/bold` scale) added to **two**
separate places, because they're two separate render contexts with no
shared `<head>`:

- `apps/sandbox/src/index.html` — the app shell.
- `libs/ui/.storybook/preview-head.html` — a brand-new file, Storybook's
  own documented convention for injecting into the preview iframe's
  `<head>`; mirrors (rather than imports) the sandbox link, the same
  "colocated and duplicated, not coupled to an app that exists for a
  different reason" call `preview.css` already made for
  `apps/sandbox/src/styles.css`.

Picking any of the eight needs no further work beyond the semantic
token edit + rebuild. A 9th font needs its own `@font-face` or CDN link
added to **both** files above, or it silently falls back to the
generic (`sans-serif`/`serif`/`monospace`) with no error — documented
in `libs/ui/README.md`'s new "Changing fonts" section, which is the
actual answer to "would it work out of the box" this fork exists to
record.

`font.family-mono` still isn't consumed by any component's CSS (no
`<code>`-shaped component exists yet) — loaded and wired through
regardless, same as before this change, just with real typefaces behind
it now instead of an unused system stack.

`reference/tokens.css`/`reference/hmha-tokens.ts` (the root README's
documented "diff a fresh build against this" snapshots) were
regenerated and committed alongside — not CI-enforced, but left stale
would contradict the root README's own instructions.

---

## 30 — Typography: `font.family-heading`, Fraunces/Raleway as the pairing

**Decided:** a third semantic font role, `font.family-heading`,
defaulting to `{font-family.fraunces}` — the follow-up fork 29 itself
flagged as the natural next question once someone actually tries the
new fonts. Applied globally to `h1`–`h6` in both base stylesheets
(`apps/sandbox/src/styles.css`, `libs/ui/.storybook/preview.css`), the
same place `body`'s own `font.family` already lives — every heading
gets it automatically, with zero per-component work, the same reason
the body rule works that way.

**Why Fraunces + Raleway, not Cormorant:** a distinctive serif for
headings against a plain, highly-legible sans for body copy is a
common, low-risk pairing — personality in short bursts (headlines),
speed in the dense stuff (paragraphs, UI text). Between the two serif
options added in fork 29, Fraunces is explicitly a *display* classification
(built for headlines, wide optical-size range, on-trend in current
product/SaaS branding) where Cormorant reads more classical/editorial —
better suited to long-form reading than short, bold headline bursts.
Flagged as a caution for whoever reaches for either serif on **body**
text later: display/decorative serifs are tuned for being read at a
glance at large sizes, not for paragraphs at 14–16px — swapping one in
for `font.family` (not `.family-heading`) will cost real reading speed.

---

## 31 — Type scale: 3 new roles, zero new primitives — `heading-sm`, `body-sm`, `caption`

**Decided:** three new semantic roles — `heading-sm` (18px/tight/
semibold), `body-sm` (14px/normal/regular), `caption` (12px/normal/
regular) — alongside the original four (`heading-lg`/`-md`,
`body-md`, `label-md`). Every one reuses a `font-size` step the
primitive scale already had (`lg`, `sm`, `xs`) but no semantic role had
ever pointed at — no new primitive work, same "the structure is the
deliverable" theme as fork 29's font-family swap and the **Open
items** note it already echoed.

**Why these three and not more:** asked directly what further
typography granularity would be worth investing in, three families'
worth of addition were on the table — more font-*family* roles (a
`display` face), more type-*scale* steps, and letter-spacing/tracking.
Recommended scale steps over more families, because most day-to-day UI
work needs an extra size step ("I need a slightly smaller heading," "I
need fine-print text") far more often than it needs a whole different
typeface — and most production systems (Material, Carbon, Polaris)
carry 6–10+ named size steps against 1–2 font families, not the
reverse. `heading-sm` covers the everyday "subsection header, smaller
than a card title" case; `body-sm` covers secondary/supporting
paragraph text; `caption` covers fine print, timestamps, metadata.

**Deliberately not built, both flagged rather than silently skipped:**
- **No bigger "display" size above `heading-lg`.** The primitive scale
  tops out at `font-size.3xl` (30px) — a step above it would need new
  primitive work, not just rewiring an unused one, and nothing today
  has a hero/marketing use case for it. Add `font-size.4xl` and a
  `display`/`heading-xl` role if that need actually shows up.
- **No separate `overline` role.** An all-caps "eyebrow" label needs
  `text-transform: uppercase` and usually wider tracking on top of a
  small size — that's styling layered on `caption`/`label-md` by
  whatever consumes it, not a reason for a distinct size/line/weight
  triple of its own.

None of the three new roles are consumed by any component's CSS yet —
same "wired, available, not yet reached for" state `font.family-mono`
already sat in after fork 29, until something actually needs it.
`npm run tokens`/`tokens:contrast` clean, 347/347 unit tests,
`build:lib`/`lint:css`/`lint:standalone` clean. Letter-spacing/tracking
(the third granularity axis raised alongside this one) is the next,
explicitly deferred step — not started.

**Addendum — `label-sm` added, a real gap in this fork's own first
pass, not a reconsidered decision.** Asked directly why there was only
one label role, the honest answer turned up two things: the original
`-md` suffix (Phase 1, predating every fork in this file) was always
just a forward-compatible naming convention, not evidence siblings were
considered and rejected; and this pass added `heading-sm`/`body-sm`/
`caption` without ever checking whether `label-md` needed the same
treatment. It's the single busiest role in the library (Button, Chip,
Field, `ExpansionPanelTrigger`, `Pagination`, `Step`,
`TableHeaderCell` all consume it for their own text, independent of
their own `size` input — none of those components' size variants touch
font-size, only control height/padding) — exactly the kind of thing
this fork's own reasoning should have caught the first time. Added
`label-sm`: `font-size.xs`/`line-height.tight`/`font-weight.medium` —
sharing `caption`'s `xs` step, same way `body-sm`/`label-md` already
share `sm`, distinguished by line/weight rather than a dedicated size,
consistent with the pattern already established elsewhere in this same
file. Still not consumed by any component — available for whichever
one reaches for a smaller label first (a dense `Chip`, a compact
`TableHeaderCell`, were the two guessed as most likely). Also added to
the Kitchen Sink's Typography tab (step 2) alongside the rest, keeping
that tab's "one of every role" promise honest. `npm run tokens`/
`tokens:contrast` clean, 347/347 unit tests, `build:lib`/`lint:css`/
`lint:standalone` clean, all 151 Storybook stories (incl. a11y) pass.

---

## 32 — Consumer docs, and a real peer-dependency bug caught while writing them

**Decided:** three new consumer-facing documents — `libs/ui/README.md`
(rewritten: install, requirements, quickstart, a complete component
catalog — it previously listed only Button), `libs/ui/docs/theming.md`
(new: the three-tier architecture, both axes, the full colour/type/font
role reference, and the three ways to override anything, consolidating
and expanding the "Changing fonts" section that used to live alone in
the README), and `libs/tokens/README.md` (new: that package had zero
documentation of its own despite being separately publishable and
framework-agnostic). Audience is explicitly external consumers of the
published packages, not this repo's own contributors — `CLAUDE.md`/
`DECISIONS.md` stay the internal working-agreement/decision-log, this
is the thing a developer sees on the npm package page.

**A real, previously-shipping bug found while auditing peer
dependencies for accuracy, not something hypothetical:**
`libs/ui/package.json`'s `peerDependencies` listed only `@angular/cdk`/
`common`/`core` — missing `@angular/forms` (used by `Checkbox`,
`Switch`, `Input`, `Combobox`'s input, `RadioGroup`, `SelectTrigger`,
and `core/value-accessor.ts` itself) and `@angular/platform-browser`
(used by `HmhaIcon`'s `DomSanitizer` — meaning transitively almost
every component, since almost everything renders an icon). Any
consumer installing this package without *also* happening to have
those two already installed would have gotten a broken build, with
nothing in the package metadata warning them why. Fixed by adding both
to `peerDependencies` at the same `>=20.0.0 <22.0.0` range as the
others; confirmed in the real `dist/hmha-ui/package.json` after a
rebuild, not just the source file.

**Two claims caught and corrected before shipping, not caught after:**
drafted "every component is tested against axe-core in both colour
modes" for the README, then actually checked — `divider` and `stepper`
have no dedicated axe run in their own `.spec.ts` files, so that was an
overclaim. Rewritten to the claim that's actually true uniformly
(every component's Storybook story is checked via the a11y addon,
confirmed every `test-run` this session) with the dedicated-unit-level
axe runs described as present on *some* components, not all. Similarly
drafted "`label-md` is the single most-used role," then grepped actual
CSS consumption counts before publishing it — `body-md` is used in 13
component files, `label-md` in 7; the superlative was wrong and was
removed rather than left in.

---

## 33 — Angular 22: raise the peer-range ceiling, never the floor

**Decided:** every `peerDependencies` entry in `libs/ui/package.json` goes
from `">=20.0.0 <22.0.0"` to `">=20.0.0 <23.0.0"`, and the CI install
matrix gains `'22'` (`['20', '21', '22']`). The workspace itself stays on
Angular 20 — this is fork 01 working as designed (partial-Ivy output built
on the floor links forward), not an exception to invariant 1. A consumer
app on Angular 22 was the trigger.

**The rule for the next major (23, …):** raise the ceiling one major at a
time, in the same change that adds that major to the matrix, and only once
`scripts/verify-install-matrix.sh <major>` passes. The matrix lists every
supported major, not just floor + latest, so a middle major can't regress
unseen.

**Verified, not assumed:** every CDK symbol `libs/ui` imports (`Overlay`,
`STANDARD_DROPDOWN_BELOW_POSITIONS`, `ComponentPortal`/`TemplatePortal`,
`AriaDescriber`, `FocusKeyManager`, the underscore-prefixed
`_IdGenerator`, `CdkListbox`/`CdkOption`, `ScrollingModule`,
`SelectionModel`) was checked against `@angular/cdk@22.2.6`'s published
typings before the range moved. `_IdGenerator` was the real risk, since
an underscore export carries no stability promise. It's still exported,
but it's the first thing to check on every future major.

**Two real gaps in the install matrix itself, found while widening it:**
1. **The floor run was never on CDK 20.** The script installed
   `@angular/cdk@">=20.0.0 <22.0.0"`, which npm resolves to its highest
   match, so the "Angular 20" smoke app actually ran core 20 with CDK 21,
   and `--legacy-peer-deps` hid the mismatch. The script now pins
   `@angular/cdk@<major>` and fails if core and CDK resolve to different
   majors.
2. **The smoke app only rendered `HmhaButton`,** so everything built on
   the CDK was tree-shaken out and never linked against the major under
   test. A CDK export removed in a new major would have passed the check.
   The smoke app (now zoneless, matching `apps/sandbox`) adds Tooltip
   (overlay, portal, `AriaDescriber`), Field + Input (`_IdGenerator`,
   Forms CVA) and Select (listbox). `render-check.mjs` drives each one for
   real: the label/input association, hover-to-open the tooltip overlay,
   and open/select/close on the listbox.

All three majors pass locally with both fixes in place (core and CDK on
matching majors, every check green, no console errors).

---

## 34 — Wave 6 scope: Slider, Progress Bar, and two more — for Stackfi's media player

**Decided:** a sixth wave, released together as one minor version
(`hmha-ui` 1.2.0) from one branch (`chore/new-components`) and one PR, at
the user's request, rather than a PR per component. ~~Four~~ **Six**
components (the user widened the wave after step 2B). Named so far, in
order: **Slider**, **Progress Bar**, **Spinner**, **Skeleton**, **Avatar**
(a person), **Badge** (a status, tag or count).

**Widened again after Badge:** **File Upload**, then the rest of what
Stackfi's planning needs, gathered as one list so the wave has a single
gate and a single 1.2.0 release rather than a partial set and a
follow-up (the user has no deadline and wants HMHA finished for a while).
Checked against the library before being scheduled:

- **Alert** (new): a persistent inline message (info, success, warning,
  error). Nothing existing covers it: `HmhaToast` disappears, `HmhaField`'s
  error is per-field. The success "banner" in the Wave 2 sandbox gate was
  hand-styled app markup, never a library component.
- **Empty State** (new): icon, heading, text, action.
- **Segmented Control** (new): one-of-several, always one selected,
  likely native radios styled as joined buttons (fork 11's ground).
- **Toggle button: an addition, not a component.** A `pressed` input on
  `HmhaButton` (`aria-pressed`), which `HmhaIconButton` inherits by
  stacking on it. `HmhaChip` already has `aria-pressed` but is tag-styled.
- **Textarea: an addition, not a component.** `HmhaInput` also matches
  `<textarea>` (it only matched `<input>`), keeping one Forms/Field
  integration.
- **Nav List** (new): links with active-item styling keyed off
  `aria-current="page"`, which `routerLinkActive`'s `ariaCurrentWhenActive`
  sets, so there's still no `@angular/router` dependency. The app shell
  itself (top bar, collapsing side nav) stays in Stackfi, consistent with
  fork 26's "no persistent drawer; consumers lay out their own
  `<nav>`/`<aside>`".

All additive, so the release stays a minor version. Each still gets its
own proposal step. Stackfi (an Angular 22 media-streaming app, the
library's first real consumer) is the driver: Slider becomes its seek
timeline and volume control, and Progress Bar its upload and transcode
status.

**Order breaks the usual smallest-first rule, on purpose.** Slider is the
most complex piece in the wave and goes first anyway, for two reasons:
Stackfi needs it most, and Progress Bar's visual design (track, fill)
should follow whatever Slider settles, not the other way round. Whether
the two share code is a real question, answered in Slider's foundation
proposal (step 1a), not assumed here.

**Out of scope, stated rather than left implicit:** the media player
itself. Play/pause, timestamps and the player shell are Stackfi's own
code, per its planning doc. The library ships the generic controls they
are built from.

---

## 35 — Slider: native `<input type="range">`, one signal for `[(value)]` and Forms

**Decided:** `HmhaSlider` is `input[hmhaSlider]`, an attribute component
on the native range input. It sets `type="range"` itself, the way
`HmhaCheckbox` sets `type="checkbox"`. The browser supplies `role="slider"`,
`aria-valuenow`/`-min`/`-max`, arrow, Page Up/Down, Home and End keys,
pointer and touch drag, track-click-to-jump, RTL and form submission,
none of it hand-written. Angular Material's own slider has been built on
the same element since v15.

**Rejected: a custom `div[role="slider"]`** with a templated track and
thumb. It gives total visual freedom, at the cost of re-implementing
every behaviour above, which is the same trade forks 10, 14 and 25 turned
down. The CDK has no slider primitive to lean on either. Electron
(raised as Stackfi's likely desktop wrapper) strengthens the native case:
it's always Chromium, so the one real cost, two engine-specific styling
paths, halves there.

**The value: one `model()` that Forms also reads and writes.** A media
player needs `[(value)]` without Forms (a playhead written from
`timeupdate` several times a second), and a settings page needs
`[formControl]`. No existing control did both: form controls were
Forms-only, Chip `model()`-only. `hmhaValueAccessor()` (fork 08) now
optionally takes an existing `WritableSignal` instead of an initial value,
and reads and writes it, so the slider's own `model()` is the single
source of truth for both paths. Fork 08's one correctness rule (a Forms
write never calls `onChange`) stays in one place. Every existing call site
passes a plain value and is unchanged. `isSignal()` tells the two apart,
since Angular 20 has no `isWritableSignal()`. Forms writing `null` (a
`reset()`) maps to `min`, because a range input has no empty state.

**Media-player specifics, all inputs and outputs, no player logic:**
- `buffered`: a lighter band ahead of the fill, in `value`'s units.
  It's never drawn behind the fill, since what has played has loaded.
- `valueText`: sets `aria-valuetext` ("1:23 of 4:56").
- `valueCommit`: the native `change` event (release, or a finished key
  press), when a player seeks. `valueChange` (the model's own output)
  fires continuously.
- `scrubbingChange` (and a `scrubbing` signal): pointer down to a
  document-level pointer up or cancel, so a player can pause its
  `timeupdate` writes during a drag.
- `orientation` (`HmhaOrientation`, reused from fork 28): vertical via
  native `writing-mode: vertical-lr; direction: rtl`, bottom = min, with
  `aria-orientation` set explicitly because CSS orientation is
  invisible to the accessibility tree.

**A real ordering bug, designed out rather than found later:** a range
input clamps `value` to whatever `max` it has *at the moment `value` is
set*. As four host property bindings, `value` could land before a new
`max` (a timeline whose duration arrives after the playhead), and a
binding only re-runs when its own expression changes, so the clamped
value would never be corrected. One `effect()` writes `min`, `max`,
`step`, then `value`, always in that order, and re-runs when any of
them changes. Two unit tests cover it, and both were confirmed to fail
("Expected '100' to be '250'") with the write order deliberately
reversed, so they catch the bug rather than just passing.

**Shared with Progress Bar: one token, no code.** Progress Bar will be
the native `<progress>` (a display element, no focus, no CVA, styled
through entirely different engine pseudo-elements), so a shared base
would couple a form control to a display element (fork 08's base-class
rejection again) and share no actual CSS. The real overlap is visual,
so it lives in the token tier: a new semantic dimension,
`track.thickness` (`{space.1}`, an existing primitive), which both
components' thickness tokens point at. Colours reuse existing roles: fill
and thumb `action` (which already passes 3:1 against `bg`, since `focus`
is the same blue), buffered `border-strong` (already a checked 3:1 pair),
and track `border`. No new colour roles, so light/dark parity and the
contrast script are untouched.

**Styling notes.** Each engine's track and thumb is written twice
(`::-webkit-slider-*`, `::-moz-range-*`), because an unknown pseudo-element
in a selector list invalidates the whole rule. Both read tokens declared
once on `:host`. The fill and buffered band are one gradient driven by
two internal percentage custom properties set from the component
(`--_hmha-slider-fill`, `--_hmha-slider-buffered`). The underscore marks
them as internal, not override API. The host is a full control height
(density-aware), so a slider lines up in a row with buttons.

**Out of scope, stated:** a two-thumb range slider (no native element),
tick marks, and a hover-time preview tooltip (player code). The iOS
caveat (its native range may not jump on a track tap) is documented in
the README, with an additive fix if Stackfi's Capacitor phase needs it.

---

## 36 — Progress Bar: native `<progress>`, three tones, and a lighter shared track

**Decided:** `HmhaProgressBar` is `progress[hmhaProgressBar]`, an
attribute component on the native `<progress>`. The browser supplies
`role="progressbar"`, its value semantics and the indeterminate state.
It's a display element: not focusable, no keyboard input, no
`ControlValueAccessor`, no `HmhaField` (no required, invalid or hint state
to wire). Labelled the native ways: `<label for>`, `aria-labelledby` or
`aria-label`. As fork 35 decided, it shares no code with Slider, only the
track.

**Indeterminate is `value = null`, bound as an *attribute*.** A
`<progress>` is indeterminate exactly when it has no `value` attribute.
Once the `value` *property* has been set, nothing but removing the
attribute returns it to that state. So `value` is `[attr.value]`, with
null removing it, and a job can go from 62% back to "queued" (a retry).
`0` stays a real, empty determinate bar. A unit test pins the round trip,
and three tests were confirmed to fail with a property binding swapped in.

**Tones, and why the shared track changed colour.** Stackfi wants a red
"failed" and a green "complete" bar. Before building them, every fill was
measured against the track it sits on, since the fill's end point is the
information and WCAG 1.4.11 wants 3:1 for it. On the original track
(`border`), blue passed in both modes, but green and red failed in dark
mode (2.65:1) and amber in light (1.85:1). The fix: both components'
track moved to `bg-subtle`. Blue, green and red then pass in both modes
(lowest 3.42:1, green and red in dark). The user chose this over
"primary only" and over keeping the failing track. It also fixes the
Slider's red `invalid` fill in dark mode, which had the same 2.65:1 gap
(its thumb, the part that identifies the value, always passed). The
trade-off, accepted knowingly: the empty track is fainter against the
page, most visibly in light mode on `bg`. It reads better on a `surface`
card.

- **Tones are `primary | success | danger`**, a new
  `HmhaProgressBarTone`, not `HmhaTone`. `neutral` has no fill role, and
  amber can't reach 3:1 on *any* light track, so `warning` waits on the
  existing amber-500 open item rather than shipping below the bar.
- **The guard is now in CI, not just in this decision:**
  `scripts/check-contrast.mjs` asserts `action`, `success` and `danger`
  at 3:1 on `bg-subtle` in both modes, so a later retheme can't quietly
  undo it.

**The indeterminate sweep** is a 40% fill segment painted on the host
and moved with `background-position`, with each engine's own
indeterminate bar made transparent so Blink and Gecko draw the same
thing. It reverses in RTL. Under `prefers-reduced-motion: reduce` it
doesn't travel: the whole track fills and pulses in opacity instead. Its
duration is a component token, `calc(var(--hmha-duration-base) * 8)`, so
no new duration token was needed. The 40% and the keyframe positions are
sweep geometry, commented as such, not design values.

**Not built, stated:** a `size` input (one thickness token covers
Stackfi's uses, and `--hmha-progress-bar-thickness` overrides it),
circular progress, and buffered progress (the Slider's `buffered` already
covers a media timeline).

**Amendment (Wave 6 step 7c): the shared track is `surface-sunken`, not
`bg-subtle`.** Step 7c's dark-mode screenshots of upload rows showed
progress tracks and neutral badge pills invisible: in dark mode
`bg-subtle` is the same neutral.900 as `surface`, so 1.00:1 inside any
row or panel on a surface. This decision had measured the track against
the page and the fills, never against `surface`. Candidates were measured
on all three grounds (page, surface, card) in both modes. A text-colour
tint shows everywhere, but pulls the dark track toward the fills (about
2:1). A darker shade can't go below the near-black dark page. In dark mode
the three grounds span a range that any single track colour matches one
of, so one ground had to give. `surface-sunken` (light neutral.100, dark
neutral.950) reads as recessed in both modes, shows on surfaces and cards,
and keeps every fill at 3.98:1 or better. The ground it gives up is the
bare dark page background, the least likely place for a player control or
upload row. The user chose it. The neutral *subtle* badge fill moved with
it, for the same reason. CI's fill-on-track pairs and the neutral badge's
text pair now point at `surface-sunken`, and all pass in both modes.

---

## 37 — Spinner: a custom element rotating the icon set's own glyph

**Decided:** `HmhaSpinner` is `hmha-spinner`, a custom element whose
template is one `<hmha-icon name="spinner">` (the Lucide arc already in the
registry), rotated by CSS. It's a custom tag under `CLAUDE.md`'s "only
where no native element fits" rule, because no native element draws a
rotating arc. It joins `hmha-card`, `hmha-field` and `hmha-icon` as the
library's only custom tags.

**Rejected: `progress[hmhaSpinner]`,** the native `<progress>` drawn as a
ring. It would have given `role="progressbar"` for free and matched
Progress Bar (fork 36), but a `<progress>` can't hold the icon, and
turning a bar into a ring means gradient and mask tricks on each engine's
pseudo-elements. That's fragile styling to save one ARIA attribute.

**Two accessibility modes:**
- **Standalone (default):** `role="progressbar"` with no value and an
  `aria-label` (`label`, default `"Loading"`). That's the standard spinner
  semantics, and the same thing an `HmhaProgressBar` with no value is.
- **`decorative`:** no role, no name, `aria-hidden="true"`, for a spinner
  inside something that already announces it's busy. A loading
  `HmhaButton` sets `aria-busy`, and an announced progress bar inside it
  would both repeat that and leak into the button's name ("Save
  Loading"). A unit test renders exactly that composition and checks it
  with axe.

**Button integration is composition, not a Button change.** `HmhaButton`'s
README already told consumers to "pair with your own spinner". It now
points at `<hmha-spinner decorative size="sm" />` instead. Making
`loading` render a spinner by itself would change every existing loading
button's look in a minor release, and would need Button to gain a
template it has never had.

**Colour and size.** `currentColor` by default, so it matches the text
beside it (white inside a primary button). Sizes are the icon scale.
Spinner sizes its glyph by setting `HmhaIcon`'s own documented override
token (`--hmha-icon-size`) on the `hmha-icon` in its own template, not
by reaching into the icon's internals, so `--hmha-spinner-size` takes any
length (a page-level loader). Removing that one declaration was confirmed
to fail the sizing test (the glyph stayed at 20px for `sm` and `lg`).

**Motion.** One turn per `calc(var(--hmha-duration-base) * 4)`, a
component token, so no new duration token was needed. Under
`prefers-reduced-motion: reduce` it pulses in place instead of rotating,
matching Progress Bar's reduced-motion treatment. The user was offered a
pure-CSS show-after-a-delay option (to avoid a flash on fast loads) and
didn't take it. It stays a cheap later addition.

---

## 38 — Skeleton: one block on a native span/div, layout stays the consumer's

**Decided:** `HmhaSkeleton` is `span[hmhaSkeleton], div[hmhaSkeleton]`, a
template-less attribute component. One block is one placeholder shape
(`text`, `circle` or `rect`), and the consumer lays blocks out with the
same markup the real content uses: skeleton cells in their real
`HmhaTable` rows, skeleton posters in their real poster grid. That's
`CLAUDE.md`'s native-element preference, and it's what makes "entire
rows" work: a `<span>` goes inside a `<td>`.

**Rejected: `hmha-skeleton` with built-in presets** (`preset="table-row"`,
`preset="card"`). That's less markup, but each preset is a guess at
Stackfi's layouts that breaks the first time a real row doesn't match.
Fork 21's principle (the consumer owns layout and data) points the same
way here as it did for the data grid.

**Accessibility: blocks are always `aria-hidden`, the container says it's
busy.** A placeholder has nothing to read, and a page of announced
progress bars would be noise. The README's headline instruction is
`[attr.aria-busy]="loading() || null"` on the container being loaded, plus
a polite live region for a long wait, which stays page code because only
the page knows when it's worth saying. No helper directive was built for
`aria-busy`: one directive to set one attribute would be API without
substance. A unit test renders the README's own table pattern
(`<tbody aria-busy>` with skeleton rows) and checks it with axe in both
modes.

**Text rhythm without margins, after the linter said no.** The first
draft centred a 1em bar in one line-height with
`margin-block: calc((1lh - 1em) / 2)`. `lint:css` rejected the `lh`/`em`
units on a margin property, correctly by the rule as written. Rather than
work around the linter, the text shape became `display: inline-block`
(1em tall). An inline box sits in its own line box, one line-height tall,
so stacked text placeholders get the rhythm of real text from normal
layout, with no spacing to tune. A test pins it (lines 24px apart at
`line-height: 24px`), and was confirmed to fail ("Expected 16 to be close
to 24") with `display: block` swapped back in.

**Colour: a 12% tint of the text colour, after a fixed grey failed in the
real browser.** A skeleton carries no information, so it has no WCAG
contrast floor, but it does have to be visible. Step 4b picked `border` by
measuring it on the page (`bg`) and `surface`, in both modes (1.18:1 to
1.50:1). Step 4c's dark-mode screenshot of a skeleton inside `HmhaCard`
showed it invisible: a card sits on `surface-raised`, not `surface`, and
in dark mode `surface-raised` and `border` are the same neutral.800, so
1.00:1. The 4b measurement had simply never included the ground a card
uses. Re-measured on all three grounds in both modes: `border-strong` never
vanishes, but at 3 to 4.7:1 reads as heavy as real UI chrome, while
`color-mix(in oklch, var(--hmha-color-text) 12%, transparent)` stays at
1.27:1 to 1.44:1 everywhere and tracks the text colour, so it holds on any
surface added later. The user chose the tint (a visual change, so asked
first). A unit test now composites the fill over all three grounds in
both modes and requires better than 1.2:1, and was confirmed to fail on
the old `border` fill ("dark on surface-raised: Expected 1 to be greater
than 1.2"). It measures through a 1x1 canvas rather than a colour
library, since `culori` (used by the contrast script) ships no types and
wasn't worth a new dev dependency for one test.

**Shapes and sizing.** `text` is full width and 1em tall. `circle` is a
control's height and always square (`aspect-ratio: 1`). `rect` is full
width at 16:9, a video thumbnail's proportions. `width`/`height` inputs take
the consumer's own CSS lengths, the same shape as `HmhaDivider`'s
`length` (fork 28), and an explicit height wins over the 16:9 default.

**Motion: a gentle opacity pulse**, the user's choice over a shimmer
sweep, and already the library's busy language (Progress Bar's and
Spinner's reduced-motion fallback). Being a fade rather than movement,
it keeps running under `prefers-reduced-motion`, at half the speed.

**Not built, stated:** row or card presets, a `lines` input (repeat
`text` blocks), and fading real content in on arrival.

---

## 39 — Avatar: a span that falls back from photo to initials to icon

**Decided:** `HmhaAvatar` is `span[hmhaAvatar]`, a component on a native
`<span>` whose template shows the first of three that works: the photo
(`src`), initials from `name`, or the `user` icon. A `<span>` can hold an
`<img>` and text alike, so it keeps `CLAUDE.md`'s native-element rule.

**Rejected: `img[hmhaAvatar]`.** That's the most native option, but an
`<img>` can't contain anything, so there would be nowhere to show
initials when the photo is missing or broken. For Stackfi's user uploads,
that's the common case, not the edge case.

**Fallback mechanics.** A failed photo (404, expired signed URL) is
caught by the image's own `error` event, with no timers, into an
`imageFailed` `linkedSignal` keyed on `src`, so a new URL gets a fresh
attempt automatically: the first `linkedSignal` in the library, and a
textbook fit for "derived state the user can also write". Initials take
the first letter or digit of the first and last words, read as whole
code points (`Array.from` plus `\p{L}\p{N}`), so accented, CJK and
punctuation-led names work and emoji are skipped. The logic is exported
as `hmhaInitials()` and pinned by 10 cases.

**Accessibility: the same two modes as Spinner (fork 37).** By default
it's `role="img"`, named by `name` ("User" when there isn't one): an
unnamed picture of a person is worse than a repeated name. `decorative`
removes it from the accessibility tree, for an avatar beside the visible
name. The inner `<img>` always has `alt=""`, so photo, initials and icon
read identically.

**Colour: one calm neutral, the user's choice over a per-person palette,**
which would need about 6 new categorical, text-safe colour roles in both
modes. That's real token work, addable later without an API change.
Measured before writing CSS, with fork 38's lesson in hand: every fixed
neutral fill vanishes on some ground (in light mode none clears 1.10:1
against any surface). So the background is fork 38's tint,
`color-mix(in oklch, var(--hmha-color-text) 12%, transparent)`, with
`text-muted` initials. That has a useful side effect: a circle skeleton
and a real initials avatar look alike, so loading to loaded doesn't
jump. Initials are text, so a unit test composites the tint over page,
surface and card in both modes and requires the circle above 1.2:1 and
the initials at 4.5:1. It was confirmed to fail with a fixed `bg-subtle`
fill (four grounds, down to 1.00:1 on a dark surface).
`check-contrast.mjs` can't resolve `color-mix()`, so this pair lives in
the unit test rather than CI's token script. The canvas-based colour
helpers it uses moved from the Skeleton spec into
`core/testing/paint.ts`, test-only and confirmed absent from `dist`.

**Size.** `sm`/`md`/`lg` are the control heights (32, 40 and 48px), so an
avatar lines up with a button beside it and shrinks with compact
density like table rows do. `--hmha-avatar-size` takes any length.
Initials scale at 40% of the size. Always a circle.

**Not built, stated:** a status dot (Badge's territory, decided there),
overlapping avatar groups, and photo cropping or upload.

**Addendum (step 6c): a `label` input, found through Badge's status-dot
pattern.** The README's first avatar-with-status pattern put the status
in the name (`name="Chris Wilson (online)"`) so the hidden dot's meaning
would be spoken. Its screenshot drew "CO": initials take the last word,
and the last word was "(online)". `label` (optional) now overrides the
accessible name while initials still come from `name`:
`name="Chris Wilson" label="Chris Wilson, online"`. That's additive, and
Avatar hadn't shipped. A unit test and the Badge story both pin "CW".

---

## 40 — Badge: never-interactive status and counts, split cleanly from Chip

**Decided:** `HmhaBadge` is `span[hmhaBadge]`, a never-interactive
component on a native `<span>` for what the app tells someone: a status
("New", "Processing", "Failed") or a count. It has three forms: projected
text, `count` (capped at `max`, default 99, as "99+"; a zero count hides
the badge unless `showZero`), and `dot` (a small circle, no text).

**The split from `HmhaChip`, approved as the rule of thumb for the
README:** if someone can click it or chose it, it's a Chip; if the app is
telling them something, it's a Badge. The display Chip already covered
"a tag", so Badge doesn't duplicate it. Chip stays neutral, control-sized
and optionally a real `<button>`, and Badge is toned, small and never
interactive. A genre tag on a title is a Chip; "Processing" on an upload
is a Badge.

**Look: `tone` (the existing `HmhaTone`) times `appearance`
(`subtle` | `solid`), `subtle` by default.** The user first answered
"solid sounds best", which was built as "solid only" for a moment before
they stopped it. They'd meant both appearances. No code had been written,
so nothing needed undoing. All ten pairings are 4.5:1 text pairs in
`check-contrast.mjs`, in both modes. Seven already existed (the four
`text-on-*` solids, the three `*-text` on `*-subtle`), and three were
added: neutral subtle (`text-muted` on `bg-subtle`, 7.42:1 / 10.95:1),
primary subtle (`action` on `action-subtle`, 4.54:1 / 4.77:1) and neutral
solid (`surface` on `text-muted`, 8.14:1 / 10.95:1). **Warning is in,
unlike Progress Bar (fork 36):** that gap was amber as a thin fill against
a track, while here amber is behind dark text (`text-on-warning`), a pair
that already passes. A unit test measures the *painted* text against the
painted fill for all ten pairings in both modes, so it checks the CSS
wiring, not just the tokens. It was confirmed to fail (2.28:1, and axe
agreed) with white text on the solid amber. Each tone's four colours are
internal `--_hmha-badge-*` properties; `--hmha-badge-bg`/`-fg` are the
override API.

**A dot is always the tone's strong colour, whatever the appearance.** A
subtle tint at 8px would barely show. A dot is `aria-hidden`, because
colour alone can't carry meaning (WCAG 1.4.1), so whatever it says must be
text elsewhere. The README's avatar status pattern puts it in the avatar's
own name ("Chris Wilson (online)"). That settles the status dot fork 39
left to Badge: plain consumer CSS pins a dot to an avatar's corner, with
no positioning API.

**Accessibility otherwise.** Text badges are plain text, deliberately not
live regions (a list of badges each announcing itself would be noise);
counts read as text inside their surrounding name ("Notifications 12").

**Sizing with no new tokens.** The proposal flagged that a new spacing
token might be needed. It wasn't: the badge is an inline icon's height
(`--hmha-icon-md`, so it lines up with an icon in the same row) and at
least as wide, so a single-digit count is round. Side padding is 0.75 of
the density-aware control gap, and a dot is half the small icon. Text uses
`label-sm`, its first consumer since fork 31 added it.

**Addendum (step 6c): lining figures.** The counts screenshot showed
Raleway's default old-style digits, sitting at different heights ("42"
descends, "3" drops), which is wrong for a count. The badge now sets
`font-variant-numeric: lining-nums tabular-nums`, pinned by a unit test.
Avatar's initials are letters, so they're unaffected.

---

## 41 — File Upload: upload UI only, the consumer owns every byte of transport

**Decided (proposal approved before any code):** the File Upload
component is upload *UI* and never makes a network request. It owns the
drop target and the file picker (a native `<input type="file" multiple>`
underneath, so keyboard, screen readers, mobile pickers and the camera
work), optional pre-flight checks (accepted types, maximum size, maximum
count, reported as rejections with reasons), rendering one row per
file from the wave's own pieces (`HmhaProgressBar`, `HmhaBadge`,
`HmhaIconButton`), a per-row slot for the consumer's own metadata fields,
and screen-reader announcements of adds, completions and failures. It
emits *intents*: files added, cancel, retry, remove, pause and resume.

The consumer (Stackfi, or an engine it chooses) owns everything else:
the list of uploads and their state, passed in as a read-only array of
`{ id, name, size, progress, status, error?, metadata? }`; chunking;
multipart and presigned URLs; retries; concurrency; resume; progress
throttling; and metadata's schema and storage. That's fork 21's pattern
again (the component renders and emits intents, the consumer owns the
state and data), applied to transport.

**Why: it keeps the library transport-agnostic.** The list of uploads is
the whole integration point, so Uppy, tus, raw S3 multipart or hand-written
`fetch`/XHR all plug in by keeping that array current. `@uppy/core` is
headless and its S3 plugin does presigned multipart, which matches
Stackfi's MinIO plan, so the README will carry an Uppy wiring recipe. That
means no dependency: `hmha-ui` never imports Uppy. FilePond was assessed
honestly and doesn't fit the same way: it's chiefly a UI library that
renders its own drop area and list, so it's an alternative to this
component, not an engine underneath it.

**Rejected: the component doing transport** (built-in XHR progress, a
chunker). That would couple the library to one upload strategy and fight
any consumer using a real engine. The user confirmed the split.

**In scope from the start, by the user's choice given no deadline:**
- **Folder drops:** a dropped folder adds every file inside it, through
  the browser's directory-entry API. Stackfi's planning doc lists folder
  import as a stretch goal.
- **Thumbnails:** image previews in rows for image files, with their
  object URLs revoked so memory doesn't leak. Video and audio stay icons.
- **Paste to upload:** pasted files or screenshots are added, as a
  keyboard-friendly shortcut.

**Known challenges, named up front:**
- Drag and drop quirks: enter/leave flicker across child elements, a drop
  just outside the zone navigating the page (or the whole Electron window),
  folders needing the directory API, and no drag at all on mobile.
- Accessibility: drag-only fails WCAG's dragging-alternative rule, so the
  picker is the primary path. Progress must not flood screen readers, so
  only start, finish and failure are announced.
- `fetch` can't report upload progress: that's the transport's problem
  (XHR, per-chunk progress, or Uppy), documented in the README.
- Memory: the component holds `File` references only and never reads
  contents.
- Testing: Karma can construct a `DataTransfer` and dispatch a drop, but
  a real drag from the desktop needs Playwright, per `CLAUDE.md`'s
  which-layer rule.

**Amendment (after 7b-i, from Stackfi's planning review):**
- **Folders are rejected, not traversed:** a new rejection reason,
  `'directory'`, detected through `DataTransferItem.webkitGetAsEntry()`.
  This replaces the "folder drops" extra approved above; traversal is a
  possible later feature. Without it, browsers hand a dropped folder over
  as an unreadable zero-byte "file".
- **`maxFiles` is per selection** (one pick, drop or paste), never a total.
  The dropzone can't see what an engine like Uppy already has queued, so
  the overall cap is the consumer's (`restrictions.maxNumberOfFiles`).
- **Unset checks mean no checks:** with `accept`, `maxSize` and
  `maxFiles` unset, every file passes untouched. Consumers whose upload
  library validates should leave them unset, so there's one source of
  truth.
- **The window guard, pinned by tests:** it acts only on drags carrying
  files, never stops propagation (a later window listener still sees the
  drop), and lives exactly as long as at least one dropzone is mounted.
  Each instance's listener is removed with it, and several cooperate
  through `defaultPrevented` rather than a reference count, which gives
  the same lifetime with no shared state.
- **Repeat announcements:** CDK's `LiveAnnouncer` clears its live region
  before every message (confirmed in its source), so an identical message
  is spoken again. A test pins that the dropzone itself never
  de-duplicates.
- **`hmhaFormatBytes` stays decimal** (1 kB = 1000 B), documented with the
  Windows Explorer difference (it divides by 1024 but still writes "GB").
- **Rows will show the whole journey, not just the upload** (built in
  7b-ii): after the bytes arrive, Stackfi transcodes, so a row's status
  must reach `processing` (an indeterminate progress bar), then `ready` or
  `failed`. Rows take inputs only and emit actions; each action button's
  accessible name includes the file name ("Cancel upload of movie.mkv").

**Rows, as built (7b-ii).** `HmhaUploadItem` (`li[hmhaUploadItem]`)
inside `HmhaUploadList` (`ul[hmhaUploadList]`, with `role="list"` stated
because Safari drops list semantics once bullets are styled away). A row
takes inputs only (`name`, `size`, `progress` 0–100 or `null`, `status`,
`statusLabel`, `error`, `pausable`) and emits payload-free outputs
(`cancel`, `retry`, `pause`, `resume`, `remove`). The consumer's `@for`
already knows which upload a row is. `HmhaUploadStatus` is `queued |
uploading | paused | processing | ready | failed`, the user's "whole
journey". `processing` always draws an indeterminate bar whatever
`progress` says, confirmed by a deliberate break. Actions per status are
the approved table, pinned by a table-driven test across every status,
with and without `pausable`. Built from the wave's own pieces:
`HmhaProgressBar`, `HmhaBadge`, `HmhaIconButton` (every action named with
its file: "Cancel upload of movie.mkv"). A failed row's error is tied to
Retry with `aria-describedby`, and its red text on the surface is a new
CI pair (7.48:1 / 8.32:1). Announcements fire on a status change only,
for `processing`, `ready` and `failed`, never per percent and never on
first render. Two small bugs were caught in review, both pinned by
tests: the failure announcement doubled a full stop when the consumer's
error already ended with one (now "movie.mkv failed. Unsupported
codec."), and the README's interpolated `statusLabel` would have blanked
the badge, since `{{ null }}` becomes `''` (the fallback is now `||`, not
`??`). The README carries an Uppy wiring sketch against Uppy's core API,
flagged to check against the installed version. `hmha-ui` imports
nothing from Uppy.

**Thumbnails and paste, as built (7b-iii).** A row's `preview` input
takes a `Blob`/`File` or a URL string. An image Blob gets an object URL
created in an `effect` whose cleanup revokes it, on the next change and
on destroy. A test pins both revocations and fails with the cleanup
removed. Video and audio keep the file icon: a frame would mean decoding
in the browser, which is the server's job. A URL string is used as it
is, which suits a server-generated poster after `processing`. A broken
preview falls back to the icon through a `linkedSignal`, like
`HmhaAvatar`. Thumbnail and icon share one control-height box so rows
align. Paste lives on the dropzone and only while it has focus, since a
page-wide listener would hijack every paste, text fields included.
Pasted files take the same checks and announcements, and a text paste is
untouched.

---

## 42 — Alert: a persistent inline message, announced only when asked

**Decided (proposal approved before code):** `HmhaAlert` is
`div[hmhaAlert]`, a component on a native `<div>`: a tone icon, the
consumer's content, an optional `[hmhaAlertActions]` row and an optional
Dismiss button. It fills the gap Stackfi's planning found. `HmhaToast`
disappears and `HmhaField`'s error belongs to one input, while an alert
stays inline for a whole form or page. The Wave 2 sandbox "success banner"
was hand-styled app markup, never a component.

**Tones:** `HmhaAlertTone` = `info | success | warning | danger`, its own
small union. `info` reads better than reusing `HmhaTone`'s `primary` ("a
primary alert"), and uses the same action colours. There's no neutral
tone: an untoned alert is a Card. Each tone is its `*-subtle` fill with
its `*-text` foreground (`action` on `action-subtle` for info), four pairs
already CI-checked at 4.5:1. The icon uses the text colour so it clears
the same bar. A unit test measures the painted text against the painted
fill for every tone in both modes.

**Accessibility, the design's centre:**
- **The tone is spoken.** The icon wrapper is `role="img"` named "Info",
  "Success", "Warning" or "Error", so colour and shape aren't the only
  carriers (WCAG 1.4.1).
- **`announce` is chosen per use, not per tone:** `'none'` (default, for
  an alert present on load, read in page order), `'polite'` or
  `'assertive'`. The announcement is "tone: title message" without action
  labels, once, after first render, through CDK's `LiveAnnouncer` (like
  the dropzone and upload rows) rather than `role="alert"`/`"status"`,
  because newly inserted live regions are announced unreliably,
  especially polite ones. Defaulting to `'none'` designs out the commonest
  Alert mistake: every error assertive, interrupting on page load.
- **Dismissing is the consumer's:** `dismissible` adds a button named
  "Dismiss", and `dismissed` fires. The alert never removes itself (fork
  21's consumer-owns-state rule). The README covers moving focus after.

**A small structural call:** the title is its own tiny component,
`HmhaAlertTitle` (`[hmhaAlertTitle]`, any element), purely so it can style
its own host. The alert's encapsulated styles can't reach projected
content, and `::ng-deep` is banned (fork 05). The consumer picks
`<strong>` or a real `<h3>`.

**Two bugs caught before they shipped:**
- **The icon box had no height.** It was first sized with
  `var(--hmha-type-body-md-line)`, which is unitless (1.5) and therefore
  invalid as a length, so the browser silently dropped it. Lint can't see
  that. Fixed with `1lh` (exactly one line), and pinned by a test that was
  confirmed to fail ("Expected 20 to be close to 24") with the token
  swapped back.
- **The axe check flagged the action button in dark mode.** That was the
  known `HmhaButton` background-transition timing, not a product bug.
  Fixed with the same 150ms wait `button.spec.ts`/`pagination.spec.ts`
  already use.

**Not built, stated:** auto-dismiss (Toast's job), an alert stack, and a
form-error summary that reads the form itself.

**Found in 8c's real-browser screenshots, not by tests or Storybook's
axe** (which runs in light mode only):
- **Links inside a dark-mode alert were unreadable.** They showed the
  browser's default blue on the dark red. The library has no link style
  at all (now an open item), and Alert can't reach projected links. The
  README and the form-error-summary story now use `color: inherit`, so
  links take the alert's CI-checked text colour.
- **An `<h3>` title took the global heading face** (fork 30's `h1`–`h6`
  rule), so it didn't match a `<strong>` title. `HmhaAlertTitle` now sets
  the body family itself, pinned by a test.

**A stale-bundle false failure:** the upload-failed story first failed on
focus because my demo used a template reference on a component host,
which resolves to the component, not the element, so `.nativeElement`
was undefined. After the `{ read: ElementRef }` fix, `test-run` reported
the same failure again, with the same live-region id. A direct Playwright
reproduction showed focus correctly returned, and a re-run passed:
`addon-vitest` had served the previous bundle once. Worth knowing next to
`CLAUDE.md`'s other dev-server quirks.

---

## Wave 6 progress — the step tracker

**This section is the single source of truth for Wave 6 status**, the
same way the Wave 2–5 progress sections were for their waves. Update the
checklist and the CURRENT STEP marker at the end of every step. The
process rule itself (one step at a time, stop-and-wait between steps,
the done criteria) lives in `CLAUDE.md`'s "Working through a wave"
section. This section only tracks where we are.

Component order follows fork 34.

**CURRENT STEP: 9a**: Empty State foundation proposal, waiting for the go-ahead.

1. [x] **1a.** Propose Slider's foundation. Approved: native
   `<input type="range">` (Option A), one `model()` shared with Forms, and
   tokens-only sharing with Progress Bar (`track.thickness`). Asked whether
   it holds up inside an Electron wrapper: it does, unchanged. Recorded as
   fork 35.
2. [x] **1b.** Build Slider + tests: `libs/ui/src/lib/slider/` (`slider.ts`,
   `slider.css`, `slider.spec.ts`, `README.md`). Built as fork 35 describes.
   Also: `hmhaValueAccessor()` accepts an external `WritableSignal` (+1
   test in `value-accessor.spec.ts`); new semantic token `track.thickness`
   (`npm run tokens`/`tokens:contrast` clean, `reference/tokens.css`
   re-synced); Slider added to `libs/ui/README.md`'s catalog and Forms
   list (Select was missing from that list too, now fixed). 24 new slider
   tests plus 1 accessor test (372/372 in `hmha-ui`, 24/24 in `sandbox`),
   `build:lib`/`lint:css`/`lint:standalone` clean.

   The spec states which layer verifies what: native keyboard and drag are
   browser default actions Karma can't perform, so the spec sets `.value`
   and dispatches `input`/`change` the way the browser would. Real keys
   and drag, and the engine pseudo-element styling (vertical thumb
   centring especially), still need a real browser. That's step 1c's
   job.
3. [x] **1c.** Story: Slider: `slider.stories.ts` (Playground, Sizes,
   MediaTimeline, VerticalVolume, Disabled, Invalid, WithFormControl,
   ChangeAndCommitInteraction, ScrubbingInteraction). Hit the documented
   `test-run` timeout on the first call: the dev server and its
   `addon-vitest` process had been running since Oct 20, with no viewer
   connected. Restarted per `CLAUDE.md` (stop all three, clear
   `node_modules/.cache/storybook`, start one), which cleared it.

   **One test-authoring bug, caught by `test-run`:** `ScrubbingInteraction`
   first pressed and released the pointer with two separate
   `userEvent.pointer()` calls. Each direct call starts from fresh pointer
   state, so the release had no press to end and fired no `pointerup`.
   Fixed with one `userEvent.setup()` instance shared by both calls.

   **The real-browser layer, done for real rather than claimed:** a
   throwaway Playwright script (not committed, per the usual discipline)
   drove the running stories with real CDP keyboard and mouse input in
   Chromium. Arrow, Page Up, Home and End all move the value. A real drag
   sets `data-scrubbing` mid-drag and clears it when released outside the
   slider. A track click jumps there, and vertical runs bottom-to-top.
   Screenshots confirmed centred thumbs at all three sizes, the fill,
   buffered band and track in the timeline, vertical centring, RTL fill
   from the right, and dark mode. The same stories in Playwright's
   Firefox matched, which covers the Gecko half of `slider.css`. Two
   first-run "failures" were the script reading the DOM in the same tick
   as the input; with a short wait both settled correctly, as zoneless
   change detection does.

   **Worth knowing:** the event trace showed Chromium's range input
   implicitly captures the pointer, so `pointerup` targets the slider
   even when released elsewhere. The document-level listener is still
   right for engines without implicit capture, and costs nothing here.

   All 9 Slider stories plus the full existing suite (160 stories) pass
   `test-run` (incl. a11y).
4. [x] **2A.** Build Progress Bar + tests: `libs/ui/src/lib/progress-bar/`
   (`progress-bar.ts`, `progress-bar.css`, `progress-bar.spec.ts`,
   `README.md`). Recorded as fork 36. Measuring each fill against the
   track before writing any tone CSS showed green, red and amber failing
   3:1 somewhere. Asked the user (a visual change): chose tones plus a
   lighter `bg-subtle` track shared with Slider, `warning` left out. Three
   fill-on-track pairs added to `check-contrast.mjs`. Slider's track token
   and README updated to match, and its 9 stories re-run green. 11 new
   unit tests (383/383 in `hmha-ui`, 24/24 in `sandbox`),
   `build:lib`/`lint:css`/`lint:standalone`/`tokens:contrast` clean.
5. [x] **2B.** Story: Progress Bar: `progress-bar.stories.ts` (Playground,
   Tones, Indeterminate, UploadWithValueText, EmptyNotIndeterminate,
   RetryReturnsToQueueInteraction). The retry story uses a small local
   `TranscodeJobDemo` host (a signal-backed job card, the same approach as
   `ToastDemo`/`DataGridDemo`), so the determinate-to-indeterminate round
   trip fork 36 designed for is driven by a real click, not set by hand.
   Hit the documented brand-new-component styleUrl error on the first
   `test-run`. The user had Storybook open in Chrome, so the restart
   waited for their go-ahead (`CLAUDE.md`'s rule), then cleared it as usual.

   Real-browser check (a throwaway Playwright script, Chromium and
   Firefox): tones render identically in both engines and modes; the
   indeterminate segment really travels (background-position moved
   roughly 55% to 145% in half a second); RTL reverses it; and with reduced
   motion emulated, both engines switch to the full-width pulse. The
   keyframe name came out scoped (`_ngcontent-…_hmha-progress-bar-pulse`),
   confirming emulated encapsulation scopes `@keyframes` too. One cosmetic
   difference, left as is: the sweeping segment has square ends while a
   determinate fill is rounded. Rounding a background-painted segment would
   need gradient tricks for little gain, and Material's bar does the same.

   All 6 Progress Bar stories plus the full existing suite (166 stories)
   pass `test-run` (incl. a11y).
6. [x] **3a.** Propose Spinner's foundation. Approved: Option A
   (`hmha-spinner` rotating the existing `spinner` icon), standalone and
   decorative modes, composition with `HmhaButton` rather than a Button
   change, no show-after-delay option. Recorded as fork 37.
7. [x] **3b.** Build Spinner + tests: `libs/ui/src/lib/spinner/`
   (`spinner.ts`, `spinner.css`, `spinner.spec.ts`, `README.md`), plus
   `HmhaButton`'s README now points at it and the library README lists it
   (catalog and custom-element list). 9 new unit tests, including a
   decorative spinner inside a loading `HmhaButton` checked with axe
   (392/392 in `hmha-ui`, 24/24 in `sandbox`), `build:lib`/`lint:css`/
   `lint:standalone`/`tokens:contrast` clean. No new tokens.
8. [x] **3c.** Story: Spinner: `spinner.stories.ts` (Playground, Sizes,
   SpecificLabel, Decorative, PageLoader, InLoadingButtonInteraction). The
   interaction uses a local `SavingButtonDemo` (signal-backed), so clicking
   Save really puts `HmhaButton` into `loading` with a decorative spinner
   inside, and the play function confirms the button's accessible name
   stays "Save". Hit the brand-new-component styleUrl error again on the
   first `test-run`. This time only the Storybook MCP client was connected
   (no user browser), so the restart went ahead without asking, per
   `CLAUDE.md`.

   Real-browser check (a throwaway Playwright script, Chromium and
   Firefox): the glyph really rotates (about 90° in 200ms in both), reduced
   motion switches both engines to the pulse, and screenshots show the
   three sizes, a white spinner inside a primary loading button, and a
   large page loader in dark mode. Two script-side mistakes were fixed
   along the way, neither a component issue: a bare `button` selector
   matched Storybook's own hidden preview buttons, and the story's play
   function had already clicked Save by the time the script tried to.

   All 6 Spinner stories plus the full existing suite (172 stories) pass
   `test-run` (incl. a11y).
9. [x] **4a.** Propose Skeleton's foundation. Approved: Option A
   (`[hmhaSkeleton]` on a native span/div, layout stays the consumer's),
   always `aria-hidden` with `aria-busy` on the container, and the gentle
   opacity pulse (the user's pick over a shimmer). Recorded as fork 38.
9b. [x] **4b.** Build Skeleton + tests: `libs/ui/src/lib/skeleton/`
   (`skeleton.ts`, `skeleton.css`, `skeleton.spec.ts`, `README.md`), plus
   the library README's catalog. `lint:css` rejected the first draft's
   `lh`/`em` margin; reworked to `inline-block` rather than worked around
   (fork 38). 8 new unit tests, including the README's own loading-table
   pattern checked with axe (400/400 in `hmha-ui`, 24/24 in `sandbox`),
   `build:lib`/`lint:css`/`lint:standalone`/`tokens:contrast` clean. No
   new tokens.
9c. [x] **4c.** Story: Skeleton: `skeleton.stories.ts` (Playground, Shapes,
   Paragraph, MediaCard, PosterRow, LoadingTableRowsInteraction). The
   interaction uses a local `LibraryTableDemo`: a real `HmhaTable` whose
   `aria-busy` body holds skeleton rows until "Finish loading" swaps in
   real rows and clears the busy state, the README pattern end to end.
   Brand-new-component restart again; the user had Storybook open, so it
   waited for their go-ahead.

   **A real bug the real-browser check caught, not the unit tests or
   axe:** in a dark-mode screenshot, skeletons inside `HmhaCard` were
   invisible. A card sits on `surface-raised`, which in dark mode is the
   same neutral.800 as the `border` fill picked in 4b (1.00:1), a ground
   4b's measurement never included. Re-measured every candidate on page,
   surface and card in both modes. The user chose a 12% tint of the text
   colour (1.27:1 to 1.44:1 everywhere). A new unit test now guards it
   across all three grounds, confirmed to fail on the old fill. Full
   write-up in fork 38. The rest of the Playwright check (Chromium and
   Firefox): the pulse really breathes (opacity sampled from about 0.84
   down to 0.50 and back), reduced motion doubles its duration (1.6s to
   3.2s), and poster rows hold 2:3.

   9 Skeleton unit tests (401/401 in `hmha-ui`, 24/24 in `sandbox`); all
   6 Skeleton stories plus the full existing suite (178 stories) pass
   `test-run` (incl. a11y).
10. [x] **5a.** Propose Avatar's foundation. Approved: Option A
    (`span[hmhaAvatar]`, photo to initials to icon), named by default with
    a `decorative` mode, one neutral colour (no per-person palette yet).
    Recorded as fork 39.
10b. [x] **5b.** Build Avatar + tests: `libs/ui/src/lib/avatar/`
    (`avatar.ts`, `avatar.css`, `avatar.spec.ts`, `README.md`), plus the
    library README's catalog. Colour measured before writing CSS; every
    fixed fill failed somewhere, so it reuses Skeleton's tint (fork 39).
    The canvas colour helpers moved to `core/testing/paint.ts`, shared
    with the Skeleton spec. 20 new unit tests (10 `hmhaInitials` cases, 10
    component; 421/421 in `hmha-ui`, 24/24 in `sandbox`),
    `build:lib`/`lint:css`/`lint:standalone`/`tokens:contrast` clean. No
    new tokens.
10c. [x] **5c.** Story: Avatar: `avatar.stories.ts` (Playground,
    FallbackOrder, Sizes, BrokenPhotoFallsBack, DecorativeBesideName,
    InAButton, MatchesSkeleton). Photos are an inlined SVG data URI, so no
    story touches the network. `BrokenPhotoFallsBack` points `src` at a
    data URI that isn't an image, so the browser fires a genuine load
    `error`, real-browser proof of the fallback the Karma spec can only
    simulate by dispatching the event. Nobody was connected to Storybook
    this time, so the new-component restart went ahead before the first
    `test-run`, saving a round trip.

    Real-browser check (a throwaway Playwright script, Chromium and
    Firefox): both engines fire the real image error and fall back to
    initials; screenshots show the fallback order, the control-height
    sizes plus a 96px profile header with scaled initials, and, in dark
    mode, a circle skeleton and the initials avatar that replaces it at
    the same tint and size, as fork 39 claimed. No bugs found.

    All 7 Avatar stories plus the full existing suite (185 stories) pass
    `test-run` (incl. a11y).
11. [x] **6a.** Propose Badge's foundation. Approved: the Chip/Badge split
    as recommended, `span[hmhaBadge]` with text, count and dot forms, and
    both `subtle` and `solid` appearances (subtle default), after a brief
    "solid only" misreading the user caught before any code was written.
    Recorded as fork 40.
11b. [x] **6b.** Build Badge + tests: `libs/ui/src/lib/badge/` (`badge.ts`,
    `badge.css`, `badge.spec.ts`, `README.md`), plus the library README's
    catalog and a pointer from the Avatar README to the status-dot
    pattern. Three new contrast pairs in `check-contrast.mjs`. 10 new unit
    tests (431/431 in `hmha-ui`, 24/24 in `sandbox`),
    `build:lib`/`lint:css`/`lint:standalone`/`tokens:contrast` clean. No
    new tokens.
11c. [x] **6c.** Story: Badge: `badge.stories.ts` (Playground,
    TonesAndAppearances, Counts, Dots, AvatarStatusDot,
    MarkAllReadInteraction). The interaction's local `NotificationsDemo`
    proves a count reads inside its button's name ("Notifications 12")
    and that zeroing it hides the badge and drops the number from the
    name. The user had Storybook open, so the new-component restart
    waited for their go-ahead.

    **Two real findings from the screenshots, neither visible to unit
    tests or axe:** the README's avatar status-dot pattern drew "CO" (the
    status was in the avatar's `name`), fixed with a new optional
    `HmhaAvatar` `label` input (fork 39 addendum); and counts rendered in
    Raleway's old-style figures, fixed with `lining-nums` (fork 40
    addendum). Both re-screenshotted in Chromium and Firefox after the
    fix; Avatar's 7 stories re-run green too.

    432/432 in `hmha-ui`, 24/24 in `sandbox`; all 6 Badge stories plus the
    full existing suite (191 stories) pass `test-run` (incl. a11y).
12. [x] **7a.** Propose File Upload's foundation. Approved: upload UI only,
    the consumer owns all transport and state, with folder drops,
    thumbnails and paste in scope. Recorded as fork 41.
12b. [x] **7b.** Build File Upload + tests, in three sub-steps:
    - [x] **7b-i.** `HmhaFileDropzone` (`label[hmhaFileDropzone]` around a
      native file input) plus the pure helpers `hmhaFileMatchesAccept`,
      `hmhaCheckFiles` and `hmhaFormatBytes` (`file-checks.ts`,
      `format-bytes.ts`). The input stays in the accessibility tree,
      covering the zone, invisible and click-through, so its focus and
      bounds are the zone's with no visually-hidden pixel tricks. Drag
      handling counts enter/leave depth (no flicker), ignores non-file
      drags, and while mounted stops a file dropped outside the zone from
      navigating the page. Checks also apply to drops, which bypass native
      `accept`. Adds and rejections are announced politely through CDK's
      `LiveAnnouncer`, in English for now. 26 new unit tests: 13 for the
      helpers, 13 for the dropzone, driving real `DataTransfer`s with real
      `File`s through its handlers. Two were confirmed to fail on purpose:
      the flicker test with naive leave handling, and three tests when
      drops skip the checks. 458/458 in `hmha-ui`, 24/24 in `sandbox`,
      `build:lib`/`lint:css`/`lint:standalone`/`tokens:contrast` clean.
      **Follow-up round (Stackfi review):** `'directory'` rejection, the
      window guard's lifetime and manners, the unset pass-through, disabled
      drags, repeat announcements and same-file re-picks, each now pinned by
      a test (fork 41 amendment). Two confirmed to fail on purpose: the
      reset test without `input.value = ''`, and the folder test with
      folders passed through. One test-only mistake fixed (reusing a single
      `FileList` across two picks, which no browser does). 467/467 in
      `hmha-ui`, 24/24 in `sandbox`, all checks clean.
    - [x] **7b-ii.** `HmhaUploadList` + `HmhaUploadItem` (`upload-list.ts`,
      `upload-item.ts`/`.css`/`.spec.ts`), the README's rows section and
      Uppy recipe, one new CI contrast pair (`danger-text` on `surface`).
      16 new unit tests (483/483 in `hmha-ui`, 24/24 in `sandbox`), all
      checks clean. Details in fork 41's "Rows, as built".
    - [x] **7b-iii.** Thumbnails (`preview` on `HmhaUploadItem`) and paste
      (on `HmhaFileDropzone`). Folder traversal moved out: folders are
      rejected with `'directory'` instead (fork 41 amendment). 8 new unit
      tests (491/491 in `hmha-ui`, 24/24 in `sandbox`), all checks clean.
      Details in fork 41's "Thumbnails and paste, as built".
12c. [x] **7c.** Story: File Upload: `file-dropzone.stories.ts` (Playground,
    PickInteraction, ChecksAndRejectionsInteraction, PasteInteraction,
    Disabled, CustomContentAndBrowseButton) and `upload-item.stories.ts`
    (Playground, WholeJourney, LongName, FakeEngineJourneyInteraction). The
    last drives a story-local fake upload engine purely through the
    components' public inputs and outputs: two dropped files upload, one
    fails at 60%, the other transcodes to ready, retry finishes the first,
    and remove clears it. The user had Storybook open, so the restart
    waited for their go-ahead.

    **A test-authoring trap, caught by `test-run`:** Testing Library's
    `fireEvent.drop(el, { dataTransfer })` builds a fresh, empty
    DataTransfer (copying only the passed object's own enumerable
    properties, and a real one has none), so no files arrived. That also
    meant the Disabled story's "nothing added" was passing for the wrong
    reason. Fixed with a story-local `dropFiles()` dispatching a real
    `DragEvent`, as the Karma specs already did.

    **Real-browser check (Playwright, Chromium and Firefox), stated
    precisely:** Tab reaches the hidden input with the focus ring on the
    zone; Space and a real click each open the browser's own file picker
    (`multiple`); files chosen through that picker run the full journey to
    `ready`; and in Chromium, a real Ctrl+V of a PNG written to the real
    clipboard reaches the dropzone and its checks. A drag that starts on
    the desktop can't be automated by any tool (it begins outside the
    browser), so that remains a manual check. The story comment was
    corrected to say exactly that, after first overclaiming.

    **An open issue the dark-mode screenshots found (not caused by File
    Upload, surfaced by it):** on a dark *surface*, the shared track
    (`bg-subtle`, fork 36) and the neutral subtle badge fill are both the
    surface's own colour (1.00:1), so progress tracks and neutral badge
    pills vanish inside upload rows. The text and fills stay readable.
    Measured candidates on all three grounds in both modes: a text-colour
    tint shows everywhere but drops dark fills to about 2:1 against the
    track; a darker shade can't go below the near-black dark page.
    `surface-sunken` (light neutral.100, dark neutral.950) shows on
    surfaces and cards in both modes and keeps every fill at 3.98:1 or
    better, vanishing only on the bare dark page background. **The user
    chose `surface-sunken`** (fork 36 amendment): Slider's and Progress
    Bar's track and the neutral subtle badge moved to it, along with CI's
    pairs, the Progress Bar spec and both READMEs. Re-screenshotted in
    Chromium and Firefox: tracks and neutral pills are back in dark upload
    rows. 491/491 in `hmha-ui`, 24/24 in `sandbox`; the affected Slider,
    Progress Bar, Badge and File Upload stories re-run green.

    All 10 File Upload stories plus the full existing suite (201 stories)
    pass `test-run` (incl. a11y).
13. [x] **8a–c.** Alert:
    - [x] **8a.** Proposal. Approved: `div[hmhaAlert]`, tones `info |
      success | warning | danger`, `announce` defaulting to `'none'`,
      consumer-owned dismissal. Recorded as fork 42.
    - [x] **8b.** Build + tests: `libs/ui/src/lib/alert/` (`alert.ts` with
      `HmhaAlert` + `HmhaAlertTitle`, `alert.css`, `alert.spec.ts`,
      `README.md`), plus the library README's catalog. 11 new unit tests
      (502/502 in `hmha-ui`, 24/24 in `sandbox`), all checks clean. Two
      catches recorded in fork 42.
    - [x] **8c.** Stories: `alert.stories.ts` (Playground, Tones,
      MessageOnly, FormErrorSummary, DismissibleInteraction,
      UploadFailedInteraction). The last proves the announcement for real:
      CDK's live region holds "Error: Upload failed movie.mkv is larger
      than your remaining storage." with `aria-live="assertive"`, then
      Dismiss removes the alert through the demo's own `@if` and focus
      returns to the Upload button. Screenshots (Chromium, Firefox, both
      modes) found two visual issues, fixed above. 502/502 in `hmha-ui`,
      24/24 in `sandbox`; all 207 stories pass `test-run` (incl. a11y).
14. [ ] **9a–c.** Empty State: proposal, build + tests, stories.
15. [ ] **10a–c.** Toggle button (`pressed` on `HmhaButton`): proposal,
    build + tests, stories.
16. [ ] **11a–c.** Textarea (`HmhaInput` on `<textarea>`): proposal, build +
    tests, stories.
17. [ ] **12a–c.** Segmented Control: proposal, build + tests, stories.
18. [ ] **13a–c.** Nav List: proposal, build + tests, stories.
19. [ ] **14.** Wave 6 gate: a real screen in `apps/sandbox` composing every
    component in the wave.
20. [ ] **15.** Release: bump `hmha-ui` to 1.2.0 and `hmha-tokens` to
    1.1.0 (the wave added `track.thickness`), merge, tag.

---

## Open items

- **The blue is a placeholder.** Swap the hue in `tokens/primitive/color.json`
  and every ramp regenerates in place; the structure is the deliverable.
- **Compact's 4px vertical control padding is tight.** If the apps are
  dense-data rather than dense-chrome, consider 32px controls with 8px padding.
- **Amber-500 is the one base fill needing dark foreground text.** A small
  asymmetry you could design away by darkening it.
- **There's no link style.** No link colour role and no link component, so
  links fall back to the browser's default blue. Found through Alert (Wave
  6 step 8c): default blue on a dark-mode tone is close to unreadable.
  Alert's README tells consumers to use `color: inherit`; a real fix is a
  `link` colour role (with a CI pair against every surface it can sit on)
  or a small link directive.
- **High-contrast mode** is a third value on the mode axis, not new machinery.
  The architecture supports it; do the ramp work once real components exist to
  test against.
