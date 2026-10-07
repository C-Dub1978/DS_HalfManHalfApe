import { Directive, input } from '@angular/core';

/**
 * Stacks on `hmhaDialog` on the same native <dialog> — it carries no
 * logic of its own (open/dismiss/focus-trap/backdrop all already come
 * from HmhaDialog + native showModal(), DECISIONS.md fork 14) and no
 * template, so its visual rules live in `dialog.css` itself, gated on
 * the `data-placement` attribute this directive sets — the same shape
 * as `HmhaIconButton` stacking on `HmhaButton` (fork 23). See fork 26
 * for why this is a directive, not a new component.
 */
@Directive({
  selector: 'dialog[hmhaDialog][hmhaDrawer]',
  host: {
    '[attr.data-placement]': 'placement()',
  },
})
export class HmhaDrawer {
  readonly placement = input<'start' | 'end'>('start');
}
