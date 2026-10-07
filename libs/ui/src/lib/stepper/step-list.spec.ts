import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaStep } from './step';
import { HmhaStepList } from './step-list';
import { HmhaStepper } from './stepper';

@Component({
  selector: 'step-list-host',
  imports: [HmhaStepper, HmhaStepList, HmhaStep],
  template: `
    <div hmhaStepper [(value)]="active">
      <div hmhaStepList>
        <button hmhaStep value="info">Info</button>
        <button hmhaStep value="shipping">Shipping</button>
        <button hmhaStep value="payment">Payment</button>
      </div>
    </div>
  `,
})
class StepListHost {
  readonly active = signal('shipping');
}

describe('HmhaStepList', () => {
  function create() {
    const fixture = TestBed.createComponent(StepListHost);
    fixture.detectChanges();
    return {
      fixture,
      list: fixture.nativeElement.querySelector('[hmhaStepList]') as HTMLElement,
      steps: Array.from(fixture.nativeElement.querySelectorAll('[hmhaStep]')) as HTMLButtonElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepListHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('sets no ARIA role of its own — there is no official WAI-ARIA stepper pattern, and role="list" needs listitem children it has no reason to add', () => {
    const { list } = create();
    expect(list.getAttribute('role')).toBeNull();
  });

  it("derives each step's position from DOM order, not declaration order of any other kind", () => {
    const { steps } = create();
    // info (index 0) is completed relative to the active "shipping" step, so
    // it renders a check icon instead of its number — payment (index 2) is
    // still upcoming and renders "3", proving the third step resolved its
    // own position via its DOM order among all three siblings.
    expect(steps[0].querySelector('.hmha-step-indicator svg')).toBeTruthy();
    expect(steps[2].querySelector('.hmha-step-indicator')?.textContent?.trim()).toBe('3');
  });
});
