import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, model } from '@angular/core';

/**
 * Placed inside a `th[hmhaTableHeaderCell]`, alongside the column's label
 * (and optionally its `HmhaDataGridSortButton`). Finds its own column via
 * `closest('th')` rather than DI — there's nothing to coordinate with a
 * parent for, and a plain DOM query is simpler and more robust than a
 * token just to reach one ancestor. `width` is internal-by-default (an
 * uninteracted handle still works, no bindings required) but is a
 * `model()`, so a consumer who wants to persist widths can read/restore
 * it like any other two-way-bound value (fork 21/22).
 *
 * Implements the WAI-ARIA `separator` pattern: focusable, `role="separator"`,
 * arrow-key resizing in addition to pointer drag — a drag-only resize
 * handle would be unusable from the keyboard.
 */
@Component({
  selector: 'div[hmhaDataGridResizeHandle]',
  template: '',
  styleUrl: './data-grid-resize-handle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    'aria-orientation': 'vertical',
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '[attr.aria-valuemin]': 'minWidth()',
    '[attr.aria-valuemax]': 'maxWidth()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HmhaDataGridResizeHandle {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // No sensible generic default — "Resize column" repeated on every
  // header would be exactly the ambiguous-label mistake fork 21's
  // selection step just made and fixed (DECISIONS.md step 3d).
  readonly label = input.required<string>();
  readonly minWidth = input(48);
  readonly maxWidth = input<number | null>(null);
  readonly step = input(10);
  readonly width = model<number | null>(null);

  private pointerId: number | null = null;
  private dragStartX = 0;
  private dragStartWidth = 0;

  constructor() {
    effect(() => {
      const column = this.columnElement();
      const width = this.width();
      if (column && width !== null) {
        column.style.width = `${width}px`;
      }
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    const column = this.columnElement();
    if (!column) {
      return;
    }
    this.pointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartWidth = this.width() ?? column.getBoundingClientRect().width;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.pointerId === null || event.pointerId !== this.pointerId) {
      return;
    }
    const delta = event.clientX - this.dragStartX;
    this.width.set(this.clamp(this.dragStartWidth + delta));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerId === null || event.pointerId !== this.pointerId) {
      return;
    }
    (event.target as HTMLElement).releasePointerCapture(this.pointerId);
    this.pointerId = null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    const column = this.columnElement();
    if (!column) {
      return;
    }
    const current = this.width() ?? column.getBoundingClientRect().width;
    const delta = event.key === 'ArrowRight' ? this.step() : -this.step();
    this.width.set(this.clamp(current + delta));
    event.preventDefault();
  }

  // WAI-ARIA's separator pattern requires aria-valuenow whenever the
  // separator is focusable/interactive — a resize handle always is, so
  // this always reports something, measuring the rendered column when
  // the model hasn't been touched yet rather than omitting the attribute.
  protected ariaValueNow(): number | null {
    const width = this.width();
    if (width !== null) {
      return Math.round(width);
    }
    const column = this.columnElement();
    return column ? Math.round(column.getBoundingClientRect().width) : null;
  }

  private clamp(width: number): number {
    const max = this.maxWidth();
    const clampedToMin = Math.max(this.minWidth(), width);
    return max === null ? clampedToMin : Math.min(max, clampedToMin);
  }

  private columnElement(): HTMLElement | null {
    return this.elementRef.nativeElement.closest('th');
  }
}
