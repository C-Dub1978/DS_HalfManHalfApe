# HmhaDataGrid

```html
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
```

A plain directive, not a component — it stacks on `table[hmhaTable]` with
no conflict, the same way `HmhaIconButton` stacks on `HmhaButton`.
`HmhaTable` already owns the table's visual styling; two components can't
match the same host element, which is why this isn't built on
`@angular/cdk/table` (see `DECISIONS.md` fork 22 for the full
reconsideration — the first proposal hit exactly that wall).

Rendering is just `HmhaTable`'s existing pieces plus your own `@for` —
there's no row model, no `dataSource`, nothing to configure. You own the
array, the `track` expression, and re-rendering on changes, the same way
you would with a plain table. `hmhaDataGrid` itself does exactly one
thing: sets `table-layout: fixed`, which column resizing (step 3e) needs
stable widths to work against.

## Sorting

```html
<th hmhaTableHeaderCell [sort]="sortColumn() === 'name' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : 'none'">
  <button
    hmhaDataGridSortButton
    [active]="sortColumn() === 'name'"
    [direction]="sortDir()"
    (sortRequest)="onSort('name', $event)"
  >
    Name
  </button>
</th>
```

`HmhaDataGridSortButton` (`button[hmhaDataGridSortButton]`) is purely an
intent emitter — clicking it never sorts anything. It suggests the next
direction as a simple two-state cycle (ascending ⇄ descending, never a
third "unsorted" state) via `sortRequest`, and the consumer decides what
to actually do with it: re-sort their own array, then feed the real
current state back through `active`/`direction` so the button's own
indicator (and the header cell's `aria-sort`, set separately on
`HmhaTableHeaderCell` — see its own README) stay correct. Each column's
button is independent; there's no coordination between them, matching
fork 21 — nothing stops a consumer from allowing multiple columns sorted
at once if that's what they want.

```ts
protected onSort(column: string, direction: HmhaSortDirection): void {
  this.sortColumn.set(column);
  this.sortDir.set(direction);
  this.rows.update((rows) => [...rows].sort(/* ... */));
}
```

## Selection

```html
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
```

```html
<td hmhaTableCell>
  <input
    type="checkbox"
    hmhaCheckbox
    [attr.aria-label]="'Select ' + row.name"
    [ngModel]="isSelected(row.id)"
    (ngModelChange)="toggle(row.id)"
  />
</td>
```

**Neither checkbox has visible text of its own, so each needs an explicit
`aria-label`** — axe's `label` rule catches this immediately if you drop
it (found exactly this way while writing this step's own test, not by
inspection). Word the per-row label around something that identifies the
row, not just "Select row" repeated identically for every row.

No dedicated component here either — `HmhaCheckbox` is reused directly,
bound with `[ngModel]`/`(ngModelChange)` (works on any `ControlValueAccessor`
without a `FormGroup`/`FormControl` per row) rather than `[checked]`/
`(change)`, since `HmhaCheckbox` already claims those natively for its own
Forms integration. `indeterminate` (added to `HmhaCheckbox` in this step —
see its own README) is purely visual and has nothing to do with the
checked value, which is why it's a separate input rather than a third
checked state.

The selected-ids set is consumer-owned (fork 21), and the select-all
tri-state is a `computed()` the consumer writes themselves — not
something `HmhaDataGrid` tracks, since it would need to know about every
rendered row to get right, which is exactly the kind of cross-cutting
state this architecture keeps out of the component:

```ts
private readonly selection = new SelectionModel<RowId>(true);
private readonly selected = signal<ReadonlySet<RowId>>(new Set());

readonly allSelected = computed(() => rows().length > 0 && rows().every((row) => selected().has(row.id)));
readonly someSelected = computed(() => !allSelected() && rows().some((row) => selected().has(row.id)));

constructor() {
  this.selection.changed.pipe(takeUntilDestroyed()).subscribe(() => {
    this.selected.set(new Set(this.selection.selected));
  });
}
```

`SelectionModel` (`@angular/cdk/collections`) is real CDK, not Material —
a plain class with no template or component-conflict surface, used purely
as bookkeeping convenience. Its `changed` stream is RxJS, not a signal;
bridge it with `takeUntilDestroyed()` the way every other signal-based
piece in this library still occasionally touches RxJS at an integration
boundary. Using it is optional — a plain mutable `Set` works too.

## Column resizing

```html
<th hmhaTableHeaderCell>
  Name
  <div hmhaDataGridResizeHandle label="Resize Name column"></div>
</th>
```

