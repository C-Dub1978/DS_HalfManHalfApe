# HmhaTabs

```html
<div hmhaTabs [(value)]="activeTab">
  <div hmhaTabList>
    <button hmhaTab value="general">General</button>
    <button hmhaTab value="billing">Billing</button>
    <button hmhaTab value="danger" disabled>Danger zone</button>
  </div>
  <div hmhaTabPanel value="general">General settings…</div>
  <div hmhaTabPanel value="billing">Billing settings…</div>
  <div hmhaTabPanel value="danger">Danger zone…</div>
</div>
```

Four pieces, each an attribute directive on a native element — no custom
tag names, applying the same native-element-preference CLAUDE.md uses
throughout to each of Tabs' individual sub-pieces (a `<div>` for the
non-interactive containers, a real `<button>` for the interactive tab):

- **`HmhaTabs`** (`div[hmhaTabs]`) owns the selection state — `value` is a
  required, two-way-bindable `model<string>()`. There's no sensible
  universal default "first" tab, so the consumer must say which one starts
  active.
- **`HmhaTabList`** (`div[hmhaTabList]`) — `role="tablist"`. Owns a CDK
  `FocusKeyManager` for Left/Right arrow navigation (wrapping) and
  Home/End. Uses **automatic activation**: moving focus with the arrow
  keys also selects the tab landed on, not just focuses it — WAI-ARIA's
  recommended model when panels are cheap to show.
- **`HmhaTab`** (`button[hmhaTab]`) — `role="tab"`, real native keyboard
  activation (Enter/Space) and click for free, roving `tabindex` (only the
  selected tab is in the Tab order). A real `disabled` button is skipped
  by keyboard navigation for free.
- **`HmhaTabPanel`** (`div[hmhaTabPanel]`) — `role="tabpanel"`, hidden via
  the native `hidden` attribute (not a CSS class) unless its `value`
  matches the selection.

## Matching tabs to panels

A tab and its panel share a plain string `value` — not DOM position, so
panels don't need to be interleaved with their tabs and can live anywhere
inside the same `<div hmhaTabs>`. `aria-controls`/`aria-labelledby` and
each piece's `id` are generated deterministically from that value, namespaced
per `<div hmhaTabs>` instance (via `_IdGenerator`) so two tab groups on the
same page never collide — but **values must be unique within one `<div
hmhaTabs>`**.

## Inputs

| Component | Input | Type | Notes |
| --- | --- | --- | --- |
| `HmhaTabs` | `value` | `string` (required, two-way) | The selected tab's value. |
| `HmhaTab` | `value` | `string` (required) | Matched against the root's `value` and the sibling panel's `value`. |
| `HmhaTab` | `disabled` | `boolean` | A real `disabled` attribute. |
| `HmhaTabPanel` | `value` | `string` (required) | Matched against the root's `value`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-tab-fg` | `var(--hmha-color-text-muted)` | `HmhaTab`, unselected |
| `--hmha-tab-fg-selected` | `var(--hmha-color-text)` | `HmhaTab`, selected |
| `--hmha-tab-border-selected` | `var(--hmha-color-action)` | `HmhaTab`, selected |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
