# HmhaNavList / HmhaNavItem / HmhaNavGroup

```html
<nav aria-label="Main">
  <ul hmhaNavList>
    <li>
      <a hmhaNavItem routerLink="/home" routerLinkActive ariaCurrentWhenActive="page">
        <hmha-icon name="home" /> Home
      </a>
    </li>
    <li hmhaNavGroup [(expanded)]="artistsOpen">
      <a hmhaNavItem routerLink="/artists" routerLinkActive ariaCurrentWhenActive="page">Artists</a>
      <ul hmhaNavList>
        <li><a hmhaNavItem routerLink="/artists/radiohead" …>Radiohead</a></li>
      </ul>
    </li>
    <li>
      <a hmhaNavItem routerLink="/uploads" routerLinkActive ariaCurrentWhenActive="page">
        <hmha-icon name="upload" /> Uploads <span hmhaBadge hmhaNavItemEnd>3</span>
      </a>
    </li>
  </ul>
</nav>
```

A vertical list of navigation links for a side nav, with the current
page marked and groups that open and close. The app shell around it (top
bar, a side panel that collapses) is yours. See `DECISIONS.md` fork 49.

- **`ul[hmhaNavList]`**: the list. No bullets, items stacked. A list nested
  inside an item indents one step per level.
- **`a[hmhaNavItem]`**: one link, and a real one: middle-click, open in a
  new tab and the browser's own link announcement all work.
- **`li[hmhaNavGroup]`**: an item whose nested list opens and closes.

**You supply the `<nav>` and its `aria-label`.** The landmark is your
shell's, and a page can have several (`"Main"`, `"Account"`), each named.

## The current page

The look keys off `aria-current`, so there's no `@angular/router`
dependency:

- **With the router:** `routerLinkActive ariaCurrentWhenActive="page"` sets
  `aria-current="page"` on the active link.
- **Without it:** set `aria-current="page"` yourself.
- **A section whose child page is open** can take `aria-current="true"` and
  gets the same look. Any value but `"false"` counts.

The current link gets an `action-subtle` fill, `action` text and a bar on
its leading edge (the right edge in right-to-left layout). The fill and
the bar both change, so it isn't told by hue alone, and screen readers
announce "current page".

## Items

```html
<a hmhaNavItem href="/uploads">
  <hmha-icon name="upload" />                 <!-- first -->
  Uploads                                      <!-- fills the row -->
  <span hmhaBadge hmhaNavItemEnd>3</span>      <!-- at the end -->
</a>
```

An `<hmha-icon>` placed directly inside goes first, the text fills the
row, and anything marked `hmhaNavItemEnd` sits at the end. Items fill the
list's width at control height, so density applies. Long text wraps
rather than being cut off. A count in the end slot is part of the link's
name ("Uploads 3"), so give it words if a bare number would confuse
("3 in progress").

**No disabled items.** A link can't truly be disabled, and a dead entry
in a nav is a pattern to avoid. Leave the item out instead.

## Groups

```html
<li hmhaNavGroup [(expanded)]="radioheadOpen">
  <a hmhaNavItem routerLink="/artists/radiohead" …>Radiohead</a>
  <ul hmhaNavList>
    <li><a hmhaNavItem routerLink="/albums/ok-computer" …>OK Computer</a></li>
  </ul>
</li>
```

The group renders a button after its link, with `aria-expanded` and
`aria-controls` pointing at the nested list, and a chevron that turns.

- **The link navigates; only the button opens and closes.** This is
  WAI-ARIA's disclosure navigation pattern, so going to "Radiohead" and
  showing its albums are two separate choices.
- **The button is named by its link** (`aria-labelledby`), so it's
  announced as "Radiohead, button, collapsed" with nothing extra to write.
  It keeps an `id` you set on the link, or gives the link one.
- **You own `expanded`**: `[(expanded)]`, or a one-way `[expanded]`. A
  common pattern is opening the group that holds the current page, which
  you know from your router.
- **A collapsed list is `hidden`**: out of view, out of the Tab order and
  the accessibility tree, but still in the DOM.
- **Any depth.** A group controls only the list directly inside it; a
  nested group controls its own.

**What belongs in a nav.** Artist → album fits well. Songs usually don't:
they're things you play or select rather than pages you go to, and a long
album makes the nav very long. They usually belong in the page content (a
table or list), with the nav stopping at the album.

## Keyboard

One Tab stop per link, and per group button. No arrow keys and no
`role="menu"`: a nav is a list of links, not a menu, which is what screen
reader users expect from WAI-ARIA's guidance. Every link and button has
the focus ring.

## A collapsed icon-only rail

Not built in (fork 49): the Nav List keeps one shape. When your side nav
collapses to icons, render icon-only links named with `aria-label`, with a
tooltip for sighted users, and keep `aria-current`:

```html
<a hmhaNavItem routerLink="/home" routerLinkActive ariaCurrentWhenActive="page"
   aria-label="Home" hmhaTooltip="Home">
  <hmha-icon name="home" />
</a>
```

## Component tokens — the override API

On the list:

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-nav-list-gap` | `calc(var(--hmha-control-padding-y) / 2)` | Between items. Follows density. |
| `--hmha-nav-list-indent` | `calc(var(--hmha-icon-md) + var(--hmha-control-gap))` | Each nested level steps in by this: one icon and its gap, so a child's text lines up under an iconned parent's text. |

On each item:

| Token | Default | Current page |
| --- | --- | --- |
| `--hmha-nav-item-bg` | `transparent` | `var(--hmha-color-action-subtle)` |
| `--hmha-nav-item-bg-hover` | `var(--hmha-color-bg-subtle)` | `var(--hmha-color-action-subtle)` |
| `--hmha-nav-item-fg` | `var(--hmha-color-text)` | `var(--hmha-color-action)` |
| `--hmha-nav-item-indicator` | `transparent` | `var(--hmha-color-action)` |
| `--hmha-nav-item-indicator-width` | `calc(var(--hmha-border-width) * 3)` | The bar's thickness. |

On a group:

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-nav-group-toggle-size` | `var(--hmha-control-height)` | The expand button, square. |

## Not in scope

A collapsed rail (above), a horizontal top-bar nav, and section headings
inside a list: use separate labelled `<nav>`s, or your own heading above
each list.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity, per the encapsulation contract in `DECISIONS.md` fork 05.
Set a component token instead.
