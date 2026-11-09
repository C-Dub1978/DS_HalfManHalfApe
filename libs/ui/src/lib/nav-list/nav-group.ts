import { ChangeDetectionStrategy, Component, contentChild, inject, model } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { HmhaIcon } from '../icon/icon';
import { HmhaNavItem } from './nav-item';
// A type-only import: nav-list.ts imports this file for real, and a value
// import back would be circular. Resolved at runtime through DI below.
import type { HmhaNavList } from './nav-list';
import { HMHA_NAV_LIST } from './nav-list-token';

@Component({
  // An item that opens and closes a nested list: WAI-ARIA's disclosure
  // navigation. The link still navigates; only the button toggles. Not
  // <details>/<summary>: a link inside <summary> is interactive content
  // in interactive content (fork 49).
  selector: 'li[hmhaNavGroup]',
  imports: [HmhaIcon],
  template: `
    <div class="hmha-nav-group-row">
      <ng-content select="[hmhaNavItem]" />
      <button
        type="button"
        class="hmha-nav-group-toggle"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="listId"
        [attr.aria-labelledby]="item()?.id ?? null"
        (click)="expanded.set(!expanded())"
      >
        <hmha-icon name="chevron-down" size="sm" />
      </button>
    </div>
    <ng-content />
  `,
  styleUrl: './nav-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-expanded]': 'expanded() ? "" : null',
  },
})
export class HmhaNavGroup {
  /**
   * Whether the nested list is showing. The consumer owns it (fork 21):
   * `[(expanded)]`, or a one-way `[expanded]` that opens the group holding
   * the current page.
   */
  readonly expanded = model(false);

  /** The list this group sits in, so its own nested list can recognise it. */
  readonly list: HmhaNavList | null = inject(HMHA_NAV_LIST, { optional: true });
  readonly listId = inject(_IdGenerator).getId('hmha-nav-group-list-');

  protected readonly item = contentChild(HmhaNavItem);
}
