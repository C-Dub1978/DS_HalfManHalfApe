import { ChangeDetectionStrategy, Component, ElementRef, contentChildren, inject } from '@angular/core';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HMHA_COMBOBOX_INPUT } from './combobox-input';

/**
 * Must be used with `cdkListboxUseActiveDescendant="true"` — real DOM
 * focus stays in `HmhaComboboxInput` the whole time (that's the point: a
 * combobox has to keep accepting keystrokes while the user navigates
 * suggestions), so CdkListbox tracks the "active" option virtually via
 * aria-activedescendant instead of moving focus onto it. CdkListbox's own
 * (keydown) host listener still lives on this element, though — the
 * input forwards relevant keydowns here directly (see combobox-input.ts).
 */
@Component({
  selector: 'div[hmhaComboboxListbox]',
  template: '<ng-content />',
  styleUrl: './combobox-listbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-labelledby]': 'trigger.inputId()',
  },
})
export class HmhaComboboxListbox {
  readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly trigger = inject(HMHA_COMBOBOX_INPUT);
  private readonly cdkListbox = inject(CdkListbox<string>, { self: true });
  private readonly items = contentChildren(CdkOption);

  constructor() {
    // CdkListbox binds its own host [id] (auto-generating one if unset) —
    // setting it here, rather than with our own [attr.id] host binding,
    // avoids two directives on the same element fighting over one
    // attribute. aria-controls (on the input) needs this exact id.
    this.cdkListbox.id = this.trigger.listboxId();

    this.cdkListbox.valueChange.subscribe((event) => {
      const [selected] = event.value;
      if (selected !== undefined) {
        this.trigger.selectValue(selected);
      }
    });

    this.trigger.registerListbox(this);
  }

  // CdkOption.isActive() is a plain `listKeyManager.activeItem === this`
  // comparison, not a signal read — wrapping it in computed()/effect()
  // never re-evaluates, since nothing it reads ever changes as far as
  // Angular's reactivity graph can see. HmhaComboboxInput calls this
  // directly, synchronously, right after the keydown event it forwards
  // here finishes dispatching (and CdkListbox's own handler has run).
  getActiveOptionId(): string | null {
    return this.items().find((option) => option.isActive())?.id ?? null;
  }
}
