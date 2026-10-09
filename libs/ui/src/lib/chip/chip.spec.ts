import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaChip } from './chip';

@Component({
  selector: 'chip-display-host',
  imports: [HmhaChip],
  template: `<span hmhaChip>Engineering</span>`,
})
class ChipDisplayHost {}

@Component({
  selector: 'chip-selectable-host',
  imports: [HmhaChip],
  template: `<button hmhaChip selectable="true" [disabled]="disabled">Remote</button>`,
})
class ChipSelectableHost {
  disabled = false;
}

describe('HmhaChip — display (span, not selectable)', () => {
  function create() {
    const fixture = TestBed.createComponent(ChipDisplayHost);
    fixture.detectChanges();
    return { fixture, chip: fixture.nativeElement.querySelector('[hmhaChip]') as HTMLElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ChipDisplayHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates on a native span', () => {
    const { chip } = create();
    expect(chip.tagName).toBe('SPAN');
  });

  it('is a normal tab stop when standalone (no HmhaChipSet ancestor)', () => {
    const { chip } = create();
    expect(chip.getAttribute('tabindex')).toBe('0');
  });

  it('has no aria-pressed and no data-selected — it is not selectable', () => {
    const { chip } = create();
    expect(chip.hasAttribute('aria-pressed')).toBe(false);
    expect(chip.hasAttribute('data-selected')).toBe(false);
  });

  it('clicking does nothing — a non-selectable chip has no toggle behavior', () => {
    const { chip } = create();
    chip.dispatchEvent(new Event('click', { bubbles: true }));
    expect(chip.hasAttribute('data-selected')).toBe(false);
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});

describe('HmhaChip — selectable (button)', () => {
  function create(disabled = false) {
    const fixture = TestBed.createComponent(ChipSelectableHost);
    fixture.componentInstance.disabled = disabled;
    fixture.detectChanges();
    return { fixture, chip: fixture.nativeElement.querySelector('[hmhaChip]') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ChipSelectableHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates on a native button', () => {
    const { chip } = create();
    expect(chip.tagName).toBe('BUTTON');
  });

  it('defaults to unselected — aria-pressed="false", no data-selected', () => {
    const { chip } = create();
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(chip.hasAttribute('data-selected')).toBe(false);
  });

  it('clicking toggles selected, aria-pressed and data-selected', async () => {
    const { fixture, chip } = create();
    chip.click();
    await fixture.whenStable();
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.getAttribute('data-selected')).toBe('');

    chip.click();
    await fixture.whenStable();
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(chip.hasAttribute('data-selected')).toBe(false);
  });

  it('reflects the disabled input onto the native button', () => {
    const { chip } = create(true);
    expect(chip.disabled).toBe(true);
  });

  it('a disabled chip does not toggle on click', async () => {
    const { fixture, chip } = create(true);
    chip.click();
    await fixture.whenStable();
    expect(chip.hasAttribute('data-selected')).toBe(false);
  });

  it('is axe-clean, selected and unselected, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const selected of [false, true]) {
        const { fixture, chip } = create();
        if (selected) {
          chip.click();
        }
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`mode="${mode}" selected=${selected}`).toEqual([]);
      }
    }
  });
});
