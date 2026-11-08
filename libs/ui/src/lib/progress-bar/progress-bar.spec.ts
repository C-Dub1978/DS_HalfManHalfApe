import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaProgressBar, type HmhaProgressBarTone } from './progress-bar';

@Component({
  selector: 'progress-bar-host',
  imports: [HmhaProgressBar],
  template: `
    <progress
      hmhaProgressBar
      aria-label="Uploading movie.mp4"
      [value]="value()"
      [max]="max()"
      [tone]="tone()"
      [valueText]="valueText()"
    ></progress>
  `,
})
class ProgressBarHost {
  readonly value = signal<number | null>(40);
  readonly max = signal(100);
  readonly tone = signal<HmhaProgressBarTone>('primary');
  readonly valueText = signal<string | null>(null);
}

describe('HmhaProgressBar', () => {
  let fixture: ComponentFixture<ProgressBarHost>;
  let host: ProgressBarHost;
  let bar: HTMLProgressElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** A semantic role's resolved value, for comparing against the bar's own token. */
  function role(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(`--hmha-color-${name}`).trim();
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [ProgressBarHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarHost);
    host = fixture.componentInstance;
    bar = fixture.nativeElement.querySelector('progress');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('is a native <progress>, so its role is progressbar for free', () => {
    expect(bar.tagName).toBe('PROGRESS');
    expect(bar.position).toBeCloseTo(0.4);
  });

  it('reflects value and max as attributes', async () => {
    host.value.set(30);
    host.max.set(60);
    await settle();
    expect(bar.getAttribute('value')).toBe('30');
    expect(bar.getAttribute('max')).toBe('60');
    expect(bar.position).toBeCloseTo(0.5);
  });

  it('is indeterminate when value is null', async () => {
    host.value.set(null);
    await settle();
    expect(bar.hasAttribute('value')).toBe(false);
    expect(bar.matches(':indeterminate')).toBe(true);
    expect(bar.position).toBe(-1);
  });

  it('returns to indeterminate after having had a value', async () => {
    // The case a property binding gets wrong: once `.value` has been set,
    // only removing the attribute makes a <progress> indeterminate again.
    expect(bar.matches(':indeterminate')).toBe(false);
    host.value.set(null);
    await settle();
    expect(bar.matches(':indeterminate')).toBe(true);
    host.value.set(75);
    await settle();
    expect(bar.matches(':indeterminate')).toBe(false);
  });

  it('treats 0 as determinate (an empty bar), not indeterminate', async () => {
    host.value.set(0);
    await settle();
    expect(bar.getAttribute('value')).toBe('0');
    expect(bar.matches(':indeterminate')).toBe(false);
  });

  it('sweeps only while indeterminate', async () => {
    expect(getComputedStyle(bar).animationName).toBe('none');
    host.value.set(null);
    await settle();
    expect(getComputedStyle(bar).animationName).not.toBe('none');
  });

  it('defaults to the primary tone and fills with the action role', () => {
    expect(bar.getAttribute('data-tone')).toBe('primary');
    expect(getComputedStyle(bar).getPropertyValue('--hmha-progress-bar-fill-bg').trim()).toBe(role('action'));
  });

  it('re-points its fill per tone', async () => {
    for (const [tone, expected] of [['success', 'success'], ['danger', 'danger']] as const) {
      host.tone.set(tone);
      await settle();
      expect(bar.getAttribute('data-tone')).toBe(tone);
      expect(getComputedStyle(bar).getPropertyValue('--hmha-progress-bar-fill-bg').trim())
        .withContext(tone)
        .toBe(role(expected));
    }
  });

  it('shares the slider’s track: the semantic thickness and the surface-sunken colour', () => {
    const style = getComputedStyle(bar);
    const thickness = getComputedStyle(document.documentElement).getPropertyValue('--hmha-track-thickness').trim();
    expect(thickness).toBeTruthy();
    expect(style.getPropertyValue('--hmha-progress-bar-thickness').trim()).toBe(thickness);
    expect(style.getPropertyValue('--hmha-progress-bar-track-bg').trim()).toBe(role('surface-sunken'));
  });

  it('sets aria-valuetext only when valueText is given', async () => {
    expect(bar.hasAttribute('aria-valuetext')).toBe(false);
    host.valueText.set('42 MB of 100 MB');
    await settle();
    expect(bar.getAttribute('aria-valuetext')).toBe('42 MB of 100 MB');
  });

  it('is axe-clean across tones, determinate and indeterminate, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const tone of ['primary', 'success', 'danger'] as const) {
        for (const value of [40, null]) {
          host.tone.set(tone);
          host.value.set(value);
          await settle();
          const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations)
            .withContext(`mode="${mode}" tone="${tone}" value=${value}`)
            .toEqual([]);
        }
      }
    }
  });
});
