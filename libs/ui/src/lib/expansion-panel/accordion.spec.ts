import { Component, provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaExpansionPanel } from './expansion-panel';
import { HmhaExpansionPanelTrigger } from './expansion-panel-trigger';
import { HmhaExpansionPanelContent } from './expansion-panel-content';
import { HmhaAccordion } from './accordion';

@Component({
  selector: 'accordion-host',
  imports: [HmhaAccordion, HmhaExpansionPanel, HmhaExpansionPanelTrigger, HmhaExpansionPanelContent],
  template: `
    <div hmhaAccordion>
      <details hmhaExpansionPanel name="faq">
        <summary hmhaExpansionPanelTrigger>Question A</summary>
        <div hmhaExpansionPanelContent>Answer A</div>
      </details>
      <details hmhaExpansionPanel name="faq">
        <summary hmhaExpansionPanelTrigger>Question B</summary>
        <div hmhaExpansionPanelContent>Answer B</div>
      </details>
    </div>
  `,
})
class AccordionHost {}

describe('HmhaAccordion', () => {
  function create() {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      accordion: el.querySelector('[hmhaAccordion]') as HTMLElement,
      panels: Array.from(el.querySelectorAll('details')) as HTMLDetailsElement[],
    };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [AccordionHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates and projects both panels', () => {
    const { panels } = create();
    expect(panels.length).toBe(2);
  });

  it('a shared name makes opening one panel natively close the other', () => {
    const { panels } = create();
    panels[0].open = true;
    expect(panels[0].open).toBe(true);
    expect(panels[1].open).toBe(false);

    panels[1].open = true;
    expect(panels[1].open).toBe(true);
    expect(panels[0].open).toBe(false);
  });

  it('clicking one panel\'s trigger closes the other via the native shared name, not any Hmha logic', async () => {
    const { fixture, panels, el } = create();
    const triggers = Array.from(el.querySelectorAll('summary')) as HTMLElement[];

    triggers[0].click();
    await fixture.whenStable();
    expect(panels[0].open).toBe(true);

    triggers[1].click();
    await fixture.whenStable();
    expect(panels[1].open).toBe(true);
    expect(panels[0].open).toBe(false);
  });

  // Karma's ChromeHeadlessNoSandbox launcher doesn't fire <details>'s
  // native `toggle` event from a synthetic click at all (confirmed in
  // expansion-panel.spec.ts) — so it can't tell us whether a *real*
  // browser also fires `toggle` on a sibling that native name-grouping
  // auto-closes, only whether HmhaExpansionPanel reacts correctly *if*
  // it does. Simulating that directly: a real end-to-end check (does a
  // genuine click on one panel actually sync the other's model too)
  // belongs in Storybook's `test-run`, not here.
  it('would sync the auto-closed sibling\'s own expanded model too, if toggle fires on it the way it does on the one directly clicked', async () => {
    const { fixture, el } = create();
    const panelInstances = fixture.debugElement.queryAll(By.directive(HmhaExpansionPanel)).map((de) => de.injector.get(HmhaExpansionPanel));
    const [panel0, panel1] = el.querySelectorAll('details') as unknown as [HTMLDetailsElement, HTMLDetailsElement];

    panel0.open = true;
    panel0.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();
    expect(panelInstances[0].expanded()).toBe(true);

    // Simulates the native shared-`name` grouping: opening panel 1 closes
    // panel 0, and (per the real-browser check this unit test can't
    // perform) a real toggle fires on both.
    panel1.open = true;
    panel0.open = false;
    panel1.dispatchEvent(new Event('toggle'));
    panel0.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();
    expect(panelInstances[0].expanded()).toBe(false);
    expect(panelInstances[1].expanded()).toBe(true);
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
