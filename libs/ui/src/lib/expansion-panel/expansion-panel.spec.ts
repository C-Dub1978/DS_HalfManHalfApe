import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaExpansionPanel } from './expansion-panel';

@Component({
  selector: 'expansion-panel-host',
  imports: [HmhaExpansionPanel],
  template: `
    <details hmhaExpansionPanel [(expanded)]="expanded">
      <summary>FAQ item</summary>
      <p>The answer.</p>
    </details>
  `,
})
class ExpansionPanelHost {
  expanded = false;
}

describe('HmhaExpansionPanel', () => {
  // expanded is set before the fixture's first detectChanges(), never
  // mutated on an already-checked fixture — same zoneless constraint
  // card.spec.ts documents for its own `elevated` input.
  function create(expanded = false) {
    const fixture = TestBed.createComponent(ExpansionPanelHost);
    fixture.componentInstance.expanded = expanded;
    fixture.detectChanges();
    return { fixture, details: fixture.nativeElement.querySelector('details') as HTMLDetailsElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ExpansionPanelHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates on a native details element', () => {
    const { details } = create();
    expect(details.tagName).toBe('DETAILS');
  });

  it('defaults to collapsed', () => {
    const { details } = create();
    expect(details.open).toBe(false);
  });

  it('opens when expanded is bound true', () => {
    const { details } = create(true);
    expect(details.open).toBe(true);
  });

  // Karma's ChromeHeadlessNoSandbox launcher doesn't fire <details>'s
  // native `toggle` event from a synthetic summary.click() — confirmed by
  // a direct listener: `open` itself flips correctly (real native
  // behavior, launcher-independent), but `toggle` never fires. Same class
  // of launcher gap as the <dialog> close event (fork 14). Test the
  // reaction to the event directly instead; the real end-to-end proof
  // (does a genuine click actually work) belongs in Storybook's
  // `test-run`, not here.
  it('reacts to a real toggle event by syncing the expanded model from the native open property', async () => {
    const { fixture, details } = create();
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();

    expect(fixture.componentInstance.expanded).toBe(true);
  });

  it('reacts to a toggle event reporting closed by clearing the expanded model', async () => {
    const { fixture, details } = create(true);
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();

    expect(fixture.componentInstance.expanded).toBe(false);
  });

  it('is axe-clean, expanded and collapsed, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const expanded of [false, true]) {
        const { fixture } = create(expanded);
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`mode="${mode}" expanded=${expanded}`).toEqual([]);
      }
    }
  });
});
