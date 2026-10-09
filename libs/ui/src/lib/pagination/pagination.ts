import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model } from '@angular/core';
import { HmhaButton } from '../button/button';
import { HmhaIconButton } from '../button/icon-button';
import type { HmhaSize } from '../core/types';
import { HmhaIcon } from '../icon/icon';

type HmhaPaginationItem = { readonly type: 'page'; readonly value: number } | { readonly type: 'ellipsis' };

/**
 * Purely structural: takes a current page and a page count, emits page
 * changes via `[(page)]`. It never sees the backing data array, a page
 * size, or how many rows exist — that stays with the consumer, same as
 * Select's trigger-label and Combobox's filtering (fork 21).
 */
@Component({
  selector: 'nav[hmhaPagination]',
  imports: [HmhaButton, HmhaIconButton, HmhaIcon],
  template: `
    <button
      hmhaButton
      hmhaIconButton
      [label]="previousLabel()"
      [size]="size()"
      [disabled]="disabled() || page() <= 1"
      (click)="goTo(page() - 1)"
    >
      <hmha-icon name="chevron-left" [size]="size()" />
    </button>

    @for (item of items(); track item.type === 'page' ? 'p' + item.value : 'e' + $index) {
      @if (item.type === 'page') {
        <button
          hmhaButton
          [tone]="item.value === page() ? 'primary' : 'neutral'"
          [size]="size()"
          [disabled]="disabled()"
          [attr.aria-current]="item.value === page() ? 'page' : null"
          [attr.aria-label]="'Page ' + item.value"
          (click)="goTo(item.value)"
        >{{ item.value }}</button>
      } @else {
        <span class="hmha-pagination-ellipsis" aria-hidden="true">&hellip;</span>
      }
    }

    <button
      hmhaButton
      hmhaIconButton
      [label]="nextLabel()"
      [size]="size()"
      [disabled]="disabled() || page() >= pageCount()"
      (click)="goTo(page() + 1)"
    >
      <hmha-icon name="chevron-right" [size]="size()" />
    </button>
  `,
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-size]': 'size()',
  },
})
export class HmhaPagination {
  /** 1-indexed current page. Required — there's no sensible default to assume. */
  readonly page = model.required<number>();
  /** Total page count. Owned and computed by the consumer from their own data length / page size. */
  readonly pageCount = input.required<number>();
  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('Pagination');
  readonly previousLabel = input('Previous page');
  readonly nextLabel = input('Next page');

  // Always shows page 1, the last page, and the current page's immediate
  // neighbours, filling gaps wider than one page with a single ellipsis.
  protected readonly items = computed<HmhaPaginationItem[]>(() => {
    const total = this.pageCount();
    if (total <= 1) {
      return [];
    }

    const current = this.page();
    const pages = new Set<number>([1, total]);
    for (let p = current - 1; p <= current + 1; p++) {
      if (p >= 1 && p <= total) {
        pages.add(p);
      }
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const result: HmhaPaginationItem[] = [];
    let previous = 0;
    for (const p of sorted) {
      if (p - previous > 1) {
        result.push({ type: 'ellipsis' });
      }
      result.push({ type: 'page', value: p });
      previous = p;
    }
    return result;
  });

  protected goTo(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) {
      return;
    }
    this.page.set(page);
  }
}
