import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import type { HmhaOrientation, HmhaSize } from '../core/types';
import { HmhaField } from '../field/field';
import { HmhaSlider } from './slider';

/*
 * What this file can and can't verify (CLAUDE.md, "know which layer"):
 * arrow/Page/Home/End keys and pointer drag changing a range input's value
 * are the browser's own default actions. A dispatched KeyboardEvent or
 * PointerEvent fires listeners but never performs them, so no test here
 * claims to. These tests cover this component's *reactions* — set
 * `.value` the way the browser would, then dispatch the `input`/`change`
 * event it would fire. Real keyboard and drag are verified in a real
 * browser instead (the Slider stories, plus a Playwright check).
 */

@Component({
  selector: 'slider-reactive-host',
  imports: [HmhaSlider, ReactiveFormsModule],
  template: `<input hmhaSlider aria-label="Volume" [formControl]="control" />`,
})
class SliderReactiveHost {
  control = new FormControl<number | null>(0);
}

@Component({
  selector: 'slider-model-host',
  imports: [HmhaSlider],
  template: `
    <input
      hmhaSlider
      aria-label="Seek"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [buffered]="buffered()"
      [valueText]="valueText()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      (valueCommit)="commits.push($event)"
      (scrubbingChange)="scrubs.push($event)"
    />
  `,
})
class SliderModelHost {
  // Real signals, not plain fields: a [(value)] two-way binding throws
  // NG0100 on a plain field mutated between checks (fork 18).
  readonly value = signal(0);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal<number | 'any'>(1);
  readonly buffered = signal<number | null>(null);
  readonly valueText = signal<string | null>(null);
  readonly orientation = signal<HmhaOrientation>('horizontal');
  readonly disabled = signal(false);
  readonly commits: number[] = [];
  readonly scrubs: boolean[] = [];
}

@Component({
  selector: 'slider-field-host',
  imports: [HmhaSlider, HmhaField],
  template: `
    <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required">
      <input
        hmhaSlider
        [value]="40"
        [size]="size"
        [orientation]="orientation"
        [disabled]="disabled"
        [invalid]="invalid"
      />
    </hmha-field>
  `,
})
class SliderFieldHost {
  label = 'Volume';
  hint = '';
  error = '';
  required = false;
  size: HmhaSize = 'md';
  orientation: HmhaOrientation = 'horizontal';
  disabled = false;
  invalid = false;
}

/** Do what the browser does when the user moves the thumb. */
function userMoves(slider: HTMLInputElement, to: number) {
  slider.value = String(to);
  slider.dispatchEvent(new Event('input'));
}

describe('HmhaSlider — reactive forms', () => {
  let fixture: ComponentFixture<SliderReactiveHost>;
  let slider: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderReactiveHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SliderReactiveHost);
    slider = fixture.nativeElement.querySelector('input');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates as a real type="range" input', () => {
    expect(slider.type).toBe('range');
  });

  it('reflects FormControl.setValue onto the native input (writeValue)', async () => {
    fixture.componentInstance.control.setValue(40);
    await fixture.whenStable();
    expect(slider.value).toBe('40');
  });

  it('updates the FormControl with a number when the user moves it', () => {
    userMoves(slider, 70);
    expect(fixture.componentInstance.control.value).toBe(70);
  });

  it('falls back to min when Forms writes null (reset)', async () => {
    fixture.componentInstance.control.setValue(40);
    await fixture.whenStable();
    fixture.componentInstance.control.reset();
    await fixture.whenStable();
    expect(slider.value).toBe('0');
  });

  it('marks the FormControl touched on blur', () => {
    slider.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the native input when the FormControl is disabled', async () => {
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(slider.disabled).toBe(true);
  });
});

