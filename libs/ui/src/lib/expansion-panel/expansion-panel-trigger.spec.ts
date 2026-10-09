import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaExpansionPanel } from './expansion-panel';
import { HmhaExpansionPanelTrigger } from './expansion-panel-trigger';

@Component({
  selector: 'expansion-panel-trigger-host',
  imports: [HmhaExpansionPanel, HmhaExpansionPanelTrigger],
  template: `
    <details hmhaExpansionPanel [expanded]="expanded">
      <summary hmhaExpansionPanelTrigger>FAQ item</summary>
      <p>The answer.</p>
    </details>
  `,
})
class ExpansionPanelTriggerHost {
  expanded = false;
}

describe('HmhaExpansionPanelTrigger', () => {
  function create(expanded = false) {
    const fixture = TestBed.createComponent(ExpansionPanelTriggerHost);
    fixture.componentInstance.expanded = expanded;
    fixture.detectChanges();
    return {
      fixture,
      trigger: fixture.nativeElement.querySelector('summary') as HTMLElement,
      icon: fixture.nativeElement.querySelector('hmha-icon') as HTMLElement,
    };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ExpansionPanelTriggerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates on a native summary and projects the label', () => {
    const { trigger } = create();
    expect(trigger.tagName).toBe('SUMMARY');
    expect(trigger.textContent).toContain('FAQ item');
  });

  it('renders a chevron icon', () => {
    const { icon } = create();
    expect(icon).toBeTruthy();
  });

  it('rotates the chevron when the parent panel is expanded', () => {
    const { icon: collapsedIcon } = create(false);
    const { icon: expandedIcon } = create(true);

    const collapsedTransform = getComputedStyle(collapsedIcon).transform;
    const expandedTransform = getComputedStyle(expandedIcon).transform;
    expect(expandedTransform).not.toBe(collapsedTransform);
  });

  it('updates data-expanded after a live toggle, not just an initial bound value — the injected parent panel\'s signal change propagates across the component boundary', async () => {
    const { fixture, trigger } = create(false);
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    // Karma doesn't fire a real toggle from summary.click() (see
    // expansion-panel.spec.ts) — set .open and dispatch it directly.
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();

    expect(trigger.getAttribute('data-expanded')).toBe('');
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
