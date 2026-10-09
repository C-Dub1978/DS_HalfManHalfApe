import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { HmhaAccordion } from './accordion';

/**
 * Built on the native `<details>` element — expanded/collapsed state,
 * keyboard operability (Enter/Space on `<summary>`) and a real `toggle`
 * event all come for free, no ARIA needed (the same "use the native
 * element" call as Dialog, fork 14).
 *
 * Exclusive (single-open) vs. independent (multi-open) grouping is
 * entirely native too — give sibling panels a shared `name` attribute
 * for single-open, or leave it off for independent panels. No input for
 * this on `HmhaExpansionPanel` itself: `name` is a plain HTML attribute
 * with nothing Angular-specific to wrap, confirmed to actually work
 * (including when set programmatically, not just by a real click) by a
 * direct browser check before relying on it — see `DECISIONS.md` fork 25.
 *
 * Optionally injects `HmhaAccordion` (no circular import: `HmhaAccordion`
 * never imports this file) to know when it should hand its own border
 * over to the group's — read, not `:host-context`, which stylelint's
 * `selector-disallowed-list` blocks for reaching outside a component's
 * own encapsulation boundary, the same reason `::ng-deep` is blocked
 * (fork 05).
 */
@Component({
  selector: 'details[hmhaExpansionPanel]',
  template: '<ng-content />',
  styleUrl: './expansion-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[open]': 'expanded()',
    '[attr.data-in-accordion]': "accordion ? '' : null",
    '(toggle)': 'onToggle($event)',
  },
})
export class HmhaExpansionPanel {
  protected readonly accordion = inject(HmhaAccordion, { optional: true });

  readonly expanded = model(false);

  protected onToggle(event: Event): void {
    this.expanded.set((event.target as HTMLDetailsElement).open);
  }
}
