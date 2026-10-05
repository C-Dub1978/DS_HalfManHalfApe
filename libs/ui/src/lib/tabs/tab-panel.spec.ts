import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

@Component({
  selector: 'tab-panel-host',
  imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel],
  template: `
    <div hmhaTabs [(value)]="active">
      <div hmhaTabList>
        <button hmhaTab value="general">General</button>
        <button hmhaTab value="billing">Billing</button>
      </div>
      <div hmhaTabPanel value="general">General content</div>
      <div hmhaTabPanel value="billing">Billing content</div>
    </div>
  `,
})
class TabPanelHost {
  readonly active = signal('general');
}

describe('HmhaTabPanel', () => {
  let fixture: ComponentFixture<TabPanelHost>;
  let panels: HTMLElement[];
  let tabs: HTMLButtonElement[];

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [TabPanelHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TabPanelHost);
    fixture.detectChanges();
    panels = Array.from(fixture.nativeElement.querySelectorAll('[hmhaTabPanel]'));
    tabs = Array.from(fixture.nativeElement.querySelectorAll('[hmhaTab]'));
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('renders as role="tabpanel", labelled by its matching tab', () => {
    expect(panels[0].getAttribute('role')).toBe('tabpanel');
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[0].id);
  });

  it('hides every panel except the one matching the selected value', () => {
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
  });

  it('switches which panel is hidden when the selected value changes', () => {
    fixture.componentInstance.active.set('billing');
    fixture.detectChanges();
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });

  it('is axe-clean across both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
