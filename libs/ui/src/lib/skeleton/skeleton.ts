import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type HmhaSkeletonShape = 'text' | 'circle' | 'rect';

@Component({
  // On a plain <span> or <div>, so a placeholder goes wherever the real
  // content will: inside a table cell, a card, a poster grid. The consumer
  // lays the blocks out with their own markup (fork 38).
  selector: 'span[hmhaSkeleton], div[hmhaSkeleton]',
  template: '',
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Always hidden: a placeholder has nothing to read. The container being
    // loaded says it's busy instead, with aria-busy (see README).
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
    // A consumer's own runtime length, not a token, the same shape as
    // HmhaDivider's `length` (fork 28). Null leaves the CSS default.
    '[style.inline-size]': 'width()',
    '[style.block-size]': 'height()',
  },
})
export class HmhaSkeleton {
  /** `text`: one line of the surrounding font. `circle`: an avatar. `rect`: a poster, thumbnail or card. */
  readonly shape = input<HmhaSkeletonShape>('text');
  /** Any CSS length: `'60%'` for a short last line, `'12rem'`. */
  readonly width = input<string | null>(null);
  /** Any CSS length. A `rect` defaults to 16:9 when no height is given. */
  readonly height = input<string | null>(null);
}
