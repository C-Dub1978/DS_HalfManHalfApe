import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KitchenSink } from './kitchen-sink';

describe('KitchenSink', () => {
  function create() {
    const fixture = TestBed.createComponent(KitchenSink);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function clickButton(root: Element, text: string): void {
    const button = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
    button.click();
  }

  function stepPanel(el: HTMLElement, value: string): HTMLElement {
    return el.querySelector(`[hmhaStepPanel][value="${value}"]`) as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenSink],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('starts in light mode, with the stepper shown and the tabs hidden', () => {
    const { el } = create();
    expect(el.getAttribute('data-hmha-mode')).toBe('light');
    expect(el.querySelector('[hmhaStepper]')).toBeTruthy();
    expect(el.querySelector('[hmhaTabs]')).toBeNull();
  });

  it('toggling the header switch flips data-hmha-mode', () => {
    const { fixture, el } = create();
    const modeSwitch = el.querySelector('[hmhaSwitch]') as HTMLButtonElement;
    modeSwitch.click();
    fixture.detectChanges();
    expect(el.getAttribute('data-hmha-mode')).toBe('dark');

    modeSwitch.click();
    fixture.detectChanges();
    expect(el.getAttribute('data-hmha-mode')).toBe('light');
  });

  it("defaults to the Ocean color theme and Standard typography — today's real shipped look, unchanged", () => {
    const { el } = create();
    expect(el.style.getPropertyValue('--hmha-color-action')).toBe('var(--hmha-color-blue-600)');
    expect(el.style.getPropertyValue('--hmha-type-heading-lg-size')).toBe('');
  });

  it('picking a different color theme re-points the live CSS custom properties on the host', () => {
    const { fixture, el } = create();
    const forestCard = Array.from(el.querySelectorAll('.preset-card-trigger')).find((card) =>
      card.textContent?.includes('Forest'),
    ) as HTMLButtonElement;
    forestCard.click();
    fixture.detectChanges();

    expect(el.style.getPropertyValue('--hmha-color-action')).toBe('var(--hmha-color-green-500)');
    expect(el.style.getPropertyValue('--hmha-color-text-on-action')).toBe('var(--hmha-color-neutral-0)');
    expect(forestCard.getAttribute('aria-pressed')).toBe('true');
  });

  it('picking a different typography preset re-points the heading size/weight custom properties', () => {
    const { fixture, el } = create();
    clickButton(stepPanel(el, 'theme'), 'Next'); // theme -> typography
    fixture.detectChanges();

    const boldCard = Array.from(stepPanel(el, 'typography').querySelectorAll('.preset-card-trigger')).find((card) =>
      card.textContent?.includes('Bold'),
    ) as HTMLButtonElement;
    boldCard.click();
    fixture.detectChanges();

    expect(el.style.getPropertyValue('--hmha-type-heading-lg-size')).toBe('36px');
    expect(el.style.getPropertyValue('--hmha-type-heading-md-weight')).toBe('var(--hmha-font-weight-bold)');
  });

  it('picking a density on the Typography step applies the real data-hmha-density attribute live', () => {
    const { fixture, el } = create();
    clickButton(stepPanel(el, 'theme'), 'Next'); // theme -> typography
    fixture.detectChanges();
    expect(el.getAttribute('data-hmha-density')).toBe('comfortable');

    clickButton(stepPanel(el, 'typography'), 'Compact');
    fixture.detectChanges();
    expect(el.getAttribute('data-hmha-density')).toBe('compact');
  });

  it('Back/Next move between onboarding steps without losing earlier picks', () => {
    const { fixture, el } = create();
    clickButton(stepPanel(el, 'theme'), 'Next'); // theme -> typography
    fixture.detectChanges();
    clickButton(stepPanel(el, 'typography'), 'Compact');
    fixture.detectChanges();
    clickButton(stepPanel(el, 'typography'), 'Back'); // typography -> theme
    fixture.detectChanges();

    expect(stepPanel(el, 'theme').hidden).toBe(false);
    expect(el.getAttribute('data-hmha-density')).toBe('compact');
  });

  it('completing all 3 steps hides the stepper and reveals the 6 tabs, starting on Tab 1', () => {
    const { fixture, el } = create();
    clickButton(stepPanel(el, 'theme'), 'Next'); // theme -> typography
    fixture.detectChanges();
    clickButton(stepPanel(el, 'typography'), 'Next'); // typography -> confirm
    fixture.detectChanges();

    expect(stepPanel(el, 'confirm').hidden).toBe(false);
    expect(stepPanel(el, 'confirm').textContent).toContain('Ocean');
    expect(stepPanel(el, 'confirm').textContent).toContain('Standard');

    clickButton(stepPanel(el, 'confirm'), 'Enter the Kitchen Sink!');
    fixture.detectChanges();

    expect(el.querySelector('[hmhaStepper]')).toBeNull();
    const tabs = Array.from(el.querySelectorAll('[hmhaTab]')) as HTMLButtonElement[];
    expect(tabs.length).toBe(6);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
});
