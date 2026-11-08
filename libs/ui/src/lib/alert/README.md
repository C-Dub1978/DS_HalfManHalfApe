# HmhaAlert

```html
<!-- Present when the page loads: read in normal order, not announced -->
<div hmhaAlert tone="warning">
  <strong hmhaAlertTitle>You've used 90% of your storage</strong>
  Uploads will stop at 100%.
  <button hmhaButton size="sm" hmhaAlertActions (click)="upgrade()">Upgrade storage</button>
</div>

<!-- Appears after something failed: announced immediately, dismissible -->
@if (uploadError()) {
  <div hmhaAlert tone="danger" announce="assertive" dismissible (dismissed)="uploadError.set(null)">
    <strong hmhaAlertTitle>Upload failed</strong>
    {{ uploadError() }}
    <button hmhaButton size="sm" hmhaAlertActions (click)="retry()">Retry</button>
  </div>
}
```

A message that stays put, on a native `<div>`: "Upload failed", "You've
used 90% of your storage", a summary of what to fix at the top of a form.
It has a tone icon, an optional title, your message, optional actions and
an optional Dismiss button. See `DECISIONS.md` fork 42.

**Alert or Toast?** A toast appears off to the side, announces itself and
disappears. An alert sits inline where it's relevant and stays until your
app removes it or the user dismisses it. **Alert or a field error?** A
field error belongs to one input (`HmhaField`'s `error`). An alert speaks
for the whole form or page.

## Content

- **`hmhaAlertTitle`** on any element: `<strong>`, or a real `<h3>` where
  the page needs a heading there. It's styled for you whichever you pick.
- **Everything else you put inside** is the message.
- **`hmhaAlertActions`** on buttons or links puts them in a row under the
  message. With no actions there's no empty row.

**Links inside an alert: give them `color: inherit`** (keep the
underline). They then take the alert's own text colour, which is checked
at 4.5:1 against every tone in both modes. The browser's default link blue
isn't: on the dark-mode tones it's close to unreadable. The library has no
link style of its own yet, and the alert can't reach into your content to
set one.

The title and message read as one block. Full width it's a page banner,
inline it sits in a form or card: that's your layout, not a variant.

## Tones

| `tone` | Icon | Read as |
| --- | --- | --- |
| `info` (default) | `info` | "Info" |
| `success` | `circle-check` | "Success" |
| `warning` | `triangle-alert` | "Warning" |
| `danger` | `circle-alert` | "Error" |

Each is a tinted fill with its own dark text, a 4.5:1 pair checked in both
modes by `npm run tokens:contrast`. The icon uses the text colour, so it
clears the same bar.

## Accessibility

- **The tone is spoken, not only shown.** The icon is named ("Warning"),
  so a screen reader hears "Warning, You've used 90% of your storage",
  not just the sentence. Colour and shape alone wouldn't reach everyone
  (WCAG 1.4.1).
- **`announce` decides whether it's announced when it appears:**

  | `announce` | Use it for | What happens |
  | --- | --- | --- |
  | `'none'` (default) | An alert already on the page when it loads | Nothing extra. It's read in normal page order. |
  | `'polite'` | One that appears after an action ("Saved") | Announced after whatever is being read now. |
  | `'assertive'` | An error that appears and needs attention now | Announced immediately, interrupting. |

  The announcement is "tone: title message", without the action buttons'
  labels, and happens once, when the alert first renders. It goes through
  CDK's `LiveAnnouncer` rather than `role="alert"`/`role="status"` on the
  element, because screen readers announce newly inserted live regions
  unreliably (polite ones especially). To announce a changed message
  again, render a new alert. Don't make every error `'assertive'`: one
  present on page load would interrupt before anyone has done anything.
- **Dismiss** is a button named "Dismiss". The alert doesn't remove
  itself: `dismissed` fires and your `@if` takes it away. Its button
  disappears with it, so move focus somewhere sensible, such as the
  control that caused the alert.

## Inputs and outputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | Reflected as `data-tone`. |
| `announce` | `'none' \| 'polite' \| 'assertive'` | `'none'` | See above. |
| `dismissible` | `boolean` | `false` | Adds the Dismiss button. |

| Output | Fires |
| --- | --- |
| `dismissed` | The Dismiss button was pressed. |

## Component tokens — the override API

| Token | Default (`info`) | Notes |
| --- | --- | --- |
| `--hmha-alert-bg` | `var(--hmha-color-action-subtle)` | Each tone's `*-subtle`. |
| `--hmha-alert-fg` | `var(--hmha-color-action)` | Each tone's `*-text`. Also the icon colour. |
| `--hmha-alert-border` | `var(--hmha-color-action)` | Each tone's strong colour. |

## Not in scope

Auto-dismiss timers (that's `HmhaToast`), a stack or queue of alerts, and
a built-in form-error summary that reads your form's errors (put your own
list inside an alert).

## Unsupported

`::ng-deep`, selectors targeting internal DOM (the icon, body or action
row), or overriding by specificity, per the encapsulation contract in
`DECISIONS.md` fork 05. Set a component token instead.
