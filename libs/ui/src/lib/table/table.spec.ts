import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaTableCell } from './table-cell';
import { HmhaTableHeaderCell } from './table-header-cell';
import { HmhaTableRow } from './table-row';
import { HmhaTable } from './table';

@Component({
  selector: 'table-host',
  imports: [HmhaTable, HmhaTableRow, HmhaTableHeaderCell, HmhaTableCell],
  template: `
    <table hmhaTable>
      <thead>
        <tr>
          <th hmhaTableHeaderCell [sort]="nameSort">Name</th>
          <th hmhaTableHeaderCell [scope]="rowHeaderScope">Role</th>
        </tr>
      </thead>
      <tbody>
        <tr hmhaTableRow>
          <td hmhaTableCell>Ada Lovelace</td>
          <td hmhaTableCell>Engineer</td>
        </tr>
        <tr hmhaTableRow>
          <td hmhaTableCell>Alan Turing</td>
          <td hmhaTableCell>Engineer</td>
        </tr>
        <tr hmhaTableRow>
          <td hmhaTableCell>Grace Hopper</td>
          <td hmhaTableCell>Admiral</td>
        </tr>
      </tbody>
    </table>
  `,
})
class TableHost {
  rowHeaderScope: 'col' | 'row' = 'col';
  nameSort: 'ascending' | 'descending' | 'none' | null = null;
}

describe('HmhaTable', () => {
  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [TableHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  // rowHeaderScope is set before the fixture's first detectChanges(), never
  // mutated on an already-checked fixture — same zoneless constraint
  // card.spec.ts documents for its own `elevated` input.
  function createTable(
    rowHeaderScope: 'col' | 'row' = 'col',
    nameSort: 'ascending' | 'descending' | 'none' | null = null,
  ) {
    const fixture = TestBed.createComponent(TableHost);
    fixture.componentInstance.rowHeaderScope = rowHeaderScope;
    fixture.componentInstance.nameSort = nameSort;
    fixture.detectChanges();
    return { fixture, table: fixture.nativeElement.querySelector('table') as HTMLTableElement };
  }

  it('creates', () => {
    const { table } = createTable();
    expect(table).toBeTruthy();
  });

  it('projects header and body content', () => {
    const { table } = createTable();
    expect(table.textContent).toContain('Name');
    expect(table.textContent).toContain('Ada Lovelace');
  });

  it('defaults header cells to scope="col"', () => {
    const { table } = createTable();
    const headerCells = table.querySelectorAll('th');
    expect(headerCells[0].getAttribute('scope')).toBe('col');
    expect(headerCells[1].getAttribute('scope')).toBe('col');
  });

  it('reflects an explicit row scope', () => {
    const { table } = createTable('row');
    const headerCells = table.querySelectorAll('th');
    expect(headerCells[1].getAttribute('scope')).toBe('row');
  });

  it('has no aria-sort by default — a plain header is not sortable', () => {
    const { table } = createTable();
    const headerCells = table.querySelectorAll('th');
    expect(headerCells[0].hasAttribute('aria-sort')).toBe(false);
  });

  it('reflects an explicit sort state as aria-sort', () => {
    const { table } = createTable('col', 'descending');
    const headerCells = table.querySelectorAll('th');
    expect(headerCells[0].getAttribute('aria-sort')).toBe('descending');
  });

  it('stripes alternating body rows', () => {
    const { table } = createTable();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const backgrounds = rows.map((row) => getComputedStyle(row).backgroundColor);
    expect(backgrounds[0]).not.toBe(backgrounds[1]);
    expect(backgrounds[0]).toBe(backgrounds[2]);
  });

  it('is axe-clean, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const { fixture } = createTable();
      const results = await axe.run(fixture.nativeElement, {
        runOnly: ['wcag2a', 'wcag2aa'],
      });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
