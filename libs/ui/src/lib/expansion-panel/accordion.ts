import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Purely visual grouping. Exclusive (single-open) vs. independent
 * (multi-open) behavior is entirely native, via a shared `name`
 * attribute on the consumer's own `<details>` elements — nothing here
 * enforces or even knows about that (fork 25). This wrapper only gives
 * stacked panels one outer border instead of each panel's own; the
 * per-panel border suppression lives in `HmhaExpansionPanel`'s own CSS
 * (`:host-context(div[hmhaAccordion])`), not here — this component has
 * no way to reach into projected children's styles at all under
 * Angular's emulated encapsulation (no real Shadow DOM, so no
 * `::slotted` either).
 */
@Component({
  selector: 'div[hmhaAccordion]',
  template: '<ng-content />',
  styleUrl: './accordion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaAccordion {}
