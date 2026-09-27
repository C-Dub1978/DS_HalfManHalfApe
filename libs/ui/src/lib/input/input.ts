import { ChangeDetectionStrategy, Component, booleanAttribute, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { HmhaSize } from '../core/types';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

@Component({
  selector: 'input[hmhaInput]',
  template: '',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaInput), multi: true }],
  host: {
    '[attr.id]': 'field?.controlId() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[disabled]': 'disabled() || accessor.disabled()',
    '[value]': 'accessor.value()',
    '(input)': 'onInput($event)',
    '(blur)': 'accessor.markTouched()',
  },
})
export class HmhaInput implements ControlValueAccessor {
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  protected readonly accessor = hmhaValueAccessor('');

  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  protected onInput(event: Event): void {
    this.accessor.setValue((event.target as HTMLInputElement).value);
  }
}
