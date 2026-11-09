import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import type { HmhaSize } from '../core/types';
import { contrast, paint } from '../core/testing/paint';
import { HmhaField } from '../field/field';
import { HmhaIcon } from '../icon/icon';
import { HmhaSegment } from './segment';
import { HmhaSegmentedControl } from './segmented-control';

@Component({
  selector: 'segmented-model-host',
  imports: [HmhaSegmentedControl, HmhaSegment, HmhaIcon],
  template: `
    <fieldset
      hmhaSegmentedControl
      aria-label="Library"
      [(value)]="value"
      [size]="size()"
      [disabled]="disabled()"
      [style.width]="width()"
    >
      <label hmhaSegment value="movies">Movies</label>
      <label hmhaSegment value="shows" [disabled]="showsDisabled()">Shows</label>
      <label hmhaSegment value="music">Music and audiobooks</label>
    </fieldset>
  `,
})
class SegmentedModelHost {
  readonly value = signal('movies');
  readonly size = signal<HmhaSize>('md');
  readonly disabled = signal(false);
  readonly showsDisabled = signal(false);
  readonly width = signal<string | null>(null);
}

@Component({
  selector: 'segmented-forms-host',
  imports: [HmhaSegmentedControl, HmhaSegment, HmhaField, ReactiveFormsModule],
  template: `
    <hmha-field label="Playback quality" hint="Higher uses more data.">
      <fieldset hmhaSegmentedControl [formControl]="control">
        <label hmhaSegment value="720p">720p</label>
        <label hmhaSegment value="1080p">1080p</label>
        <label hmhaSegment value="4k">4K</label>
      </fieldset>
    </hmha-field>
  `,
})
class SegmentedFormsHost {
  readonly control = new FormControl('1080p', { nonNullable: true });
}

@Component({
  selector: 'segmented-icon-host',
  imports: [HmhaSegmentedControl, HmhaSegment, HmhaIcon],
  template: `
    <fieldset hmhaSegmentedControl aria-label="View" value="grid">
      <label hmhaSegment value="grid" [label]="gridLabel()"><hmha-icon name="layout-grid" /></label>
      <label hmhaSegment value="list" label="List"><hmha-icon name="list" /></label>
    </fieldset>
  `,
})
class SegmentedIconHost {
  readonly gridLabel = signal<string | undefined>('Grid');
}

@Component({
  selector: 'segmented-bound-host',
  imports: [HmhaSegmentedControl, HmhaSegment],
  template: `
    <fieldset hmhaSegmentedControl aria-label="Speed" value="1">
      @for (speed of speeds; track speed) {
        <label hmhaSegment [value]="speed">{{ speed }}×</label>
      }
    </fieldset>
  `,
})
class SegmentedBoundHost {
  readonly speeds = ['0.5', '1', '1.5', '2'];
}

