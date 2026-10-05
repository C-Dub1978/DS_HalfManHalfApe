import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { HmhaPagination } from './pagination';

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

@Component({
  selector: 'pagination-host',
  imports: [HmhaPagination],
  template: `
    <nav
      hmhaPagination
      [(page)]="page"
      [pageCount]="pageCount()"
      [size]="size()"
      [disabled]="disabled()"
    ></nav>
  `,
})
class PaginationHost {
  readonly page = signal(1);
  readonly pageCount = signal(10);
  readonly size = signal<HmhaSize>('md');
  readonly disabled = signal(false);
}

describe('HmhaPagination', () => {
  let fixture: ComponentFixture<PaginationHost>;
  let nav: HTMLElement;

  function pageButtons(): HTMLButtonElement[] {
    return Array.from(nav.querySelectorAll('[aria-label^="Page "]'));
  }

  function previousButton(): HTMLButtonElement {
    return nav.querySelector('[aria-label="Previous page"]') as HTMLButtonElement;
  }

  function nextButton(): HTMLButtonElement {
    return nav.querySelector('[aria-label="Next page"]') as HTMLButtonElement;
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [PaginationHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();
    nav = fixture.nativeElement.querySelector('[hmhaPagination]') as HTMLElement;
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates', () => {
    expect(nav).toBeTruthy();
  });

  it('renders first page, last page and the current page\'s neighbours, with an ellipsis for the gap', () => {
    const labels = pageButtons().map((button) => button.textContent?.trim());
    expect(labels).toEqual(['1', '2', '10']);
    expect(nav.querySelector('.hmha-pagination-ellipsis')).toBeTruthy();
  });

  it('marks the current page with aria-current and the primary tone', async () => {
    fixture.componentInstance.page.set(5);
    await fixture.whenStable();
    const current = pageButtons().find((button) => button.textContent?.trim() === '5')!;
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.getAttribute('data-tone')).toBe('primary');

    const other = pageButtons().find((button) => button.textContent?.trim() === '1')!;
    expect(other.hasAttribute('aria-current')).toBe(false);
    expect(other.getAttribute('data-tone')).toBe('neutral');
  });

  it('disables Previous on the first page and enables it elsewhere', async () => {
    expect(previousButton().disabled).toBe(true);

    fixture.componentInstance.page.set(2);
    await fixture.whenStable();
    expect(previousButton().disabled).toBe(false);
  });

  it('disables Next on the last page and enables it elsewhere', async () => {
    expect(nextButton().disabled).toBe(false);

    fixture.componentInstance.page.set(10);
    await fixture.whenStable();
    expect(nextButton().disabled).toBe(true);
  });

  it('clicking a page button updates the bound page via [(page)]', async () => {
    fixture.componentInstance.page.set(5);
    await fixture.whenStable();
    const neighbour = pageButtons().find((button) => button.textContent?.trim() === '6')!;
    neighbour.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(6);
  });

  it('clicking Previous/Next steps the page by one', async () => {
    fixture.componentInstance.page.set(5);
    await fixture.whenStable();

    nextButton().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(6);

    previousButton().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(5);
  });

  it('disables every button when disabled() is true', async () => {
    fixture.componentInstance.page.set(5);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();

    expect(previousButton().disabled).toBe(true);
    expect(nextButton().disabled).toBe(true);
    for (const button of pageButtons()) {
      expect(button.disabled).toBe(true);
    }
  });

  it('renders no page buttons when there is one page or fewer, and disables both arrows', async () => {
    fixture.componentInstance.pageCount.set(1);
    await fixture.whenStable();
    expect(pageButtons().length).toBe(0);
    expect(previousButton().disabled).toBe(true);
    expect(nextButton().disabled).toBe(true);
  });

  it('is axe-clean at every size, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const size of ['sm', 'md', 'lg'] as const) {
        fixture.componentInstance.size.set(size);
        await fixture.whenStable();
        // Nested HmhaButton instances transition `background` on token
        // changes (button.css); let it finish before sampling colours.
        await settle();

        const results = await axe.run(fixture.nativeElement, {
          runOnly: ['wcag2a', 'wcag2aa'],
        });
        expect(results.violations).withContext(`mode="${mode}" size="${size}"`).toEqual([]);
      }
    }
  });
});
