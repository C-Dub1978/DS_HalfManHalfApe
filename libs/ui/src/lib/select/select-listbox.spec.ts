import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaSelectOption]'));
}
function panel(): HTMLElement {
  return document.querySelector('.cdk-overlay-pane [hmhaSelectListbox]') as HTMLElement;
}

// CDK's ActiveDescendantKeyManager (used internally by CdkListbox) reads
// the same legacy event.keyCode ListKeyManager does — a synthetic
// KeyboardEvent never populates it in Chrome, same workaround as
// menu.spec.ts/tab-list.spec.ts.
function dispatchKeydown(target: Element, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}
function arrowDown(target: Element): void {
  dispatchKeydown(target, 'ArrowDown', 40);
}

@Component({
  selector: 'select-listbox-host',
  imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
  template: `
    <button [hmhaSelectTrigger]="listboxTpl" [formControl]="control">Actions</button>
    <ng-template #listboxTpl>
      <div hmhaSelectListbox cdkListbox>
        <div hmhaSelectOption cdkOption="us">United States</div>
        <div hmhaSelectOption cdkOption="ca" [cdkOptionDisabled]="caDisabled">Canada</div>
        <div hmhaSelectOption cdkOption="mx">Mexico</div>
      </div>
    </ng-template>
  `,
})
class SelectListboxHost {
  control = new FormControl('', { nonNullable: true });
  caDisabled = false;
}

describe('HmhaSelectListbox', () => {
  let fixture: ComponentFixture<SelectListboxHost>;
  let button: HTMLButtonElement;

  function openListbox(): void {
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectListboxHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectListboxHost);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  it('renders as a real listbox', () => {
    openListbox();
    expect(panel().getAttribute('role')).toBe('listbox');
  });

  it('focuses the first option on open when nothing is selected yet', () => {
    openListbox();
    expect(document.activeElement).toBe(options()[0]);
  });

  it('ArrowDown moves focus to the next option', () => {
    openListbox();
    const [first, second] = options();
    arrowDown(panel());
    expect(document.activeElement).toBe(second);
    expect(first.getAttribute('aria-selected')).toBe('false');
  });

  it('skips a disabled option when navigating past it', () => {
    fixture.componentInstance.caDisabled = true;
    openListbox();
    const [first, , third] = options();
    expect(document.activeElement).toBe(first);
    arrowDown(panel());
    expect(document.activeElement).toBe(third);
  });
});