describe('HmhaSegmentedControl', () => {
  let fixture: ComponentFixture<SegmentedModelHost>;
  let host: SegmentedModelHost;
  let fieldset: HTMLFieldSetElement;
  let segments: HTMLLabelElement[];
  let radios: HTMLInputElement[];

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  const rgb = (css: string) => paint(css);
  // The segment's background transitions on a mode switch: wait for it
  // before sampling colours (Wave 4 step 1A).
  const transitions = () => new Promise((resolve) => setTimeout(resolve, 150));
  const px = (name: string) => {
    const probe = document.createElement('div');
    probe.style.height = `var(${name})`;
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h;
  };

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [SegmentedModelHost, SegmentedFormsHost, SegmentedIconHost, SegmentedBoundHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(SegmentedModelHost);
    host = fixture.componentInstance;
    await settle();
    fieldset = fixture.nativeElement.querySelector('fieldset');
    segments = Array.from(fixture.nativeElement.querySelectorAll('label[hmhaSegment]'));
    radios = segments.map((s) => s.querySelector('input')!);
  });

  afterEach(() => document.documentElement.removeAttribute('data-hmha-mode'));

  it('is a real radiogroup fieldset of labels, each holding a native radio with one shared name', () => {
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset.getAttribute('role')).toBe('radiogroup');
    expect(radios.map((r) => r.type)).toEqual(['radio', 'radio', 'radio']);
    const name = radios[0].name;
    expect(name).toMatch(/^hmha-segmented-control-/);
    expect(radios.every((r) => r.name === name)).toBeTrue();
    expect(radios.map((r) => r.value)).toEqual(['movies', 'shows', 'music']);
  });

  it('checks and marks the segment matching the value, and follows the value when it changes', async () => {
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);
    expect(segments.map((s) => s.hasAttribute('data-selected'))).toEqual([true, false, false]);

    host.value.set('music');
    await settle();
    expect(radios.map((r) => r.checked)).toEqual([false, false, true]);
    expect(segments.map((s) => s.hasAttribute('data-selected'))).toEqual([false, false, true]);
  });

  it('writes [(value)] when a segment is clicked anywhere on it', async () => {
    segments[1].click(); // the label, not the radio: the whole segment is the target
    await settle();
    expect(host.value()).toBe('shows');
    expect(radios[1].checked).toBeTrue();
    expect(segments[1].hasAttribute('data-selected')).toBeTrue();
    expect(segments[0].hasAttribute('data-selected')).toBeFalse();
  });

  it('covers each segment with its invisible radio, so touch exploration finds it there', () => {
    const seg = segments[0].getBoundingClientRect();
    const radio = radios[0].getBoundingClientRect();
    expect(radio.width).toBeCloseTo(seg.width, 0);
    expect(radio.height).toBeCloseTo(seg.height, 0);
    expect(getComputedStyle(radios[0]).opacity).toBe('0');
  });

  it('gives every segment the same width: as wide as the widest, or an equal share of a set width', async () => {
    const widths = () => segments.map((s) => s.getBoundingClientRect().width);
    const [a, b, c] = widths();
    expect(a).toBeCloseTo(c, 0);
    expect(b).toBeCloseTo(c, 0);

    host.width.set('600px');
    await settle();
    const [x, y, z] = widths();
    expect(x).toBeCloseTo(z, 0);
    expect(y).toBeCloseTo(z, 0);
    expect(x * 3).toBeGreaterThan(500);
  });

  it('never shrinks below its content in a squeezing flex row, so segments keep equal widths and nothing overlaps', async () => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; width: 200px;';
    fieldset.parentElement!.insertBefore(row, fieldset);
    row.append(fieldset, Object.assign(document.createElement('div'), { style: 'width: 100%' }));
    const widths = segments.map((s) => s.getBoundingClientRect().width);
    expect(widths[0]).toBeCloseTo(widths[2], 0);
    expect(fieldset.getBoundingClientRect().right).toBeGreaterThanOrEqual(segments[2].getBoundingClientRect().right);
  });

  it('is exactly a control height tall at every size, so it lines up beside buttons and inputs', async () => {
    for (const [size, token] of [
      ['sm', '--hmha-control-height-sm'],
      ['md', '--hmha-control-height'],
      ['lg', '--hmha-control-height-lg'],
    ] as const) {
      host.size.set(size);
      await settle();
      expect(fieldset.getBoundingClientRect().height).withContext(size).toBeCloseTo(px(token), 0);
    }
  });

  it('shows the selected segment by its background and border, not hue alone, in both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      await settle();
      await transitions();
      const on = getComputedStyle(segments[0]);
      const off = getComputedStyle(segments[2]);
      const track = rgb(getComputedStyle(fieldset).backgroundColor);
      const onBg = rgb(on.backgroundColor);
      expect(on.backgroundColor).withContext(mode).not.toBe(off.backgroundColor);
      expect(contrast(rgb(on.color), onBg)).withContext(`${mode} text`).toBeGreaterThanOrEqual(4.5);
      // WCAG 1.4.11: the selected segment's edge against the track around it.
      expect(contrast(rgb(on.borderTopColor), track)).withContext(`${mode} border`).toBeGreaterThanOrEqual(3);
      expect(contrast(rgb(off.color), track)).withContext(`${mode} unselected text`).toBeGreaterThanOrEqual(4.5);
      // The track's edge shows on the page even where surface-sunken is
      // the page colour itself (dark mode).
      const page = rgb(getComputedStyle(document.documentElement).getPropertyValue('--hmha-color-bg').trim() || 'white');
      expect(rgb(getComputedStyle(fieldset).borderTopColor)).withContext(`${mode} track edge`).not.toEqual(page);
    }
  });

  it('draws the focus ring on the segment when its radio has keyboard focus', async () => {
    radios[0].focus();
    await settle();
    if (radios[0].matches(':focus-visible')) {
      expect(getComputedStyle(segments[0]).outlineStyle).toBe('solid');
      expect(getComputedStyle(segments[1]).outlineStyle).toBe('none');
    } else {
      pending('This launcher did not treat a programmatic focus as :focus-visible.');
    }
  });

  it('disables one segment, or every segment through the fieldset', async () => {
    host.showsDisabled.set(true);
    await settle();
    expect(radios.map((r) => r.matches(':disabled'))).toEqual([false, true, false]);
    expect(getComputedStyle(segments[1]).opacity).toBe('0.5');

    host.showsDisabled.set(false);
    host.disabled.set(true);
    await settle();
    // The fieldset cascade: :disabled sees it, the .disabled property doesn't (fork 11).
    expect(radios.every((r) => r.matches(':disabled'))).toBeTrue();
    expect(getComputedStyle(segments[0]).cursor).toBe('not-allowed');
  });

  it('is axe-clean in both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      await settle();
      await transitions();
      const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(mode).toEqual([]);
    }
  });

  describe('with Forms, in a field', () => {
    let forms: ComponentFixture<SegmentedFormsHost>;
    let set: HTMLFieldSetElement;
    let formRadios: HTMLInputElement[];

    beforeEach(async () => {
      forms = TestBed.createComponent(SegmentedFormsHost);
      forms.detectChanges();
      await forms.whenStable();
      set = forms.nativeElement.querySelector('fieldset');
      formRadios = Array.from(set.querySelectorAll('input'));
    });

    it('reflects the control value, and writes a pick back to it without echoing Forms writes', async () => {
      expect(formRadios.map((r) => r.checked)).toEqual([false, true, false]);
      const changes: string[] = [];
      forms.componentInstance.control.valueChanges.subscribe((v) => changes.push(v));

      forms.componentInstance.control.setValue('4k', { emitEvent: false });
      forms.detectChanges();
      await forms.whenStable();
      expect(formRadios[2].checked).toBeTrue();

      (formRadios[0].closest('label') as HTMLElement).click();
      expect(forms.componentInstance.control.value).toBe('720p');
      expect(changes).toEqual(['720p']);
    });

    it('marks the control touched when focus leaves a segment', () => {
      expect(forms.componentInstance.control.touched).toBeFalse();
      formRadios[1].dispatchEvent(new Event('blur'));
      expect(forms.componentInstance.control.touched).toBeTrue();
    });

    it('disables every segment when the control is disabled', async () => {
      forms.componentInstance.control.disable();
      forms.detectChanges();
      await forms.whenStable();
      expect(formRadios.every((r) => r.matches(':disabled'))).toBeTrue();
    });

    it("is named by the field's label and described by its hint, axe-clean", async () => {
      const label = forms.nativeElement.querySelector(`#${set.getAttribute('aria-labelledby')}`);
      expect(label?.textContent).toContain('Playback quality');
      const hint = forms.nativeElement.querySelector(`#${set.getAttribute('aria-describedby')}`);
      expect(hint?.textContent).toContain('Higher uses more data.');
      const results = await axe.run(forms.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).toEqual([]);
    });
  });

  describe('icon-only segments', () => {
    it('name each radio by its label', async () => {
      const icons = TestBed.createComponent(SegmentedIconHost);
      icons.detectChanges();
      await icons.whenStable();
      const r: HTMLInputElement[] = Array.from(icons.nativeElement.querySelectorAll('input'));
      expect(r.map((x) => x.getAttribute('aria-label'))).toEqual(['Grid', 'List']);
      const results = await axe.run(icons.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).toEqual([]);
    });

    it("don't throw for a segment whose only text is bound, from a loop", async () => {
      const bound = TestBed.createComponent(SegmentedBoundHost);
      expect(() => bound.detectChanges()).not.toThrow();
      await bound.whenStable();
      expect(bound.nativeElement.querySelectorAll('[data-selected]')[0]?.textContent?.trim()).toBe('1×');
    });

    it('throw when a segment has neither text nor a label', () => {
      const icons = TestBed.createComponent(SegmentedIconHost);
      icons.componentInstance.gridLabel.set(undefined);
      expect(() => icons.detectChanges()).toThrowError(/HmhaSegment.*label.*required.*"grid"/);
    });
  });
});
