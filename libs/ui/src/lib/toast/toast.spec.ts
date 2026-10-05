import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaToast } from './toast';

function panel(): HTMLElement | null {
  return document.querySelector('[hmhaToastPanel]');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('HmhaToast', () => {
  let toast: HmhaToast;
  let appRef: ApplicationRef;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    toast = TestBed.inject(HmhaToast);
    appRef = TestBed.inject(ApplicationRef);
  });

  // A ComponentPortal attached with no ViewContainerRef (Toast has no host
  // element to give it one — see DECISIONS.md fork 17) is rendered via
  // ApplicationRef.attachView(), not viewContainerRef.createComponent().
  // There's no fixture.detectChanges() to flush its first render here, so
  // this stands in for it.
  function flush(): void {
    appRef.tick();
  }

  it('shows a status live-region panel with the message text', async () => {
    toast.show('Saved', 60);
    flush();
    expect(panel()?.getAttribute('role')).toBe('status');
    expect(panel()?.getAttribute('aria-live')).toBe('polite');
    expect(panel()?.textContent).toBe('Saved');
    await wait(80);
  });

  it('auto-dismisses after the given duration', async () => {
    toast.show('Saved', 60);
    flush();
    expect(panel()).toBeTruthy();
    await wait(80);
    expect(panel()).toBeNull();
  });

  it('queues a second message instead of replacing the first immediately', async () => {
    toast.show('First', 60);
    toast.show('Second', 60);
    flush();
    expect(panel()?.textContent).toBe('First');

    // First is visible [0, 60); Second takes over [60, 120) — 80 lands
    // inside Second's window, after First has handed off but before
    // Second's own timer fires.
    await wait(80);
    flush();
    expect(panel()?.textContent).toBe('Second');
    await wait(80);
  });

  it('processes a longer queue in FIFO order', async () => {
    toast.show('A', 60);
    toast.show('B', 60);
    toast.show('C', 60);
    flush();
    expect(panel()?.textContent).toBe('A');

    // A: [0, 60), B: [60, 120), C: [120, 180). Each 80ms step lands inside
    // the next message's window without overrunning into the one after.
    await wait(80);
    flush();
    expect(panel()?.textContent).toBe('B');

    await wait(80);
    flush();
    expect(panel()?.textContent).toBe('C');

    await wait(80);
    expect(panel()).toBeNull();
  });

  it('is axe-clean while visible, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      toast.show('Saved', 60);
      flush();

      // The panel lives in the CDK overlay container, a sibling of any
      // fixture in the real DOM — scoping to it keeps this from picking up
      // unrelated violations in the surrounding Karma test page, the same
      // reasoning as menu.spec.ts and tooltip.spec.ts.
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      const results = await axe.run(overlayContainer, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);

      await wait(80);
    }
    document.documentElement.removeAttribute('data-hmha-mode');
  });
});
