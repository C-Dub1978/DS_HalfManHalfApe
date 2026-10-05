# HmhaPagination

```html
<nav hmhaPagination [(page)]="page" [pageCount]="pageCount"></nav>
```

An attribute directive on the native `<nav>` landmark element. Purely
structural — it has no idea how many rows exist, what a page size is, or
where the data comes from. The consumer computes `pageCount` from their own
data length and page size, slices their own array (or issues their own
server request) when `page` changes, and owns that state entirely. See
`DECISIONS.md` fork 21.

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | `number` | — (required) | 1-indexed current page. Two-way bindable: `[(page)]`. |
| `pageCount` | `number` | — (required) | Total page count. Computed by the consumer, never by this component. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Reflected as `data-size`; passed down to the internal buttons and icons. |
| `disabled` | `boolean` | `false` | Disables every button, e.g. while the consumer's data is loading. |
| `ariaLabel` | `string` | `'Pagination'` | The `<nav>`'s `aria-label`. Give each a distinct label if a page has more than one pagination control. |
| `previousLabel` | `string` | `'Previous page'` | Accessible label for the previous-page button. |
| `nextLabel` | `string` | `'Next page'` | Accessible label for the next-page button. |

## Page window

Always shows page 1, the last page, and the current page's immediate
neighbours, collapsing any wider gap to a single ellipsis — e.g. page 5 of
20 renders `1 … 4 5 6 … 20`. The window isn't configurable; it's a fixed,
small default rather than another input to maintain.

## Composing with your own data

```ts
readonly page = signal(1);
readonly pageSize = 10;
readonly allRows = signal<Row[]>([...]);

readonly pageCount = computed(() => Math.max(1, Math.ceil(this.allRows().length / this.pageSize)));
readonly visibleRows = computed(() => {
  const start = (this.page() - 1) * this.pageSize;
  return this.allRows().slice(start, start + this.pageSize);
});
```

```html
<nav hmhaPagination [(page)]="page" [pageCount]="pageCount()"></nav>
```

Nothing here is specific to an in-memory array — a consumer doing
server-side paging sets `page` the same way and refetches in an `effect()`
or a resource reacting to it instead.

## Unsupported

`::ng-deep`, selectors targeting internal DOM, or overriding by specificity
— per the encapsulation contract in `DECISIONS.md` fork 05. The internal
buttons are plain `HmhaButton`/`HmhaIconButton` instances; style the control
through their own component tokens if you need to, not by reaching into
`HmhaPagination`'s template.
