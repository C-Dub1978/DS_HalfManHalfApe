import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  type Signal,
  effect,
  inject,
  input,
} from '@angular/core';
import { AriaDescriber } from '@angular/cdk/a11y';
import { hmhaOverlay } from '../core/overlay';

const HMHA_TOOLTIP_MESSAGE = new InjectionToken<Signal<string>>('HMHA_TOOLTIP_MESSAGE');

/**
 * The visible bubble. Purely decorative for screen readers — AriaDescriber
 * (below) owns the actual accessible description via a hidden element that
 * persists independent of this one's mount/unmount, so there's no
 * aria-describedby pointed at a node that comes and goes with hover state.
 */
@Component({
  selector: 'div[hmhaTooltipPanel]',
  template: '{{ message() }}',
  styleUrl: './tooltip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'tooltip' },
})
class HmhaTooltipPanel {
  protected readonly message = inject(HMHA_TOOLTIP_MESSAGE);
}

@Directive({
  selector: '[hmhaTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class HmhaTooltip {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ariaDescriber = inject(AriaDescriber);
  private readonly overlay = hmhaOverlay({ position: 'connected' });

  readonly hmhaTooltip = input.required<string>();

  // Passed through to hmhaOverlay().open() so HmhaTooltipPanel can inject
  // the current message — a ComponentPortal has no other way to receive
  // data from its trigger (see DECISIONS.md fork 15's injector note).
  private readonly panelInjector = Injector.create({
    providers: [{ provide: HMHA_TOOLTIP_MESSAGE, useValue: this.hmhaTooltip }],
    parent: inject(Injector),
  });

  constructor() {
    // AriaDescriber reference-counts its hidden message elements across
    // every host describing the same text — without removeDescription, an
    // unmounted host leaves its reference behind forever.
    let previouslyDescribed: string | null = null;
    effect(() => {
      const message = this.hmhaTooltip();
      if (previouslyDescribed !== null) {
        this.ariaDescriber.removeDescription(this.elementRef.nativeElement, previouslyDescribed);
      }
      this.ariaDescriber.describe(this.elementRef.nativeElement, message);
      previouslyDescribed = message;
    });
    inject(DestroyRef).onDestroy(() => {
      if (previouslyDescribed !== null) {
        this.ariaDescriber.removeDescription(this.elementRef.nativeElement, previouslyDescribed);
      }
    });
  }

  protected show(): void {
    if (this.overlay.isOpen()) {
      return;
    }
    this.overlay.open(this.elementRef.nativeElement, HmhaTooltipPanel, this.panelInjector);
  }

  protected hide(): void {
    this.overlay.close();
  }
}
