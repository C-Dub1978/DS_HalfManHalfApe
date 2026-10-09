import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import type { HmhaSortDirection } from '../core/types';
import { HmhaDataGridSortButton } from './data-grid-sort-button';

@Component({
  selector: 'sort-button-host',
  imports: [HmhaDataGridSortButton],
  template: `
    <button hmhaDataGridSortButton [active]="active" [direction]="direction" (sortRequest)="onSortRequest($event)">
      Name
    </button>
  `,
})
class SortButtonHost {
  active = false;
  direction: HmhaSortDirection = 'asc';
  lastRequest: HmhaSortDirection | null = null;

  onSortRequest(direction: HmhaSortDirection): void {
    this.lastRequest = direction;
  }
}

describe('HmhaDataGridSortButton', () => {
  let fixture: ComponentFixture<SortButtonHost>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [SortButtonHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  // active/direction are set before the fixture's first detectChanges(),
  // never mutated on an already-checked fixture — same zoneless
  // constraint card.spec.ts documents for its own `elevated` input.
  function createButton(active = false, direction: HmhaSortDirection = 'asc') {
    const host = TestBed.createComponent(SortButtonHost);
    host.componentInstance.active = active;
    host.componentInstance.direction = direction;
    host.detectChanges();
    return { fixture: host, button: host.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(() => {
    ({ fixture, button } = createButton());
  });

  it('creates', () => {
    expect(button).toBeTruthy();
  });

  it('projects the column label', () => {
    expect(button.textContent?.trim()).toBe('Name');
  });

  it('sets type="button" so it never submits an enclosing form', () => {
    expect(button.getAttribute('type')).toBe('button');
  });

  it('has no data-active attribute by default', () => {
    expect(button.hasAttribute('data-active')).toBe(false);
  });

  it('reflects active as a data attribute', () => {
    const { button: activeButton } = createButton(true);
    expect(activeButton.getAttribute('data-active')).toBe('true');
  });

  it('requests ascending when clicked while inactive', () => {
    button.click();
    expect(fixture.componentInstance.lastRequest).toBe('asc');
  });

  it('requests descending when clicked while active and currently ascending', () => {
    const { fixture: activeFixture, button: activeButton } = createButton(true, 'asc');
    activeButton.click();
    expect(activeFixture.componentInstance.lastRequest).toBe('desc');
  });

  it('requests ascending when clicked while active and currently descending', () => {
    const { fixture: activeFixture, button: activeButton } = createButton(true, 'desc');
    activeButton.click();
    expect(activeFixture.componentInstance.lastRequest).toBe('asc');
  });

  it('is axe-clean, active and inactive, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const active of [false, true]) {
        const { fixture: stateFixture } = createButton(active);
        const results = await axe.run(stateFixture.nativeElement, {
          runOnly: ['wcag2a', 'wcag2aa'],
        });
        expect(results.violations).withContext(`mode="${mode}" active=${active}`).toEqual([]);
      }
    }
  });
});
