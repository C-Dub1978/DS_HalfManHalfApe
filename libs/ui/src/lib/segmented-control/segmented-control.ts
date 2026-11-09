import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  type Signal,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import type { HmhaSize } from '../core/types';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

/**
 * DI contract each `HmhaSegment` injects (required: a segment outside a
 * control has no value to compare against and no shared `name`, as fork
 * 11's radios).
 */
export interface HmhaSegmentedControlContext {
  readonly name: string;
  readonly value: Signal<string>;
  select(value: string): void;
  markTouched(): void;
}

export const HMHA_SEGMENTED_CONTROL = new InjectionToken<HmhaSegmentedControlContext>('HMHA_SEGMENTED_CONTROL');

@Component({
  // A native <fieldset> of native radios drawn as one joined control
  // (fork 48): the browser supplies one Tab stop, arrow keys that move and
  // select, wrap and RTL, and "1 of 3, selected" for screen readers.
  selector: 'fieldset[hmhaSegmentedControl]',
  template: '<ng-content />',
  styleUrl: './segmented-control.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaSegmentedControl), multi: true },
    { provide: HMHA_SEGMENTED_CONTROL, useExisting: forwardRef(() => HmhaSegmentedControl) },
  ],
  host: {
    // The radio-group pattern, as HmhaRadioGroup (fork 11). Native
    // <fieldset disabled> cascades to every segment's radio.
    role: 'radiogroup',
    '[attr.data-size]': 'size()',
    '[disabled]': 'disabled() || accessor.disabled()',
    '[attr.aria-labelledby]': 'field?.labelId() ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class HmhaSegmentedControl implements ControlValueAccessor, HmhaSegmentedControlContext {
  protected readonly field = inject(HMHA_FIELD, { optional: true });

  /**
   * The selected segment's `value`. Two-way bindable on its own (a view
   * switcher with no form) and also the value Forms reads and writes,
   * through the same signal (fork 35). Give it a starting value: once a
   * segment is picked, native radios can't be unselected.
   */
  readonly value = model('');
  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly name = inject(_IdGenerator).getId('hmha-segmented-control-');
  protected readonly accessor = hmhaValueAccessor<string>(this.value);

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  select(value: string): void {
    this.accessor.setValue(value);
  }

  markTouched(): void {
    this.accessor.markTouched();
  }
}
