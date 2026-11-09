import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { contrast, paint } from '../core/testing/paint';
import type { HmhaTone } from '../core/types';
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

/*
 * A real <button> host. TestBed.createComponent(HmhaButton), used by the
 * suite above, renders the host as a <div id="root…">, where axe rightly
 * rejects aria-pressed, and where a `disabled` check passes regardless.
 */
@Component({
  selector: 'pressed-host',
  imports: [HmhaButton],
  template: `<button hmhaButton [tone]="tone()" [pressed]="pressed()">Mute</button>`,
})
class PressedHost {
  readonly tone = signal<HmhaTone>('neutral');
  readonly pressed = signal<boolean | null>(null);
}

describe('HmhaButton — pressed (toggle button)', () => {
  let fixture: ComponentFixture<PressedHost>;
  let host: PressedHost;
  let button: HTMLButtonElement;

  async function set(state: { tone?: HmhaTone; pressed?: boolean | null }) {
    if (state.tone) host.tone.set(state.tone);
    if (state.pressed !== undefined) host.pressed.set(state.pressed);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [PressedHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(PressedHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('is an ordinary button by default: no aria-pressed, no pressed styling', () => {
    expect(button.tagName).toBe('BUTTON');
    expect(button.hasAttribute('aria-pressed')).toBe(false);
    expect(button.hasAttribute('data-pressed')).toBe(false);
  });

  it('becomes a toggle button with pressed true or false', async () => {
    await set({ pressed: false });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.hasAttribute('data-pressed')).toBe(false);
    await set({ pressed: true });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.hasAttribute('data-pressed')).toBe(true);
  });

  it('never flips itself on click: the consumer’s state drives it', async () => {
    await set({ pressed: false });
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('looks clearly different when pressed, with readable text, in both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      await set({ pressed: false });
      await settle();
      const off = getComputedStyle(button);
      const offBg = paint(off.backgroundColor);
      const offBorder = paint(off.borderTopColor);

      await set({ pressed: true });
      await settle();
      const on = getComputedStyle(button);
      const onBg = paint(on.backgroundColor);
      expect(onBg).withContext(`${mode}: background changes`).not.toEqual(offBg);
      expect(paint(on.borderTopColor)).withContext(`${mode}: border changes`).not.toEqual(offBorder);
      expect(contrast(paint(on.color, onBg), onBg)).withContext(`${mode}: pressed text`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('shows pressed in every tone, with a ring the page can see for the status tones', async () => {
    // The first version drew the status tones' ring in the button's own
    // text colour: white, invisible on a light page (and dark on a dark
    // one). Measure the ring against the page, not just "it changed".
    document.body.style.background = 'var(--hmha-color-bg)';
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const page = paint(getComputedStyle(document.body).backgroundColor);
      for (const tone of ['neutral', 'primary', 'danger', 'warning', 'success'] as const) {
        await set({ tone, pressed: false });
        await settle();
        const off = getComputedStyle(button);
        const offLook = [paint(off.backgroundColor), paint(off.borderTopColor)];
        await set({ pressed: true });
        await settle();
        const on = getComputedStyle(button);
        expect([paint(on.backgroundColor), paint(on.borderTopColor)])
          .withContext(`${mode} ${tone}: looks different when pressed`)
          .not.toEqual(offLook);
        if (tone === 'danger' || tone === 'warning' || tone === 'success') {
          expect(contrast(paint(on.borderTopColor), page))
            .withContext(`${mode} ${tone}: ring visible against the page`)
            .toBeGreaterThanOrEqual(3);
        }
      }
    }
    document.body.style.background = '';
  });

  it('is axe-clean pressed and not pressed, in every tone, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const tone of ['neutral', 'primary', 'danger', 'warning', 'success'] as const) {
        for (const pressed of [false, true]) {
          await set({ tone, pressed });
          await settle();
          const results = await axe.run(button, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations).withContext(`${mode} ${tone} pressed=${pressed}`).toEqual([]);
        }
      }
    }
  });
});
