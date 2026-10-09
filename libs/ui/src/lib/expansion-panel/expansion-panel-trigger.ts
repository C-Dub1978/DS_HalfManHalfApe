import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HmhaIcon } from '../icon/icon';
import { HmhaExpansionPanel } from './expansion-panel';

/**
 * The chevron is this component's own template, not projected content —
 * every trigger needs one, unlike Button's optional icon slot. Its
 * rotation needs the parent `HmhaExpansionPanel`'s `expanded` state —
 * injected directly (no separate token needed; `HmhaExpansionPanel`
 * never imports this file back, so there's no circular-import risk the
 * way Menu's/ChipSet's own parent-child tokens guard against), not read
 * via `:host-context`, which stylelint's `selector-disallowed-list`
 * blocks for the same reason as `::ng-deep` — a component reaching
 * outside its own encapsulation boundary, per the fork 05 contract.
 */
@Component({
  selector: 'summary[hmhaExpansionPanelTrigger]',
  imports: [HmhaIcon],
  template: `
    <ng-content />
    <hmha-icon name="chevron-down" size="sm" />
  `,
  styleUrl: './expansion-panel-trigger.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-expanded]': "panel.expanded() ? '' : null",
  },
})
export class HmhaExpansionPanelTrigger {
  protected readonly panel = inject(HmhaExpansionPanel);
}
