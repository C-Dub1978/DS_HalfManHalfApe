import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaExpansionPanelContent } from './expansion-panel-content';

@Component({
  selector: 'expansion-panel-content-host',
  imports: [HmhaExpansionPanelContent],
  template: `<div hmhaExpansionPanelContent>The answer.</div>`,
})
class ExpansionPanelContentHost {}

describe('HmhaExpansionPanelContent', () => {
  function create() {
    const fixture = TestBed.createComponent(ExpansionPanelContentHost);
    fixture.detectChanges();
    return { fixture, content: fixture.nativeElement.querySelector('[hmhaExpansionPanelContent]') as HTMLElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ExpansionPanelContentHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates on a native div and projects its content', () => {
    const { content } = create();
    expect(content.tagName).toBe('DIV');
    expect(content.textContent).toContain('The answer.');
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
