import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaStepPanel } from './step-panel';
import { HmhaStepper } from './stepper';

@Component({
  selector: 'step-panel-host',
  imports: [HmhaStepper, HmhaStepPanel],
  template: `
    <div hmhaStepper [(value)]="active">
      <div hmhaStepPanel value="info">Info content</div>
      <div hmhaStepPanel value="shipping">Shipping content</div>
    </div>
  `,
})
class StepPanelHost {
  readonly active = signal('info');
}

describe('HmhaStepPanel', () => {
  function create() {
    const fixture = TestBed.createComponent(StepPanelHost);
    fixture.detectChanges();
    return {
      fixture,
      panels: Array.from(fixture.nativeElement.querySelectorAll('[hmhaStepPanel]')) as HTMLElement[],
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepPanelHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('hides the panel that does not match the current value', () => {
    const { panels } = create();
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
  });

  it("gives each panel an id namespaced under its stepper's rootId and own value", () => {
    const { panels } = create();
    expect(panels[0].id).toMatch(/-steppanel-info$/);
    expect(panels[1].id).toMatch(/-steppanel-shipping$/);
  });

  it('updates visibility when the bound value changes from outside', () => {
    const { fixture, panels } = create();
    fixture.componentInstance.active.set('shipping');
    fixture.detectChanges();
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });
});
