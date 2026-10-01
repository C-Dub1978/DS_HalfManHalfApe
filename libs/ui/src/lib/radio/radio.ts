import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import type { HmhaSize } from '../core/types';
import { HMHA_RADIO_GROUP } from './radio-group';

@Component({
  selector: 'input[hmhaRadio]',
  template: '',
  styleUrl: './radio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Forced, like hmhaCheckbox's type="checkbox" — the directive's whole
    // identity depends on it.
    type: 'radio',
    '[attr.name]': 'group.name()',
    '[attr.data-size]': 'size()',
    '[checked]': 'group.value() === value()',
    '[disabled]': 'disabled()',
    '[required]': 'group.required()',
    '(change)': 'group.select(value())',
  },
})
export class HmhaRadio {
  // Required, not optional — a radio outside a group has no group value to
  // compare itself against and no shared `name`, so it cannot function.
  protected readonly group = inject(HMHA_RADIO_GROUP);

  readonly value = input.required<string>();
  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
}
