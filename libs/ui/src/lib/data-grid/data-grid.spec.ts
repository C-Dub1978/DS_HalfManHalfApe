import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableHeaderCell } from '../table/table-header-cell';
import { HmhaTableRow } from '../table/table-row';
import { HmhaTable } from '../table/table';
import { HmhaDataGrid } from './data-grid';

interface Person {
  readonly id: number;
  readonly name: string;
  readonly role: string;
}

@Component({
  selector: 'data-grid-host',
  imports: [HmhaDataGrid, HmhaTable, HmhaTableRow, HmhaTableHeaderCell, HmhaTableCell],
  template: `
    <table hmhaTable hmhaDataGrid>
      <thead>
        <tr>
          <th hmhaTableHeaderCell>Name</th>
          <th hmhaTableHeaderCell>Role</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr hmhaTableRow>
            <td hmhaTableCell>{{ row.name }}</td>
            <td hmhaTableCell>{{ row.role }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class DataGridHost {
  readonly rows = signal<Person[]>([
    { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
    { id: 2, name: 'Grace Hopper', role: 'Admiral' },
    { id: 3, name: 'Alan Turing', role: 'Engineer' },
  ]);
}

describe('HmhaDataGrid', () => {
  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [DataGridHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  function createGrid() {
    const fixture = TestBed.createComponent(DataGridHost);
    fixture.detectChanges();
    return { fixture, table: fixture.nativeElement.querySelector('table') as HTMLTableElement };
  }

  it('creates', () => {
    const { table } = createGrid();
    expect(table).toBeTruthy();
  });

  it('sets table-layout: fixed', () => {
    const { table } = createGrid();
    expect(getComputedStyle(table).tableLayout).toBe('fixed');
  });

  it('renders a body row per array item, composing HmhaTable\'s plain @for with no row model of its own', () => {
    const { table } = createGrid();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(table.textContent).toContain('Ada Lovelace');
    expect(table.textContent).toContain('Grace Hopper');
  });

  it('re-renders when the consumer\'s own array changes, proving the foundation is a real signal-driven @for, not static content', () => {
    const { fixture, table } = createGrid();
    fixture.componentInstance.rows.update((rows) => rows.filter((row) => row.id !== 2));
    fixture.detectChanges();

    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(table.textContent).not.toContain('Grace Hopper');
  });

  it('still stripes alternating body rows — composing with HmhaDataGrid does not break HmhaTableRow\'s own styling', () => {
    const { table } = createGrid();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const backgrounds = rows.map((row) => getComputedStyle(row).backgroundColor);
    expect(backgrounds[0]).not.toBe(backgrounds[1]);
    expect(backgrounds[0]).toBe(backgrounds[2]);
  });

  it('is axe-clean, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const { fixture } = createGrid();
      const results = await axe.run(fixture.nativeElement, {
        runOnly: ['wcag2a', 'wcag2aa'],
      });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
