# HmhaBadge

```html
<!-- Status -->
<span hmhaBadge tone="warning">Processing</span>
<span hmhaBadge tone="danger" appearance="solid">Failed</span>

<!-- A count: 150 reads "99+", 0 hides the badge -->
<button hmhaButton>
  Notifications <span hmhaBadge tone="danger" appearance="solid" [count]="unread()"></span>
</button>

<!-- A dot -->
<span hmhaBadge dot tone="success"></span>
```

A small, never-interactive label the app uses to tell someone something:
a status ("New", "Processing", "Failed") or a count. It sits on a native
`<span>`. See `DECISIONS.md` fork 40.

## Badge or Chip?

**If someone can click it or chose it, it's a Chip; if the app is telling
them something, it's a Badge.** A genre tag on a title is an `HmhaChip`;
"Processing" on an upload is a Badge.

| | `HmhaChip` | `HmhaBadge` |
| --- | --- | --- |
| For | Tags people act on: genres, filters, removable tags | Status and counts the system reports |
| Interactive | Can be (a `<button>`, selectable) | Never |
| Colour | Neutral | Five tones, subtle or solid |
| Size | Control-sized, tappable | Small, inline with text |

## Look

`tone` is the library's `HmhaTone`: `neutral`, `primary`, `success`,
`warning`, `danger`. `appearance` is `subtle` (the default, a tinted fill
with dark text) or `solid` (a strong fill with light text, as for a
notification count). Every one of the ten pairings is a 4.5:1 text pair
checked in both modes by `npm run tokens:contrast`, and a unit test checks
what's actually painted.

A badge uses the small label type role (`label-sm`), and is as tall as an
inline icon, so it lines up with one in the same row.

## Three forms

- **Text (default):** the badge shows what you put inside it.
- **Count:** `[count]` shows a number instead. Above `max` (default 99) it
  reads "99+". A count of 0 hides the badge, unless `showZero` is set.
- **Dot:** `dot` draws a small circle with no text, always in the tone's
  strong colour (a subtle tint wouldn't show at that size).

## Accessibility

- **Text badges are plain text,** read where they sit: "Big Buck Bunny,
  Processing". They're deliberately not live regions: a list of badges
  each announcing itself would be noise. If a change matters (an upload
  finishing), announce it once through your own polite live region.
- **Counts read as text,** so the surrounding name gives them context:
  the button above reads "Notifications 12". "99+" reads as "99 plus".
- **A dot is hidden from assistive tech,** because colour alone can't
  carry meaning (WCAG 1.4.1). Whatever the dot says ("online", "unread")
  must also be available as text, such as the avatar's name or a label.
- **Tone is a cue, never the message.** A red badge still says "Failed".

## A status dot on an avatar

Pin a dot to an `HmhaAvatar`'s corner with your own wrapper; the ring in
the surface colour separates it from the photo:

```html
<span class="avatar-with-status">
  <span hmhaAvatar name="Chris Wilson" label="Chris Wilson, online" [src]="photoUrl"></span>
  <span hmhaBadge dot tone="success"></span>
</span>
```

```css
.avatar-with-status {
  position: relative;
  display: inline-flex;
}
.avatar-with-status [hmhaBadge] {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  outline: calc(var(--hmha-border-width) * 2) solid var(--hmha-color-surface);
}
```

The dot is hidden, so the avatar's `label` carries the status: "Chris
Wilson, online". Use `label`, not `name`, for that: initials come from
`name`, so "Chris Wilson (online)" would draw "CO".

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `HmhaTone` | `'neutral'` | Reflected as `data-tone`. |
| `appearance` | `'subtle' \| 'solid'` | `'subtle'` | Reflected as `data-appearance`. |
| `count` | `number \| null` | `null` | Shows a number instead of the projected text. |
| `max` | `number` | `99` | Above it, the count reads `max` followed by "+". |
| `showZero` | `boolean` | `false` | Show a count of 0 instead of hiding the badge. |
| `dot` | `boolean` | `false` | A small circle, no text, hidden from assistive tech. |

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-badge-bg` | the tone's tint (subtle) or strong colour (solid) | |
| `--hmha-badge-fg` | the tone's text colour for that fill | |

Custom properties starting `--_hmha-badge-` are internal (each tone's
four colours). They're not override API.

## Not in scope

Clickable or removable badges (use `HmhaChip`), a built-in icon slot (put
an `hmha-icon` inside yourself), and a positioning API (the pattern above
is plain CSS).

## Unsupported

`::ng-deep`, or overriding by specificity, per the encapsulation contract
in `DECISIONS.md` fork 05. Set a component token instead.
