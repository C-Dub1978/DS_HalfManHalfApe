# Decisions of record

Six architectural forks, decided. Each entry gives the decision, the rejected
alternatives, and the reasoning — so a later contributor can tell a settled
decision from an accident.

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

**Still to decide:** the npm scope and package names — check availability before
they are written into fifty files — and the license (MIT unless there is a reason
not to). `CLAUDE.md` carries the publishing mechanics.

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
