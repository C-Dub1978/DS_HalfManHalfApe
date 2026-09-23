import { Directive, input } from '@angular/core';

/**
 * Stacks on `hmhaButton` on the same native <button> — it does not style
 * anything itself. `button.css` owns the square sizing, gated on the
 * `data-icon-only` attribute this directive sets, so there is exactly one
 * source of truth for button visuals.
 */
@Directive({
  selector: 'button[hmhaButton][hmhaIconButton]',
  host: {
    '[attr.aria-label]': 'label()',
    '[attr.data-icon-only]': "''",
  },
})
export class HmhaIconButton {
  readonly label = input.required<string>();
}
