import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaButton } from './button';
import { HmhaIconButton } from './icon-button';

@Component({
  selector: 'icon-button-host',
  imports: [HmhaButton, HmhaIconButton],
  template: `<button hmhaButton hmhaIconButton [label]="label" tone="neutral"><span aria-hidden="true">×</span></button>`,
})
class IconButtonHost {
  label = 'Close';
}

describe('HmhaIconButton', () => {
  function create() {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [IconButtonHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates alongside hmhaButton on the same element', () => {
    const { button } = create();
    expect(button).toBeTruthy();
    expect(button.hasAttribute('data-tone')).toBe(true);
  });

  it('sets aria-label from the required label input', () => {
    const { button } = create();
    expect(button.getAttribute('aria-label')).toBe('Close');
  });

  it('sets data-icon-only so button.css can square the control', () => {
    const { button } = create();
    expect(button.getAttribute('data-icon-only')).toBe('');
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
