import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { HMHA_STEPPER } from './stepper';

@Component({
  selector: 'div[hmhaStepPanel]',
  template: '<ng-content />',
  styleUrl: './step-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'panelId()',
    '[hidden]': '!isSelected()',
  },
})
export class HmhaStepPanel {
  private readonly stepper = inject(HMHA_STEPPER);

  readonly value = input.required<string>();

  protected readonly isSelected = computed(() => this.stepper.value() === this.value());
  protected readonly panelId = computed(() => `${this.stepper.rootId}-steppanel-${this.value()}`);
}
