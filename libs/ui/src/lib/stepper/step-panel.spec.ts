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

  // Rendered, not just attributed: :host's display once beat the browser's
  // [hidden] rule, so every step's panel showed at once while the attribute
  // checks above all passed (found by the Wave 6 gate).
  it('actually removes a hidden panel from the page, and shows the current one', () => {
    const { fixture, panels } = create();
    expect(getComputedStyle(panels[0]).display).toBe('block');
    expect(getComputedStyle(panels[1]).display).toBe('none');
    fixture.componentInstance.active.set('shipping');
    fixture.detectChanges();
    expect(getComputedStyle(panels[0]).display).toBe('none');
    expect(getComputedStyle(panels[1]).display).toBe('block');
  });
});
