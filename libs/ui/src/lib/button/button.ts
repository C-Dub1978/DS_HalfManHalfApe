import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { HmhaSize, HmhaTone } from '../core/types';

@Component({
  selector: 'button[hmhaButton]',
  template: '<ng-content />',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.aria-busy]': 'loading() || null',
    // null (the default) is an ordinary button: no aria-pressed at all, so
    // every existing button is untouched. true/false makes it a toggle
    // button, announced as "pressed"/"not pressed" (fork 45).
    '[attr.aria-pressed]': 'pressed() ?? null',
    '[attr.data-pressed]': 'pressed() ? "" : null',
    '[disabled]': 'disabled() || loading()',
  },
})
export class HmhaButton {
  readonly tone = input<HmhaTone>('neutral');
  readonly size = input<HmhaSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Make this a toggle button. Keep its label the same in both states
   * ("Mute", pressed or not); the button never flips itself: your click
   * handler changes your state, and this reflects it.
   */
  readonly pressed = input<boolean | null>(null);
}
