# HmhaProgressBar

```html
<!-- Determinate: an upload, with a visible label -->
<label for="upload-progress">Uploading movie.mp4</label>
<progress
  hmhaProgressBar
  id="upload-progress"
  [value]="uploadedBytes()"
  [max]="totalBytes()"
  [valueText]="uploadLabel()"
></progress>

<!-- Indeterminate: a transcode job still in the queue -->
<progress hmhaProgressBar aria-label="Waiting to transcode"></progress>

<!-- A failed job -->
<progress hmhaProgressBar aria-label="Transcode failed" tone="danger" [value]="62"></progress>
```

An attribute component on the native `<progress>` element. The browser
supplies `role="progressbar"` and its value semantics; this component
adds the token-driven look, tones, and the indeterminate sweep. It's a
display element: it isn't focusable, takes no keyboard input, and isn't a
form control. See `DECISIONS.md` fork 36.

**Indeterminate is `value = null`, the default.** A `<progress>` with no
`value` attribute means "working on it, progress unknown", and this
component removes the attribute rather than setting it to zero, so a bar
can go from determinate back to indeterminate (a retry going back into
the queue). `0` is a real, empty determinate bar.

## Labelling

`<progress>` is a labelable element, so give it an accessible name one of
three ways: a native `<label for>` (shown above), `aria-labelledby`
pointing at visible text, or `aria-label`. It doesn't use `HmhaField`,
because a progress bar has no required, invalid or hint state.

Set `valueText` whenever a percentage isn't the most useful thing to hear:
"42 MB of 100 MB", "Transcoding: 3 of 4 renditions".

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number \| null` | `null` | `null` is indeterminate. Otherwise 0 to `max`; the browser clamps out-of-range values. |
| `max` | `number` | `100` | |
| `tone` | `'primary' \| 'success' \| 'danger'` | `'primary'` | Reflected as `data-tone`. No `warning`: amber can't reach 3:1 on a light track yet (the amber open item in `DECISIONS.md`). |
| `valueText` | `string \| null` | `null` | Sets `aria-valuetext`. |

Tone is a visual cue, not the message. Say "failed" or "complete" in the
label or `valueText` too, since colour alone doesn't reach everyone.

## Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-progress-bar-track-bg` | `var(--hmha-color-bg-subtle)` | The same track colour as `HmhaSlider`. |
| `--hmha-progress-bar-fill-bg` | `var(--hmha-color-action)` | Re-pointed per `data-tone`. |
| `--hmha-progress-bar-thickness` | `var(--hmha-track-thickness)` | The semantic track role, shared with `HmhaSlider`. |
| `--hmha-progress-bar-indeterminate-duration` | `calc(var(--hmha-duration-base) * 8)` | One sweep across the track. |

Every fill colour is checked at 3:1 against the track in both modes by
`npm run tokens:contrast`, so retheming either one can't silently make
progress hard to see.

## Motion

The indeterminate state sweeps a segment across the track, following
the reading direction (right-to-left in RTL). Under
`prefers-reduced-motion: reduce` it doesn't travel: the whole track fills
and gently pulses instead.

## Unsupported

`::ng-deep`, selectors targeting the engine pseudo-elements from outside,
or overriding by specificity, per the encapsulation contract in
`DECISIONS.md` fork 05. Set a component token instead.
