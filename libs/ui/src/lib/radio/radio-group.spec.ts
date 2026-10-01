import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import { HmhaField } from '../field/field';
import { HmhaRadio } from './radio';
import { HmhaRadioGroup } from './radio-group';

@Component({
  selector: 'radio-group-reactive-host',
  imports: [HmhaRadioGroup, HmhaRadio, ReactiveFormsModule],
  template: `
    <fieldset hmhaRadioGroup [formControl]="control">
      <label><input type="radio" hmhaRadio value="a" /> A</label>
      <label><input type="radio" hmhaRadio value="b" /> B</label>
    </fieldset>
  `,
})
class RadioGroupReactiveHost {
  control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'radio-group-field-host',
  imports: [HmhaRadioGroup, HmhaRadio, HmhaField],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <fieldset hmhaRadioGroup [disabled]="disabled" [invalid]="invalid">
        <label><input type="radio" hmhaRadio value="a" size="sm" /> A</label>
        <label><input type="radio" hmhaRadio value="b" /> B</label>
      </fieldset>
    </hmha-field>
  `,
})
class RadioGroupFieldHost {
  label = 'Choose a plan';
  hint = '';
  error = '';
  required = false;
  disabled = false;
  invalid = false;
}

describe('HmhaRadioGroup — reactive forms', () => {
  let fixture: ComponentFixture<RadioGroupReactiveHost>;
  let fieldset: HTMLFieldSetElement;
  let radios: HTMLInputElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioGroupReactiveHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(RadioGroupReactiveHost);
    fieldset = fixture.nativeElement.querySelector('fieldset');
    radios = Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
    fixture.detectChanges();
  });

  it('creates as a real <fieldset>', () => {
    expect(fieldset).toBeTruthy();
    expect(fieldset.tagName).toBe('FIELDSET');
  });

  it('reflects FormControl.setValue onto the matching radio (writeValue)', () => {
    fixture.componentInstance.control.setValue('b');
    fixture.detectChanges();
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
  });

  it('updates the FormControl when a radio is selected', () => {
    radios[0].checked = true;
    radios[0].dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe('a');
  });

  it('marks the FormControl touched when a selection is made', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    radios[0].checked = true;
    radios[0].dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the fieldset when the FormControl is disabled, cascading natively to every radio', () => {
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(fieldset.disabled).toBe(true);
    // The fieldset-disabled cascade affects interaction/:disabled CSS/form
    // submission — NOT the child's own `.disabled` property getter, which
    // keeps reflecting only its own (unset) attribute. matches(':disabled')
    // is what actually reflects the cascade.
    expect(radios[0].matches(':disabled')).toBe(true);
    expect(radios[1].matches(':disabled')).toBe(true);
  });
});

describe('HmhaRadioGroup — standalone inputs and HMHA_FIELD integration', () => {
  function create(state: Partial<RadioGroupFieldHost> = {}) {
    const fixture = TestBed.createComponent(RadioGroupFieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return {
      fixture,
      fieldset: fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement,
      radios: Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]')) as HTMLInputElement[],
    };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [RadioGroupFieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('defaults to nothing selected, not disabled, not invalid', () => {
    const { fieldset, radios } = create();
    expect(radios.every((r) => !r.checked)).toBe(true);
    expect(fieldset.disabled).toBe(false);
    expect(fieldset.hasAttribute('data-invalid')).toBe(false);
  });

  it('disables via the standalone disabled input, cascading to every radio', () => {
    const { fieldset, radios } = create({ disabled: true });
    expect(fieldset.disabled).toBe(true);
    expect(radios.every((r) => r.matches(':disabled'))).toBe(true);
  });

  it('sets aria-invalid and data-invalid via the standalone invalid input', () => {
    const { fieldset } = create({ invalid: true });
    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(fieldset.getAttribute('data-invalid')).toBe('');
  });

  it("uses the wrapping HmhaField's label via aria-labelledby, not for/id (fieldset isn't labelable)", () => {
    const { fixture, fieldset } = create();
    const label = fixture.nativeElement.querySelector('label.hmha-field-label');
    expect(fieldset.hasAttribute('for')).toBe(false);
    expect(fieldset.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('propagates aria-describedby from the wrapping HmhaField hint', () => {
    const { fixture, fieldset } = create({ hint: 'Billed monthly.' });
    const hint = fixture.nativeElement.querySelector('.hmha-field-hint');
    expect(fieldset.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('propagates required from the field onto the fieldset AND each individual radio (native per-radio validation)', () => {
    const { fieldset, radios } = create({ required: true });
    expect(fieldset.getAttribute('aria-required')).toBe('true');
    expect(radios.every((r) => r.required)).toBe(true);
  });

  it('reflects aria-invalid/data-invalid from an HmhaField error', () => {
    const { fieldset } = create({ error: 'Select a plan to continue.' });
    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(fieldset.getAttribute('data-invalid')).toBe('');
  });

  it('is axe-clean across invalid/disabled/required states, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const state of ['default', 'invalid', 'disabled', 'required'] as const) {
        const { fixture } = create({
          invalid: state === 'invalid',
          disabled: state === 'disabled',
          required: state === 'required',
        });

        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`mode="${mode}" state="${state}"`).toEqual([]);
      }
    }
  });
});
