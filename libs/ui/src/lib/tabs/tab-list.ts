import { ChangeDetectionStrategy, Component, DestroyRef, Injector, contentChildren, effect, inject } from '@angular/core';
import { FocusKeyManager } from '@angular/cdk/a11y';
import { HMHA_TABS } from './tabs';
import { HmhaTab } from './tab';

@Component({
  selector: 'div[hmhaTabList]',
  template: '<ng-content />',
  styleUrl: './tab-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tablist',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HmhaTabList {
  private readonly tabs = inject(HMHA_TABS);
  private readonly injector = inject(Injector);

  private readonly items = contentChildren(HmhaTab);
  private readonly keyManager = new FocusKeyManager<HmhaTab>(this.items, this.injector)
    .withWrap()
    .withHorizontalOrientation('ltr')
    .withHomeAndEnd();

  constructor() {
    // Automatic activation: moving focus with the arrow keys also selects
    // the tab landed on, not just focuses it — WAI-ARIA's recommended
    // model for tabs whose panels are cheap to show.
    this.keyManager.change.subscribe(() => {
      const active = this.keyManager.activeItem;
      if (active) {
        this.tabs.select(active.value());
      }
    });

    // Keeps the key manager's own notion of "active" pointed at whatever
    // is actually selected, including when selection changes from outside
    // (a bound [value]) rather than from arrow-key navigation.
    // updateActiveItem — unlike setActiveItem — doesn't focus or re-emit
    // change, which would otherwise loop straight back into select().
    effect(() => {
      const currentValue = this.tabs.value();
      const index = this.items().findIndex((tab) => tab.value() === currentValue);
      if (index !== -1) {
        this.keyManager.updateActiveItem(index);
      }
    });

    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);
  }
}
