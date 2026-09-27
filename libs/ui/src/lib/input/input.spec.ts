import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { HmhaField } from '../field/field';
import { HmhaInput } from './input';

@Component({
  selector: 'input-reactive-host',
  imports: [HmhaInput, ReactiveFormsModule],
  template: `<input hmhaInput [formControl]="control" />`,
})
class InputReactiveHost {
  control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'input-field-host',
  imports: [HmhaInput, HmhaField],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <input hmhaInput [size]="size" [disabled]="disabled" [invalid]="invalid" />
    </hmha-field>
  `,
})
class InputFieldHost {
  label = 'Email';
  hint = '';
  error = '';
  required = false;
  size: HmhaSize = 'md';
  disabled = false;
  invalid = false;
}

describe('HmhaInput — reactive forms', () => {
  let fixture: ComponentFixture<InputReactiveHost>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputReactiveHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(InputReactiveHost);
    input = fixture.nativeElement.querySelector('input');
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(input).toBeTruthy();
  });

  it('reflects FormControl.setValue onto the native input (writeValue)', () => {
    fixture.componentInstance.control.setValue('from forms');
    fixture.detectChanges();
    expect(input.value).toBe('from forms');
  });

  it('updates the FormControl when the user types', () => {
    input.value = 'typed value';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('typed value');
  });

  it('marks the FormControl touched on blur', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the native input when the FormControl is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});

describe('HmhaInput — standalone inputs and HMHA_FIELD integration', () => {
  function create(state: Partial<InputFieldHost> = {}) {
    const fixture = TestBed.createComponent(InputFieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return { fixture, input: fixture.nativeElement.querySelector('input') as HTMLInputElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [InputFieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('defaults to size=md, not disabled, not invalid', () => {
    const { input } = create();
    expect(input.getAttribute('data-size')).toBe('md');
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('data-invalid')).toBe(false);
  });

  it('reflects the size input as a data attribute', () => {
    const { input } = create({ size: 'lg' });
    expect(input.getAttribute('data-size')).toBe('lg');
  });

  it('disables via the standalone disabled input (no Forms involved)', () => {
    const { input } = create({ disabled: true });
    expect(input.disabled).toBe(true);
  });

  it('sets aria-invalid and data-invalid via the standalone invalid input', () => {
    const { input } = create({ invalid: true });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('');
  });

  it('picks up id, aria-required and aria-describedby from the wrapping HmhaField', () => {
    const { fixture, input } = create({ hint: 'Helper text.', required: true });
    const label = fixture.nativeElement.querySelector('label');
    expect(input.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    const hint = fixture.nativeElement.querySelector('.hmha-field-hint');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('reflects aria-invalid/data-invalid from an HmhaField error, with no standalone invalid input set', () => {
    const { input } = create({ error: 'Enter a valid email address.' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('');
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
