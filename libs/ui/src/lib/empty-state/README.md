# HmhaEmptyState

```html
<!-- A whole section with nothing in it yet -->
<div hmhaEmptyState icon="upload">
  <h2 hmhaEmptyStateTitle>Your library is empty</h2>
  Upload a movie, show or album to start building it.
  <button hmhaButton tone="primary" hmhaEmptyStateActions (click)="openUpload()">Upload something</button>
</div>

<!-- In place of a table's rows, appearing after a search -->
<td hmhaTableCell colspan="3">
  <div hmhaEmptyState size="sm" icon="search" announce="polite">
    <h3 hmhaEmptyStateTitle>No results for “{{ query() }}”</h3>
    Try a different spelling, or search your library instead.
  </div>
</td>
```

What a space shows when it has nothing in it: an icon, a heading, a short
explanation and, usually, one action. On a native `<div>`, centred, and
usable anywhere: a page, a card, or a table cell spanning every column
where the rows would be. See `DECISIONS.md` fork 43.

**Empty State or Alert?** An alert tells someone something happened
("Upload failed"). An empty state fills a space that has nothing in it
("No search results"). If loading failed, that's an alert, not an empty
state: "your library is empty" would be untrue.

## Content

- **`hmhaEmptyStateTitle`** on the element your page needs, usually a real
  heading at the next level (`<h2>`, `<h3>`). An empty state stands in for
  a whole section, and screen-reader users navigate by headings. It takes
  the heading face at a size set by the empty state, whatever element it's
  on.
- **Everything else you put inside** is the explanation.
- **`hmhaEmptyStateActions`** on one or two buttons or links, centred
  underneath. With none, there's no empty row.
- **`icon`**: any icon name, shown large above the heading and hidden from
  assistive tech, since the heading already says what it means.

## Accessibility

- **The heading carries the meaning**, so someone moving between headings
  finds "Your library is empty" exactly where the content would be.
- **`announce`:** `'none'` (the default) for an empty state that's simply
  there on load. `'polite'` for one that appears in response to something,
  such as "No search results" after typing, so it's heard without
  someone having to go looking. The heading and text (without the action
  labels) are announced once they've stayed unchanged for half a second,
  and again whenever they change and settle. An empty state that appears
  while someone types stays on screen as the query changes, so typing
  "zzz" is announced once, as "No results for "zzz"", not three times and
  not stuck on "z". There's no `'assertive'`: an empty result is never
  urgent.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `icon` | `HmhaIconName \| null` | `null` | Decorative. |
| `size` | `'sm' \| 'md'` | `'md'` | `md` for a page or panel section; `sm` in a table or small card (smaller icon, heading, text and spacing). |
| `announce` | `'none' \| 'polite'` | `'none'` | See above. |

## Component tokens — the override API

| Token | Default (`md`) | Notes |
| --- | --- | --- |
| `--hmha-empty-state-icon-size` | `calc(var(--hmha-icon-lg) * 2)` | `var(--hmha-icon-lg)` at `sm`. |
| `--hmha-empty-state-icon-color` | `var(--hmha-color-text-subtle)` | Decorative, so its 3:1 is enough. |
| `--hmha-empty-state-padding` | `calc(var(--hmha-space-stack) * 2)` | `var(--hmha-space-stack)` at `sm`. |
| `--hmha-empty-state-title-size` | `var(--hmha-type-heading-sm-size)` | Read by the title; `label-md` at `sm`. |

The explanation is `text-muted`, the heading the normal text colour, both
CI-checked against the surface.

## Not in scope

Illustrations (the system has icons, not illustration art), and a
built-in "clear search" or "retry": put your own in the actions slot.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity, per the encapsulation contract in `DECISIONS.md` fork 05.
Set a component token instead.
