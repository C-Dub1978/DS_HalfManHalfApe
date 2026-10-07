import { ChangeDetectionStrategy, Component, computed, contentChildren, forwardRef } from '@angular/core';
import { HmhaStep } from './step';
import { HMHA_STEP_LIST, type HmhaStepListContext } from './step-list-context';

/**
 * Provides HMHA_STEP_LIST from its own `contentChildren(HmhaStep)` —
 * DOM order is step order, same assumption HmhaTabList makes for tabs.
 */
@Component({
  selector: 'div[hmhaStepList]',
  template: '<ng-content />',
  styleUrl: './step-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_STEP_LIST, useExisting: forwardRef(() => HmhaStepList) }],
})
export class HmhaStepList implements HmhaStepListContext {
  private readonly steps = contentChildren(HmhaStep);
  readonly stepValues = computed(() => this.steps().map((step) => step.value()));
}
