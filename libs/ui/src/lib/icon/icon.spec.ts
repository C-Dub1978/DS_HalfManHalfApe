import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaIcon } from './icon';

describe('HmhaIcon', () => {
  let fixture: ComponentFixture<HmhaIcon>;
  let host: HTMLElement;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [HmhaIcon],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HmhaIcon);
    fixture.componentRef.setInput('name', 'check');
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates', () => {
    expect(host).toBeTruthy();
  });

  it('defaults to the md size', () => {
    expect(host.getAttribute('data-size')).toBe('md');
  });

  it('renders the requested icon markup', () => {
    expect(host.querySelector('svg')?.innerHTML).toContain('M5 13l4 4L19 7');
  });

  it('swaps markup when the name changes', async () => {
    fixture.componentRef.setInput('name', 'close');
    await fixture.whenStable();
    expect(host.querySelector('svg')?.innerHTML).toContain('M6 6l12 12');
  });

  it('reflects size as a data attribute', async () => {
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();
    expect(host.getAttribute('data-size')).toBe('lg');
  });

  it('hides the inner svg from assistive tech — decorative by default', () => {
    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is axe-clean for every registered icon, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const name of ['check', 'close', 'chevron-down', 'spinner'] as const) {
        fixture.componentRef.setInput('name', name);
        await fixture.whenStable();
        const results = await axe.run(fixture.nativeElement, {
          runOnly: ['wcag2a', 'wcag2aa'],
        });
        expect(results.violations).withContext(`mode="${mode}" name="${name}"`).toEqual([]);
      }
    }
  });
});
