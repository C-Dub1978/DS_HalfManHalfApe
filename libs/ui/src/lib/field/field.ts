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
 */
export interface HmhaFieldContext {
  readonly controlId: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly describedBy: Signal<string | null>;
}

export const HMHA_FIELD = new InjectionToken<HmhaFieldContext>('HMHA_FIELD');

@Component({
  selector: 'hmha-field',
  template: `
    <label [attr.for]="controlId()" class="hmha-field-label">
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

  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  readonly controlId = computed(() => this.id);
  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed<string | null>(() => {
    if (this.error()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });
}
