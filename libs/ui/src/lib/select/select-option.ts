import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CdkOption } from '@angular/cdk/listbox';
import { HmhaIcon } from '../icon/icon';

/**
 * Mostly a token-driven styling wrapper — `cdkOption` (stacked on the same
 * host element: `<div hmhaSelectOption cdkOption="us">`) already supplies
 * role="option", aria-selected, aria-disabled, tabindex and click/keyboard
 * handling. Styling hooks into CDK's own `[aria-selected]` and
 * `.cdk-option-active` rather than tracking either state again here.
 *
 * The one piece of real content this adds: a trailing checkmark for the
 * selected option. An earlier colored-text treatment failed WCAG AA
 * contrast specifically when an option was both selected and
 * active/hovered (blue text on the active background, 4.46:1) — a real
 * visual bug, not a test artifact. A checkmark sidesteps text-contrast
 * entirely and matches how most native select/listbox UIs show selection.
 */
@Component({
  selector: 'div[hmhaSelectOption]',
  template: `
    <ng-content />
    @if (cdkOption.isSelected()) {
      <hmha-icon name="check" size="sm" />
    }
  `,
  styleUrl: './select-option.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HmhaIcon],
})
export class HmhaSelectOption {
  protected readonly cdkOption = inject(CdkOption, { self: true });
}
