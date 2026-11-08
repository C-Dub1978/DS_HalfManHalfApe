import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  booleanAttribute,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { HmhaButton } from '../button/button';
import { HmhaIconButton } from '../button/icon-button';
import { HmhaIcon } from '../icon/icon';
import type { HmhaIconName } from '../icon/icon-registry';

export type HmhaAlertTone = 'info' | 'success' | 'warning' | 'danger';
export type HmhaAlertAnnounce = 'none' | 'polite' | 'assertive';

const TONES: Record<HmhaAlertTone, { icon: HmhaIconName; label: string }> = {
  info: { icon: 'info', label: 'Info' },
  success: { icon: 'circle-check', label: 'Success' },
  warning: { icon: 'triangle-alert', label: 'Warning' },
  danger: { icon: 'circle-alert', label: 'Error' },
};

/**
 * The alert's title, on whatever element suits the page (`<strong>`, or a
 * real `<h3>` where a heading belongs). A component only so it can style
 * its own host: the alert's encapsulated styles can't reach projected
 * content, and `::ng-deep` is off limits (fork 05).
 */
@Component({
  selector: '[hmhaAlertTitle]',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      margin: 0;
      /* An <h3> title would otherwise take the global heading face
         (fork 30); the title reads the same whatever element it's on. */
      font-family: var(--hmha-font-family);
      font-size: var(--hmha-type-label-md-size);
      font-weight: var(--hmha-type-label-md-weight);
      line-height: var(--hmha-type-label-md-line);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaAlertTitle {}

@Component({
  // A native <div>: a persistent, inline message, not a widget (fork 42).
  selector: 'div[hmhaAlert]',
  imports: [HmhaIcon, HmhaButton, HmhaIconButton],
  template: `
    <!-- The tone reaches assistive tech as words, not only colour and
         shape (WCAG 1.4.1): "Warning: You've used 90% of your storage". -->
    <span class="hmha-alert-icon" role="img" [attr.aria-label]="toneLabel()">
      <hmha-icon [name]="icon()" />
    </span>
    <div class="hmha-alert-body" #body>
      <ng-content select="[hmhaAlertTitle]" />
      <div class="hmha-alert-message"><ng-content /></div>
      <div class="hmha-alert-actions"><ng-content select="[hmhaAlertActions]" /></div>
    </div>
    @if (dismissible()) {
      <button hmhaButton hmhaIconButton size="sm" label="Dismiss" class="hmha-alert-dismiss" (click)="dismissed.emit()">
        <hmha-icon name="close" size="sm" />
      </button>
    }
  `,
  styleUrl: './alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
  },
})
export class HmhaAlert {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  readonly tone = input<HmhaAlertTone>('info');
  /**
   * Whether to announce the alert when it first renders. `'none'` (the
   * default) for an alert already on the page when it loads, read in
   * normal order; `'polite'` for one that appears after an action
   * ("Saved"); `'assertive'` for an error that needs attention now.
   */
  readonly announce = input<HmhaAlertAnnounce>('none');
  readonly dismissible = input(false, { transform: booleanAttribute });

  /** The Dismiss button was pressed. The alert doesn't remove itself: your `@if` does. */
  readonly dismissed = output<void>();

  protected readonly icon = computed(() => TONES[this.tone()].icon);
  protected readonly toneLabel = computed(() => TONES[this.tone()].label);

  constructor() {
    // Through CDK's LiveAnnouncer rather than role="alert"/"status" on the
    // element: screen readers announce newly inserted live regions
    // unreliably (polite ones especially), and one shared mechanism can't
    // double-announce. After render, so the projected text is there.
    afterNextRender(() => {
      const politeness = this.announce();
      if (politeness === 'none') return;
      const text = this.messageText();
      if (text) void this.announcer.announce(`${this.toneLabel()}: ${text}`, politeness);
    });
  }

  /** The title and message, without the action buttons' labels. */
  private messageText(): string {
    const body = this.body().nativeElement.cloneNode(true) as HTMLElement;
    body.querySelector('.hmha-alert-actions')?.remove();
    return (body.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
}
