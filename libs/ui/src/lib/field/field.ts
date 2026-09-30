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
import { _IdGenerator } from '@angular/cdk/a11y';

/**
 * DI contract a wrapped control optionally injects
 * (`inject(HMHA_FIELD, { optional: true })`) to reflect the field's
 * id/invalid/required/describedBy state onto itself. Keeps HmhaField
 * decoupled from knowing what control it wraps — Input, Checkbox,
 * RadioGroup, Switch, or a consumer's own custom control all consume the
 * same contract.
 *
 * `labelId` exists because `<label for>` only associates with labelable
 * elements (input, select, textarea, button, output, meter, progress) — a
 * `<fieldset>` (what HmhaRadioGroup wraps) isn't one of them. A control
 * built on a non-labelable host binds `[attr.aria-labelledby]="labelId()"`
 * instead of relying on `controlId`/`for`.
 */
export interface HmhaFieldContext {
  readonly controlId: Signal<string>;
  readonly labelId: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly describedBy: Signal<string | null>;
}

export const HMHA_FIELD = new InjectionToken<HmhaFieldContext>('HMHA_FIELD');

@Component({
  selector: 'hmha-field',
  template: `
    <label [attr.for]="controlId()" [id]="labelElId" class="hmha-field-label">
      <span>{{ label() }}</span>
      @if (required()) {
        <span class="hmha-field-required" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (error()) {
      <div [id]="errorId" class="hmha-field-error" role="alert">{{ error() }}</div>
    } @else if (hint()) {
      <div [id]="hintId" class="hmha-field-hint">{{ hint() }}</div>
    }
  `,
  styleUrl: './field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'hmhaField',
  providers: [{ provide: HMHA_FIELD, useExisting: forwardRef(() => HmhaField) }],
})
export class HmhaField implements HmhaFieldContext {
  private readonly id = inject(_IdGenerator).getId('hmha-field-');
  protected readonly hintId = `${this.id}-hint`;
  protected readonly errorId = `${this.id}-error`;
  protected readonly labelElId = `${this.id}-label`;

  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  readonly controlId = computed(() => this.id);
  readonly labelId = computed(() => this.labelElId);
  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed<string | null>(() => {
    if (this.error()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });
}
