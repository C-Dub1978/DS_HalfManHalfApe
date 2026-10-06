# HmhaTable

```html
<table hmhaTable>
  <thead>
    <tr>
      <th hmhaTableHeaderCell>Name</th>
      <th hmhaTableHeaderCell>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr hmhaTableRow>
      <td hmhaTableCell>Ada Lovelace</td>
      <td hmhaTableCell>Engineer</td>
    </tr>
    <tr hmhaTableRow>
      <td hmhaTableCell>Grace Hopper</td>
      <td hmhaTableCell>Admiral</td>
    </tr>
  </tbody>
</table>
```

Four attribute directives on native table elements — `HmhaTable`
(`table[hmhaTable]`), `HmhaTableRow` (`tr[hmhaTableRow]`),
`HmhaTableHeaderCell` (`th[hmhaTableHeaderCell]`) and `HmhaTableCell`
(`td[hmhaTableCell]`). Purely visual: borders, header styling, row striping
and hover. No sort, select, resize, or data model of any kind — that's
`HmhaDataGrid`'s job (`DECISIONS.md` fork 06/21). You write the
`<thead>`/`<tbody>` structure and the rows yourself, the same way you'd
write a plain HTML table.

**`HmhaTableRow` goes on body rows only.** A header row needs no directive
— striping and hover don't apply to it, and `HmhaTableHeaderCell` already
carries all the header's own visual treatment. Applying `hmhaTableRow` to a
`<thead>` row has no useful effect (nothing styles it) and no harmful one
either, but it's not what the directive is for.

## HmhaTableHeaderCell inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `scope` | `'col' \| 'row'` | `'col'` | Reflected as the native `scope` attribute. Simple tables only have column headers; set `'row'` on a header cell that labels its row instead. |
| `sort` | `'ascending' \| 'descending' \| 'none' \| null` | `null` | Reflected as `aria-sort` when set; unset (no attribute) by default, since a plain header isn't sortable. A Data Grid column sets this alongside `HmhaDataGridSortButton`'s own `active`/`direction` inputs — see `libs/ui/src/lib/data-grid/README.md`. |

## Component tokens — the override API

Declared on each piece's own `:host`, consumed in the same file.

| Token | Default | Declared by |
| --- | --- | --- |
| `--hmha-table-border` | `var(--hmha-color-border-strong)` | `HmhaTable` |
| `--hmha-table-bg` | `var(--hmha-color-surface)` | `HmhaTable` |
| `--hmha-table-fg` | `var(--hmha-color-text)` | `HmhaTable` |
| `--hmha-table-row-stripe-bg` | `var(--hmha-color-bg-subtle)` | `HmhaTableRow` |
| `--hmha-table-row-hover-bg` | `var(--hmha-color-surface-raised)` | `HmhaTableRow` |
| `--hmha-table-header-bg` | `var(--hmha-color-bg-subtle)` | `HmhaTableHeaderCell` |
| `--hmha-table-header-fg` | `var(--hmha-color-text)` | `HmhaTableHeaderCell` |
| `--hmha-table-cell-border` | `var(--hmha-color-border)` | `HmhaTableCell` |

Row padding and cell padding both come from `--hmha-control-padding-y`/
`--hmha-control-padding-x` — already density-aware, so a table nested under
`data-hmha-density="compact"` gets tighter rows for free, with no input of
its own to set.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity
— per the encapsulation contract in `DECISIONS.md` fork 05. Set a component
token instead.
