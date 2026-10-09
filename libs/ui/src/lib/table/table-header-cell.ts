import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'th[hmhaTableHeaderCell]',
  template: '<ng-content />',
  styleUrl: './table-header-cell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.scope]': 'scope()',
    '[attr.aria-sort]': 'sort()',
  },
})
export class HmhaTableHeaderCell {
  /** Simple tables only have column headers — defaults to `col`; set `row` for a row-header cell. */
  readonly scope = input<'col' | 'row'>('col');
  /** Unset by default — plain headers aren't sortable. A Data Grid column sets this alongside `HmhaDataGridSortButton`'s own `active`/`direction` inputs. */
  readonly sort = input<'ascending' | 'descending' | 'none' | null>(null);
}
