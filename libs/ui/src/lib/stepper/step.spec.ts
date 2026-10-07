import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaStep } from './step';
import { HmhaStepList } from './step-list';
import { HmhaStepper } from './stepper';

@Component({
  selector: 'step-host',
  imports: [HmhaStepper, HmhaStepList, HmhaStep],
  template: `
    <div hmhaStepper [(value)]="active">
      <div hmhaStepList>
        <button hmhaStep value="info">Info</button>
        <button hmhaStep value="shipping" [hasError]="shippingError" [disabled]="shippingDisabled">
          Shipping
        </button>
        <button hmhaStep value="payment">Payment</button>
      </div>
    </div>
  `,
})
class StepHost {
  readonly active = signal('shipping');
  shippingError = false;
  shippingDisabled = false;
}

describe('HmhaStep', () => {
  function create(state: Partial<Pick<StepHost, 'shippingError' | 'shippingDisabled'>> = {}) {
    const fixture = TestBed.createComponent(StepHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return {
      fixture,
      steps: Array.from(fixture.nativeElement.querySelectorAll('[hmhaStep]')) as HTMLButtonElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('creates as a real type="button"', () => {
    const { steps } = create();
    expect(steps[0].tagName).toBe('BUTTON');
    expect(steps[0].type).toBe('button');
  });

  it("sets data-state to completed/active/upcoming based on position relative to the stepper's value", () => {
    const { steps } = create();
    expect(steps[0].getAttribute('data-state')).toBe('completed');
    expect(steps[1].getAttribute('data-state')).toBe('active');
    expect(steps[2].getAttribute('data-state')).toBe('upcoming');
  });

  it('sets aria-current="step" only on the active step', () => {
    const { steps } = create();
    expect(steps[0].getAttribute('aria-current')).toBeNull();
    expect(steps[1].getAttribute('aria-current')).toBe('step');
    expect(steps[2].getAttribute('aria-current')).toBeNull();
  });

  it('renders a check icon for a completed step instead of its number', () => {
    const { steps } = create();
    expect(steps[0].querySelector('.hmha-step-indicator svg')).toBeTruthy();
  });

  it('renders the 1-based step number for active/upcoming steps with no error', () => {
    const { steps } = create();
    expect(steps[1].querySelector('.hmha-step-indicator')?.textContent?.trim()).toBe('2');
    expect(steps[2].querySelector('.hmha-step-indicator')?.textContent?.trim()).toBe('3');
  });

  it('renders an error icon and sets data-error when hasError is true, regardless of state', () => {
    const { steps } = create({ shippingError: true });
    expect(steps[1].getAttribute('data-error')).toBe('');
    expect(steps[1].querySelector('.hmha-step-indicator svg')).toBeTruthy();
  });

  it('disables an upcoming step natively — nothing to show there yet', () => {
    const { steps } = create();
    expect(steps[2].disabled).toBe(true);
    expect(steps[0].disabled).toBe(false);
    expect(steps[1].disabled).toBe(false);
  });

  it('an explicit disabled input disables an otherwise-reachable (active) step too', () => {
    const { steps } = create({ shippingDisabled: true });
    expect(steps[1].disabled).toBe(true);
  });

  it('clicking a completed step navigates the stepper back to it (two-way value update)', () => {
    const { fixture, steps } = create();
    steps[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('info');
  });

  it("clicking an upcoming step does nothing — it's natively disabled, so no click fires", () => {
    const { fixture, steps } = create();
    steps[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('shipping');
  });

  it('an explicitly disabled reachable step does not navigate when clicked', () => {
    const { fixture, steps } = create({ shippingDisabled: true });
    steps[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('shipping');
  });
});
