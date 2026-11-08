import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { HmhaSize } from '../core/types';
import { HmhaIcon } from '../icon/icon';

@Component({
  // A custom element: no native element draws a rotating arc (fork 37).
  // `<progress>` was the alternative, but it can't hold the icon, and
  // drawing a ring from its engine pseudo-elements is fragile.
  selector: 'hmha-spinner',
  imports: [HmhaIcon],
  // The same Lucide arc the icon set already ships, so its stroke matches
  // every other icon. Sized through --hmha-icon-size in spinner.css.
  template: '<hmha-icon name="spinner" />',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Standalone: an indeterminate progressbar, the standard spinner role,
    // and the same thing an HmhaProgressBar with no value is. Decorative:
    // gone from the accessibility tree, for a spinner inside something
    // that already says it's busy (a loading HmhaButton sets aria-busy).
    '[attr.role]': 'decorative() ? null : "progressbar"',
    '[attr.aria-label]': 'decorative() ? null : label()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.data-size]': 'size()',
  },
})
export class HmhaSpinner {
  readonly size = input<HmhaSize>('md');
  /** The accessible name. Name what's loading where you can: "Loading catalog". */
  readonly label = input('Loading');
  /**
   * Hide it from assistive tech: no role, no name. For a spinner inside a
   * container that already announces its busy state, so it isn't
   * announced twice or folded into a button's name ("Save Loading").
   */
  readonly decorative = input(false, { transform: booleanAttribute });
}
