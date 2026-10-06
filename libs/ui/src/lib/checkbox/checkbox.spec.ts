import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { HmhaField } from '../field/field';
import { HmhaCheckbox } from './checkbox';

@Component({
  selector: 'checkbox-reactive-host',
  imports: [HmhaCheckbox, ReactiveFormsModule],
  template: `<input type="checkbox" hmhaCheckbox [formControl]="control" />`,
})
class CheckboxReactiveHost {
  control = new FormControl(false, { nonNullable: true });
}

@Component({
  selector: 'checkbox-field-host',
  imports: [HmhaCheckbox, HmhaField],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <input type="checkbox" hmhaCheckbox [size]="size" [disabled]="disabled" [invalid]="invalid" [indeterminate]="indeterminate" />
    </hmha-field>
  `,
})
class CheckboxFieldHost {
  label = 'Subscribe to updates';
  hint = '';
  error = '';
  required = false;
  size: HmhaSize = 'md';
  disabled = false;
  invalid = false;
  indeterminate = false;
}

describe('HmhaCheckbox — reactive forms', () => {
  let fixture: ComponentFixture<CheckboxReactiveHost>;
  let checkbox: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxReactiveHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxReactiveHost);
    checkbox = fixture.nativeElement.querySelector('input');
    fixture.detectChanges();
  });

  it('creates as a real type="checkbox" input', () => {
    expect(checkbox).toBeTruthy();
    expect(checkbox.type).toBe('checkbox');
  });

  it('reflects FormControl.setValue onto the native checkbox (writeValue)', () => {
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(checkbox.checked).toBe(true);
  });

  it('updates the FormControl when the user toggles it', () => {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('marks the FormControl touched on blur', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    checkbox.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the native checkbox when the FormControl is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(checkbox.disabled).toBe(true);
  });
});

describe('HmhaCheckbox — standalone inputs and HMHA_FIELD integration', () => {
  function create(state: Partial<CheckboxFieldHost> = {}) {
    const fixture = TestBed.createComponent(CheckboxFieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return { fixture, checkbox: fixture.nativeElement.querySelector('input') as HTMLInputElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [CheckboxFieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('defaults to unchecked, size=md, not disabled, not invalid', () => {
    const { checkbox } = create();
    expect(checkbox.checked).toBe(false);
    expect(checkbox.getAttribute('data-size')).toBe('md');
    expect(checkbox.disabled).toBe(false);
    expect(checkbox.hasAttribute('data-invalid')).toBe(false);
  });

  it('reflects the size input as a data attribute', () => {
    const { checkbox } = create({ size: 'sm' });
    expect(checkbox.getAttribute('data-size')).toBe('sm');
  });

  it('disables via the standalone disabled input (no Forms involved)', () => {
    const { checkbox } = create({ disabled: true });
    expect(checkbox.disabled).toBe(true);
  });

  it('sets aria-invalid and data-invalid via the standalone invalid input', () => {
    const { checkbox } = create({ invalid: true });
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.getAttribute('data-invalid')).toBe('');
  });

  it('is not indeterminate by default', () => {
    const { checkbox } = create();
    expect(checkbox.indeterminate).toBe(false);
  });

  it('sets the native indeterminate DOM property, not an attribute', () => {
    const { checkbox } = create({ indeterminate: true });
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.hasAttribute('indeterminate')).toBe(false);
  });

  it('picks up id, aria-required and aria-describedby from the wrapping HmhaField', () => {
    const { fixture, checkbox } = create({ hint: 'You can unsubscribe anytime.', required: true });
    const label = fixture.nativeElement.querySelector('label');
    expect(checkbox.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(checkbox.id);
    expect(checkbox.getAttribute('aria-required')).toBe('true');
    const hint = fixture.nativeElement.querySelector('.hmha-field-hint');
    expect(checkbox.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('reflects aria-invalid/data-invalid from an HmhaField error', () => {
    const { checkbox } = create({ error: 'You must agree to continue.' });
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.getAttribute('data-invalid')).toBe('');
  });

  it('is axe-clean across size/invalid/disabled states, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const size of ['sm', 'md', 'lg'] as const) {
        for (const state of ['default', 'invalid', 'disabled'] as const) {
          const { fixture } = create({
            size,
            invalid: state === 'invalid',
            disabled: state === 'disabled',
          });

          const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations)
            .withContext(`mode="${mode}" size="${size}" state="${state}"`)
            .toEqual([]);
        }
      }
    }
  });
});
