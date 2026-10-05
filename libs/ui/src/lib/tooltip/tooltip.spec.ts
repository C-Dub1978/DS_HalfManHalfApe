import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaTooltip } from './tooltip';

function panel(): HTMLElement | null {
  return document.querySelector('[hmhaTooltipPanel]');
}

@Component({
  selector: 'tooltip-host',
  imports: [HmhaTooltip],
  template: `<button type="button" [hmhaTooltip]="message">Hover me</button>`,
})
class TooltipHost {
  message = 'Saved to drafts';
}

describe('HmhaTooltip', () => {
  let fixture: ComponentFixture<TooltipHost>;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('describes the host via a hidden element, independent of hover state', () => {
    const describedId = trigger.getAttribute('aria-describedby');
    expect(describedId).toBeTruthy();
    const message = document.getElementById(describedId as string);
    expect(message?.textContent).toBe('Saved to drafts');
    expect(panel()).toBeNull();
  });

  it('shows the panel on mouseenter, with role="tooltip" and the message text', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(panel()?.getAttribute('role')).toBe('tooltip');
    expect(panel()?.textContent).toBe('Saved to drafts');
  });

  it('hides the panel on mouseleave', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('shows on focus and hides on blur, for keyboard users', () => {
    trigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('a second mouseenter while already open does not create a duplicate panel', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(document.querySelectorAll('[hmhaTooltipPanel]').length).toBe(1);
  });

  it('Escape dismisses the panel even though focus never leaves the trigger', () => {
    trigger.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('destroying the host removes an open panel and its aria-describedby registration', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    const describedId = trigger.getAttribute('aria-describedby') as string;

    fixture.destroy();
    expect(panel()).toBeNull();
    expect(document.getElementById(describedId)).toBeNull();
  });

  it('is axe-clean with the panel open, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // The panel (CDK overlay) and AriaDescriber's hidden message both
      // live in document.body, siblings of fixture.nativeElement rather
      // than descendants of it — scanning both explicitly (not the whole
      // body) keeps this from picking up unrelated violations in the
      // surrounding Karma test page, the same reasoning as menu.spec.ts.
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      const results = await axe.run([fixture.nativeElement, overlayContainer], {
        runOnly: ['wcag2a', 'wcag2aa'],
      });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
    }
    document.documentElement.removeAttribute('data-hmha-mode');
  });
});
