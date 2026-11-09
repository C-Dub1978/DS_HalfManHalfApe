import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { HmhaSize } from '../core/types';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

@Component({
  // A native <input> or, for multi-line text, a native <textarea>: one
  // component, one Forms and HmhaField integration (fork 46).
  selector: 'input[hmhaInput], textarea[hmhaInput]',
  template: '',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaInput), multi: true }],
  host: {
    '[attr.id]': 'field?.controlId() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-auto-grow]': 'autoGrow() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.aria-invalid]': 'isInvalid() ? true : null',
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
  /**
   * `<textarea>` only: grow with the content as the user types, up to
   * `--hmha-input-max-block-size`, then scroll. CSS `field-sizing`, so no
   * script; browsers without it keep `rows` and the drag handle.
   */
  readonly autoGrow = input(false, { transform: booleanAttribute });
  /**
   * A soft character limit: shown and announced by a wrapping HmhaField,
   * and the control goes invalid when over it. Typing and pasting past it
   * still work (no native `maxlength`, which silently cuts off pasted
   * text); pair it with `Validators.maxLength` to stop saving (fork 47).
   */
  readonly maxCharacters = input<number | null>(null);

  /** Characters as people see them: an emoji is one, not two UTF-16 units. */
  readonly characterCount = computed(() => Array.from(this.accessor.value() ?? '').length);
  protected readonly isInvalid = computed(() => {
    const max = this.maxCharacters();
    return this.invalid() || !!this.field?.invalid() || (max !== null && this.characterCount() > max);
  });

  constructor() {
    this.field?.registerCounter(
      computed(() => {
        const max = this.maxCharacters();
        return max === null ? null : { length: this.characterCount(), max };
      }),
    );
  }

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  protected onInput(event: Event): void {
    this.accessor.setValue((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
