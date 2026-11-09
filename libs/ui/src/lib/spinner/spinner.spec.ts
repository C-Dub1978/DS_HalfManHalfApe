import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaButton } from '../button/button';
import type { HmhaSize } from '../core/types';
import { HmhaSpinner } from './spinner';

@Component({
  selector: 'spinner-host',
  imports: [HmhaSpinner],
  template: `
    <div [style.color]="parentColor()">
      <hmha-spinner [size]="size()" [label]="label()" [decorative]="decorative()" />
    </div>
  `,
})
class SpinnerHost {
  readonly size = signal<HmhaSize>('md');
  readonly label = signal('Loading');
  readonly decorative = signal(false);
  readonly parentColor = signal<string | null>(null);
}

@Component({
  selector: 'spinner-button-host',
  imports: [HmhaSpinner, HmhaButton],
  template: `
    <button hmhaButton tone="primary" [loading]="true">
      <hmha-spinner decorative size="sm" />
      Save
    </button>
  `,
})
class SpinnerInButtonHost {}

describe('HmhaSpinner', () => {
  let fixture: ComponentFixture<SpinnerHost>;
  let host: SpinnerHost;
  let spinner: HTMLElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** A token's resolved px length from :root, e.g. --hmha-icon-sm → 16. */
  function tokenPx(name: string): number {
    const probe = document.createElement('div');
    probe.style.width = `var(${name})`;
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    document.body.style.color = 'var(--hmha-color-text)';

    await TestBed.configureTestingModule({
      imports: [SpinnerHost, SpinnerInButtonHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerHost);
    host = fixture.componentInstance;
    spinner = fixture.nativeElement.querySelector('hmha-spinner');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('is an indeterminate progressbar named "Loading" by default', () => {
    expect(spinner.getAttribute('role')).toBe('progressbar');
    expect(spinner.getAttribute('aria-label')).toBe('Loading');
    expect(spinner.hasAttribute('aria-valuenow')).toBe(false);
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);
  });

  it('takes a more specific label', async () => {
    host.label.set('Loading catalog');
    await settle();
    expect(spinner.getAttribute('aria-label')).toBe('Loading catalog');
  });

  it('leaves the accessibility tree entirely when decorative', async () => {
    host.decorative.set(true);
    await settle();
    expect(spinner.hasAttribute('role')).toBe(false);
    expect(spinner.hasAttribute('aria-label')).toBe(false);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the icon set’s own spinner glyph', () => {
    const icon = spinner.querySelector('hmha-icon');
    expect(icon).toBeTruthy();
    expect(icon!.querySelector('svg path')).toBeTruthy();
  });

  it('sizes itself and its glyph from the icon scale', async () => {
    for (const [size, token] of [['sm', '--hmha-icon-sm'], ['md', '--hmha-icon-md'], ['lg', '--hmha-icon-lg']] as const) {
      host.size.set(size);
      await settle();
      const expected = tokenPx(token);
      const box = spinner.getBoundingClientRect();
      const glyph = spinner.querySelector('svg')!.getBoundingClientRect();
      expect(box.width).withContext(`${size} host`).toBeCloseTo(expected, 0);
      expect(glyph.width).withContext(`${size} glyph`).toBeCloseTo(expected, 0);
    }
  });

  it('takes its colour from the surrounding text', async () => {
    host.parentColor.set('rgb(200, 0, 0)');
    await settle();
    expect(getComputedStyle(spinner.querySelector('svg')!).color).toBe('rgb(200, 0, 0)');
  });

  it('rotates its glyph', () => {
    // The animation is the whole point of a spinner; Karma can't watch it
    // move, but it can confirm one is running (the real motion, and the
    // reduced-motion pulse, are checked in a real browser in step 3c).
    expect(getComputedStyle(spinner.querySelector('hmha-icon')!).animationName).toContain('hmha-spinner-rotate');
  });

  it('is axe-clean standalone and decorative, every size, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const size of ['sm', 'md', 'lg'] as const) {
        for (const decorative of [false, true]) {
          host.size.set(size);
          host.decorative.set(decorative);
          await settle();
          const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations)
            .withContext(`mode="${mode}" size="${size}" decorative=${decorative}`)
            .toEqual([]);
        }
      }
    }
  });

  it('stays out of a loading button’s accessible name when decorative', async () => {
    const buttonFixture = TestBed.createComponent(SpinnerInButtonHost);
    buttonFixture.detectChanges();
    await buttonFixture.whenStable();
    const button: HTMLButtonElement = buttonFixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('[role="progressbar"]')).toBeNull();
    const results = await axe.run(buttonFixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
