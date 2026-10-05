import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

@Component({
  selector: 'tabs-host',
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
class TabsHost {
  readonly active = signal('general');
}

describe('HmhaTabs', () => {
  function create() {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();
    return {
      fixture,
      tabs: Array.from(fixture.nativeElement.querySelectorAll('[hmhaTab]')) as HTMLButtonElement[],
      panels: Array.from(fixture.nativeElement.querySelectorAll('[hmhaTabPanel]')) as HTMLElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it("selects the tab matching the root's initial value", () => {
    const { tabs, panels } = create();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
  });

  it('switches selection when the bound value changes from outside', () => {
    const { fixture, tabs, panels } = create();
    fixture.componentInstance.active.set('billing');
    fixture.detectChanges();

    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });

  it('updates the bound value (two-way) when a tab is clicked', () => {
    const { fixture, tabs } = create();
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('billing');
  });

  it('two separate <div hmhaTabs> instances generate distinct, non-colliding ids', () => {
    const one = create();
    const two = create();
    expect(one.tabs[0].id).toBeTruthy();
    expect(one.tabs[0].id).not.toBe(two.tabs[0].id);
  });
});
