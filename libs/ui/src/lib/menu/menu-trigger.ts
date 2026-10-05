import {
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  type TemplateRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { hmhaOverlay } from '../core/overlay';

/**
 * What `HmhaMenu` (the panel, possibly nested components deep inside the
 * attached template) injects to ask the trigger to close — the trigger
 * owns the `hmhaOverlay()` handle, the panel never touches it directly.
 */
export interface HmhaMenuTriggerContext {
  close(): void;
}

export const HMHA_MENU_TRIGGER = new InjectionToken<HmhaMenuTriggerContext>('HMHA_MENU_TRIGGER');

@Directive({
  selector: 'button[hmhaMenuTrigger]',
  host: {
    // Guards against accidental form submission, same reasoning as every
    // other control that forces its own type.
    type: 'button',
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'overlay.isOpen()',
    '(click)': 'onClick()',
  },
})
export class HmhaMenuTrigger implements HmhaMenuTriggerContext {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  protected readonly overlay = hmhaOverlay({ position: 'connected' });
  private wasOpen = false;

  // The attached <ng-template> is declared in the consumer's own template,
  // a sibling of this button — not a descendant — so HmhaMenu can't reach
  // HMHA_MENU_TRIGGER through the normal element-injector tree. This child
  // injector is handed to hmhaOverlay().open() so the portal's embedded
  // view gets it explicitly instead.
  private readonly menuInjector = Injector.create({
    providers: [{ provide: HMHA_MENU_TRIGGER, useValue: this }],
    parent: inject(Injector),
  });

  /** The menu's content — `<ng-template #menu><div hmhaMenu>...</div></ng-template>`. */
  readonly hmhaMenuTrigger = input.required<TemplateRef<unknown>>();

  constructor() {
    // Covers every close path uniformly (Escape, outside click, an item
    // selected, or close() called directly) — all of them end with
    // isOpen() flipping to false, so focus restoration only needs to
    // watch that, not each path individually.
    effect(() => {
      const isOpen = this.overlay.isOpen();
      if (!isOpen && this.wasOpen) {
        this.elementRef.nativeElement.focus();
      }
      this.wasOpen = isOpen;
    });
  }

  close(): void {
    this.overlay.close();
  }

  protected onClick(): void {
    if (this.overlay.isOpen()) {
      this.overlay.close();
    } else {
      this.overlay.open(this.elementRef.nativeElement, this.hmhaMenuTrigger(), this.menuInjector);
    }
  }
}
