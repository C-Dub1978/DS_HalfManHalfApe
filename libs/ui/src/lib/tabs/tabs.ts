import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  type Signal,
  forwardRef,
  inject,
  model,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';

/**
 * Shared by HmhaTabList/HmhaTab (selection + navigation) and HmhaTabPanel
 * (visibility) — every piece is a descendant of the one HmhaTabs that
 * provides this, so DI resolves normally (unlike Menu's trigger/panel
 * split, nothing here is attached through a portal).
 */
export interface HmhaTabsContext {
  readonly value: Signal<string>;
  /** Namespaces the id pairs HmhaTab/HmhaTabPanel generate from `value`, so two <div hmhaTabs> on one page never collide. */
  readonly rootId: string;
  select(value: string): void;
}

export const HMHA_TABS = new InjectionToken<HmhaTabsContext>('HMHA_TABS');

@Component({
  selector: 'div[hmhaTabs]',
  template: '<ng-content />',
  styleUrl: './tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HMHA_TABS, useExisting: forwardRef(() => HmhaTabs) }],
})
export class HmhaTabs implements HmhaTabsContext {
  readonly rootId = inject(_IdGenerator).getId('hmha-tabs-');

  /** The selected tab's value — required: there's no universally sensible default "first" tab to assume. */
  readonly value = model.required<string>();

  select(value: string): void {
    this.value.set(value);
  }
}
