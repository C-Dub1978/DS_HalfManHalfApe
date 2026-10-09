import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Apply to body rows only (`<tbody><tr hmhaTableRow>`) — striping and
 * hover don't make sense on a header row, which needs no directive of its
 * own; `HmhaTableHeaderCell` carries all header styling.
 */
@Component({
  selector: 'tr[hmhaTableRow]',
  template: '<ng-content />',
  styleUrl: './table-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaTableRow {}
