import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaButton } from './button';

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

describe('HmhaButton', () => {
  let fixture: ComponentFixture<HmhaButton>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    // Pin the mode axis so contrast/colour assertions don't depend on the
    // test runner's OS/browser color-scheme preference.
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [HmhaButton],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HmhaButton);
    button = fixture.nativeElement as HTMLButtonElement;
    button.textContent = 'Click me';
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates', () => {
    expect(button).toBeTruthy();
  });

  it('defaults to the neutral tone and md size', () => {
    expect(button.getAttribute('data-tone')).toBe('neutral');
    expect(button.getAttribute('data-size')).toBe('md');
  });

  it('reflects tone and size as data attributes', async () => {
    fixture.componentRef.setInput('tone', 'primary');
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();
    expect(button.getAttribute('data-tone')).toBe('primary');
    expect(button.getAttribute('data-size')).toBe('lg');
  });

  it('sets aria-busy and disables the control while loading', async () => {
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
  });

  it('has no aria-busy when not loading', () => {
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  it('disables the native button when disabled() is true', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('is axe-clean in every tone, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const tone of ['neutral', 'primary', 'danger', 'warning', 'success'] as const) {
        fixture.componentRef.setInput('tone', tone);
        await fixture.whenStable();
        // Colour custom properties are declared with `transition: background`;
        // let it finish before sampling computed colours for contrast.
        await settle();

        const results = await axe.run(fixture.nativeElement, {
          runOnly: ['wcag2a', 'wcag2aa'],
        });
        expect(results.violations).withContext(`mode="${mode}" tone="${tone}"`).toEqual([]);
      }
    }
  });
});
