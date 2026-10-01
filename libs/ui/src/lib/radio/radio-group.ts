import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  type Signal,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

/**
 * DI contract each `HmhaRadio` injects (required, not optional — a radio
 * outside a group is meaningless) to read the group's shared `name` and
 * current value, and to select itself. Individual radios never hold their
 * own ControlValueAccessor or talk to HMHA_FIELD directly — only the group
 * does, per DECISIONS.md fork 09's deferred note.
 */
export interface HmhaRadioGroupContext {
  readonly name: Signal<string>;
  readonly value: Signal<string>;
  readonly required: Signal<boolean>;
  select(value: string): void;
}

export const HMHA_RADIO_GROUP = new InjectionToken<HmhaRadioGroupContext>('HMHA_RADIO_GROUP');

@Component({
  selector: 'fieldset[hmhaRadioGroup]',
  template: '<ng-content />',
  styleUrl: './radio-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaRadioGroup), multi: true },
    { provide: HMHA_RADIO_GROUP, useExisting: forwardRef(() => HmhaRadioGroup) },
  ],
  host: {
    // WAI-ARIA Authoring Practices' radio-group pattern: fieldset + legend
    // is the accessible-name mechanism, role="radiogroup" is what makes
    // aria-required/aria-invalid valid on this element at all — the
    // implicit role for a bare <fieldset> is "group", which ARIA doesn't
    // allow those attributes on.
    role: 'radiogroup',
    // Native <fieldset disabled> cascades to every descendant control for
    // free — individual radios don't need to separately check this. Note:
    // the cascade affects interaction/:disabled CSS/form submission, not
    // the child's own `.disabled` PROPERTY getter, which keeps reflecting
    // only its own attribute — see radio-group.spec.ts.
    '[disabled]': 'disabled() || accessor.disabled()',
    '[attr.aria-labelledby]': 'field?.labelId() ?? null',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
  },
})
export class HmhaRadioGroup implements ControlValueAccessor, HmhaRadioGroupContext {
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  protected readonly accessor = hmhaValueAccessor('');
  private readonly groupName = inject(_IdGenerator).getId('hmha-radio-group-');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly name = computed(() => this.groupName);
  readonly value = this.accessor.value;
  readonly required = computed(() => this.field?.required() ?? false);

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  select(value: string): void {
    this.accessor.setValue(value);
    this.accessor.markTouched();
  }
}
