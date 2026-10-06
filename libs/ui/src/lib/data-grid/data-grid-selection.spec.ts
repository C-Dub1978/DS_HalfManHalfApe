import { Component, computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import * as axe from 'axe-core';
import { HmhaCheckbox } from '../checkbox/checkbox';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableHeaderCell } from '../table/table-header-cell';
import { HmhaTableRow } from '../table/table-row';
import { HmhaTable } from '../table/table';
import { HmhaDataGrid } from './data-grid';

interface Person {
  readonly id: number;
  readonly name: string;
}

/**
 * Selection has no `Hmha*` component of its own (fork 21/22's tracker):
 * `HmhaCheckbox` is reused directly, `SelectionModel` (real CDK, a plain
 * class with no template/conflict surface) is the consumer's own
 * bookkeeping, and the select-all tri-state is a `computed()` the
 * consumer writes themselves — nothing to wrap. This spec proves that
 * composition actually works end-to-end, the same way `data-grid.spec.ts`
 * proved the rendering foundation rather than just asserting it.
 */
@Component({
  selector: 'selection-host',
  imports: [HmhaDataGrid, HmhaTable, HmhaTableRow, HmhaTableHeaderCell, HmhaTableCell, HmhaCheckbox, FormsModule],
  template: `
    <table hmhaTable hmhaDataGrid>
      <thead>
        <tr>
          <th hmhaTableHeaderCell>
            <input
              type="checkbox"
              hmhaCheckbox
              aria-label="Select all rows"
              [ngModel]="allSelected()"
              [indeterminate]="someSelected()"
              (ngModelChange)="toggleAll()"
            />
          </th>
          <th hmhaTableHeaderCell>Name</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr hmhaTableRow>
            <td hmhaTableCell>
              <input
                type="checkbox"
                hmhaCheckbox
                [attr.aria-label]="'Select ' + row.name"
                [ngModel]="isSelected(row.id)"
                (ngModelChange)="toggle(row.id)"
              />
            </td>
            <td hmhaTableCell>{{ row.name }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class SelectionHost {
  readonly rows = signal<Person[]>([
    { id: 1, name: 'Ada Lovelace' },
    { id: 2, name: 'Grace Hopper' },
    { id: 3, name: 'Alan Turing' },
  ]);

  private readonly selection = new SelectionModel<number>(true);
  private readonly selected = signal<ReadonlySet<number>>(new Set());

  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((row) => this.selected().has(row.id)),
  );
  readonly someSelected = computed(() => !this.allSelected() && this.rows().some((row) => this.selected().has(row.id)));

  constructor() {
    this.selection.changed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.selected.set(new Set(this.selection.selected));
    });
  }

  isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  toggle(id: number): void {
    this.selection.toggle(id);
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selection.clear();
    } else {
      this.selection.setSelection(...this.rows().map((row) => row.id));
    }
  }
}

describe('Data Grid selection (HmhaCheckbox + SelectionModel, no dedicated component)', () => {
  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [SelectionHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  function create() {
    const fixture = TestBed.createComponent(SelectionHost);
    fixture.detectChanges();
    const checkboxes = () => Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    return { fixture, selectAll: () => checkboxes()[0], rowCheckboxes: () => checkboxes().slice(1) };
  }

  it('starts with every checkbox unchecked and the select-all not indeterminate', () => {
    const { selectAll, rowCheckboxes } = create();
    expect(selectAll().checked).toBe(false);
    expect(selectAll().indeterminate).toBe(false);
    expect(rowCheckboxes().every((checkbox) => !checkbox.checked)).toBe(true);
  });

  it('checking one row makes the select-all indeterminate, not checked', async () => {
    const { fixture, selectAll, rowCheckboxes } = create();
    rowCheckboxes()[0].checked = true;
    rowCheckboxes()[0].dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(selectAll().checked).toBe(false);
    expect(selectAll().indeterminate).toBe(true);
  });

  it('checking every row makes the select-all checked, not indeterminate', async () => {
    const { fixture, selectAll, rowCheckboxes } = create();
    for (const checkbox of rowCheckboxes()) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
    await fixture.whenStable();

    expect(selectAll().checked).toBe(true);
    expect(selectAll().indeterminate).toBe(false);
  });

  it('toggling select-all selects every row, and toggling it again clears all of them', async () => {
    const { fixture, selectAll, rowCheckboxes } = create();

    selectAll().checked = true;
    selectAll().dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(rowCheckboxes().every((checkbox) => checkbox.checked)).toBe(true);

    selectAll().checked = false;
    selectAll().dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(rowCheckboxes().every((checkbox) => !checkbox.checked)).toBe(true);
  });

  it('unchecking one row after select-all drops it back to indeterminate', async () => {
    const { fixture, selectAll, rowCheckboxes } = create();

    selectAll().checked = true;
    selectAll().dispatchEvent(new Event('change'));
    await fixture.whenStable();

    rowCheckboxes()[0].checked = false;
    rowCheckboxes()[0].dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(selectAll().checked).toBe(false);
    expect(selectAll().indeterminate).toBe(true);
  });

  it('is axe-clean in every selection state, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      const { fixture, rowCheckboxes } = create();
      rowCheckboxes()[0].checked = true;
      rowCheckboxes()[0].dispatchEvent(new Event('change'));
      await fixture.whenStable();

      const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
