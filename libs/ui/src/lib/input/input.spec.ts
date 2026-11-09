import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
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

@Component({
  selector: 'textarea-host',
  imports: [HmhaInput, HmhaField, ReactiveFormsModule],
  template: `
    <div style="width: 320px;">
      <hmha-field label="Description" hint="Shown on the title's detail page.">
        <textarea hmhaInput rows="4" [formControl]="control" [autoGrow]="autoGrow()" [invalid]="invalid()"></textarea>
      </hmha-field>
    </div>
  `,
})
class TextareaHost {
  readonly control = new FormControl('', { nonNullable: true });
  readonly autoGrow = signal(false);
  readonly invalid = signal(false);
}

describe('HmhaInput — on a <textarea>', () => {
  let fixture: ComponentFixture<TextareaHost>;
  let host: TextareaHost;
  let textarea: HTMLTextAreaElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  /** Type into the textarea the way the browser reports it. */
  async function type(value: string) {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    await settle();
  }
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join('\n');

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    await TestBed.configureTestingModule({
      imports: [TextareaHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(TextareaHost);
    host = fixture.componentInstance;
    await settle();
    textarea = fixture.nativeElement.querySelector('textarea');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('is the same HmhaInput: Forms in both directions', async () => {
    host.control.setValue('From the form');
    await settle();
    expect(textarea.value).toBe('From the form');
    await type('Typed\nacross lines');
    expect(host.control.value).toBe('Typed\nacross lines');
  });

  it('gets HmhaField’s label, hint and invalid wiring like any input', async () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(textarea.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(textarea.id);
    expect(textarea.getAttribute('aria-describedby')).toBe(fixture.nativeElement.querySelector('.hmha-field-hint').id);
    host.invalid.set(true);
    await settle();
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });

  it('resizes vertically only, and keeps its rows height, without autoGrow', async () => {
    expect(getComputedStyle(textarea).resize).toBe('vertical');
    const before = textarea.getBoundingClientRect().height;
    await type(lines(12));
    expect(textarea.getBoundingClientRect().height).withContext('no auto-grow by default').toBeCloseTo(before, 0);
  });

  it('with autoGrow, starts at three lines, grows with content, and stops at the cap', async () => {
    host.autoGrow.set(true);
    await settle();
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
    const start = textarea.getBoundingClientRect().height;
    expect(start).withContext('about three lines tall').toBeGreaterThan(lineHeight * 3);
    expect(start).toBeLessThan(lineHeight * 4.5);
    expect(getComputedStyle(textarea).resize).withContext('no drag handle while auto-growing').toBe('none');

    await type(lines(8));
    const grown = textarea.getBoundingClientRect().height;
    expect(grown).withContext('grows with content').toBeGreaterThan(start + lineHeight * 3);

    textarea.style.setProperty('--hmha-input-max-block-size', `${Math.round(start + lineHeight)}px`);
    await type(lines(20));
    expect(textarea.getBoundingClientRect().height).withContext('stops at the cap').toBeCloseTo(start + lineHeight, -1);
    expect(textarea.scrollHeight).withContext('and scrolls past it').toBeGreaterThan(textarea.clientHeight);

    textarea.style.removeProperty('--hmha-input-max-block-size');
    await type('');
    expect(textarea.getBoundingClientRect().height).withContext('never below the start').toBeCloseTo(start, 0);
  });

  it('is axe-clean, with and without autoGrow, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const autoGrow of [false, true]) {
        host.autoGrow.set(autoGrow);
        await settle();
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} autoGrow=${autoGrow}`).toEqual([]);
      }
    }
  });
});

@Component({
  selector: 'counter-host',
  imports: [HmhaInput, HmhaField, ReactiveFormsModule],
  template: `
    <hmha-field label="Description" [hint]="hint()" [error]="error()">
      <textarea hmhaInput [maxCharacters]="max()" [formControl]="control"></textarea>
    </hmha-field>
  `,
})
class CounterHost {
  readonly control = new FormControl('', { nonNullable: true });
  readonly max = signal<number | null>(10);
  readonly hint = signal<string | undefined>('Shown on the detail page.');
  readonly error = signal<string | undefined>(undefined);
}

describe('HmhaInput — character counter (maxCharacters + HmhaField)', () => {
  let fixture: ComponentFixture<CounterHost>;
  let host: CounterHost;
  let textarea: HTMLTextAreaElement;
  let announce: jasmine.Spy;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  async function type(value: string) {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    await settle();
  }
  const counter = () => fixture.nativeElement.querySelector('.hmha-field-counter') as HTMLElement | null;
  const pause = () => new Promise((resolve) => setTimeout(resolve, 600));

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    await TestBed.configureTestingModule({
      imports: [CounterHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
    fixture = TestBed.createComponent(CounterHost);
    host = fixture.componentInstance;
    await settle();
    textarea = fixture.nativeElement.querySelector('textarea');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('shows how many characters remain, and updates as the user types', async () => {
    expect(counter()?.textContent?.trim()).toBe('You have 10 characters remaining');
    await type('Bunny');
    expect(counter()?.textContent?.trim()).toBe('You have 5 characters remaining');
    await type('Big Bunny');
    expect(counter()?.textContent?.trim()).toBe('You have 1 character remaining');
  });

  it('follows values the form sets, not only typing', async () => {
    host.control.setValue('Sintel');
    await settle();
    expect(counter()?.textContent?.trim()).toBe('You have 4 characters remaining');
  });

  it('is a soft limit: typing past it works, and says how many too many in the error colour', async () => {
    await type('Big Buck Bunny 2008');
    expect(textarea.value).withContext('nothing cut off').toBe('Big Buck Bunny 2008');
    expect(host.control.value).toBe('Big Buck Bunny 2008');
    expect(counter()?.textContent?.trim()).toBe('You have 9 characters too many');
    expect(counter()!.hasAttribute('data-over')).toBe(true);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    const error = getComputedStyle(document.documentElement).getPropertyValue('--hmha-color-danger-text').trim();
    expect(getComputedStyle(counter()!).getPropertyValue('color')).toBe(
      (() => {
        const probe = document.createElement('span');
        probe.style.color = error;
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      })(),
    );
  });

  it('counts characters as people see them: an emoji is one', async () => {
    await type('😀😀');
    expect(counter()?.textContent?.trim()).toBe('You have 8 characters remaining');
  });

  it('ties the count to the control alongside the hint, or the error', async () => {
    const hintId = fixture.nativeElement.querySelector('.hmha-field-hint').id;
    expect(textarea.getAttribute('aria-describedby')).toBe(`${hintId} ${counter()!.id}`);
    host.error.set('Add a description.');
    await settle();
    const errorId = fixture.nativeElement.querySelector('.hmha-field-error').id;
    expect(textarea.getAttribute('aria-describedby')).toBe(`${errorId} ${counter()!.id}`);
  });

  it('shows no counter without maxCharacters', async () => {
    host.max.set(null);
    await settle();
    expect(counter()).toBeNull();
    expect(textarea.getAttribute('aria-describedby')).toBe(fixture.nativeElement.querySelector('.hmha-field-hint').id);
  });

  it('announces nothing far from the limit, or on first render', async () => {
    await type('Big');
    await pause();
    expect(announce).not.toHaveBeenCalled();
  });

  it('announces politely once typing pauses near the limit, and over it, only the latest', async () => {
    await type('Big Bun');
    await type('Big Bunn'); // within 20% of 10: 2 left
    await pause();
    await type('Big Bunny 20');
    await type('Big Bunny 2008'); // over
    await pause();
    expect(announce.calls.allArgs()).toEqual([
      ['You have 2 characters remaining', 'polite'],
      ['You have 4 characters too many', 'polite'],
    ]);
  });

  it('is axe-clean within and over the limit, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const value of ['Bunny', 'Big Buck Bunny 2008']) {
        await type(value);
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} "${value}"`).toEqual([]);
      }
    }
  });
});

