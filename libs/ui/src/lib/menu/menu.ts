import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  contentChildren,
  effect,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { HMHA_MENU, type HmhaMenuContext } from './menu-context';
import { HMHA_MENU_TRIGGER } from './menu-trigger';
import { HmhaMenuItem } from './menu-item';

@Component({
  selector: 'div[hmhaMenu]',
  template: '<ng-content />',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_MENU, useExisting: forwardRef(() => HmhaMenu) }],
  host: {
    role: 'menu',
    // Escape is already handled by hmhaOverlay's own dismissal — this only
    // needs to feed Arrow/Home/End navigation to the key manager. Enter and
    // Space aren't handled here either: HmhaMenuItem is a real <button>, so
    // the browser's own native activation already fires its click handler.
    '(keydown)': 'onKeydown($event)',
  },
})
export class HmhaMenu implements HmhaMenuContext {
  private readonly trigger = inject(HMHA_MENU_TRIGGER);
  private readonly injector = inject(Injector);

  private readonly items = contentChildren(HmhaMenuItem);
  private readonly keyManager = new FocusKeyManager<HmhaMenuItem>(this.items, this.injector)
    .withWrap()
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withTypeAhead();

  private readonly activeItemSignal = signal<FocusableOption | null>(null);
  readonly activeItem = this.activeItemSignal.asReadonly();

  constructor() {
    this.keyManager.change.subscribe(() => {
      this.activeItemSignal.set(this.keyManager.activeItem);
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());

    // The panel is freshly created every time it opens (hmhaOverlay disposes
    // and recreates on each open()), so "first items appear, nothing active
    // yet" only ever means "just opened" — activate the first one.
    effect(() => {
      if (this.items().length > 0 && this.keyManager.activeItem === null) {
        this.keyManager.setFirstItemActive();
      }
    });
  }

  close(): void {
    this.trigger.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);
  }
}
