import { Directive, effect, input } from '@angular/core';

/**
 * Stacks on `hmhaButton` on the same native <button> — it does not style
 * anything itself. `button.css` owns the square sizing, gated on the
 * `data-icon-only` attribute this directive sets only for `iconPosition()
 * === 'only'`, so there is exactly one source of truth for button visuals.
 *
 * The icon/text order for `'leading'`/`'trailing'` is entirely the
 * consumer's own content order (`<hmha-icon/>Save` vs. `Next<hmha-icon/>`)
 * — this directive has no template of its own, so it has no way to
 * reorder projected content and doesn't try to (fork 23).
 */
@Directive({
  selector: 'button[hmhaButton][hmhaIconButton]',
  host: {
    '[attr.aria-label]': 'label() ?? null',
    '[attr.data-icon-only]': "iconPosition() === 'only' ? '' : null",
  },
})
export class HmhaIconButton {
  readonly iconPosition = input<'only' | 'leading' | 'trailing'>('only');
  readonly label = input<string>();

  constructor() {
    effect(() => {
      if (this.iconPosition() === 'only' && !this.label()) {
        throw new Error(
          'HmhaIconButton: `label` is required when iconPosition is "only" (the default) — an icon-only button has no other accessible name.',
        );
      }
    });
  }
}
