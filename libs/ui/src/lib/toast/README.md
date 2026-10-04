# HmhaToast

```ts
import { HmhaToast } from '@halfmanhalfape/hmha-ui';

export class SomeComponent {
  private readonly toast = inject(HmhaToast);

  save(): void {
    // ...
    this.toast.show('Saved to drafts');
  }
}
```

A root-provided injectable service, not a directive or component with a
selector — triggered imperatively from anywhere (a component, another
service), not attached to a specific element in a template. It's one of
the two component-convention exceptions CLAUDE.md names for "no native
element fits" (the other is Dialog, which instead found a native element —
Toast has none to find).

## One visible at a time, queued

Calling `show()` while a toast is already visible **queues** the new
message rather than replacing or stacking it — the next message appears
only once the current one's duration elapses. This is deliberately the
simplest behavior that never silently drops a message. Showing several
toasts stacked simultaneously isn't supported; it can be added later if
it's actually needed.

## No host element, no `ViewContainerRef`

Every other Wave 3 component built on `hmhaOverlay()` is a directive or
component with a real element, which gives it a `ViewContainerRef` for
free. A root-provided service has none. `hmhaOverlay()` now injects
`ViewContainerRef` as optional (fork 17) — CDK's `ComponentPortal` already
supports attaching without one, falling back to
`ApplicationRef.attachView()`. `TemplateRef` content still requires a
`ViewContainerRef` and throws without one; `HmhaToast` only ever opens a
component (`HmhaToastPanel`, internal, not exported), so this never
applies to it in practice.

## API

| Method | Notes |
| --- | --- |
| `show(text: string, durationMs = 4000)` | Queues a message. Auto-dismisses after `durationMs`. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-toast-bg` | `var(--hmha-color-surface-raised)` | the panel |
| `--hmha-toast-fg` | `var(--hmha-color-text)` | the panel |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
