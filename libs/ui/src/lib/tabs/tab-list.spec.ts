import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

// CDK's ListKeyManager.onKeydown switches on the legacy numeric
// event.keyCode, which a synthetic KeyboardEvent never populates in
// Chrome — keyCode has to be forced on with Object.defineProperty, same
// workaround as menu.spec.ts.
function dispatchKeydown(target: Element, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}
function arrowRight(target: Element): void {
  dispatchKeydown(target, 'ArrowRight', 39);
}
function arrowLeft(target: Element): void {
  dispatchKeydown(target, 'ArrowLeft', 37);
}
function end(target: Element): void {
  dispatchKeydown(target, 'End', 35);
}
function home(target: Element): void {
  dispatchKeydown(target, 'Home', 36);
}

@Component({
  selector: 'tab-list-host',
  imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel],
  template: `
    <div hmhaTabs [(value)]="active">
      <div hmhaTabList>
        <button hmhaTab value="a">A</button>
        <button hmhaTab value="b" [disabled]="bDisabled">B</button>
        <button hmhaTab value="c">C</button>
      </div>
      <div hmhaTabPanel value="a">A content</div>
      <div hmhaTabPanel value="b">B content</div>
      <div hmhaTabPanel value="c">C content</div>
    </div>
  `,
})
class TabListHost {
  readonly active = signal('a');
  bDisabled = false;
}

describe('HmhaTabList', () => {
  function create(state: Partial<Pick<TabListHost, 'bDisabled'>> = {}) {
    const fixture = TestBed.createComponent(TabListHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return {
      fixture,
      tablist: fixture.nativeElement.querySelector('[hmhaTabList]') as HTMLElement,
      tabs: Array.from(fixture.nativeElement.querySelectorAll('[hmhaTab]')) as HTMLButtonElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabListHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders as a real tablist', () => {
    const { tablist } = create();
    expect(tablist.getAttribute('role')).toBe('tablist');
  });

  it('ArrowRight moves focus AND selection to the next tab (automatic activation)', () => {
    const { fixture, tablist, tabs } = create();
    arrowRight(tablist);
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[1]);
    expect(fixture.componentInstance.active()).toBe('b');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft wraps from the first tab to the last', () => {
    const { fixture, tablist, tabs } = create();
    arrowLeft(tablist);
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[2]);
    expect(fixture.componentInstance.active()).toBe('c');
  });

  it('End selects the last tab, Home returns to the first', () => {
    const { fixture, tablist, tabs } = create();
    end(tablist);
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('c');

    home(tablist);
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('a');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('skips a disabled tab when navigating past it', () => {
    const { fixture, tablist, tabs } = create({ bDisabled: true });
    arrowRight(tablist);
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[2]);
    expect(fixture.componentInstance.active()).toBe('c');
  });

  it("re-syncs its active item when the tablist's value changes from outside, without stealing focus", () => {
    const { fixture, tabs } = create();
    fixture.componentInstance.active.set('c');
    fixture.detectChanges();

    expect(document.activeElement).not.toBe(tabs[2]);
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
  });
});
