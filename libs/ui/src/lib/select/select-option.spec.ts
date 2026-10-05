import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import * as axe from 'axe-core';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaSelectOption]'));
}

@Component({
  selector: 'select-option-host',
  imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <button [hmhaSelectTrigger]="listboxTpl" [formControl]="control">Actions</button>
    <ng-template #listboxTpl>
      <div hmhaSelectListbox cdkListbox>
        <div hmhaSelectOption cdkOption="us">United States</div>
        <div hmhaSelectOption cdkOption="ca" cdkOptionDisabled>Canada</div>
      </div>
    </ng-template>
  `,
})
class SelectOptionHost {
  control = new FormControl('', { nonNullable: true });
}

describe('HmhaSelectOption', () => {
  let fixture: ComponentFixture<SelectOptionHost>;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';

    await TestBed.configureTestingModule({
      imports: [SelectOptionHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOptionHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  it('creates with role="option"', () => {
    const [first] = options();
    expect(first.getAttribute('role')).toBe('option');
  });

  it('reflects the cdkOptionDisabled input as aria-disabled', () => {
    const [, canada] = options();
    expect(canada.getAttribute('aria-disabled')).toBe('true');
  });

  it('clicking an enabled option selects it and closes the listbox', () => {
    const [us] = options();
    us.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('us');
    expect(document.querySelector('.cdk-overlay-pane [hmhaSelectListbox]')).toBeNull();
  });

  it('clicking a disabled option does neither', () => {
    const [, canada] = options();
    canada.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('');
    expect(document.querySelector('.cdk-overlay-pane [hmhaSelectListbox]')).toBeTruthy();
  });

  it('is axe-clean with the listbox open, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      const results = await axe.run(overlayContainer, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);
    }
  });
});
