import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';

@Component({
  // A real link: middle-click, open in a new tab, the browser's own link
  // announcement and Tab order (fork 49). The current page is whatever
  // carries aria-current, which routerLinkActive's ariaCurrentWhenActive
  // sets, so there's no router dependency.
  selector: 'a[hmhaNavItem]',
  template: `
    <ng-content select="hmha-icon" />
    <span class="hmha-nav-item-text"><ng-content /></span>
    <ng-content select="[hmhaNavItemEnd]" />
  `,
  styleUrl: './nav-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'id',
  },
})
export class HmhaNavItem {
  /** The consumer's own id if it set one, so a group's toggle can name itself by this link. */
  readonly id: string =
    (inject(ElementRef).nativeElement as HTMLElement).id || inject(_IdGenerator).getId('hmha-nav-item-');
}
