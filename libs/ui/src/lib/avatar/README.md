# HmhaAvatar

```html
<!-- On its own: announced as an image named "Chris Wilson" -->
<span hmhaAvatar name="Chris Wilson" [src]="user.photoUrl"></span>

<!-- Beside the visible name: decorative, so the name isn't read twice -->
<span class="comment-author">
  <span hmhaAvatar decorative size="sm" [name]="author.name" [src]="author.photoUrl"></span>
  {{ author.name }}
</span>

<!-- Clickable: put it in a button, which takes its name from the avatar -->
<button type="button" (click)="openProfileMenu()">
  <span hmhaAvatar [name]="me().name" [src]="me().photoUrl"></span>
</button>
```

A person's picture, on a native `<span>`. It shows the first of these that
works:

1. **The photo** (`src`). If it fails to load (a 404, an expired signed
   URL), the avatar falls back on its own. A new `src` gets a fresh try.
2. **Initials** from `name`: the first letter of the first and last words.
   "Chris Wilson" gives "CW" and "Madonna" gives "M". Letters are read as
   whole characters, so accented and non-Latin names work. The same logic
   is exported as `hmhaInitials(name)`.
3. **The `user` icon**, when there's no usable name either.

It's a `<span>`, not an `<img>`, because an `<img>` can't contain the
initials or icon fallback. See `DECISIONS.md` fork 39.

## Accessibility

- **Default:** `role="img"`, named by `label` if set, otherwise `name`,
  otherwise "User". Use `label` to say more than the name (a status)
  without that text turning into an initial. The inner `<img>` always has `alt=""`, so a photo, initials and
  the icon all read the same.
- **`decorative`:** no role, no name, `aria-hidden`. Use it when the
  person's name is visible right beside the avatar (a list row, a comment
  header), so it isn't read twice.

## Colour

Every initials avatar uses one calm colour: the text colour at 12% as the
background (the same tint as `HmhaSkeleton`, so a circle skeleton and a
real avatar look alike), with `text-muted` initials. A unit test checks
that the circle stays visible and the initials clear 4.5:1 on the page, a
surface and a card, in both modes. A different colour per person isn't
built: it would need a new palette of text-safe colours, and can be
added later without changing this API.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string \| null` | `null` | The accessible name, and the source of the initials. |
| `label` | `string \| null` | `null` | Overrides the accessible name; initials still come from `name`. For saying more than the name, such as "Chris Wilson, online". |
| `src` | `string \| null` | `null` | A photo URL. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The control heights, 32, 40 and 48px, so it lines up with a button beside it and shrinks with compact density. |
| `decorative` | `boolean` | `false` | Hides it from assistive tech. |

`data-content` on the host reports what's showing: `image`, `initials` or
`icon`.

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-avatar-size` | `var(--hmha-control-height)` | Re-pointed per `data-size`. Any length works, such as a large profile header. |
| `--hmha-avatar-bg` | `color-mix(in oklch, var(--hmha-color-text) 12%, transparent)` | Behind initials and the icon. |
| `--hmha-avatar-fg` | `var(--hmha-color-text-muted)` | The initials and icon colour. |

The initials scale with the avatar (40% of its size), so they fit at any
size.

## Not in scope

Overlapping avatar groups ("+3") and cropping or uploading photos. For
an online/status dot, pin an `HmhaBadge` dot to the corner: see
`badge/README.md`.

## Unsupported

`::ng-deep`, selectors targeting internal DOM (the `img`, initials or
icon inside), or overriding by specificity, per the encapsulation contract
in `DECISIONS.md` fork 05. Set a component token instead.
