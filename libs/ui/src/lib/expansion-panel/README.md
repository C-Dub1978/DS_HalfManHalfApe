# HmhaExpansionPanel

```html
<details hmhaExpansionPanel [(expanded)]="faqOpen">
  <summary hmhaExpansionPanelTrigger>What's included?</summary>
  <div hmhaExpansionPanelContent>Everything in the Starter plan, plus priority support.</div>
</details>
```

Built on the native `<details>`/`<summary>` elements — expanded/collapsed
state, keyboard operability (Enter/Space on the trigger) and a real
`toggle` event all come for free, no ARIA needed. The same "use the
native element" call as `HmhaDialog` (`DECISIONS.md` fork 14).

## Pieces

| Piece | Selector | Notes |
| --- | --- | --- |
| `HmhaExpansionPanel` | `details[hmhaExpansionPanel]` | `expanded` (model, two-way bindable) syncs with the native `open` property in both directions. |
| `HmhaExpansionPanelTrigger` | `summary[hmhaExpansionPanelTrigger]` | Renders a chevron itself (not projected — every trigger needs one, unlike `HmhaButton`'s optional icon slot), rotated when its parent panel is expanded. |
| `HmhaExpansionPanelContent` | `div[hmhaExpansionPanelContent]` | Token-driven padding/typography for the collapsible body. Not required — `<details>` doesn't need a wrapper for its body content at all, this just saves you re-styling it yourself every time. |

## Accordion grouping — entirely native, no JS

```html
<div hmhaAccordion>
  <details hmhaExpansionPanel name="faq">
    <summary hmhaExpansionPanelTrigger>Question A</summary>
    <div hmhaExpansionPanelContent>Answer A</div>
  </details>
  <details hmhaExpansionPanel name="faq">
    <summary hmhaExpansionPanelTrigger>Question B</summary>
    <div hmhaExpansionPanelContent>Answer B</div>
  </details>
</div>
```

**Exclusive (single-open) vs. independent (multi-open) behavior is
entirely native** — give sibling panels a shared `name` attribute for
single-open (opening one closes the others, the same mechanism radio
buttons use), or leave `name` off for independent panels. There's no
input for this on `HmhaExpansionPanel` — `name` is a plain HTML attribute
with nothing Angular-specific to wrap. Confirmed to actually work,
including when `open` is set programmatically and not just via a real
click, by a direct browser check before relying on it (`DECISIONS.md`
fork 25) — this isn't a well-known enough feature to take on faith.

`HmhaAccordion` (`div[hmhaAccordion]`) itself is purely visual: one outer
border and radius around the stacked group instead of each panel's own.
It has no way to reach into its projected panels' own styles — Angular's
emulated encapsulation has no real Shadow DOM, so there's no `::slotted`,
and `:host-context` is blocked by this project's own stylelint config for
reaching outside a component's encapsulation boundary the same way
`::ng-deep` is (fork 05). Each panel's own border-suppression-when-grouped
CSS lives in `HmhaExpansionPanel` instead, which knows it's inside a group
by injecting `HmhaAccordion` directly (optional injection — no separate
token needed, since neither file imports the other back).

## Component tokens — the override API

| Token | Default | Declared by |
| --- | --- | --- |
| `--hmha-expansion-panel-bg` | `var(--hmha-color-surface)` | `HmhaExpansionPanel` |
| `--hmha-expansion-panel-border` | `var(--hmha-color-border)` | `HmhaExpansionPanel` |

## A real Karma-launcher gap, not a component bug

**Karma's `ChromeHeadlessNoSandbox` launcher doesn't fire `<details>`'s
native `toggle` event from a synthetic `summary.click()`** — confirmed
with a direct listener: the native `open` property itself flips
correctly (real, launcher-independent browser behavior), but `toggle`
never fires. Same class of gap as `<dialog>`'s own `close` event (fork
14). If you're testing a consumer of this component, test your own
reaction to the event by dispatching it directly
(`detailsEl.dispatchEvent(new Event('toggle'))` after setting `.open`
yourself) rather than relying on a synthetic click's own internal firing
— save the real end-to-end proof for a real-browser check (Storybook's
`test-run`, or driving the sandbox), not the Karma unit suite.

## Unsupported

`::ng-deep`, `:host-context`, selectors targeting internal DOM, or
overriding by specificity — per the encapsulation contract in
`DECISIONS.md` fork 05. Set a component token instead.
