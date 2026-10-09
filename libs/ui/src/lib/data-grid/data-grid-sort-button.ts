import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import type { HmhaSortDirection } from '../core/types';
import { HmhaIcon } from '../icon/icon';

/**
 * Lives inside a sortable `th[hmhaTableHeaderCell]`, wrapping the column's
 * label. Purely an intent emitter (fork 21/22): clicking never sorts
 * anything itself — it suggests the next direction (a simple two-state
 * cycle, asc/desc, never "none") and the consumer decides what to do with
 * it, feeding the real current state back through `active`/`direction`.
 * No cross-column coordination needed — each column's button is
 * independent of every other.
 */
@Component({
  selector: 'button[hmhaDataGridSortButton]',
  imports: [HmhaIcon],
  template: `
    <ng-content />
    <hmha-icon [name]="direction() === 'desc' ? 'chevron-down' : 'chevron-up'" size="sm" />
  `,
  styleUrl: './data-grid-sort-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.data-active]': 'active() || null',
    '(click)': 'onClick()',
  },
})
export class HmhaDataGridSortButton {
  readonly active = input(false, { transform: booleanAttribute });
  readonly direction = input<HmhaSortDirection>('asc');
  readonly sortRequest = output<HmhaSortDirection>();

  protected onClick(): void {
    const next: HmhaSortDirection = this.active() && this.direction() === 'asc' ? 'desc' : 'asc';
    this.sortRequest.emit(next);
  }
}
