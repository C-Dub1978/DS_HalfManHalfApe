# HmhaStepper

```html
<div hmhaStepper [(value)]="currentStep">
  <div hmhaStepList>
    <button hmhaStep value="account">Account</button>
    <button hmhaStep value="shipping" [hasError]="shippingInvalid">Shipping</button>
    <button hmhaStep value="payment">Payment</button>
  </div>

  <div hmhaStepPanel value="account">…</div>
  <div hmhaStepPanel value="shipping">…</div>
  <div hmhaStepPanel value="payment">…</div>
</div>
```

Four pieces, the same DI shape as `HmhaTabs`/`HmhaTabList`/`HmhaTab`/
`HmhaTabPanel` (`DECISIONS.md` fork 18), adapted for linear, ordered
progress instead of free switching:

- **`HmhaStepper`** (`div[hmhaStepper]`) — owns `value` (`model.required`)
  and provides it via `HMHA_STEPPER`.
- **`HmhaStepList`** (`div[hmhaStepList]`, `role="list"`) — reads its own
  `contentChildren(HmhaStep)` and provides their `value`s, in DOM order,
  via `HMHA_STEP_LIST` — a separate context file (`step-list-context.ts`)
  so `HmhaStepList` can import `HmhaStep` for `contentChildren` without a
  circular import, the same reasoning as Chip's `chip-set-context.ts` and
  Menu's `menu-context.ts`.
- **`HmhaStep`** (`button[hmhaStep]`) — injects both contexts to compute
  its own position relative to the current step.
- **`HmhaStepPanel`** (`div[hmhaStepPanel]`) — injects `HMHA_STEPPER` only,
  shows/hides via `[hidden]`, exactly like `HmhaTabPanel`.

## Progression is linear, and the consumer owns it

`HmhaStepper.select()` does **not** enforce "can't skip ahead" — it just
sets `value`. Only `HmhaStep`'s own click handler enforces reachability,
because a consumer's own Next/Back buttons (calling `stepper.select()` or
setting the bound `value` directly) need free control over navigation —
the same "consumer owns progression" principle as `DECISIONS.md` fork 21.

## HmhaStep — completed / active / upcoming

| State | When | Indicator |
| --- | --- | --- |
| `completed` | step's index < current step's index | check icon |
| `active` | step's index === current step's index | its 1-based number |
| `upcoming` | step's index > current step's index | its 1-based number, natively `disabled` |

Reflected as `data-state`, plus `aria-current="step"` on the active step
(there's no official WAI-ARIA "stepper" pattern the way there is for Tabs
or Disclosure, so `aria-current="step"` — the token the spec itself
suggests for step indicators — is the closest fit).

`hasError` is a separate, consumer-set input, independent of `state` — a
`completed` step can still have an error found on a later revalidation.
Reflected as `data-error` and renders a `triangle-alert` icon in place of
the check/number, regardless of state.

An explicit `disabled` input always wins, even on an otherwise-reachable
(`completed`/`active`) step.

No roving-tabindex/`FocusKeyManager` here — deliberately simpler than
`HmhaChipSet`/`HmhaTabList`. Each step is its own independent tab stop;
linear progression means there's no "move focus freely between all of
them" interaction to manage.

## Inputs

| Component | Input | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `HmhaStep` | `value` | `string` (required) | — | Matches a `HmhaStepPanel`'s own `value`. |
| `HmhaStep` | `hasError` | `boolean` | `false` | Independent of `state`; see above. |
| `HmhaStep` | `disabled` | `boolean` | `false` | Wins over reachability. |
| `HmhaStepPanel` | `value` | `string` (required) | — | Matches a `HmhaStep`'s own `value`. |
| `HmhaStepper` | `value` | `string` (required model) | — | Two-way bindable (`[(value)]`). |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity — per the encapsulation contract in `DECISIONS.md` fork 05.
Set a component token instead.
