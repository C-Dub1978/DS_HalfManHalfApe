import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Purely visual — borders, background, and the structural `<table>` box
 * model. No sort, select, resize or row model of any kind: that's
 * `HmhaDataGrid`'s job (fork 06/21). A consumer writes a plain
 * `<thead>`/`<tbody>` structure and applies `HmhaTableRow`/
 * `HmhaTableHeaderCell`/`HmhaTableCell` to the rows/cells that need
 * striping, hover or header treatment.
 */
@Component({
  selector: 'table[hmhaTable]',
  template: '<ng-content />',
  styleUrl: './table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaTable {}
