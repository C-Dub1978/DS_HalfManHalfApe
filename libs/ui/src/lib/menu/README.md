# HmhaMenu

```html
<button [hmhaMenuTrigger]="actions">Actions</button>
<ng-template #actions>
  <div hmhaMenu>
    <button hmhaMenuItem (click)="rename()">Rename</button>
    <button hmhaMenuItem (click)="duplicate()">Duplicate</button>
    <button hmhaMenuItem disabled>Archive</button>
    <button hmhaMenuItem (click)="delete()">Delete</button>
  </div>
</ng-template>
```

Three pieces, each a thin layer over a native `<button>`/`<div>`:

- **`HmhaMenuTrigger`** (`button[hmhaMenuTrigger]`) owns the floating panel —
  built on the shared `hmhaOverlay()` (`core/overlay.ts`), connected-positioned
  below the trigger. The `hmhaMenuTrigger` input is the `<ng-template>` holding
  the panel's content. Sets `aria-haspopup="menu"` and `aria-expanded`, and
  returns focus to itself when the menu closes by any path (Escape, an
  outside click, selecting an item, or an explicit `close()`).
- **`HmhaMenu`** (`div[hmhaMenu]`) is the panel — `role="menu"`, and owns a
  CDK `FocusKeyManager` for Arrow/Home/End navigation, wrapping, and
  typeahead. Activates its first item automatically on open.
- **`HmhaMenuItem`** (`button[hmhaMenuItem]`) is a single action —
  `role="menuitem"`, roving `tabindex` (only the active item is in the Tab
  order), and closes the menu on click. A real `disabled` button is skipped
  by keyboard navigation for free.

## A foundation-level fix this component needed

`hmhaOverlay()`'s `open()` now takes an optional third `injector` argument.
Without it, a `TemplatePortal`'s embedded view is injected from wherever the
`<ng-template>` is lexically declared — a sibling of the trigger in the
consumer's own template, not a descendant of it — so `HmhaMenu` could never
reach `HMHA_MENU_TRIGGER` through the normal element-injector tree.
`HmhaMenuTrigger` now builds a child `Injector` providing itself and passes
it to `open()`. Any future connected-overlay trigger needing its panel to
inject the trigger (Select, Combobox) will need the same pattern.

`hmhaOverlay()`'s outside-interaction dismissal also now excludes clicks on
the origin element itself. CDK's outside-click dispatcher runs on
`document.body` in the *capture* phase, which fires and closes the overlay
**before** a `(click)` handler on the trigger ever sees the event — the
trigger counts as "outside" like anything else. Left alone, a trigger's own
toggle-to-close click would always see `isOpen()` as already `false` and
reopen what the dispatcher just closed. The origin element now owns
dismissal of clicks on itself; `hmhaOverlay` only auto-dismisses for
everything else.

## Inputs

| Component | Input | Type | Notes |
| --- | --- | --- | --- |
| `HmhaMenuTrigger` | `hmhaMenuTrigger` | `TemplateRef<unknown>` (required) | The panel content. |
| `HmhaMenuItem` | `disabled` | `boolean` | A real `disabled` attribute — skipped by both the key manager and native click. |

## Component tokens — the override API

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-menu-bg` | `var(--hmha-color-surface-raised)` | `HmhaMenu` |
| `--hmha-menu-fg` | `var(--hmha-color-text)` | `HmhaMenu` |
| `--hmha-menu-item-bg-active` | `var(--hmha-color-bg-subtle)` | `HmhaMenuItem`; applied on `data-active` or hover |
| `--hmha-menu-item-fg` | `var(--hmha-color-text)` | `HmhaMenuItem` |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity —
per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
