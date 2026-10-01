import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { HmhaField } from '../field/field';
import { HmhaSwitch } from './switch';

@Component({
  selector: 'switch-reactive-host',
  imports: [HmhaSwitch, ReactiveFormsModule],
  template: `<button hmhaSwitch [formControl]="control">Enable notifications</button>`,
})
class SwitchReactiveHost {
  control = new FormControl(false, { nonNullable: true });
}

@Component({
  selector: 'switch-field-host',
  imports: [HmhaSwitch, HmhaField],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <button hmhaSwitch [size]="size" [disabled]="disabled" [invalid]="invalid"></button>
    </hmha-field>
  `,
})
class SwitchFieldHost {
  label = 'Enable notifications';
  hint = '';
  error = '';
  required = false;
  size: HmhaSize = 'md';
  disabled = false;
  invalid = false;
}

describe('HmhaSwitch — reactive forms', () => {
  let fixture: ComponentFixture<SwitchReactiveHost>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchReactiveHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchReactiveHost);
    button = fixture.nativeElement.querySelector('button');
    fixture.detectChanges();
  });

  it('creates as a real type="button" with role="switch"', () => {
    expect(button).toBeTruthy();
    expect(button.type).toBe('button');
    expect(button.getAttribute('role')).toBe('switch');
  });

  it('reflects FormControl.setValue onto aria-checked/data-checked (writeValue)', () => {
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.getAttribute('data-checked')).toBe('');
  });

  it('defaults aria-checked to the literal string "false", not absent', () => {
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.hasAttribute('data-checked')).toBe(false);
  });

  it('updates the FormControl when clicked, toggling each time', () => {
    button.click();
    expect(fixture.componentInstance.control.value).toBe(true);
    button.click();
    expect(fixture.componentInstance.control.value).toBe(false);
  });

  it('marks the FormControl touched on blur', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    button.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the native button when the FormControl is disabled', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
  });
});

describe('HmhaSwitch — standalone inputs and HMHA_FIELD integration', () => {
  function create(state: Partial<SwitchFieldHost> = {}) {
    const fixture = TestBed.createComponent(SwitchFieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [SwitchFieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('defaults to unchecked, size=md, not disabled, not invalid', () => {
    const { button } = create();
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.getAttribute('data-size')).toBe('md');
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('data-invalid')).toBe(false);
  });

  it('reflects the size input as a data attribute', () => {
    const { button } = create({ size: 'lg' });
    expect(button.getAttribute('data-size')).toBe('lg');
  });

  it('disables via the standalone disabled input (no Forms involved)', () => {
    const { button } = create({ disabled: true });
    expect(button.disabled).toBe(true);
  });

  it('sets aria-invalid and data-invalid via the standalone invalid input', () => {
    const { button } = create({ invalid: true });
    expect(button.getAttribute('aria-invalid')).toBe('true');
    expect(button.getAttribute('data-invalid')).toBe('');
  });

  it('picks up id, aria-required and aria-describedby from the wrapping HmhaField (button is labelable, unlike fieldset)', () => {
    const { fixture, button } = create({ hint: 'You can change this later.', required: true });
    const label = fixture.nativeElement.querySelector('label');
    expect(button.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(button.id);
    expect(button.getAttribute('aria-required')).toBe('true');
    const hint = fixture.nativeElement.querySelector('.hmha-field-hint');
    expect(button.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('reflects aria-invalid/data-invalid from an HmhaField error', () => {
    const { button } = create({ error: 'This setting is required.' });
    expect(button.getAttribute('aria-invalid')).toBe('true');
    expect(button.getAttribute('data-invalid')).toBe('');
  });

  it('is axe-clean across size/checked/invalid/disabled states, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const size of ['sm', 'md', 'lg'] as const) {
        for (const state of ['default', 'invalid', 'disabled'] as const) {
          const { fixture, button } = create({
            size,
            invalid: state === 'invalid',
            disabled: state === 'disabled',
          });
          button.click();

          const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
          expect(results.violations)
            .withContext(`mode="${mode}" size="${size}" state="${state}"`)
            .toEqual([]);
        }
      }
    }
  });
});
