import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

function items(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaMenuItem]'));
}

function panel(): HTMLElement {
  return document.querySelector('.cdk-overlay-pane [hmhaMenu]') as HTMLElement;
}

// ListKeyManager.onKeydown switches on the legacy numeric `event.keyCode`,
// which Chrome's KeyboardEvent constructor never populates from `key` —
// it has to be forced on with defineProperty for a synthetic event.
function dispatchKeydown(target: HTMLElement, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}
function arrowDown(target: HTMLElement): void {
  dispatchKeydown(target, 'ArrowDown', 40);
}
function arrowUp(target: HTMLElement): void {
  dispatchKeydown(target, 'ArrowUp', 38);
}
function end(target: HTMLElement): void {
  dispatchKeydown(target, 'End', 35);
}
function home(target: HTMLElement): void {
  dispatchKeydown(target, 'Home', 36);
}

@Component({
  selector: 'menu-host',
  imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem],
  template: `
    <button [hmhaMenuTrigger]="menuTpl">Actions</button>
    <ng-template #menuTpl>
      <div hmhaMenu>
        <button hmhaMenuItem>Edit</button>
        <button hmhaMenuItem [disabled]="middleDisabled">Duplicate</button>
        <button hmhaMenuItem>Delete</button>
      </div>
    </ng-template>
  `,
})
class MenuHost {
  middleDisabled = false;
}

describe('HmhaMenu', () => {
  let fixture: ComponentFixture<MenuHost>;
  let button: HTMLButtonElement;

  function openMenu(): void {
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [MenuHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuHost);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('renders as a real menu panel with role="menu"', () => {
    openMenu();
    expect(panel().getAttribute('role')).toBe('menu');
  });

  it('activates the first item on open', () => {
    openMenu();
    const [first] = items();
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute('data-active')).toBe('');
  });

  it('ArrowDown moves active state to the next item', () => {
    openMenu();
    const [first, second] = items();
    arrowDown(panel());
    fixture.detectChanges();
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute('data-active')).toBe('');
    expect(first.hasAttribute('data-active')).toBe(false);
  });

  it('ArrowUp wraps from the first item to the last', () => {
    openMenu();
    const all = items();
    arrowUp(panel());
    expect(document.activeElement).toBe(all[all.length - 1]);
  });

  it('End activates the last item, Home returns to the first', () => {
    openMenu();
    const all = items();
    end(panel());
    expect(document.activeElement).toBe(all[all.length - 1]);
    home(panel());
    expect(document.activeElement).toBe(all[0]);
  });

  it('skips a disabled item when navigating past it', () => {
    fixture.componentInstance.middleDisabled = true;
    openMenu();
    const [first, , third] = items();
    expect(document.activeElement).toBe(first);
    arrowDown(panel());
    expect(document.activeElement).toBe(third);
  });

  it('only the active item is in the Tab order (roving tabindex)', () => {
    openMenu();
    const [first, second, third] = items();
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);
    expect(third.tabIndex).toBe(-1);
    arrowDown(panel());
    fixture.detectChanges();
    expect(first.tabIndex).toBe(-1);
    expect(second.tabIndex).toBe(0);
  });

  it('clicking an item closes the menu', () => {
    openMenu();
    items()[0].click();
    fixture.detectChanges();
    expect(panel()).toBeFalsy();
  });

  it('is axe-clean with the menu open, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      openMenu();
      // The panel lives in the CDK overlay container, a sibling of
      // fixture.nativeElement in the real DOM, not a descendant — scoping to
      // just that container (rather than document.body) keeps this from
      // picking up unrelated violations in the surrounding Karma test page.
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      const results = await axe.run(overlayContainer, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
      button.click();
      fixture.detectChanges();
    }
  });
});
