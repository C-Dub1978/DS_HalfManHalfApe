# HmhaCard

```html
<hmha-card elevated="true">
  <span hmhaCardHeader>Plan usage</span>
  <p>3 of 5 seats filled.</p>
  <span hmhaCardFooter>Updated 2 minutes ago</span>
</hmha-card>
```

A custom element — no native element fits a generic content surface. Content
projects into three slots: an optional header (`hmhaCardHeader`), the default
body, and an optional footer (`hmhaCardFooter`). An unused header or footer
collapses to nothing rather than leaving empty padded space.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `elevated` | `boolean` | `false` | Sets `data-elevated`. Swaps the flat border for `--hmha-elevation-raised` and drops the border. |

## Component tokens — the override API

Declared on `:host` in `card.css`, consumed in the same file.

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-card-bg` | `var(--hmha-color-surface-raised)` | base |
| `--hmha-card-border` | `var(--hmha-color-border)` | base; cleared when `elevated` |
| `--hmha-card-fg` | `var(--hmha-color-text)` | base |
| `--hmha-card-shadow` | `none` | base; re-pointed to `var(--hmha-elevation-raised)` when `elevated` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
