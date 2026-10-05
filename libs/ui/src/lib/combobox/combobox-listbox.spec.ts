import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaComboboxOption]'));
}
function panel(): HTMLElement {
  return document.querySelector('.cdk-overlay-pane [hmhaComboboxListbox]') as HTMLElement;
}

function dispatchKeydown(key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  document.activeElement?.dispatchEvent(event);
}
function arrowDown(): void {
  dispatchKeydown('ArrowDown', 40);
}
function enter(): void {
  dispatchKeydown('Enter', 13);
}

@Component({
  selector: 'combobox-listbox-host',
  imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <input [hmhaCombobox]="listboxTpl" [formControl]="country" />
    <ng-template #listboxTpl>
      <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
        <div hmhaComboboxOption cdkOption="United States">United States</div>
        <div hmhaComboboxOption cdkOption="Canada" [cdkOptionDisabled]="canadaDisabled">Canada</div>
        <div hmhaComboboxOption cdkOption="Mexico">Mexico</div>
      </div>
    </ng-template>
  `,
})
class ComboboxListboxHost {
  country = new FormControl('', { nonNullable: true });
  canadaDisabled = false;
}

describe('HmhaComboboxListbox', () => {
  let fixture: ComponentFixture<ComboboxListboxHost>;
  let input: HTMLInputElement;

  function openListbox(): void {
    input.focus();
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboboxListboxHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboboxListboxHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  it('renders as a real listbox, labelled by the input that opened it', () => {
    openListbox();
    expect(panel().getAttribute('role')).toBe('listbox');
    expect(panel().getAttribute('aria-labelledby')).toBe(input.id);
  });

  it('ArrowDown moves the active option without moving real DOM focus off the input', () => {
    openListbox();
    arrowDown();
    fixture.detectChanges();

    const [first] = options();
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
    expect(first.classList.contains('cdk-option-active')).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('a second ArrowDown moves to the next option', () => {
    openListbox();
    arrowDown();
    arrowDown();
    fixture.detectChanges();

    const [, second] = options();
    expect(input.getAttribute('aria-activedescendant')).toBe(second.id);
  });

  it('skips a disabled option when navigating past it', () => {
    fixture.componentInstance.canadaDisabled = true;
    openListbox();
    arrowDown();
    arrowDown();
    fixture.detectChanges();

    const [, , third] = options();
    expect(input.getAttribute('aria-activedescendant')).toBe(third.id);
  });

  it('Enter commits the active option, same as clicking it', () => {
    openListbox();
    arrowDown();
    fixture.detectChanges();
    enter();
    fixture.detectChanges();

    expect(fixture.componentInstance.country.value).toBe('United States');
    expect(document.querySelector('.cdk-overlay-pane [hmhaComboboxListbox]')).toBeNull();
  });
});
