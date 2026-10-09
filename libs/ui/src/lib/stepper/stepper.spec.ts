import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaStep } from './step';
import { HmhaStepList } from './step-list';
import { HmhaStepPanel } from './step-panel';
import { HmhaStepper } from './stepper';

@Component({
  selector: 'stepper-host',
  imports: [HmhaStepper, HmhaStepList, HmhaStep, HmhaStepPanel],
  template: `
    <div hmhaStepper [(value)]="active">
      <div hmhaStepList>
        <button hmhaStep value="info">Info</button>
        <button hmhaStep value="shipping">Shipping</button>
        <button hmhaStep value="payment">Payment</button>
      </div>
      <div hmhaStepPanel value="info">Info content</div>
      <div hmhaStepPanel value="shipping">Shipping content</div>
      <div hmhaStepPanel value="payment">Payment content</div>
    </div>
  `,
})
class StepperHost {
  readonly active = signal('shipping');
}

describe('HmhaStepper', () => {
  function create() {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.detectChanges();
    return {
      fixture,
      panels: Array.from(fixture.nativeElement.querySelectorAll('[hmhaStepPanel]')) as HTMLElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it("shows only the panel matching the root's initial value", () => {
    const { panels } = create();
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
    expect(panels[2].hidden).toBe(true);
  });

  it('switches the visible panel when the bound value changes from outside', () => {
    const { fixture, panels } = create();
    fixture.componentInstance.active.set('payment');
    fixture.detectChanges();

    expect(panels[1].hidden).toBe(true);
    expect(panels[2].hidden).toBe(false);
  });

  it('two separate <div hmhaStepper> instances generate distinct, non-colliding root ids', () => {
    const one = create();
    const two = create();
    const onePanel = one.panels[0].id;
    const twoPanel = two.panels[0].id;
    expect(onePanel).toBeTruthy();
    expect(onePanel).not.toBe(twoPanel);
  });
});
