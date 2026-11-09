import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { HMHA_SEGMENTED_CONTROL } from './segmented-control';

@Component({
  // A <label> wrapping its own native radio, so a segment is one element
  // to write and clicking anywhere on it selects (fork 48).
  selector: 'label[hmhaSegment]',
  template: `
    <input
      type="radio"
      class="hmha-segment-radio"
      [attr.name]="control.name"
      [value]="value()"
      [checked]="selected()"
      [disabled]="disabled()"
      [attr.aria-label]="label() ?? null"
      (change)="control.select(value())"
      (blur)="control.markTouched()"
    />
    <ng-content />
  `,
  styleUrl: './segment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-selected]': 'selected() ? "" : null',
  },
})
export class HmhaSegment {
  protected readonly control = inject(HMHA_SEGMENTED_CONTROL);

  readonly value = input.required<string>();
  /**
   * The accessible name, for a segment with no text (an icon on its own).
   * A segment with visible text is named by that text and needs none.
   */
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly selected = computed(() => this.control.value() === this.value());

  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    // The same rule as HmhaIconButton (fork 23): no text and no label means
    // no accessible name at all, so fail loudly rather than ship it. An
    // effect, not afterNextRender, so the error surfaces through change
    // detection; the segment's own effect runs after the parent has set the
    // projected text, interpolations included.
    effect(() => {
      if (!this.label() && !el.textContent?.trim()) {
        throw new Error(
          `HmhaSegment: \`label\` is required on a segment with no text (value "${this.value()}") — an icon-only segment has no other accessible name.`,
        );
      }
    });
  }
}
