import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { contrast, paint } from '../core/testing/paint';
import { HmhaAvatar, hmhaInitials } from './avatar';

// A 1x1 transparent GIF: a real image that loads without a network request.
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

@Component({
  selector: 'avatar-host',
  imports: [HmhaAvatar],
  template: `
    <span
      hmhaAvatar
      [name]="name()"
      [label]="label()"
      [src]="src()"
      [size]="size()"
      [decorative]="decorative()"
    ></span>
  `,
})
class AvatarHost {
  readonly name = signal<string | null>('Chris Wilson');
  readonly label = signal<string | null>(null);
  readonly src = signal<string | null>(null);
  readonly size = signal<HmhaSize>('md');
  readonly decorative = signal(false);
}

describe('hmhaInitials', () => {
  const cases: [string | null, string][] = [
    ['Chris Wilson', 'CW'],
    ['Madonna', 'M'],
    ['Jean-Luc van der Berg', 'JB'],
    ['  chris   wilson  ', 'CW'],
    ['Émile Zola', 'ÉZ'],
    ['李 小龍', '李小'],
    ['(Chris) Wilson', 'CW'],
    ['😀 Smile', 'S'],
    ['', ''],
    [null, ''],
  ];
  for (const [name, expected] of cases) {
    it(`"${name}" → "${expected}"`, () => expect(hmhaInitials(name)).toBe(expected));
  }
});

describe('HmhaAvatar', () => {
  let fixture: ComponentFixture<AvatarHost>;
  let host: AvatarHost;
  let avatar: HTMLElement;

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
      imports: [AvatarHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarHost);
    host = fixture.componentInstance;
    avatar = fixture.nativeElement.querySelector('[hmhaAvatar]');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('is an image named after the person', () => {
    expect(avatar.getAttribute('role')).toBe('img');
    expect(avatar.getAttribute('aria-label')).toBe('Chris Wilson');
  });

  it('takes a label that overrides the accessible name but not the initials', async () => {
    host.label.set('Chris Wilson, online');
    await settle();
    expect(avatar.getAttribute('aria-label')).toBe('Chris Wilson, online');
    expect(avatar.textContent?.trim()).toBe('CW');
  });

  it('falls back to "User" as its name when it has none', async () => {
    host.name.set(null);
    await settle();
    expect(avatar.getAttribute('aria-label')).toBe('User');
  });

  it('leaves the accessibility tree entirely when decorative', async () => {
    host.decorative.set(true);
    await settle();
    expect(avatar.hasAttribute('role')).toBe(false);
    expect(avatar.hasAttribute('aria-label')).toBe(false);
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows initials when there is no photo', () => {
    expect(avatar.getAttribute('data-content')).toBe('initials');
    expect(avatar.textContent?.trim()).toBe('CW');
  });

  it('shows the photo, with an empty alt, when there is one', async () => {
    host.src.set(PIXEL);
    await settle();
    const img = avatar.querySelector('img')!;
    expect(avatar.getAttribute('data-content')).toBe('image');
    expect(img.getAttribute('alt')).toBe('');
    expect(avatar.textContent?.trim()).toBe('');
  });

  it('falls back to initials when the photo fails, and retries on a new src', async () => {
    host.src.set('https://example.invalid/expired.jpg');
    await settle();
    // Our reaction to the image's error event: dispatched directly rather
    // than waiting on a real failed request.
    avatar.querySelector('img')!.dispatchEvent(new Event('error'));
    await settle();
    expect(avatar.getAttribute('data-content')).toBe('initials');
    expect(avatar.querySelector('img')).toBeNull();

    host.src.set(PIXEL);
    await settle();
    expect(avatar.getAttribute('data-content')).withContext('a new URL gets a fresh attempt').toBe('image');
  });

  it('falls back to the user icon with no photo and no usable name', async () => {
    host.name.set('  ');
    await settle();
    expect(avatar.getAttribute('data-content')).toBe('icon');
    expect(avatar.querySelector('hmha-icon')).toBeTruthy();
  });

  it('sizes to the control heights, and any length through --hmha-avatar-size', async () => {
    for (const [size, token] of [
      ['sm', '--hmha-control-height-sm'],
      ['md', '--hmha-control-height'],
      ['lg', '--hmha-control-height-lg'],
    ] as const) {
      host.size.set(size);
      await settle();
      const box = avatar.getBoundingClientRect();
      expect(box.width).withContext(size).toBeCloseTo(tokenPx(token), 0);
      expect(box.height).withContext(size).toBeCloseTo(box.width, 0);
    }
    avatar.style.setProperty('--hmha-avatar-size', '96px');
    expect(avatar.getBoundingClientRect().width).toBeCloseTo(96, 0);
  });

  it('is visible, with readable initials, on the page, a surface and a card, in both modes', () => {
    // The lesson from HmhaSkeleton (fork 38): a fixed neutral fill vanishes
    // on some surface. The circle must show (> 1.2:1), and the initials are
    // text, so they must clear 4.5:1 against the circle as it's actually seen.
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const ground of ['bg', 'surface', 'surface-raised']) {
        const container = document.createElement('div');
        container.style.background = `var(--hmha-color-${ground})`;
        container.style.color = 'var(--hmha-color-text)';
        container.appendChild(avatar);
        document.body.appendChild(container);

        const under = paint(getComputedStyle(container).backgroundColor);
        const circle = paint(getComputedStyle(avatar).backgroundColor, under);
        const initials = paint(getComputedStyle(avatar).color, circle);
        expect(contrast(circle, under)).withContext(`${mode} circle on ${ground}`).toBeGreaterThan(1.2);
        expect(contrast(initials, circle)).withContext(`${mode} initials on ${ground}`).toBeGreaterThanOrEqual(4.5);
        container.remove();
      }
    }
  });

  it('is axe-clean for photo, initials and icon, named and decorative, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const [name, src] of [['Chris Wilson', PIXEL], ['Chris Wilson', null], [null, null]] as const) {
        for (const decorative of [false, true]) {
          host.name.set(name);
          host.src.set(src);
          host.decorative.set(decorative);
          await settle();
          const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations)
            .withContext(`mode="${mode}" name=${name} src=${!!src} decorative=${decorative}`)
            .toEqual([]);
        }
      }
    }
  });
});
