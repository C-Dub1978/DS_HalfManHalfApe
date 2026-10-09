import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SelectionModel } from '@angular/cdk/collections';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import type { HmhaSortDirection } from '../core/types';
import { HmhaCheckbox } from '../checkbox/checkbox';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableHeaderCell } from '../table/table-header-cell';
import { HmhaTableRow } from '../table/table-row';
import { HmhaTable } from '../table/table';
import { HmhaDataGridResizeHandle } from './data-grid-resize-handle';
import { HmhaDataGridSortButton } from './data-grid-sort-button';
import { HmhaDataGrid } from './data-grid';

interface Person {
  readonly id: number;
  readonly name: string;
  readonly role: string;
}

type SortColumn = 'name' | null;

/**
 * Composes every Wave 4 piece the way a real consumer would — nothing
 * here belongs to any one component. Sort/selection state, the sorted
 * array, and the selected-ids set are all owned by this demo, matching
 * fork 21: the components only emit intents and reflect state back.
 */
@Component({
  selector: 'data-grid-demo',
  imports: [
    HmhaDataGrid,
    HmhaTable,
    HmhaTableRow,
    HmhaTableHeaderCell,
    HmhaTableCell,
    HmhaDataGridSortButton,
    HmhaDataGridResizeHandle,
    HmhaCheckbox,
    FormsModule,
  ],
  template: `
    <table hmhaTable hmhaDataGrid style="width: 408px;">
      <thead>
        <tr>
          <th hmhaTableHeaderCell style="width: 48px">
            <input
              type="checkbox"
              hmhaCheckbox
              aria-label="Select all rows"
              [ngModel]="allSelected()"
              [indeterminate]="someSelected()"
              (ngModelChange)="toggleAll()"
            />
          </th>
          <th hmhaTableHeaderCell style="width: 200px" [sort]="sortAriaFor('name')">
            <button
              hmhaDataGridSortButton
              [active]="sortColumn() === 'name'"
              [direction]="sortDirection()"
              (sortRequest)="onSort('name', $event)"
            >
              Name
            </button>
            <div hmhaDataGridResizeHandle label="Resize Name column"></div>
          </th>
          <th hmhaTableHeaderCell style="width: 160px">
            Role
            <div hmhaDataGridResizeHandle label="Resize Role column"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        @for (person of sortedRows(); track person.id) {
          <tr hmhaTableRow>
            <td hmhaTableCell>
              <input
                type="checkbox"
                hmhaCheckbox
                [attr.aria-label]="'Select ' + person.name"
                [ngModel]="isSelected(person.id)"
                (ngModelChange)="toggle(person.id)"
              />
            </td>
            <td hmhaTableCell>{{ person.name }}</td>
            <td hmhaTableCell>{{ person.role }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class DataGridDemo {
  readonly rows = signal<Person[]>([
    { id: 1, name: 'Grace Hopper', role: 'Admiral' },
    { id: 2, name: 'Ada Lovelace', role: 'Engineer' },
    { id: 3, name: 'Alan Turing', role: 'Engineer' },
    { id: 4, name: 'Katherine Johnson', role: 'Mathematician' },
  ]);

  readonly sortColumn = signal<SortColumn>(null);
  readonly sortDirection = signal<HmhaSortDirection>('asc');

  readonly sortedRows = computed(() => {
    const column = this.sortColumn();
    if (!column) {
      return this.rows();
    }
    const direction = this.sortDirection();
    return [...this.rows()].sort((a, b) => {
      const cmp = a[column].localeCompare(b[column]);
      return direction === 'asc' ? cmp : -cmp;
    });
  });

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

  sortAriaFor(column: NonNullable<SortColumn>): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  onSort(column: NonNullable<SortColumn>, direction: HmhaSortDirection): void {
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
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

/**
 * Proves the README's virtualization composition actually renders
 * correctly, not just that it doesn't crash.
 *
 * The viewport wraps the *entire* `<table>`, with a sticky `<thead>` —
 * not just the `<tbody>` rows, which was this step's first (wrong)
 * attempt. Putting `<cdk-virtual-scroll-viewport>` directly inside
 * `<tbody>` compiles and renders without error, but CSS's anonymous-
 * table-object rules treat that div-shaped element as needing to fit
 * inside the column grid — it gets squeezed to roughly one column's
 * width instead of the table's full width, visibly breaking every
 * column's layout. Confirmed by measuring actual rendered widths in a
 * throwaway experiment, not by inspection; the fix (viewport outside,
 * around a sticky-headed table) measured correctly in the same way
 * before it replaced the broken version here and in the README.
 */
@Component({
  selector: 'data-grid-virtualized-demo',
  imports: [HmhaDataGrid, HmhaTable, HmhaTableRow, HmhaTableHeaderCell, HmhaTableCell, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="41" tabindex="0" style="height: 200px; width: 300px;">
      <table hmhaTable hmhaDataGrid>
        <colgroup>
          <col style="width: 60px" />
          <col style="width: 240px" />
        </colgroup>
        <thead style="position: sticky; top: 0;">
          <tr>
            <th hmhaTableHeaderCell style="width: 60px">ID</th>
            <th hmhaTableHeaderCell style="width: 240px">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr hmhaTableRow *cdkVirtualFor="let row of rows()">
            <td hmhaTableCell>{{ row.id }}</td>
            <td hmhaTableCell>{{ row.name }}</td>
          </tr>
        </tbody>
      </table>
    </cdk-virtual-scroll-viewport>
  `,
})
class DataGridVirtualizedDemo {
  readonly rows = signal(Array.from({ length: 500 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` })));
}

const meta: Meta<DataGridDemo> = {
  title: 'Components/Data Grid',
  component: DataGridDemo,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [DataGridDemo, DataGridVirtualizedDemo] })],
};
export default meta;

type Story = StoryObj<DataGridDemo>;

/** Default — sortable Name column, resizable Name/Role columns, row + select-all checkboxes, all composed with no dedicated "grid" logic of their own. */
export const Playground: Story = {};

/** Clicking the Name header sorts the rows; clicking again reverses direction. The grid never sorts anything itself — this demo does. */
export const SortingInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const sortButton = canvas.getByRole('button', { name: 'Name' });
    const nameHeader = canvasElement.querySelector('th[aria-sort]') as HTMLElement;

    await userEvent.click(sortButton);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    let names = Array.from(canvasElement.querySelectorAll('tbody tr td:nth-child(2)')).map((cell) => cell.textContent);
    await expect(names).toEqual(['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson']);

    await userEvent.click(sortButton);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    names = Array.from(canvasElement.querySelectorAll('tbody tr td:nth-child(2)')).map((cell) => cell.textContent);
    await expect(names).toEqual(['Katherine Johnson', 'Grace Hopper', 'Alan Turing', 'Ada Lovelace']);
  },
};

/** Select-all checks every row; unchecking one row drops select-all back to indeterminate. The selected set lives entirely in this demo, not in any Hmha component. */
export const SelectionInteraction: Story = {
  play: async ({ canvas }) => {
    const selectAll = canvas.getByRole('checkbox', { name: 'Select all rows' });
    await userEvent.click(selectAll);
    await expect(selectAll).toBeChecked();

    const firstRow = canvas.getByRole('checkbox', { name: 'Select Grace Hopper' });
    await userEvent.click(firstRow);
    await expect(firstRow).not.toBeChecked();
    await expect(selectAll).not.toBeChecked();
  },
};

/** ArrowRight/ArrowLeft on a resize handle grow/shrink its column — keyboard-operable, not pointer-drag-only. */
export const ResizingInteraction: Story = {
  play: async ({ canvas }) => {
    const handle = canvas.getByRole('separator', { name: 'Resize Name column' });
    const nameHeader = handle.closest('th') as HTMLElement;
    const before = nameHeader.getBoundingClientRect().width;

    handle.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

    const after = nameHeader.getBoundingClientRect().width;
    await expect(after).toBe(before + 30);
    await expect(handle).toHaveAttribute('aria-valuenow', String(Math.round(after)));
  },
};

/**
 * 500 rows, only a small window ever in the DOM at once, columns still
 * aligned with the static header — the composition pattern from the
 * README, proven rather than just asserted.
 *
 * `CdkVirtualScrollViewport` renders nothing on the first tick in a
 * zoneless app — its initial measurement happens on a later frame that
 * `whenStable()`/one `detectChanges()` doesn't wait for, confirmed by a
 * throwaway experiment outside any table context too (so it's a real
 * CDK/zoneless gap, not something this library's table nesting causes).
 * `waitFor` below is doing real work, not defensive padding.
 */
export const Virtualization: Story = {
  render: () => ({ template: '<data-grid-virtualized-demo />' }),
  play: async ({ canvasElement }) => {
    const bodyRows = await waitFor(() => {
      const rows = canvasElement.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      return rows;
    });
    await expect(bodyRows.length).toBeLessThan(30); // nowhere near all 500 rows

    const headerCells = canvasElement.querySelectorAll('th');
    const bodyCells = bodyRows[0].querySelectorAll('td');
    for (let i = 0; i < headerCells.length; i++) {
      await expect(Math.round(bodyCells[i].getBoundingClientRect().width)).toBe(
        Math.round(headerCells[i].getBoundingClientRect().width),
      );
    }
  },
};
