import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { HMHA_TABS } from './tabs';

@Component({
  selector: 'div[hmhaTabPanel]',
  template: '<ng-content />',
  styleUrl: './tab-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    '[attr.id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
    // Lets focus move directly into the panel's region after a tab is
    // selected — WAI-ARIA's Tabs pattern recommends this even when the
    // panel also contains its own focusable content.
    tabindex: '0',
    '[hidden]': '!isSelected()',
  },
})
export class HmhaTabPanel {
  private readonly tabs = inject(HMHA_TABS);

  readonly value = input.required<string>();

  protected readonly isSelected = computed(() => this.tabs.value() === this.value());
  protected readonly panelId = computed(() => `${this.tabs.rootId}-tabpanel-${this.value()}`);
  protected readonly tabId = computed(() => `${this.tabs.rootId}-tab-${this.value()}`);
}
