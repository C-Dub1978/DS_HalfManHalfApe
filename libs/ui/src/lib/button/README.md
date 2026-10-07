# HmhaButton

```html
<button hmhaButton tone="primary" size="md">Save</button>
```

An attribute directive on the native `<button>` element — you keep native
keyboard behaviour, form submission and `type`.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'primary' \| 'danger' \| 'warning' \| 'success'` | `'neutral'` | Reflected as `data-tone`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; drives `--hmha-control-height*`. |
| `loading` | `boolean` | `false` | Sets `aria-busy` and disables the control. Does not change label content — pair with your own spinner/`aria-live` region if you need one. |
| `disabled` | `boolean` | `false` | Sets the native `disabled` attribute. |

## Component tokens — the override API

Declared on `:host` in `button.css`, consumed in the same file. Set these on
the host (or a variant's attribute selector) to override; do not reach past
them into internal structure.

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-button-bg` | `var(--hmha-color-surface-raised)` | base; re-pointed per `data-tone` |
| `--hmha-button-bg-hover` | `var(--hmha-color-bg-subtle)` | base; re-pointed per `data-tone` |
| `--hmha-button-bg-active` | `var(--hmha-color-bg-subtle)` | base; re-pointed per `data-tone` |
| `--hmha-button-fg` | `var(--hmha-color-text)` | base; re-pointed per `data-tone` |
| `--hmha-button-border` | `var(--hmha-color-border-strong)` | base; re-pointed per `data-tone` |

`danger`, `warning` and `success` have no hover/active token roles of their
own yet (see `tokens/semantic/color.*.json`), so their hover/active state
currently pins to the tone's base fill rather than shifting shade. Add
`*-hover`/`*-active` semantic roles first if that changes.

## Composing icons

`HmhaIcon` drops into the default content slot — the host is already
`inline-flex` with `gap: var(--hmha-control-gap)`, so no extra markup or CSS
is needed:

```html
<button hmhaButton tone="primary" size="sm">
  <hmha-icon name="check" size="sm" />
  Save
</button>
```

Match the icon's `size` to the button's `size` (`sm`/`sm`, `md`/`md`,
`lg`/`lg`) for visual balance — there is no automatic coupling between them.

## HmhaIconButton — icon-only, leading-icon and trailing-icon buttons

```html
<!-- iconPosition="only" (the default) — icon, no visible text -->
<button hmhaButton hmhaIconButton label="More options" tone="neutral">
  <hmha-icon name="more-vertical" />
</button>

<!-- iconPosition="leading" — icon, then text -->
<button hmhaButton hmhaIconButton iconPosition="leading" tone="primary">
  <hmha-icon name="check" size="sm" />
  Save
</button>

<!-- iconPosition="trailing" — text, then icon -->
<button hmhaButton hmhaIconButton iconPosition="trailing" tone="neutral">
  Next
  <hmha-icon name="chevron-right" size="sm" />
</button>
```

`hmhaIconButton` is a second attribute directive that stacks on `hmhaButton`
on the same native `<button>` — it carries no styles of its own, and no
template of its own either, so it has no way to reorder projected content.
For `leading`/`trailing`, the icon/text order is entirely your own content
order — write `<hmha-icon/>` before or after your text and that's the order
rendered.

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `iconPosition` | `'only' \| 'leading' \| 'trailing'` | `'only'` | `'only'` sets `data-icon-only` (square sizing, no change needed for `leading`/`trailing` — `hmhaButton`'s own `gap` already spaces icon and text). |
| `label` | `string` | — | Required in substance when `iconPosition` is `'only'` — **throws** if missing, rather than shipping a button with no accessible name. Optional for `leading`/`trailing`; if given there, it overrides the visible text as the accessible name, so only pass it when you deliberately want that (the common case is to leave it unset and let the visible text name the button). |

`HmhaIcon`'s SVG is unconditionally `aria-hidden`, which is why `'only'`
needs `label` at all, and why passing one for `leading`/`trailing` is an
override rather than harmless — see `DECISIONS.md` fork 23 for the WCAG
reasoning (Label in Name).

`tone`, `size`, `loading` and `disabled` all still come from `hmhaButton`.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
