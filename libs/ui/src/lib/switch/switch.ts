import { ChangeDetectionStrategy, Component, booleanAttribute, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { HmhaSize } from '../core/types';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

@Component({
  selector: 'button[hmhaSwitch]',
  // <button> isn't a void element (unlike <input>), so — unique among the
  // form controls — this one gets a real template: a thumb element to
  // slide, rather than a CSS pseudo-element trick.
  template: '<span class="hmha-switch-thumb" aria-hidden="true"></span>',
  styleUrl: './switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaSwitch), multi: true }],
  host: {
    // No native <input type="switch"> exists reliably — role="switch" on a
    // native <button> is WAI-ARIA's own switch pattern. type="button"
    // guards against accidental form submission on click.
    type: 'button',
    role: 'switch',
    '[attr.id]': 'field?.controlId() ?? null',
    '[attr.data-size]': 'size()',
    // aria-checked is the accessibility state; data-checked is the styling
    // hook — kept separate per the data-* variant convention, even though
    // they're always in sync.
    '[attr.aria-checked]': 'accessor.value()',
    '[attr.data-checked]': 'accessor.value() ? "" : null',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[disabled]': 'disabled() || accessor.disabled()',
    '(click)': 'onClick()',
    '(blur)': 'accessor.markTouched()',
  },
})
export class HmhaSwitch implements ControlValueAccessor {
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  protected readonly accessor = hmhaValueAccessor(false);

  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  protected onClick(): void {
    this.accessor.setValue(!this.accessor.value());
  }
}
