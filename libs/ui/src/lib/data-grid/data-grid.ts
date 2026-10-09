import { Directive } from '@angular/core';

/**
 * The anchor every other Data Grid piece (sort button, resize handle)
 * belongs to. A plain directive, not a component — `HmhaTable` already
 * owns the table's visual styling, and two components can't match the
 * same host element (fork 22's reconsideration). Rendering rows is just
 * `HmhaTable`'s existing pieces plus the consumer's own `@for`; nothing
 * about that needs code here.
 *
 * `table-layout: fixed` is set because column resizing (step 3e) needs
 * stable widths to work against — `auto` layout recomputes column widths
 * from content on every render, fighting any width a resize handle sets.
 */
@Directive({
  selector: 'table[hmhaDataGrid]',
  host: {
    '[style.table-layout]': "'fixed'",
  },
})
export class HmhaDataGrid {}
