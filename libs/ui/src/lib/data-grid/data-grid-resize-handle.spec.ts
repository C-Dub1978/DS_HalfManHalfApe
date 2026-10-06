import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaDataGridResizeHandle } from './data-grid-resize-handle';

@Component({
  selector: 'resize-handle-host',
  imports: [HmhaDataGridResizeHandle],
  template: `
    <table style="table-layout: fixed; width: 400px;">
      <tr>
        <th style="position: relative;">
          Name
          <div
            hmhaDataGridResizeHandle
            label="Resize Name column"
            [minWidth]="minWidth"
            [maxWidth]="maxWidth"
            [width]="initialWidth"
          ></div>
        </th>
      </tr>
    </table>
  `,
})
class ResizeHandleHost {
  minWidth = 48;
  maxWidth: number | null = null;
  // Bound explicitly rather than left to measure real table layout — a
  // single-column `<col width>` doesn't reliably hold against a wider
  // `table-layout: fixed` table across browsers/test-runner page states,
  // and this way every arithmetic test has a known, stable starting point
  // regardless. The one test for the *unset* case still measures for real.
  initialWidth: number | null = 200;
}

function pointerEvent(type: string, init: { pointerId: number; clientX: number }): PointerEvent {
  return new PointerEvent(type, { pointerId: init.pointerId, clientX: init.clientX, bubbles: true });
}

describe('HmhaDataGridResizeHandle', () => {
  function create(state: Partial<ResizeHandleHost> = {}) {
    const fixture = TestBed.createComponent(ResizeHandleHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    const handle = fixture.nativeElement.querySelector('[hmhaDataGridResizeHandle]') as HTMLElement;
    const th = fixture.nativeElement.querySelector('th') as HTMLElement;
    return { fixture, handle, th };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeHandleHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('creates', () => {
    const { handle } = create();
    expect(handle).toBeTruthy();
  });

  it('exposes the WAI-ARIA separator pattern — role, orientation, focusability, and the required label', () => {
    const { handle } = create();
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-label')).toBe('Resize Name column');
  });

  it('applies a bound initial width to the column immediately', () => {
    const { th } = create();
    expect(th.style.width).toBe('200px');
  });

  it('reflects the measured column width as aria-valuenow when no width is bound yet — WAI-ARIA requires it whenever separator is focusable', () => {
    const { handle, th } = create({ initialWidth: null });
    const measured = Math.round(th.getBoundingClientRect().width);
    expect(handle.getAttribute('aria-valuenow')).toBe(String(measured));
  });

  it('reflects minWidth as aria-valuemin, and omits aria-valuemax when unset', () => {
    const { handle } = create({ minWidth: 64 });
    expect(handle.getAttribute('aria-valuemin')).toBe('64');
    expect(handle.hasAttribute('aria-valuemax')).toBe(false);
  });

  it('ArrowRight grows the column by one step', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(th.style.width).toBe('210px'); // 200 + default step (10)
  });

  it('ArrowLeft shrinks the column by one step', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await fixture.whenStable();
    expect(th.style.width).toBe('190px');
  });

  it('never shrinks the column below minWidth', async () => {
    const { fixture, handle, th } = create({ minWidth: 195 });
    for (let i = 0; i < 5; i++) {
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await fixture.whenStable();
    }
    expect(th.style.width).toBe('195px');
  });

  it('never grows the column beyond maxWidth', async () => {
    const { fixture, handle, th } = create({ maxWidth: 205 });
    for (let i = 0; i < 5; i++) {
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await fixture.whenStable();
    }
    expect(th.style.width).toBe('205px');
  });

  it('reflects the current width as aria-valuenow after a resize', async () => {
    const { fixture, handle } = create();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('210');
  });

  it('ignores keys other than the arrow keys', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(th.style.width).toBe('200px');
  });

  it('dragging the pointer resizes the column by the pointer delta', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 100 }));
    handle.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 140 }));
    await fixture.whenStable();
    expect(th.style.width).toBe('240px'); // 200 + 40px drag delta
  });

  it('ignores pointermove events from an unrelated pointer id', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 100 }));
    handle.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 300 }));
    await fixture.whenStable();
    expect(th.style.width).toBe('200px');
  });

  it('stops resizing after pointerup', async () => {
    const { fixture, handle, th } = create();
    handle.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 100 }));
    handle.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 140 }));
    handle.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 140 }));
    handle.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 400 }));
    await fixture.whenStable();
    expect(th.style.width).toBe('240px');
  });

  it('is axe-clean before any interaction, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      const { fixture } = create();
      await fixture.whenStable();
      const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);

      document.documentElement.removeAttribute('data-hmha-mode');
    }
  });

  it('is axe-clean after a resize, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      const { fixture, handle } = create();
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await fixture.whenStable();

      const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);

      document.documentElement.removeAttribute('data-hmha-mode');
    }
  });
});
