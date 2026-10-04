import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FocusableOption } from '@angular/cdk/a11y';
import { HMHA_TABS } from './tabs';

@Component({
  selector: 'button[hmhaTab]',
  template: '<ng-content />',
  styleUrl: './tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tab',
    // Guards against accidental form submission, same reasoning as every
    // other control that forces its own type.
    type: 'button',
    '[attr.id]': 'tabId()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.aria-selected]': 'isSelected()',
    // Roving tabindex: only the selected tab is in the Tab order — arrow
    // keys move between tabs (and, with automatic activation, select the
    // one they land on), matching HmhaMenuItem's pattern.
    '[attr.tabindex]': 'isSelected() ? 0 : -1',
    '[disabled]': 'disabled',
    '(click)': 'onClick()',
  },
})
export class HmhaTab implements FocusableOption {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly tabs = inject(HMHA_TABS);

  readonly value = input.required<string>();

  // Aliased: FocusableOption requires `disabled` to be a plain boolean
  // property, not a signal — same reasoning as HmhaMenuItem.
  protected readonly disabledInput = input(false, { transform: booleanAttribute, alias: 'disabled' });
  get disabled(): boolean {
    return this.disabledInput();
  }

  protected readonly isSelected = computed(() => this.tabs.value() === this.value());
  protected readonly tabId = computed(() => `${this.tabs.rootId}-tab-${this.value()}`);
  protected readonly panelId = computed(() => `${this.tabs.rootId}-tabpanel-${this.value()}`);

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  protected onClick(): void {
    this.tabs.select(this.value());
  }
}
