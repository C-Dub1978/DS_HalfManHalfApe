import { ChangeDetectionStrategy, Component, InjectionToken, type Signal, forwardRef, inject, model } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';

/**
 * Shared by HmhaStepList/HmhaStep (navigation) and HmhaStepPanel
 * (visibility) — every piece is a descendant of the one HmhaStepper that
 * provides this, so DI resolves normally, the same shape as HMHA_TABS
 * (fork 18).
 */
export interface HmhaStepperContext {
  readonly value: Signal<string>;
  readonly rootId: string;
  select(value: string): void;
}

export const HMHA_STEPPER = new InjectionToken<HmhaStepperContext>('HMHA_STEPPER');

@Component({
  selector: 'div[hmhaStepper]',
  template: '<ng-content />',
  styleUrl: './stepper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_STEPPER, useExisting: forwardRef(() => HmhaStepper) }],
})
export class HmhaStepper implements HmhaStepperContext {
  readonly rootId = inject(_IdGenerator).getId('hmha-stepper-');

  /** The current step's value — required: there's no universally sensible default "first" step to assume. */
  readonly value = model.required<string>();

  select(value: string): void {
    this.value.set(value);
  }
}