describe('HmhaSlider — standalone [(value)] and media-player inputs', () => {
  let fixture: ComponentFixture<SliderModelHost>;
  let host: SliderModelHost;
  let slider: HTMLInputElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderModelHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SliderModelHost);
    host = fixture.componentInstance;
    slider = fixture.nativeElement.querySelector('input');
    await settle();
  });

  it('writes the bound value into the input, and the user’s value back out', async () => {
    host.value.set(25);
    await settle();
    expect(slider.value).toBe('25');

    userMoves(slider, 60);
    await settle();
    expect(host.value()).toBe(60);
  });

  it('applies min, max and step, including step="any"', async () => {
    host.min.set(10);
    host.max.set(20);
    host.step.set('any');
    await settle();
    expect(slider.min).toBe('10');
    expect(slider.max).toBe('20');
    expect(slider.step).toBe('any');
  });

  it('sets a value above the default max when max arrives in the same pass', async () => {
    // A range input clamps value to the max it has *when value is set* — a
    // value written before max would stick at 100.
    host.max.set(300);
    host.value.set(250);
    await settle();
    expect(slider.value).toBe('250');
  });

  it('re-applies the value once a larger max arrives later (duration loads)', async () => {
    host.value.set(150);
    await settle();
    expect(slider.value).toBe('100'); // clamped to the default max, as the browser does

    host.max.set(300);
    await settle();
    expect(slider.value).toBe('150');
  });

  it('exposes the fill as a percentage of [min, max], clamped to the track', async () => {
    host.value.set(25);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-fill')).toBe('25%');

    host.min.set(10);
    host.max.set(20);
    host.value.set(15);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-fill')).toBe('50%');

    host.value.set(99);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-fill')).toBe('100%');
  });

  it('draws the buffered band ahead of the fill, never behind it', async () => {
    host.value.set(25);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-buffered'))
      .withContext('no buffered value: band collapses onto the fill')
      .toBe('25%');

    host.buffered.set(60);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-buffered')).toBe('60%');

    host.buffered.set(10);
    await settle();
    expect(slider.style.getPropertyValue('--_hmha-slider-buffered'))
      .withContext('buffered behind the playhead: clamped up to the fill')
      .toBe('25%');
  });

  it('sets aria-valuetext only when valueText is given', async () => {
    expect(slider.hasAttribute('aria-valuetext')).toBe(false);
    host.valueText.set('1:23 of 4:56');
    await settle();
    expect(slider.getAttribute('aria-valuetext')).toBe('1:23 of 4:56');
  });

  it('reflects orientation as both data-orientation and aria-orientation', async () => {
    expect(slider.getAttribute('aria-orientation')).toBe('horizontal');
    host.orientation.set('vertical');
    await settle();
    expect(slider.getAttribute('data-orientation')).toBe('vertical');
    expect(slider.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('emits valueCommit with the current value on change (release / key press done)', async () => {
    userMoves(slider, 30);
    userMoves(slider, 45);
    slider.dispatchEvent(new Event('change'));
    await settle();
    expect(host.commits).toEqual([45]);
  });

  it('reports scrubbing from pointer down until a document-level pointer up', async () => {
    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(host.scrubs).toEqual([true]);
    expect(slider.hasAttribute('data-scrubbing')).toBe(true);

    // Released outside the slider — still ends the scrub.
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await settle();
    expect(host.scrubs).toEqual([true, false]);
    expect(slider.hasAttribute('data-scrubbing')).toBe(false);

    // A pointer up anywhere else on the page, with no scrub in progress, is not news.
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await settle();
    expect(host.scrubs).toEqual([true, false]);
  });

  it('ends a scrub on pointercancel too', async () => {
    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    await settle();
    expect(host.scrubs).toEqual([true, false]);
  });

  it('does not start a scrub while disabled', async () => {
    host.disabled.set(true);
    await settle();
    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(host.scrubs).toEqual([]);
  });
});

describe('HmhaSlider — standalone inputs and HMHA_FIELD integration', () => {
  async function create(state: Partial<SliderFieldHost> = {}) {
    const fixture = TestBed.createComponent(SliderFieldHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, slider: fixture.nativeElement.querySelector('input') as HTMLInputElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [SliderFieldHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('defaults to size=md, horizontal, not disabled, not invalid', async () => {
    const { slider } = await create();
    expect(slider.getAttribute('data-size')).toBe('md');
    expect(slider.getAttribute('data-orientation')).toBe('horizontal');
    expect(slider.disabled).toBe(false);
    expect(slider.hasAttribute('data-invalid')).toBe(false);
  });

  it('reads its track thickness from the shared semantic track token', async () => {
    const { slider } = await create();
    const own = getComputedStyle(slider).getPropertyValue('--hmha-slider-track-thickness').trim();
    const shared = getComputedStyle(document.documentElement).getPropertyValue('--hmha-track-thickness').trim();
    expect(shared).withContext('--hmha-track-thickness is built into the token CSS').toBeTruthy();
    expect(own).toBe(shared);
  });

  it('sets aria-invalid and data-invalid via the standalone invalid input', async () => {
    const { slider } = await create({ invalid: true });
    expect(slider.getAttribute('aria-invalid')).toBe('true');
    expect(slider.getAttribute('data-invalid')).toBe('');
  });

  it('picks up id, aria-required and aria-describedby from the wrapping HmhaField', async () => {
    const { fixture, slider } = await create({ hint: 'Applies to every video.', required: true });
    const label = fixture.nativeElement.querySelector('label');
    expect(slider.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(slider.id);
    expect(slider.getAttribute('aria-required')).toBe('true');
    const hint = fixture.nativeElement.querySelector('.hmha-field-hint');
    expect(slider.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('reflects aria-invalid/data-invalid from an HmhaField error', async () => {
    const { slider } = await create({ error: 'Pick a volume.' });
    expect(slider.getAttribute('aria-invalid')).toBe('true');
  });

  it('is axe-clean across size/orientation/state, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const size of ['sm', 'md', 'lg'] as const) {
        for (const orientation of ['horizontal', 'vertical'] as const) {
          for (const state of ['default', 'invalid', 'disabled'] as const) {
            const { fixture } = await create({
              size,
              orientation,
              invalid: state === 'invalid',
              disabled: state === 'disabled',
            });

            const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
            expect(results.violations)
              .withContext(`mode="${mode}" size="${size}" orientation="${orientation}" state="${state}"`)
              .toEqual([]);
          }
        }
      }
    }
  });
});
