import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

function overlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane [hmhaSelectListbox]');
}

@Component({
  selector: 'select-trigger-host',
  imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <button #trigger [hmhaSelectTrigger]="listboxTpl" [formControl]="control">Choose a country</button>
    <ng-template #listboxTpl>
      <div hmhaSelectListbox cdkListbox>
        <div hmhaSelectOption cdkOption="us">United States</div>
        <div hmhaSelectOption cdkOption="ca">Canada</div>
      </div>
    </ng-template>
  `,
})
class SelectTriggerHost {
  readonly trigger = viewChild.required(HmhaSelectTrigger);
  control = new FormControl('', { nonNullable: true });
}

describe('HmhaSelectTrigger', () => {
  let fixture: ComponentFixture<SelectTriggerHost>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTriggerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTriggerHost);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    fixture.componentInstance.trigger().close();
  });

  it('creates as a real <button type="button"> advertising a listbox popup', () => {
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('starts closed, with aria-expanded false and nothing in the overlay', () => {
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(overlayPanel()).toBeNull();
  });

  it('opens the listbox and sets aria-expanded on click', () => {
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(overlayPanel()).toBeTruthy();
  });

  it('closes the listbox on a second click (toggle)', () => {
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(overlayPanel()).toBeNull();
  });

  it('returns focus to the trigger when the listbox closes', () => {
    button.click();
    fixture.detectChanges();
    fixture.componentInstance.trigger().close();
    fixture.detectChanges();
    expect(document.activeElement).toBe(button);
  });

  it("updates the bound FormControl when an option is picked, and closes", () => {
    button.click();
    fixture.detectChanges();
    const canada = document.querySelector('.cdk-overlay-pane [cdkoption="ca"]') as HTMLElement;
    canada.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('ca');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('reopening after setting the FormControl programmatically highlights that option as selected, not always the first', () => {
    fixture.componentInstance.control.setValue('ca');
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();

    const canada = document.querySelector('.cdk-overlay-pane [cdkoption="ca"]') as HTMLElement;
    const us = document.querySelector('.cdk-overlay-pane [cdkoption="us"]') as HTMLElement;
    expect(canada.getAttribute('aria-selected')).toBe('true');
    expect(us.getAttribute('aria-selected')).toBe('false');
  });

  it('disables via the FormControl', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
  });
});
