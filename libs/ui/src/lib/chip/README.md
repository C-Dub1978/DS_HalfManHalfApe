# HmhaChip

```html
<!-- display — a plain tag, not interactive -->
<span hmhaChip>Engineering</span>

<!-- removable — a nested HmhaIconButton handles removal; no dedicated
     input for this, it's your own projected content -->
<span hmhaChip>
  Engineering
  <button hmhaButton hmhaIconButton size="sm" label="Remove Engineering">
    <hmha-icon name="close" size="sm" />
  </button>
</span>

<!-- selectable/toggleable — the whole chip is the control -->
<button hmhaChip selectable="true" [(selected)]="remoteSelected">Remote</button>
```

An attribute directive on either a native `<span>` (display/removable —
never itself interactive) or a native `<button>` (selectable/toggleable —
the whole chip is the control, native `aria-pressed` makes it a real ARIA
toggle button, no custom role needed). Which native element you reach for
*is* the decision about whether the chip is interactive — there's no
separate "mode" input for that.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `selectable` | `boolean` | `false` | Only meaningful on a `<button>`. When `true`, clicking the chip toggles `selected` and sets `aria-pressed`. |
| `selected` | `boolean` (model) | `false` | Two-way bindable (`[(selected)]`). Own, local UI state the chip is allowed to hold directly — the same shape as `HmhaCheckbox`'s checked value — not the kind of collection state (e.g. "which chips are selected in this filter group") that Wave 4 deliberately kept out of every component. Reflected as `data-selected`. |
| `disabled` | `boolean` | `false` | Reflected as the `disabled` *attribute* (not the DOM property — a `<span>` has no such property, and a property binding there throws NG0303; the attribute works universally and a real `<button>` still reflects it into its own `.disabled`). Also makes the key manager skip this chip when inside an `HmhaChipSet`. |

## HmhaChipSet — roving-tabindex grouping

```html
<div hmhaChipSet ariaLabel="Filters">
  <button hmhaChip selectable="true">Remote</button>
  <button hmhaChip selectable="true">Hybrid</button>
  <button hmhaChip selectable="true" disabled="true">On-site</button>
</div>
```

Purely a focus manager over its `HmhaChip` content children — ArrowLeft/
ArrowRight move between them (wrapping), Home/End jump to the first/last,
a `disabled` chip is skipped. No shared "selected" state: each chip
already owns its own `selected` model independently, and a consumer
tracking "which chips are selected" reads each chip's own state — the
same "no collection state in the component" principle as Wave 4's
selection work (`DECISIONS.md` fork 21).

`HmhaChip` works standalone too, with no `HmhaChipSet` ancestor — it's
just a normal tab stop in that case, not part of any roving-tabindex
group.

## Component tokens — the override API

Declared on `:host` in `chip.css`, consumed in the same file.

| Token | Default | Set by |
| --- | --- | --- |
| `--hmha-chip-bg` | `var(--hmha-color-bg-subtle)` | base; re-pointed to `var(--hmha-color-action-subtle)` when selected |
| `--hmha-chip-fg` | `var(--hmha-color-text)` | base; re-pointed to `var(--hmha-color-action)` when selected |
| `--hmha-chip-border` | `var(--hmha-color-border)` | base; re-pointed to `var(--hmha-color-action)` when selected |

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity
— per the encapsulation contract in `DECISIONS.md` fork 05. Set a
component token instead.
