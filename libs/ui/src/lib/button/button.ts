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
    '[disabled]': 'disabled() || loading()',
  },
})
export class HmhaButton {
  readonly tone = input<HmhaTone>('neutral');
  readonly size = input<HmhaSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
