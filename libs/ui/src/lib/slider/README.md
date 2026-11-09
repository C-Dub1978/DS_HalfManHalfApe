# HmhaSlider

```html
<!-- A media timeline: standalone two-way binding, no Forms involved -->
<input
  hmhaSlider
  aria-label="Seek"
  step="any"
  [max]="duration()"
  [(value)]="currentTime"
  [buffered]="bufferedEnd()"
  [valueText]="timeLabel()"
  (scrubbingChange)="scrubbing.set($event)"
  (valueCommit)="seek($event)"
/>

<!-- A settings form: the same control through ControlValueAccessor -->
<hmha-field label="Default volume">
  <input hmhaSlider [formControl]="volume" />
</hmha-field>
```

An attribute directive on the native `<input type="range">`. `type` is
set by the directive itself, and everything else stays native: the
`slider` role, `aria-valuenow`/`-min`/`-max`, arrow, Page Up/Down, Home and
End keys, pointer and touch drag, clicking the track to jump, right-to-left
layout and form submission. See `DECISIONS.md` fork 35 for why this is a
native input and not a custom `role="slider"`.

The value works two ways, through **one** signal:

- **`[(value)]`**: a `model()`, for a value something other than a form
  owns, such as a media player writing the playhead several times a second.
- **`[formControl]` / `formControlName` / `ngModel`**: the usual
  `ControlValueAccessor`. Forms writing `null` (a `reset()`) moves the
  slider to `min`, since a range input has no empty state.

Wrap it in `HmhaField` for a visible label, hint, error and required
state (the `HMHA_FIELD` contract in `field/README.md`). Standalone, give it
an `aria-label`.

## Building a media timeline

Three things keep a seek bar from fighting the player:

1. **Stop writing the playhead while the user drags.** `scrubbingChange`
   emits `true` on pointer down and `false` on release (anywhere on the
   page). While it's `true`, skip the `timeupdate` → `value` write.
2. **Seek on `valueCommit`, not on every `valueChange`.** `valueChange`
   fires continuously during a drag; `valueCommit` fires once, when the
   user lets go or a key press completes.
3. **Set `valueText`.** Screen readers announce `aria-valuetext` instead of
   a raw number, so "1:23 of 4:56" rather than "83".

`buffered` draws how far the media has loaded as a lighter band ahead of
the fill (`HTMLMediaElement.buffered.end(…)` is the usual source). It's in
the same units as `value`, and it's never drawn behind the fill.

The value is re-applied whenever `min`, `max` or `step` change, so a
playhead set before the media's duration is known lands correctly once
`max` arrives. A range input clamps its value to the `max` it has at that
moment, so without this it would stay stuck at the old maximum.

Volume works the same way, usually with `orientation="vertical"`,
`max="1"` and `step="0.01"` to match `HTMLMediaElement.volume`.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Two-way (`model()`). Also the Forms value. |
| `min` | `number` | `0` | |
| `max` | `number` | `100` | |
| `step` | `number \| 'any'` | `1` | `'any'` for a continuous value (a timeline). |
| `buffered` | `number \| null` | `null` | Loaded-so-far band, in `value`'s units. `null` draws none. |
| `valueText` | `string \| null` | `null` | Sets `aria-valuetext`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Reflected as `data-orientation` and `aria-orientation`. Vertical runs bottom (min) to top (max). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Thumb size (the `--hmha-icon-*` scale) and the host's height (the density-aware `--hmha-control-height*`). |
| `disabled` | `boolean` | `false` | Combines with Forms' `setDisabledState`. |
| `invalid` | `boolean` | `false` | Combines with a wrapping `HmhaField`'s `error`. |

## Outputs

| Output | Payload | Fires |
| --- | --- | --- |
| `valueChange` | `number` | Every change, continuously during a drag. (The `model()`'s own output.) |
| `valueCommit` | `number` | Once the user releases the pointer or a key press completes (native `change`). |
| `scrubbingChange` | `boolean` | `true` on pointer down, `false` on pointer up or cancel. Also readable as the `scrubbing` signal. |

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-slider-track-bg` | `var(--hmha-color-surface-sunken)` | The unfilled, unbuffered track. Shared with Progress Bar; every fill colour is CI-checked at 3:1 against it (fork 36). Shows on surfaces and cards in both modes; on a bare dark page background it matches the page. |
| `--hmha-slider-buffered-bg` | `var(--hmha-color-border-strong)` | The buffered band. |
| `--hmha-slider-fill-bg` | `var(--hmha-color-action)` | Re-pointed to `danger` when invalid. |
| `--hmha-slider-thumb-bg` | `var(--hmha-color-action)` | Hover, scrubbing and invalid each re-point it. |
| `--hmha-slider-thumb-border` | `var(--hmha-color-surface)` | Separates the thumb from a fill of the same colour. |
| `--hmha-slider-thumb-size` | `var(--hmha-icon-md)` | Re-pointed per `data-size`. |
| `--hmha-slider-track-thickness` | `var(--hmha-track-thickness)` | The semantic track role, shared with Progress Bar. |
| `--hmha-slider-length` | `100%` (`auto` vertical) | The inline size. Vertical's `auto` is the browser's default length, so set it to a real length. |

Custom properties starting `--_hmha-slider-` are internal (the fill and
buffered end points, the gradient direction). They're not override API.

## Platform notes

- **Electron / Chromium:** the same native range input Chrome uses. Only
  the Blink/WebKit rules in `slider.css` apply.
- **iOS (Safari, Capacitor's WKWebView):** iOS's native range input may
  only move when the thumb is dragged, not when the track is tapped. If
  that matters for a phone seek bar, the fix is an extra pointer handler.
  It's an additive change, not a redesign. Use `size="lg"` for a
  touch-friendly thumb.

## Not in scope

A two-thumb range slider (no native element exists for one), tick marks,
and a hover-time preview tooltip, which is player code that reads
`pointermove` on the host.

## Unsupported

`::ng-deep`, selectors targeting internal DOM or the engine pseudo-elements
from outside, or overriding by specificity, per the encapsulation contract
in `DECISIONS.md` fork 05. Set a component token instead.
