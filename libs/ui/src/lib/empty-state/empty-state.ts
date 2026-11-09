import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { HmhaSize } from '../core/types';
import { HmhaIcon } from '../icon/icon';
import type { HmhaIconName } from '../icon/icon-registry';
import { hmhaLiveAnnouncer } from '../core/live-announcer';

export type HmhaEmptyStateSize = Extract<HmhaSize, 'sm' | 'md'>;

/**
 * How long the heading and text must stay unchanged before a polite
 * announcement. Long enough to wait out a typing burst ("z", "zz", "zzz"
 * becomes one announcement), short enough to feel immediate. A plain
 * number, not a token: it's script timing, not a CSS value (fork 13).
 */
const SETTLE_MS = 500;

/**
 * The empty state's heading, on the element the page needs (usually a real
 * `<h2>`/`<h3>`, since an empty state stands in for a whole section). A
 * component only so it can style its own host: the empty state's
 * encapsulated styles can't reach projected content (fork 05). It always
 * takes the heading face and the size the empty state sets, so it looks
 * the same on any element.
 */
@Component({
  selector: '[hmhaEmptyStateTitle]',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      margin: 0;
      color: var(--hmha-color-text);
      font-family: var(--hmha-font-family-heading);
      font-size: var(--hmha-empty-state-title-size, var(--hmha-type-heading-sm-size));
      font-weight: var(--hmha-empty-state-title-weight, var(--hmha-type-heading-sm-weight));
      line-height: var(--hmha-empty-state-title-line, var(--hmha-type-heading-sm-line));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaEmptyStateTitle {}

@Component({
  // A native <div> filling the space where content would be (fork 43).
  selector: 'div[hmhaEmptyState]',
  imports: [HmhaIcon],
  template: `
    @if (icon(); as name) {
      <!-- Decorative: the heading already says what the icon would. -->
      <span class="hmha-empty-state-icon" aria-hidden="true"><hmha-icon [name]="name" /></span>
    }
    <div class="hmha-empty-state-body" #body>
      <ng-content select="[hmhaEmptyStateTitle]" />
      <div class="hmha-empty-state-message"><ng-content /></div>
    </div>
    <div class="hmha-empty-state-actions"><ng-content select="[hmhaEmptyStateActions]" /></div>
  `,
  styleUrl: './empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class HmhaEmptyState {
  private readonly announcer = hmhaLiveAnnouncer();
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  /** A large, decorative icon above the heading. `null` shows none. */
  readonly icon = input<HmhaIconName | null>(null);
  /** `md` for a page or panel section, `sm` inside a table or small card. */
  readonly size = input<HmhaEmptyStateSize>('md');
  /**
   * `'polite'` announces the heading and text once they've settled, and
   * again if they change (a search query being typed), for an empty state
   * that appears in response to something. `'none'` (the default) for one
   * that's simply there on load.
   */
  readonly announce = input<'none' | 'polite'>('none');

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Announce once the heading and text have settled, and again whenever
    // they change and settle. An empty state that appears while someone
    // types stays on screen as the query changes ("No results for "z"",
    // then "zz", then "zzz"); announcing only on first render would leave
    // them hearing a stale query. The timer only schedules an
    // announcement, never a view update (invariant 4).
    afterNextRender(() => {
      if (this.announce() === 'none') return;
      const body = this.body().nativeElement;
      let spoken = '';
      let timer: ReturnType<typeof setTimeout> | undefined;
      const speak = () => {
        const text = (body.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (text && text !== spoken) {
          spoken = text;
          void this.announcer.announce(text, 'polite');
        }
      };
      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(speak, SETTLE_MS);
      };
      const observer = new MutationObserver(schedule);
      observer.observe(body, { subtree: true, childList: true, characterData: true });
      schedule();
      destroyRef.onDestroy(() => {
        observer.disconnect();
        clearTimeout(timer);
      });
    });
  }
}
