# HmhaSkeleton

```html
<!-- Loading table rows: the real table, placeholder cells -->
<tbody [attr.aria-busy]="loading() || null">
  @if (loading()) {
    @for (_ of [1, 2, 3, 4]; track $index) {
      <tr hmhaTableRow>
        <td hmhaTableCell><span hmhaSkeleton shape="circle"></span></td>
        <td hmhaTableCell><span hmhaSkeleton width="60%"></span></td>
        <td hmhaTableCell><span hmhaSkeleton width="30%"></span></td>
      </tr>
    }
  } @else {
    <!-- real rows -->
  }
</tbody>

<!-- A loading catalog row: your poster grid, placeholder posters -->
<div class="poster-row" [attr.aria-busy]="loading() || null">
  @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
    <div hmhaSkeleton shape="rect" style="aspect-ratio: 2 / 3"></div>
  }
</div>
```

A placeholder block on a plain `<span>` or `<div>`. One block is one
shape, and you lay blocks out with the same markup the real content will
use, so a skeleton row can't drift out of step with the row it stands in
for. See `DECISIONS.md` fork 38.

## Accessibility: mark the container busy

Every skeleton block is `aria-hidden`: a placeholder has nothing to read.
**The container being loaded has to say it's busy**, with one binding:

```html
<section [attr.aria-busy]="loading() || null">
```

Without it, a screen-reader user meets an empty or half-built region with
no explanation. Remove it (`null`) when the content arrives. For a long
wait, or one the user is waiting on, also announce it in words through a
polite live region ("Loading your library"). Only the page knows when
that's worth saying, so it isn't built in.

## Shapes

| `shape` | Default size | For |
| --- | --- | --- |
| `text` (default) | Full width, one em tall | A line of text. Each sits in its own line box, so a stack of them keeps the vertical rhythm of real text with no spacing to tune. |
| `circle` | A control's height, always square | An avatar. |
| `rect` | Full width, 16:9 | A thumbnail, poster or card. Set `height`, or your own `aspect-ratio` (posters are 2:3), to change it. |

For a paragraph, repeat `text` blocks and shorten the last one:
`<span hmhaSkeleton width="60%">`.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `shape` | `'text' \| 'circle' \| 'rect'` | `'text'` | Reflected as `data-shape`. |
| `width` | `string \| null` | `null` | Any CSS length, applied as `inline-size`. |
| `height` | `string \| null` | `null` | Any CSS length, applied as `block-size`. Wins over a `rect`'s 16:9. |

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-skeleton-bg` | `color-mix(in oklch, var(--hmha-color-text) 12%, transparent)` | A light tint of the text colour, so it shows on the page, a surface and a card in both modes (1.27–1.44:1), and on any surface you add. A fixed grey can't: `border` matches a card exactly in dark mode. |
| `--hmha-skeleton-radius` | `var(--hmha-radius-control)` | `circle` re-points it to the pill radius, `rect` to the surface radius. |
| `--hmha-skeleton-duration` | `calc(var(--hmha-duration-base) * 8)` | One pulse. |

## Motion

A gentle opacity pulse. It's a fade, not movement, so under
`prefers-reduced-motion: reduce` it keeps pulsing, at half the speed.

## Not in scope

Built-in row or card presets (your layout is the preset), a `lines`
input (repeat `text` blocks), and a fade-in of the real content when it
arrives (your template swaps the two).

## Unsupported

`::ng-deep`, or overriding by specificity, per the encapsulation contract
in `DECISIONS.md` fork 05. Set a component token instead.
