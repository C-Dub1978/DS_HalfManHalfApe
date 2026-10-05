import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  Injector,
  type Signal,
  type TemplateRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { hmhaOverlay } from '../core/overlay';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

/**
 * What `HmhaSelectListbox` (possibly nested components deep inside the
 * attached template) injects to read the current value, report a new one,
 * and ask the trigger to close — the trigger owns both the
 * `ControlValueAccessor` and the `hmhaOverlay()` handle, the listbox never
 * touches either directly.
 */
export interface HmhaSelectTriggerContext {
  readonly value: Signal<string>;
  /** A role="listbox" needs an accessible name of its own — the listbox points aria-labelledby back at this. */
  readonly triggerId: Signal<string>;
  selectValue(value: string): void;
  close(): void;
}

export const HMHA_SELECT_TRIGGER = new InjectionToken<HmhaSelectTriggerContext>('HMHA_SELECT_TRIGGER');

@Component({
  selector: 'button[hmhaSelectTrigger]',
  template: '<ng-content />',
  styleUrl: './select-trigger.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaSelectTrigger), multi: true }],
  host: {
    // Guards against accidental form submission, same reasoning as every
    // other control that forces its own type.
    type: 'button',
    'aria-haspopup': 'listbox',
    '[attr.id]': 'triggerId()',
    '[attr.aria-expanded]': 'overlay.isOpen()',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[disabled]': 'disabled() || accessor.disabled()',
    '(click)': 'onClick()',
    '(blur)': 'accessor.markTouched()',
  },
})
export class HmhaSelectTrigger implements ControlValueAccessor, HmhaSelectTriggerContext {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  protected readonly accessor = hmhaValueAccessor('');
  protected readonly overlay = hmhaOverlay({ position: 'connected' });
  private readonly generatedId = inject(_IdGenerator).getId('hmha-select-trigger-');
  private wasOpen = false;

  // Falls back to a self-generated id when not wrapped in an HmhaField —
  // the listbox needs this id either way, for its own aria-labelledby.
  readonly triggerId = computed(() => this.field?.controlId() ?? this.generatedId);

  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The listbox's content — `<ng-template #listbox><div hmhaSelectListbox cdkListbox>...</div></ng-template>`. */
  readonly hmhaSelectTrigger = input.required<TemplateRef<unknown>>();

  readonly value = this.accessor.value;

  // The attached <ng-template> is declared in the consumer's own template,
  // a sibling of this button — not a descendant — so HmhaSelectListbox
  // can't reach HMHA_SELECT_TRIGGER through the normal element-injector
  // tree. This child injector is handed to hmhaOverlay().open() so the
  // portal's embedded view gets it explicitly instead (fork 15's fix).
  private readonly listboxInjector = Injector.create({
    providers: [{ provide: HMHA_SELECT_TRIGGER, useValue: this }],
    parent: inject(Injector),
  });

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  constructor() {
    // Covers every close path uniformly (Escape, outside click, an option
    // picked, or close() called directly) — same as HmhaMenuTrigger.
    effect(() => {
      const isOpen = this.overlay.isOpen();
      if (!isOpen && this.wasOpen) {
        this.elementRef.nativeElement.focus();
      }
      this.wasOpen = isOpen;
    });
  }

  selectValue(value: string): void {
    this.accessor.setValue(value);
    this.accessor.markTouched();
    this.close();
  }

  close(): void {
    this.overlay.close();
  }

  protected onClick(): void {
    if (this.overlay.isOpen()) {
      this.overlay.close();
    } else {
      this.overlay.open(this.elementRef.nativeElement, this.hmhaSelectTrigger(), this.listboxInjector);
    }
  }
}
