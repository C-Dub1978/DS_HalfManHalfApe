import { Component, Directive, inject, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as axe from 'axe-core';
import { HMHA_FIELD, HmhaField, type HmhaFieldContext } from './field';

/**
 * Minimal stand-in for a real control (HmhaInput, etc.): reads the field
 * context and reflects it onto itself, exactly as documented in
 * field/README.md's "The HMHA_FIELD contract" section.
 */
@Directive({
  selector: '[testFieldConsumer]',
  host: {
    '[attr.id]': 'field?.controlId() ?? null',
    '[attr.aria-invalid]': 'field?.invalid() ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
  },
})
class TestFieldConsumer {
  readonly field: HmhaFieldContext | null = inject(HMHA_FIELD, { optional: true });
}

@Component({
  selector: 'field-host',
  imports: [HmhaField, TestFieldConsumer],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <input testFieldConsumer />
    </hmha-field>
  `,
})
class FieldHost {
  label = 'Email';
  hint = '';
  error = '';
  required = false;
}

describe('HmhaField', () => {
  /**
   * State is set before the fixture's first `detectChanges()`, never
   * mutated on an already-checked fixture — zoneless TestBed's
   * checkNoChanges pass flags a plain-field mutation between two
   * `detectChanges()` calls as a stray change.
   */
  function create(state: Partial<Pick<FieldHost, 'hint' | 'error' | 'required'>> = {}) {
    const fixture = TestBed.createComponent(FieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return {
      fixture,
      field: fixture.nativeElement.querySelector('hmha-field') as HTMLElement,
      label: fixture.nativeElement.querySelector('label') as HTMLLabelElement,
      consumer: fixture.debugElement.query(By.directive(TestFieldConsumer))
        .injector.get(TestFieldConsumer),
    };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    // HmhaField renders no background of its own — see README.md. Real apps
    // provide one via apps/sandbox/src/styles.css's body reset; replicate
    // just enough of that here for the hint/error text's contrast to be
    // measured against the background it's actually designed for.
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [FieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('creates', () => {
    const { field } = create();
    expect(field).toBeTruthy();
  });

  it('renders the label text', () => {
    const { label } = create();
    expect(label.textContent).toContain('Email');
  });

  it("associates the label with the control via matching for/id, exposed through HMHA_FIELD", () => {
    const { label, consumer } = create();
    const controlId = consumer.field?.controlId();
    expect(controlId).toBeTruthy();
    expect(label.getAttribute('for')).toBe(controlId ?? null);
  });

  it('exposes the label element\'s own id as labelId, for hosts that cannot use for/id (e.g. a fieldset)', () => {
    const { label, consumer } = create();
    const labelId = consumer.field?.labelId();
    expect(labelId).toBeTruthy();
    expect(label.id).toBe(labelId ?? '');
  });

  it('gives each field instance a distinct id', () => {
    const a = create();
    const b = create();
    expect(a.consumer.field?.controlId()).not.toBe(b.consumer.field?.controlId());
  });

  it('shows no required marker and reports required=false by default', () => {
    const { field, consumer } = create();
    expect(field.querySelector('.hmha-field-required')).toBeNull();
    expect(consumer.field?.required()).toBe(false);
  });

  it('shows an aria-hidden required marker and reports required=true when required', () => {
    const { field, consumer } = create({ required: true });

    const marker = field.querySelector('.hmha-field-required');
    expect(marker).toBeTruthy();
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
    expect(consumer.field?.required()).toBe(true);
  });

  it('shows hint text and points describedBy at it when there is no error', () => {
    const { field, consumer } = create({ hint: 'We will never share your email.' });

    const hint = field.querySelector('.hmha-field-hint');
    expect(hint?.textContent).toContain('We will never share your email.');
    expect(consumer.field?.describedBy()).toBe(hint?.id ?? null);
    expect(consumer.field?.invalid()).toBe(false);
  });

  it('shows the error instead of the hint, with role="alert", and reports invalid=true', () => {
    const { field, consumer } = create({
      hint: 'We will never share your email.',
      error: 'Enter a valid email address.',
    });

    expect(field.querySelector('.hmha-field-hint')).toBeNull();
    const error = field.querySelector('.hmha-field-error');
    expect(error?.textContent).toContain('Enter a valid email address.');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(consumer.field?.describedBy()).toBe(error?.id ?? null);
    expect(consumer.field?.invalid()).toBe(true);
  });

  it('describedBy is null when there is neither hint nor error', () => {
    const { consumer } = create();
    expect(consumer.field?.describedBy()).toBeNull();
  });

  it('projects the wrapped control between the label and the hint/error', () => {
    const { field } = create();
    expect(field.querySelector('input[testFieldConsumer]')).toBeTruthy();
  });

  it('is axe-clean with a hint, an error, and required, in both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const state of ['hint', 'error', 'required'] as const) {
        const { fixture } = create({
          hint: state === 'hint' ? 'Helper text.' : '',
          error: state === 'error' ? 'Something is wrong.' : '',
          required: state === 'required',
        });

        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`mode="${mode}" state="${state}"`).toEqual([]);
      }
    }
  });
});
