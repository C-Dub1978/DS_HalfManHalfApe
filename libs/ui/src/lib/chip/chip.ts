import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, inject, input, model } from '@angular/core';
import type { FocusableOption } from '@angular/cdk/a11y';
import { HMHA_CHIP_SET } from './chip-set-context';

/**
 * Works on either a native `<span>` (display or removable — not itself
 * interactive; a nested `HmhaIconButton` handles removal, projected by the
 * consumer, no dedicated input here for it) or a native `<button>`
 * (selectable/toggleable — the whole chip is the control, native
 * `aria-pressed` makes it a real ARIA toggle button, no custom role
 * needed).
 *
 * Optionally participates in an ancestor `HmhaChipSet`'s roving-tabindex
 * navigation via `HMHA_CHIP_SET` (optional injection) — standalone, with
 * no `HmhaChipSet` ancestor, it's just a normal tab stop.
 */
@Component({
  selector: 'span[hmhaChip], button[hmhaChip]',
  template: '<ng-content />',
  styleUrl: './chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.aria-pressed]': 'selectable() ? selected() : null',
    '[attr.tabindex]': 'tabindex()',
    // [disabled] (a property binding) isn't valid on <span> — it has no
    // such DOM property, and Angular's strict binding throws (NG0303)
    // rather than silently no-opping the way a raw JS assignment would.
    // [attr.disabled] works universally; it's inert on a span (no native
    // behavior there) and still disables a real <button>.
    '[attr.disabled]': "disabledInput() ? '' : null",
    '(click)': 'onClick()',
  },
})
export class HmhaChip implements FocusableOption {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly chipSet = inject(HMHA_CHIP_SET, { optional: true });

  readonly selectable = input(false, { transform: booleanAttribute });
  readonly selected = model(false);

  // FocusableOption requires `disabled` as a plain boolean property, not a
  // signal — same alias-plus-getter shape HmhaMenuItem already uses. Public
  // (not protected): a bare `disabled="true"` template attribute resolves
  // to this aliased input ahead of the native button property of the same
  // name, and Angular's strict template checking requires it be accessible
  // from the template for that resolution to type-check.
  readonly disabledInput = input(false, { transform: booleanAttribute, alias: 'disabled' });
  get disabled(): boolean {
    return this.disabledInput();
  }

  protected readonly isActive = computed(() => this.chipSet?.activeChip() === this);
  // Standalone: always a normal tab stop. Inside a set: roving
  // tabindex — only the active chip is in the Tab order.
  protected readonly tabindex = computed(() => (this.chipSet ? (this.isActive() ? 0 : -1) : 0));

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  protected onClick(): void {
    if (this.selectable() && !this.disabled) {
      this.selected.set(!this.selected());
    }
  }
}
