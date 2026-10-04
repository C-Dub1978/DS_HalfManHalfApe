import { ChangeDetectionStrategy, Component, Injectable, InjectionToken, Injector, inject } from '@angular/core';
import { hmhaOverlay } from '../core/overlay';

const HMHA_TOAST_MESSAGE = new InjectionToken<string>('HMHA_TOAST_MESSAGE');

interface HmhaToastRequest {
  readonly text: string;
  readonly durationMs: number;
}

/**
 * The visible bubble. `role="status"` + `aria-live="polite"` — a
 * confirmation, not an interruption; nothing here ever takes focus (fork
 * 13's "Tooltip/Toast touch focus not at all").
 */
@Component({
  selector: 'div[hmhaToastPanel]',
  template: '{{ message }}',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-live': 'polite' },
})
class HmhaToastPanel {
  protected readonly message = inject(HMHA_TOAST_MESSAGE);
}

/**
 * Toast has no host element of its own — unlike every other Wave 3
 * component, it's triggered imperatively from anywhere (`inject(HmhaToast).
 * show(...)`), not attached to one via a selector. A root-provided service
 * has no ViewContainerRef to give hmhaOverlay(), which is exactly the case
 * the optional-injection fix below (fork 17) exists for.
 */
@Injectable({ providedIn: 'root' })
export class HmhaToast {
  private readonly injector = inject(Injector);
  private readonly overlay = hmhaOverlay({ position: 'global-fixed-corner', dismissOnOutsideInteraction: false });

  // One visible at a time, queued rather than stacked — the simplest
  // behaviour that still never drops a message silently. Stacking several
  // toasts simultaneously can follow later if it's actually needed.
  private readonly queue: HmhaToastRequest[] = [];
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;

  show(text: string, durationMs = 4000): void {
    this.queue.push({ text, durationMs });
    if (this.queue.length === 1) {
      this.showNext();
    }
  }

  private showNext(): void {
    const request = this.queue[0];
    if (!request) {
      return;
    }
    const panelInjector = Injector.create({
      providers: [{ provide: HMHA_TOAST_MESSAGE, useValue: request.text }],
      parent: this.injector,
    });
    this.overlay.open(null, HmhaToastPanel, panelInjector);
    this.dismissTimeout = setTimeout(() => this.dismissCurrent(), request.durationMs);
  }

  private dismissCurrent(): void {
    this.dismissTimeout = null;
    this.overlay.close();
    this.queue.shift();
    this.showNext();
  }
}
