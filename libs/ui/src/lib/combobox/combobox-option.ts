import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Purely a token-driven styling wrapper — `cdkOption` (stacked on the
 * same host element: `<div hmhaComboboxOption cdkOption="United States">`)
 * already supplies role="option", aria-disabled, and click handling.
 * Unlike `HmhaSelectOption`, nothing here renders a "selected" state —
 * a combobox's options are suggestions, not a persistent choice; picking
 * one replaces the input's text rather than leaving an option checked.
 */
@Component({
  selector: 'div[hmhaComboboxOption]',
  template: '<ng-content />',
  styleUrl: './combobox-option.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // A <div> isn't focusable by mouse by default — without this, clicking
    // an option blurs HmhaComboboxInput (moving focus to <body>, since
    // this element doesn't take it), breaking the one guarantee this
    // whole component is built on: real focus stays in the input the
    // entire time. preventDefault() on mousedown stops the browser's
    // default focus-the-click-target step; CdkOption's own (click)
    // handler (a separate, later event) still fires normally afterward.
    '(mousedown)': 'onMouseDown($event)',
  },
})
export class HmhaComboboxOption {
  protected onMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }
}
