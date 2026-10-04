import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

function overlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane [hmhaComboboxListbox]');
}

// CdkListbox's own (keydown) host listener reads the legacy
// event.keyCode — a synthetic KeyboardEvent never populates it in Chrome,
// same gap as everywhere else CDK's key managers are driven (fork 15's
// note). Dispatched directly at document.activeElement, same as a real
// keypress would reach whatever currently has focus.
function dispatchKeydown(key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  document.activeElement?.dispatchEvent(event);
}

@Component({
  selector: 'combobox-input-host',
  imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <input #trigger [hmhaCombobox]="listboxTpl" [formControl]="country" />
    <ng-template #listboxTpl>
      <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
        <div hmhaComboboxOption cdkOption="United States">United States</div>
        <div hmhaComboboxOption cdkOption="Canada">Canada</div>
      </div>
    </ng-template>
  `,
})
class ComboboxInputHost {
  readonly trigger = viewChild.required(HmhaComboboxInput);
  country = new FormControl('', { nonNullable: true });
}

describe('HmhaComboboxInput', () => {
  let fixture: ComponentFixture<ComboboxInputHost>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboboxInputHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboboxInputHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    input.focus();
  });

  afterEach(() => {
    fixture.componentInstance.trigger().close();
  });

  it('creates as a real text input advertising a combobox popup', () => {
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('text');
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('starts closed, with aria-expanded false and nothing in the overlay', () => {
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(overlayPanel()).toBeNull();
  });

  it('opens on input (typing), and aria-controls points to the open listbox', () => {
    input.value = 'Uni';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = overlayPanel() as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('ArrowDown opens the popup when closed', () => {
    dispatchKeydown('ArrowDown', 40);
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('Escape closes the popup without moving focus off the input', () => {
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('true');

    dispatchKeydown('Escape', 27);
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(input);
  });

  it('selecting an option sets the FormControl to its text and closes, keeping focus on the input', () => {
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const canada = document.querySelector('.cdk-overlay-pane [cdkoption="Canada"]') as HTMLElement;
    canada.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.country.value).toBe('Canada');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(input);
  });

  it('disables via the FormControl', () => {
    fixture.componentInstance.country.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
