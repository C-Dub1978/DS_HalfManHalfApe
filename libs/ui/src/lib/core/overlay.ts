import {
  DestroyRef,
  TemplateRef,
  ViewContainerRef,
  type Injector,
  type Signal,
  type Type,
  inject,
  signal,
} from '@angular/core';
import {
  Overlay,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  type OverlayRef,
  type PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

/**
 * Shared CDK-overlay plumbing for hmha-ui's floating-content components
 * (Dialog, Menu, Tooltip, Toast, Select, Combobox). Not exported from
 * public-api.ts — internal to libs/ui, same as hmhaValueAccessor.
 *
 * Deliberately handles ONLY creation, positioning, and dismissal — never
 * focus-trapping or ARIA roles. Those diverge too much per component
 * (Dialog traps focus hard; Menu/Select/Combobox move focus in with
 * arrow-key nav and no trap; Tooltip/Toast touch focus not at all) to live
 * in one shared piece. See DECISIONS.md fork 13.
 */
export interface HmhaOverlayOptions {
  /**
   * 'connected' anchors to a trigger element (Menu/Select/Combobox/Tooltip),
   * flipping to stay on-screen. 'global-center' centers in the viewport
   * (Dialog). 'global-fixed-corner' pins to a viewport corner with zero
   * offset — the consuming component owns its own spacing via its own
   * token-driven CSS, not a number baked in here.
   */
  readonly position: 'connected' | 'global-center' | 'global-fixed-corner';
  /** Default false — only Dialog (a real modal) should normally opt in. */
  readonly hasBackdrop?: boolean;
  /** Escape key or a click outside the overlay closes it. Default true. */
  readonly dismissOnOutsideInteraction?: boolean;
}

export interface HmhaOverlayHandle {
  readonly isOpen: Signal<boolean>;
  /**
   * `injector`, when given, becomes the content's DI parent instead of the
   * TemplateRef's own declaration context. A TemplatePortal's embedded view
   * is otherwise injected from where the <ng-template> was lexically
   * declared, NOT from the trigger that opened it — a sibling element in
   * the same host template is not an ancestor of that view. Any trigger
   * whose panel content needs to inject the trigger itself (Menu, Select,
   * Combobox) must pass one.
   */
  open(origin: HTMLElement | null, content: TemplateRef<unknown> | Type<unknown>, injector?: Injector): void;
  close(): void;
}

export function hmhaOverlay(options: HmhaOverlayOptions): HmhaOverlayHandle {
  const overlay = inject(Overlay);
  const viewContainerRef = inject(ViewContainerRef);

  const isOpen = signal(false);
  const dismissOnOutsideInteraction = options.dismissOnOutsideInteraction ?? true;
  let overlayRef: OverlayRef | null = null;

  // Without this, a host destroyed while its overlay is still open (a real
  // path for a hover-driven Tooltip — nothing guarantees a mouseleave fires
  // before the element it's attached to is removed) leaks the CDK overlay
  // DOM node and its dismissal subscriptions indefinitely.
  inject(DestroyRef).onDestroy(() => close());

  function positionStrategy(origin: HTMLElement | null): PositionStrategy {
    switch (options.position) {
      case 'connected':
        if (!origin) {
          throw new Error('hmhaOverlay: "connected" position requires an origin element.');
        }
        return overlay
          .position()
          .flexibleConnectedTo(origin)
          .withPositions(STANDARD_DROPDOWN_BELOW_POSITIONS)
          .withPush(true);
      case 'global-center':
        return overlay.position().global().centerHorizontally().centerVertically();
      case 'global-fixed-corner':
        return overlay.position().global().bottom('0').right('0');
    }
  }

  function scrollStrategy() {
    switch (options.position) {
      case 'global-center':
        return overlay.scrollStrategies.block();
      case 'global-fixed-corner':
        return overlay.scrollStrategies.noop();
      case 'connected':
        return overlay.scrollStrategies.reposition();
    }
  }

  function close(): void {
    overlayRef?.dispose();
    overlayRef = null;
    isOpen.set(false);
  }

  function open(
    origin: HTMLElement | null,
    content: TemplateRef<unknown> | Type<unknown>,
    injector?: Injector,
  ): void {
    close();

    overlayRef = overlay.create({
      positionStrategy: positionStrategy(origin),
      scrollStrategy: scrollStrategy(),
      hasBackdrop: options.hasBackdrop ?? false,
    });

    const portal =
      content instanceof TemplateRef
        ? new TemplatePortal(content, viewContainerRef, undefined, injector)
        : new ComponentPortal(content, viewContainerRef, injector);
    overlayRef.attach(portal);
    isOpen.set(true);

    // dispose() (called from close()) completes these, so no manual
    // unsubscribe bookkeeping is needed.
    overlayRef.backdropClick().subscribe(() => close());
    if (dismissOnOutsideInteraction) {
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') close();
      });
      overlayRef.outsidePointerEvents().subscribe((event) => {
        // CDK's outside-click dispatcher runs on document.body in the
        // CAPTURE phase, so for a connected overlay it fires and closes
        // BEFORE a (click) handler on the origin element itself ever sees
        // the event — the origin is "outside" the overlay pane like
        // anything else. Without this guard, a trigger's own click handler
        // then reads isOpen() as already false and reopens what this just
        // closed. The origin owns dismissal of its own clicks; this only
        // handles everything else.
        if (origin && event.target instanceof Node && origin.contains(event.target)) {
          return;
        }
        close();
      });
    }
  }

  return { isOpen: isOpen.asReadonly(), open, close };
}
