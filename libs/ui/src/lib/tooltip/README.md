# HmhaTooltip

```html
<button type="button" [hmhaTooltip]="'Saved to drafts'">
  <hmha-icon name="save" />
</button>
```

An attribute directive — `[hmhaTooltip]` applies to any element, no markup
of its own required beyond the input. It shows a small floating bubble on
hover (`mouseenter`) or keyboard focus, and hides it on `mouseleave`,
`blur`, or Escape — even though, per the WAI-ARIA tooltip pattern, focus
never actually leaves the triggering element to go anywhere near the
bubble.

## Two separate mechanisms, on purpose

The directive does **not** point `aria-describedby` at the visible bubble.
Instead it uses `@angular/cdk/a11y`'s `AriaDescriber`, which maintains a
hidden, always-present text node referenced via `aria-describedby`,
independent of whether the visible bubble is currently mounted. This is the
same approach Angular Material's own tooltip uses, and for the same reason:
a floating element that mounts and unmounts on every hover is an unreliable
thing to point a persistent ARIA reference at directly, and some assistive
tech doesn't reliably announce content that lives inside a portal.

So:
- **`AriaDescriber`** — the real accessible description. Present from the
  moment the directive is created, regardless of hover state.
- **The visible bubble** (`hmhaOverlay`-positioned, `role="tooltip"`) —
  purely a sighted-user visual aid. It's never the thing a screen reader is
  told to read via `aria-describedby`.

## Inputs

| Input | Type | Notes |
| --- | --- | --- |
| `hmhaTooltip` | `string` (required) | The message. Reactive — changing it re-describes the host and updates the next time the bubble opens. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-tooltip-bg` | `var(--hmha-color-surface-raised)` | the bubble |
| `--hmha-tooltip-fg` | `var(--hmha-color-text)` | the bubble |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
