import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaComboboxOption]'));
}

// HmhaComboboxOption's own (mousedown) → preventDefault() (which keeps
// real focus on HmhaComboboxInput when an option is clicked) isn't
// tested here. Neither `.click()` (used below) nor a plain
// `dispatchEvent(new MouseEvent('mousedown'))` reproduces the browser's
// actual default focus-shifting behavior that fix suppresses — confirmed
// by temporarily removing the fix and finding every test here, including
// an explicit dispatched-mousedown attempt, still passed. That behavior
// only showed up — and was fixed and verified — via Storybook's
// `userEvent`-driven real pointer interaction (ComboboxInput's
// SelectionInteraction story), not Karma.

@Component({
  selector: 'combobox-option-host',
  imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <input [hmhaCombobox]="listboxTpl" [formControl]="country" />
    <ng-template #listboxTpl>
      <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
        <div hmhaComboboxOption cdkOption="United States">United States</div>
        <div hmhaComboboxOption cdkOption="Canada" cdkOptionDisabled>Canada</div>
      </div>
    </ng-template>
  `,
})
class ComboboxOptionHost {
  country = new FormControl('', { nonNullable: true });
}

describe('HmhaComboboxOption', () => {
  let fixture: ComponentFixture<ComboboxOptionHost>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [ComboboxOptionHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboboxOptionHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    input.focus();
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('creates with role="option"', () => {
    const [first] = options();
    expect(first.getAttribute('role')).toBe('option');
  });

  it('reflects the cdkOptionDisabled input as aria-disabled', () => {
    const [, canada] = options();
    expect(canada.getAttribute('aria-disabled')).toBe('true');
  });

  it('clicking an enabled option sets it as the FormControl value and closes the listbox', () => {
    const [us] = options();
    us.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.country.value).toBe('United States');
    expect(document.querySelector('.cdk-overlay-pane [hmhaComboboxListbox]')).toBeNull();
  });

  it('clicking a disabled option does neither', () => {
    const [, canada] = options();
    canada.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.country.value).toBe('');
    expect(document.querySelector('.cdk-overlay-pane [hmhaComboboxListbox]')).toBeTruthy();
  });

  it('is axe-clean with the listbox open, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      const results = await axe.run(overlayContainer, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
