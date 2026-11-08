import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { contrast, paint } from '../core/testing/paint';
import type { HmhaTone } from '../core/types';
import { HmhaBadge, type HmhaBadgeAppearance } from './badge';

const TONES: HmhaTone[] = ['neutral', 'primary', 'success', 'warning', 'danger'];
const APPEARANCES: HmhaBadgeAppearance[] = ['subtle', 'solid'];

@Component({
  selector: 'badge-host',
  imports: [HmhaBadge],
  template: `
    <span
      hmhaBadge
      [tone]="tone()"
      [appearance]="appearance()"
      [count]="count()"
      [max]="max()"
      [showZero]="showZero()"
      [dot]="dot()"
    >Processing</span>
  `,
})
class BadgeHost {
  readonly tone = signal<HmhaTone>('neutral');
  readonly appearance = signal<HmhaBadgeAppearance>('subtle');
  readonly count = signal<number | null>(null);
  readonly max = signal(99);
  readonly showZero = signal(false);
  readonly dot = signal(false);
}

describe('HmhaBadge', () => {
  let fixture: ComponentFixture<BadgeHost>;
  let host: BadgeHost;
  let badge: HTMLElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

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
      imports: [BadgeHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeHost);
    host = fixture.componentInstance;
    badge = fixture.nativeElement.querySelector('[hmhaBadge]');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('shows its projected text, neutral and subtle by default, readable as plain text', () => {
    expect(badge.textContent?.trim()).toBe('Processing');
    expect(badge.getAttribute('data-tone')).toBe('neutral');
    expect(badge.getAttribute('data-appearance')).toBe('subtle');
    expect(badge.hasAttribute('aria-hidden')).toBe(false);
    expect(badge.hasAttribute('role')).toBe(false);
  });

  it('renders readable text (4.5:1) for every tone and appearance, both modes', async () => {
    // The CSS wiring, not just the token pairs: what's actually painted.
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const appearance of APPEARANCES) {
        for (const tone of TONES) {
          host.tone.set(tone);
          host.appearance.set(appearance);
          await settle();
          const style = getComputedStyle(badge);
          const fill = paint(style.backgroundColor);
          const text = paint(style.color, fill);
          expect(contrast(text, fill))
            .withContext(`${mode} ${appearance} ${tone}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('shows a count instead of its text', async () => {
    host.count.set(5);
    await settle();
    expect(badge.textContent?.trim()).toBe('5');
  });

  it('caps a count at max with a plus', async () => {
    host.count.set(150);
    await settle();
    expect(badge.textContent?.trim()).toBe('99+');
    host.max.set(9);
    host.count.set(12);
    await settle();
    expect(badge.textContent?.trim()).toBe('9+');
  });

  it('hides a zero count unless showZero is set', async () => {
    host.count.set(0);
    await settle();
    expect(badge.hidden).toBe(true);
    expect(badge.getBoundingClientRect().width).toBe(0);

    host.showZero.set(true);
    await settle();
    expect(badge.hidden).toBe(false);
    expect(badge.textContent?.trim()).toBe('0');
  });

  it('is at least as wide as it is tall, so a single-digit count is round', async () => {
    host.count.set(3);
    await settle();
    const box = badge.getBoundingClientRect();
    expect(box.height).toBeCloseTo(tokenPx('--hmha-icon-md'), 0);
    expect(box.width).toBeGreaterThanOrEqual(box.height - 0.5);
  });

  it('draws a dot: no text, hidden from assistive tech, half the small icon size', async () => {
    host.dot.set(true);
    await settle();
    const box = badge.getBoundingClientRect();
    expect(badge.textContent?.trim()).toBe('');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(box.width).toBeCloseTo(tokenPx('--hmha-icon-sm') / 2, 0);
    expect(box.height).toBeCloseTo(box.width, 0);
  });

  it('paints a dot in the tone’s strong colour even when subtle', async () => {
    host.dot.set(true);
    host.tone.set('success');
    host.appearance.set('subtle');
    await settle();
    const success = getComputedStyle(document.documentElement).getPropertyValue('--hmha-color-success').trim();
    expect(paint(getComputedStyle(badge).backgroundColor)).toEqual(paint(success));
  });

  it('uses the small label type role, with lining tabular figures', () => {
    const style = getComputedStyle(badge);
    expect(style.fontVariantNumeric).toContain('lining-nums');
    expect(style.fontVariantNumeric).toContain('tabular-nums');
    const root = getComputedStyle(document.documentElement);
    expect(style.fontSize).toBe(root.getPropertyValue('--hmha-type-label-sm-size').trim());
  });

  it('is axe-clean for every tone and appearance, text, count and dot, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const appearance of APPEARANCES) {
        for (const tone of TONES) {
          for (const form of ['text', 'count', 'dot'] as const) {
            host.tone.set(tone);
            host.appearance.set(appearance);
            host.count.set(form === 'count' ? 12 : null);
            host.dot.set(form === 'dot');
            await settle();
            const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
            expect(results.violations)
              .withContext(`${mode} ${appearance} ${tone} ${form}`)
              .toEqual([]);
          }
        }
      }
    }
  });
});
