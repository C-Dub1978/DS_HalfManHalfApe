import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { HmhaIcon } from '../icon/icon';
import { HMHA_STEPPER } from './stepper';
import { HMHA_STEP_LIST } from './step-list-context';

export type HmhaStepState = 'completed' | 'active' | 'upcoming';

/**
 * A native `<button>` — clickable to jump back to a `completed` step
 * (real, deliberate linear-progression semantics, not just a Tab that
 * can be clicked directly regardless of position, fork 24) but disabled
 * for an `upcoming` one, since there's nothing to show yet. `hasError`
 * is a separate, consumer-set input, independent of position: a
 * `completed` step can still have an error found on revalidation.
 */
@Component({
  selector: 'button[hmhaStep]',
  imports: [HmhaIcon],
  template: `
    <span class="hmha-step-indicator" aria-hidden="true">
      @if (hasError()) {
        <hmha-icon name="triangle-alert" size="sm" />
      } @else if (state() === 'completed') {
        <hmha-icon name="check" size="sm" />
      } @else {
        {{ stepNumber() }}
      }
    </span>
    <ng-content />
  `,
  styleUrl: './step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[attr.data-state]': 'state()',
    '[attr.data-error]': 'hasError() ? \'\' : null',
    '[attr.aria-current]': "state() === 'active' ? 'step' : null",
    '[disabled]': '!reachable() || disabledInput()',
    '(click)': 'onClick()',
  },
})
export class HmhaStep {
  private readonly stepper = inject(HMHA_STEPPER);
  private readonly stepList = inject(HMHA_STEP_LIST);

  readonly value = input.required<string>();
  readonly hasError = input(false, { transform: booleanAttribute });
  readonly disabledInput = input(false, { transform: booleanAttribute, alias: 'disabled' });

  protected readonly stepIndex = computed(() => this.stepList.stepValues().indexOf(this.value()));
  protected readonly currentIndex = computed(() => this.stepList.stepValues().indexOf(this.stepper.value()));
  protected readonly stepNumber = computed(() => this.stepIndex() + 1);

  protected readonly state = computed<HmhaStepState>(() => {
    const diff = this.stepIndex() - this.currentIndex();
    if (diff < 0) return 'completed';
    if (diff === 0) return 'active';
    return 'upcoming';
  });

  protected readonly reachable = computed(() => this.state() !== 'upcoming');

  protected onClick(): void {
    if (this.reachable() && !this.disabledInput()) {
      this.stepper.select(this.value());
    }
  }
}