`HmhaDataGridResizeHandle` (`div[hmhaDataGridResizeHandle]`) sits inside
the header cell it resizes and finds its own column via `closest('th')` —
a plain DOM query, not DI, since there's nothing to coordinate with a
parent for. `width` is internal-by-default: a bare handle with no bindings
at all still works, out of the box. It's also a `model()`, so a consumer
who wants to persist widths across sessions can read it (and restore it on
init by binding `[width]`) like any other two-way-bound value in this
library.

**`label` is required, with no generic fallback** — "Resize column"
repeated identically on every header would be exactly the ambiguous-label
mistake the Selection section above just made and fixed. Name the column:
`"Resize Name column"`, not `"Resize column"`.

Implements the WAI-ARIA `separator` pattern properly, not just the pointer
half of it: focusable, `role="separator"`, `aria-orientation="vertical"`,
and ArrowLeft/ArrowRight resize it in fixed steps in addition to pointer
drag — a drag-only resize handle would be entirely unusable from the
keyboard. `aria-valuenow` is always present once the column has rendered,
not only after the first interaction: WAI-ARIA requires it whenever a
separator is focusable, and a resize handle always is. Needing to reflect
*something* before any resize at all — the column's real measured
width — surfaced this as a real gap during this step's own testing, not
by inspection.

`minWidth` (default `48`) keeps a column from being dragged to nothing;
`maxWidth` is unset by default. Both clamp pointer drag and keyboard
resizing identically.

**Don't give a resizable column's `<th>` a `<colgroup>`/`<col>` as well.**
Under `table-layout: fixed`, a `<col>`'s declared width is the
authoritative source for that column and wins over the resize handle's
own `th.style.width` mutation — the handle updates its model, its
`aria-valuenow`, everything *except* the one thing a consumer would
actually see, with no error anywhere to say so (found in the Wave 4 gate,
`apps/sandbox`'s Directory screen, purely by measuring the rendered width
and finding it hadn't moved). Set the initial width directly on the `<th>`
instead (`style="width: 160px"`, as the examples above do) for any column
that has a resize handle. A `<colgroup>` is still fine for a column in the
same table that *isn't* resizable.

## Composing virtualization

Not a component either — but the composition is more specific than
"wrap it and it works." The viewport has to wrap the **entire table**,
with a sticky `<thead>`, not just the `<tbody>` rows:

```html
<cdk-virtual-scroll-viewport itemSize="41" tabindex="0" style="height: 400px; width: 100%;">
  <table hmhaTable hmhaDataGrid>
    <colgroup>
      <col style="width: 160px" />
      <col style="width: 240px" />
    </colgroup>
    <thead style="position: sticky; top: 0;">
      <tr>
        <th hmhaTableHeaderCell>ID</th>
        <th hmhaTableHeaderCell>Name</th>
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
```

**Putting `<cdk-virtual-scroll-viewport>` directly inside `<tbody>`
instead — wrapping just the rows — was this step's first attempt, and it
doesn't work**, even though it compiles and renders with no error. CSS's
anonymous-table-object rules treat that div-shaped element as something
that has to fit inside the column grid, and it gets squeezed to roughly
one column's width instead of the table's full width — every column's
layout visibly breaks. Confirmed by measuring actual rendered widths in a
throwaway experiment, not by inspection. Wrapping the whole table instead
sidesteps the problem entirely: the viewport is then a plain scrolling
box around a normal block-level `<table>`, nothing CSS needs to
special-case, and the sticky `<thead>` stays pinned using ordinary
`position: sticky` relative to the viewport as its nearest scrolling
ancestor.

A `<colgroup>` with explicit widths matters more here than it does for a
non-virtualized table — it's what keeps column widths anchored
regardless of which row the fixed-layout algorithm happens to see first.

**`CdkVirtualScrollViewport` renders nothing on the first tick in a
zoneless app.** Its initial measurement happens on a later frame that a
single `whenStable()`/`detectChanges()` doesn't wait for — confirmed with
the viewport in complete isolation, outside any table context, so it's a
real CDK/zoneless timing gap, not something this library's composition
causes. Don't assert on rendered rows immediately; wait for them (a
`waitFor`-style poll, or an extra frame) first.

**Give the viewport `tabindex="0"`.** Without it, axe's
`scrollable-region-focusable` rule correctly flags it — a scrollable
region with no native way to reach it by keyboard is a real, common
accessibility gap (particularly for Safari/VoiceOver), not specific to
this library's usage.

Opt-in, and the consumer's own choice — a grid used with `HmhaPagination`
has no reason to virtualize at all.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by
specificity — per the encapsulation contract in `DECISIONS.md` fork 05.
All visual styling lives in `HmhaTable`'s own component tokens; there are
none declared here, since this directive has no visual output of its own.
