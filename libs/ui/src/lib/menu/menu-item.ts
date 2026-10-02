import { ChangeDetectionStrategy, Component, ElementRef, type Signal, booleanAttribute, computed, inject, input } from '@angular/core';
import type { FocusableOption } from '@angular/cdk/a11y';
import { HMHA_MENU } from './menu-context';

@Component({
  selector: 'button[hmhaMenuItem]',
  template: '<ng-content />',
  styleUrl: './menu-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitem',
    type: 'button',
    // Roving tabindex: only the active item is in the Tab order — arrow
    // keys move between items, Tab leaves the menu entirely.
    '[attr.tabindex]': 'tabindex()',
    '[attr.data-active]': 'isActive() ? "" : null',
    '[disabled]': 'disabled',
    '(click)': 'onClick()',
  },
})
export class HmhaMenuItem implements FocusableOption {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly menu = inject(HMHA_MENU);

  // Aliased: FocusableOption requires `disabled` to be a plain boolean
  // property, not a signal, so the input is renamed internally and exposed
  // through a getter of the same public name.
  protected readonly disabledInput = input(false, { transform: booleanAttribute, alias: 'disabled' });
  get disabled(): boolean {
    return this.disabledInput();
  }

  protected readonly isActive: Signal<boolean> = computed(() => this.menu.activeItem() === this);
  protected readonly tabindex = computed(() => (this.isActive() ? 0 : -1));

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  // Powers HmhaMenu's withTypeAhead(): without it, FocusKeyManager's
  // typeahead silently matches nothing (it skips items missing getLabel
  // rather than throwing once any item is present).
  getLabel(): string {
    return this.elementRef.nativeElement.textContent?.trim() ?? '';
  }

  protected onClick(): void {
    // Selecting an item closes the menu — the consumer's own (click)
    // handler on the same button fires independently for the actual action.
    this.menu.close();
  }
}
