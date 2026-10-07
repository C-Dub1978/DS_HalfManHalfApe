import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaIcon } from '../icon/icon';
import { HmhaButton } from './button';
import { HmhaIconButton } from './icon-button';

@Component({
  selector: 'icon-button-only-host',
  imports: [HmhaButton, HmhaIconButton],
  template: `<button hmhaButton hmhaIconButton [label]="label" tone="neutral"><span aria-hidden="true">×</span></button>`,
})
class IconButtonOnlyHost {
  label: string | undefined = 'Close';
}

@Component({
  selector: 'icon-button-leading-host',
  imports: [HmhaButton, HmhaIconButton, HmhaIcon],
  template: `
    <button hmhaButton hmhaIconButton iconPosition="leading" [label]="label" tone="primary">
      <hmha-icon name="check" size="sm" />
      Save
    </button>
  `,
})
class IconButtonLeadingHost {
  label: string | undefined;
}

@Component({
  selector: 'icon-button-trailing-host',
  imports: [HmhaButton, HmhaIconButton, HmhaIcon],
  template: `
    <button hmhaButton hmhaIconButton iconPosition="trailing" tone="neutral">
      Next
      <hmha-icon name="chevron-right" size="sm" />
    </button>
  `,
})
class IconButtonTrailingHost {}

describe('HmhaIconButton — iconPosition="only" (default)', () => {
  function create() {
    const fixture = TestBed.createComponent(IconButtonOnlyHost);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [IconButtonOnlyHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates alongside hmhaButton on the same element', () => {
    const { button } = create();
    expect(button).toBeTruthy();
    expect(button.hasAttribute('data-tone')).toBe(true);
  });

  it('sets aria-label from the label input', () => {
    const { button } = create();
    expect(button.getAttribute('aria-label')).toBe('Close');
  });

  it('sets data-icon-only so button.css can square the control', () => {
    const { button } = create();
    expect(button.getAttribute('data-icon-only')).toBe('');
  });

  it('throws if label is missing — an icon-only button would have no accessible name', () => {
    const fixture = TestBed.createComponent(IconButtonOnlyHost);
    fixture.componentInstance.label = undefined;
    expect(() => fixture.detectChanges()).toThrowError(/HmhaIconButton.*label.*required/);
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});

describe('HmhaIconButton — iconPosition="leading"', () => {
  function create() {
    const fixture = TestBed.createComponent(IconButtonLeadingHost);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [IconButtonLeadingHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('does not set data-icon-only — the button sizes to its content, not a square', () => {
    const { button } = create();
    expect(button.hasAttribute('data-icon-only')).toBe(false);
  });

  it('does not require a label — no throw, and no aria-label is set, letting the visible text name the button', () => {
    const { button } = create();
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(button.textContent?.trim()).toContain('Save');
  });

  it('still sets aria-label if a label is explicitly given, as a deliberate override', () => {
    const fixture = TestBed.createComponent(IconButtonLeadingHost);
    fixture.componentInstance.label = 'Save changes';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Save changes');
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});

describe('HmhaIconButton — iconPosition="trailing"', () => {
  function create() {
    const fixture = TestBed.createComponent(IconButtonTrailingHost);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [IconButtonTrailingHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('does not set data-icon-only', () => {
    const { button } = create();
    expect(button.hasAttribute('data-icon-only')).toBe(false);
  });

  it('places the icon after the text in the rendered DOM, matching the consumer\'s own content order', () => {
    const { button } = create();
    const children = Array.from(button.childNodes);
    const iconIndex = children.findIndex((node) => (node as Element).tagName === 'HMHA-ICON');
    const textIndex = children.findIndex((node) => node.textContent?.includes('Next'));
    expect(iconIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeLessThan(iconIndex);
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
