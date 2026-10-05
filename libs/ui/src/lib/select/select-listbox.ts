import { ChangeDetectionStrategy, Component, afterNextRender, effect, inject } from '@angular/core';
import { CdkListbox } from '@angular/cdk/listbox';
import { HMHA_SELECT_TRIGGER } from './select-trigger';

@Component({
  selector: 'div[hmhaSelectListbox]',
  template: '<ng-content />',
  styleUrl: './select-listbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // role="listbox" is an ARIA input role and needs an accessible name of
    // its own — axe's aria-input-field-name rule catches its absence.
    // The trigger button's own text is that name.
    '[attr.aria-labelledby]': 'trigger.triggerId()',
  },
})
export class HmhaSelectListbox {
  protected readonly trigger = inject(HMHA_SELECT_TRIGGER);
  // CdkListbox already implements full ARIA (role="listbox", aria-selected
  // etc.) and keyboard navigation — per CLAUDE.md's "use @angular/cdk...
  // do not hand-roll" guidance, this only bridges it to HMHA_SELECT_TRIGGER,
  // never re-implements selection or key handling itself.
  private readonly cdkListbox = inject(CdkListbox<string>, { self: true });

  constructor() {
    effect(() => {
      const current = this.trigger.value();
      this.cdkListbox.value = current ? [current] : [];
    });

    this.cdkListbox.valueChange.subscribe((event) => {
      const [selected] = event.value;
      if (selected !== undefined) {
        this.trigger.selectValue(selected);
      }
    });

    // The listbox is freshly created every time it opens (hmhaOverlay
    // disposes and recreates on each open()), so it never already has
    // focus — this moves it in once content/value are both settled.
    // CdkListbox.focus() itself already focuses the currently-selected
    // option first, not always the first one, so reopening highlights
    // whatever was previously chosen.
    afterNextRender(() => this.cdkListbox.focus());
  }
}
