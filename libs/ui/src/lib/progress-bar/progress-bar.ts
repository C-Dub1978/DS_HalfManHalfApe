import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * The fill colours a progress bar can take. Deliberately not the full
 * `HmhaTone`: `neutral` has no fill role, and `warning` (amber) can't reach
 * 3:1 against a light track until DECISIONS.md's amber open item is fixed
 * (fork 36).
 */
export type HmhaProgressBarTone = 'primary' | 'success' | 'danger';

/** `null`/`undefined` stay `null` (indeterminate); anything else is a number. */
function optionalNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : numberAttribute(value, 0);
}

@Component({
  selector: 'progress[hmhaProgressBar]',
  // <progress> renders its own bar; there's nothing to template. Its track
  // and fill are engine pseudo-elements, styled in progress-bar.css.
  template: '',
  styleUrl: './progress-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // An attribute binding, not a property one: a <progress> is
    // indeterminate exactly when it has no value *attribute*, and only
    // removing the attribute (null here) returns it to that state.
    // Setting the `value` property can never make it indeterminate again.
    '[attr.value]': 'value()',
    '[attr.max]': 'max()',
    '[attr.data-tone]': 'tone()',
    '[attr.aria-valuetext]': 'valueText() ?? null',
  },
})
export class HmhaProgressBar {
  /**
   * Progress so far, from 0 to `max`. `null` (the default) is
   * indeterminate: something is happening, but how far along is unknown,
   * such as a transcode job still waiting in the queue.
   */
  readonly value = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly max = input(100, { transform: numberAttribute });
  readonly tone = input<HmhaProgressBarTone>('primary');
  /** Human-readable progress for assistive tech, such as "42 MB of 100 MB". */
  readonly valueText = input<string | null>(null);
}
