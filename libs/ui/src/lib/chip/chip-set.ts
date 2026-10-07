import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { FocusKeyManager, type FocusableOption } from '@angular/cdk/a11y';
import { HMHA_CHIP_SET, type HmhaChipSetContext } from './chip-set-context';
import { HmhaChip } from './chip';

/**
 * Purely a roving-tabindex focus manager over its `HmhaChip` content
 * children — no shared "selected" state (each chip already owns its own
 * `selected` model independently; a consumer filtering by multiple
 * selected chips reads each chip's own state, the same "no collection
 * state in the component" principle as Wave 4's selection work, fork 21).
 */
@Component({
  selector: 'div[hmhaChipSet]',
  template: '<ng-content />',
  styleUrl: './chip-set.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_CHIP_SET, useExisting: forwardRef(() => HmhaChipSet) }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HmhaChipSet implements HmhaChipSetContext {
  private readonly injector = inject(Injector);

  readonly ariaLabel = input<string | null>(null);

  private readonly chips = contentChildren(HmhaChip);
  private readonly keyManager = new FocusKeyManager<HmhaChip>(this.chips, this.injector)
    .withWrap()
    .withHorizontalOrientation('ltr')
    .withHomeAndEnd();

  private readonly activeChipSignal = signal<FocusableOption | null>(null);
  readonly activeChip = this.activeChipSignal.asReadonly();

  constructor() {
    this.keyManager.change.subscribe(() => {
      this.activeChipSignal.set(this.keyManager.activeItem);
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());

    effect(() => {
      if (this.chips().length > 0 && this.keyManager.activeItem === null) {
        this.keyManager.setFirstItemActive();
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);
  }
}
