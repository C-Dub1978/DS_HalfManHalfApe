# HmhaSegmentedControl / HmhaSegment

```html
<!-- A view switcher, no form needed -->
<fieldset hmhaSegmentedControl aria-label="View" [(value)]="view">
  <label hmhaSegment value="grid" label="Grid"><hmha-icon name="layout-grid" /></label>
  <label hmhaSegment value="list" label="List"><hmha-icon name="list" /></label>
</fieldset>

<!-- A setting, with Forms and a visible label -->
<hmha-field label="Playback quality" hint="Higher uses more data.">
  <fieldset hmhaSegmentedControl formControlName="quality">
    <label hmhaSegment value="720p">720p</label>
    <label hmhaSegment value="1080p">1080p</label>
    <label hmhaSegment value="4k">4K</label>
  </fieldset>
</hmha-field>
```

A row of joined segments with exactly one selected: Grid/List,
Movies/Shows/Music, 720p/1080p/4K. It's a radio group drawn as one
control, and it's built from real radios. See `DECISIONS.md` fork 48.

- **`fieldset[hmhaSegmentedControl]`** is the group. It holds the value,
  sets `role="radiogroup"` and gives every segment's radio one shared
  `name`, as `HmhaRadioGroup` does (fork 11).
- **`label[hmhaSegment]`** is one segment. It renders its own native
  `<input type="radio">` and then your content, so you write one element
  per segment and clicking anywhere on it selects it. A segment outside a
  segmented control throws, since it has nothing to belong to.

**Segmented Control, Tabs or Select?** If picking a segment swaps the
content below, that's `HmhaTabs`. With more than about five options, or
options that wouldn't fit side by side on a phone, use `HmhaSelect`. For
"any number of these" rather than "one of these", use a selectable
`HmhaChipSet` or `pressed` buttons.

## Keyboard and screen readers

All of this is the browser's, from the native radios, with nothing
re-implemented:

- **One Tab stop** for the whole control, landing on the selected segment.
- **Arrow keys** move to the next or previous segment and select it,
  wrapping at the ends and following right-to-left layout.
- **Screen readers** announce "Grid, radio button, 1 of 2, selected".

Each radio covers its whole segment, invisibly, rather than being clipped
to 1px: a phone screen reader's touch exploration finds it exactly where
the segment is drawn. The focus ring is drawn on the segment.

## The value

`value` is a `model()`, and it's also the value Forms reads and writes,
through the same signal (as `HmhaSlider`, fork 35):

- **`[(value)]`** on its own, for a view switcher with no form.
- **`formControlName` / `[formControl]` / `[(ngModel)]`**, for a setting.

**Give it a starting value.** It matches a segment's `value`, and once a
segment has been picked, native radios can't be unselected, so "exactly
one selected" holds from then on. Values are strings; stringify anything
else.

## Naming it

The group needs an accessible name, like any radio group:

- **`aria-label`** (`aria-label="View"`) where the segments explain
  themselves visually.
- **`aria-labelledby`** pointing at a heading or label already on the page.
- **Inside `hmha-field`**, for a visible label, hint and Forms wiring. The
  field names the group with `aria-labelledby`, because a `<fieldset>`
  can't be a `<label for>` target (fork 11).

A `<legend>` would render inside the track, so don't use one here.

## Segments with icons

Any content works: text, an `<hmha-icon>` plus text, or an icon alone. An
**icon-only segment needs `label`**, which becomes its radio's
`aria-label`, and it throws without one: an icon alone has no accessible
name (the same rule as `HmhaIconButton`, fork 23). A segment with visible
text is named by that text and needs no `label`. Bound text
(`{{ speed }}×`) counts as text.

## Inputs

### `HmhaSegmentedControl`

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` (model) | `''` | The selected segment's `value`. Two-way bindable. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The whole control is exactly that control height, so it lines up with buttons and inputs beside it. Density applies too. |
| `disabled` | `boolean` | `false` | The native `<fieldset disabled>`, which disables every segment. Forms' `disable()` does the same. |

### `HmhaSegment`

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` (required) | — | What the control's `value` becomes when this segment is picked. |
| `label` | `string` | — | The accessible name, required on a segment with no text. |
| `disabled` | `boolean` | `false` | This segment only. |

## Layout

Every segment is the same width: as wide as the widest by default, or an
equal share when you give the control a width (`style="width: 100%"`, or
your own class). Segment text doesn't wrap.

## The selected look

The selected segment has the same look as a pressed button (fork 45):
`action` text on `action-subtle`, with an `action` border, in a
`surface-sunken` track outlined in `border`. The background, the border and the text all
change, so "selected" isn't told by hue alone (WCAG 1.4.1), and both pairs
are CI-checked (`action` on `action-subtle` at 4.5:1, `action` on
`surface-sunken` at 3:1).

## Component tokens — the override API

On the control:

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-segmented-control-bg` | `var(--hmha-color-surface-sunken)` | The track. |
| `--hmha-segmented-control-border` | `var(--hmha-color-border)` | The track's edge. Decorative, and it keeps the control visible where `surface-sunken` matches the page (dark mode). |
| `--hmha-segmented-control-inset` | `calc(var(--hmha-control-padding-y) / 2)` | The space around and between segments. Follows density. |
| `--hmha-segmented-control-height` | `var(--hmha-control-height)` | Set by `size`. The segments fill it, less the inset. |

On each segment:

| Token | Default | Selected |
| --- | --- | --- |
| `--hmha-segment-bg` | `transparent` | `var(--hmha-color-action-subtle)` |
| `--hmha-segment-bg-hover` | `var(--hmha-color-surface-raised)` | `var(--hmha-color-action-subtle)` |
| `--hmha-segment-fg` | `var(--hmha-color-text)` | `var(--hmha-color-action)` |
| `--hmha-segment-border` | `transparent` | `var(--hmha-color-action)` |

If you override the selected colours, keep the selected segment's border
at 3:1 against the track.

## Not in scope

Multiple selection, overflow scrolling, and switching panels (see
"Segmented Control, Tabs or Select?" above).

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity, per the encapsulation contract in `DECISIONS.md` fork 05.
Set a component token instead.
