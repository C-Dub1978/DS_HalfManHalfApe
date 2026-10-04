import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

@Component({
  selector: 'tab-host',
  imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel],
  template: `
    <div hmhaTabs [(value)]="active">
      <div hmhaTabList>
        <button hmhaTab value="general">General</button>
        <button hmhaTab value="billing" [disabled]="billingDisabled">Billing</button>
      </div>
      <div hmhaTabPanel value="general">General content</div>
      <div hmhaTabPanel value="billing">Billing content</div>
    </div>
  `,
})
class TabHost {
  readonly active = signal('general');
  billingDisabled = false;
}

describe('HmhaTab', () => {
  function create(state: Partial<Pick<TabHost, 'billingDisabled'>> = {}) {
    const fixture = TestBed.createComponent(TabHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return {
      fixture,
      tabs: Array.from(fixture.nativeElement.querySelectorAll('[hmhaTab]')) as HTMLButtonElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('creates as a real type="button" with role="tab"', () => {
    const { tabs } = create();
    expect(tabs[0].tagName).toBe('BUTTON');
    expect(tabs[0].type).toBe('button');
    expect(tabs[0].getAttribute('role')).toBe('tab');
  });

  it("sets aria-controls to its matching panel's id, and aria-selected per the root's value", () => {
    const { fixture, tabs } = create();
    const panel = fixture.nativeElement.querySelector('[hmhaTabPanel]');
    expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('reflects the disabled input as a real disabled attribute', () => {
    const { tabs } = create({ billingDisabled: true });
    expect(tabs[1].disabled).toBe(true);
  });

  it('clicking an unselected tab selects it', () => {
    const { fixture, tabs } = create();
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('billing');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });
});
