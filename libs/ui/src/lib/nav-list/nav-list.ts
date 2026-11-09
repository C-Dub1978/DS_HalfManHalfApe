import { ChangeDetectionStrategy, Component, computed, forwardRef, inject } from '@angular/core';
import { HmhaNavGroup } from './nav-group';
import { HMHA_NAV_LIST } from './nav-list-token';

@Component({
  // A native list of native links (fork 49). The consumer supplies the
  // <nav> landmark and its name around it.
  selector: 'ul[hmhaNavList]',
  template: '<ng-content />',
  styleUrl: './nav-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_NAV_LIST, useExisting: forwardRef(() => HmhaNavList) }],
  host: {
    '[attr.data-nested]': 'parent ? "" : null',
    '[attr.id]': 'controller?.listId ?? null',
    '[attr.hidden]': 'collapsed() ? "" : null',
  },
})
export class HmhaNavList {
  /** The list this one is nested in, if any: it indents one level. */
  readonly parent = inject(HMHA_NAV_LIST, { optional: true, skipSelf: true });
  private readonly group = inject(HmhaNavGroup, { optional: true });

  /**
   * The group whose expand button shows and hides this list: the nearest
   * group, but only if this list sits directly in it. A list nested under
   * a plain item further down shares that ancestor group, but isn't its
   * list, and is told apart by having a different parent list.
   */
  protected readonly controller = this.group && this.group.list === this.parent ? this.group : null;

  protected readonly collapsed = computed(() => (this.controller ? !this.controller.expanded() : false));
}
