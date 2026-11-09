import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaTable } from '../table/table';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableRow } from '../table/table-row';
import { contrast, paint } from '../core/testing/paint';
import { HmhaSkeleton, type HmhaSkeletonShape } from './skeleton';

@Component({
  selector: 'skeleton-host',
  imports: [HmhaSkeleton],
  template: `
    <div style="width: 400px; font-size: 16px; line-height: 24px;">
      <span hmhaSkeleton data-testid="one" [shape]="shape()" [width]="width()" [height]="height()"></span>
    </div>
    <div style="width: 400px; font-size: 16px; line-height: 24px;" data-testid="paragraph">
      <span hmhaSkeleton></span>
      <span hmhaSkeleton></span>
      <span hmhaSkeleton width="60%"></span>
    </div>
    <div hmhaSkeleton data-testid="on-div"></div>
  `,
})
class SkeletonHost {
  readonly shape = signal<HmhaSkeletonShape>('text');
  readonly width = signal<string | null>(null);
  readonly height = signal<string | null>(null);
}

@Component({
  selector: 'skeleton-table-host',
  imports: [HmhaSkeleton, HmhaTable, HmhaTableRow, HmhaTableCell],
  // The README's headline pattern: the container being loaded says it's
  // busy, the placeholders inside are hidden.
  template: `
    <table hmhaTable aria-label="Your library" style="width: 600px;">
      <tbody aria-busy="true">
        @for (row of [1, 2, 3]; track row) {
          <tr hmhaTableRow>
            <td hmhaTableCell style="width: 60px;"><span hmhaSkeleton shape="circle"></span></td>
            <td hmhaTableCell><span hmhaSkeleton width="60%"></span></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class SkeletonTableHost {}


describe('HmhaSkeleton', () => {
  let fixture: ComponentFixture<SkeletonHost>;
  let host: SkeletonHost;
  let one: HTMLElement;

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
      imports: [SkeletonHost, SkeletonTableHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonHost);
    host = fixture.componentInstance;
    one = fixture.nativeElement.querySelector('[data-testid="one"]');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('is always hidden from assistive tech, on a span or a div', () => {
    expect(one.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('[data-testid="on-div"]').getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to a text line: full width, one em tall', () => {
    expect(one.getAttribute('data-shape')).toBe('text');
    const box = one.getBoundingClientRect();
    expect(box.width).toBeCloseTo(400, 0);
    expect(box.height).toBeCloseTo(16, 0);
  });

  it('stacks text lines one line-height apart, the rhythm of real text', () => {
    const [a, b, c] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('[data-testid="paragraph"] [hmhaSkeleton]'),
    ).map((el) => el.getBoundingClientRect());
    expect(b.top - a.top).toBeCloseTo(24, 0);
    expect(c.top - b.top).toBeCloseTo(24, 0);
    expect(c.width).toBeCloseTo(240, 0); // width="60%"
  });

  it('applies width and height as the consumer’s own lengths', async () => {
    host.width.set('12rem');
    host.height.set('3rem');
    await settle();
    expect(one.style.inlineSize).toBe('12rem');
    expect(one.style.blockSize).toBe('3rem');
  });

  it('draws a circle at a control’s height, and keeps it square at any width', async () => {
    host.shape.set('circle');
    await settle();
    let box = one.getBoundingClientRect();
    expect(box.width).toBeCloseTo(tokenPx('--hmha-control-height'), 0);
    expect(box.height).toBeCloseTo(box.width, 0);

    host.width.set('64px');
    await settle();
    box = one.getBoundingClientRect();
    expect(box.width).toBeCloseTo(64, 0);
    expect(box.height).toBeCloseTo(64, 0);
  });

  it('draws a rect at 16:9 by default, and an explicit height wins', async () => {
    host.shape.set('rect');
    await settle();
    let box = one.getBoundingClientRect();
    expect(box.height).toBeCloseTo((box.width * 9) / 16, 0);

    host.height.set('50px');
    await settle();
    box = one.getBoundingClientRect();
    expect(box.height).toBeCloseTo(50, 0);
  });

  it('pulses', () => {
    expect(getComputedStyle(one).animationName).toContain('hmha-skeleton-pulse');
  });

  it('stays visible on the page, a surface and a card, in both modes', () => {
    // The regression this guards: a fixed `border` fill equalled a card's
    // surface-raised in dark mode (1.00:1), so placeholders on a card
    // vanished. Not a WCAG floor (a skeleton carries no information), just
    // "you can see it": the translucent fill is composited over its ground.
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const ground of ['bg', 'surface', 'surface-raised']) {
        const container = document.createElement('div');
        container.style.background = `var(--hmha-color-${ground})`;
        container.style.color = 'var(--hmha-color-text)';
        container.appendChild(one);
        document.body.appendChild(container);

        const under = paint(getComputedStyle(container).backgroundColor);
        const seen = paint(getComputedStyle(one).backgroundColor, under);
        expect(contrast(seen, under))
          .withContext(`${mode} on ${ground}`)
          .toBeGreaterThan(1.2);
        container.remove();
      }
    }
  });

  it('composes into a loading table row: widths follow the cell, axe-clean in both modes', async () => {
    const tableFixture = TestBed.createComponent(SkeletonTableHost);
    tableFixture.detectChanges();
    await tableFixture.whenStable();

    const cell: HTMLElement = tableFixture.nativeElement.querySelectorAll('td')[1];
    const bar: HTMLElement = cell.querySelector('[hmhaSkeleton]')!;
    const style = getComputedStyle(cell);
    const content = cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    expect(bar.getBoundingClientRect().width).toBeCloseTo(content * 0.6, 0);

    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const results = await axe.run(tableFixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(mode).toEqual([]);
    }
  });
});
