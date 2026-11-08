import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import type { HmhaTone } from '../core/types';

export type HmhaBadgeAppearance = 'subtle' | 'solid';

/** `null`/`undefined` stay `null` (not a count badge); anything else is a number. */
function optionalNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : numberAttribute(value, 0);
}

@Component({
  // A native <span>, never interactive: a badge reports something, it
  // can't be clicked or chosen. That's HmhaChip's job (fork 40).
  selector: 'span[hmhaBadge]',
  template: `
    @if (dot()) {
    } @else if (countText() !== null) {
      {{ countText() }}
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-dot]': 'dot() ? "" : null',
    // A dot is colour alone, which can't carry meaning by itself (WCAG
    // 1.4.1), so it's hidden; what it says must also be in text nearby.
    '[attr.aria-hidden]': 'dot() ? "true" : null',
    // A count of zero means nothing to report, unless asked to show it.
    '[attr.hidden]': 'countText() === "" ? "" : null',
  },
})
export class HmhaBadge {
  readonly tone = input<HmhaTone>('neutral');
  /** `subtle`: a tinted fill with dark text. `solid`: a strong fill with light text. */
  readonly appearance = input<HmhaBadgeAppearance>('subtle');
  /** Show a number instead of projected text. Above `max`, it reads "99+". */
  readonly count = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly max = input(99, { transform: numberAttribute });
  /** Show a count of 0 instead of hiding the badge. */
  readonly showZero = input(false, { transform: booleanAttribute });
  /** A small circle with no text, such as "online" on an avatar. */
  readonly dot = input(false, { transform: booleanAttribute });

  /** `null`: not a count badge. `''`: a zero count, hidden. */
  protected readonly countText = computed(() => {
    const count = this.count();
    if (count === null) return null;
    if (count <= 0 && !this.showZero()) return '';
    return count > this.max() ? `${this.max()}+` : String(count);
  });
}
