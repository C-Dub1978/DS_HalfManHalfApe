import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'td[hmhaTableCell]',
  template: '<ng-content />',
  styleUrl: './table-cell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaTableCell {}
