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
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { hmhaOverlay } from '../core/overlay';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

/** The minimal shape `HmhaComboboxListbox` registers itself as — a structural type, not an import, to avoid a circular import between the two files. */
export interface HmhaComboboxListboxHandle {
  readonly element: HTMLElement;
  getActiveOptionId(): string | null;
}

/**
 * What `HmhaComboboxListbox` injects to register itself (so keydown
 * events can be forwarded to it, and its active option read back
 * afterward — see `onKeydown`) and report a committed selection.
 */
export interface HmhaComboboxInputContext {
  readonly inputId: Signal<string>;
  readonly listboxId: Signal<string>;
  selectValue(value: string): void;
  registerListbox(listbox: HmhaComboboxListboxHandle): void;
}

export const HMHA_COMBOBOX_INPUT = new InjectionToken<HmhaComboboxInputContext>('HMHA_COMBOBOX_INPUT');

// Space is deliberately excluded — it must keep typing a space character,
// unlike a listbox/menu item where Space selects. CdkListbox's own
// _handleKeydown reads event.keyCode, same legacy gap as everywhere else
// CDK's key managers are driven (fork 15's note).
const NAVIGATION_KEY_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  Home: 36,
  End: 35,
  Enter: 13,
};

@Component({
  selector: 'input[hmhaCombobox]',
  template: '',
  styleUrl: './combobox-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaComboboxInput), multi: true }],
  host: {
    type: 'text',
    role: 'combobox',
    'aria-autocomplete': 'list',
    autocomplete: 'off',
    '[attr.id]': 'inputId()',
    '[attr.aria-expanded]': 'overlay.isOpen()',
    '[attr.aria-controls]': 'listboxId()',
    '[attr.aria-activedescendant]': 'activeOptionId()',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[disabled]': 'disabled() || accessor.disabled()',
    '[value]': 'accessor.value()',
    '(input)': 'onInput($event)',
    '(keydown)': 'onKeydown($event)',
    '(blur)': 'accessor.markTouched()',
  },
})
export class HmhaComboboxInput implements ControlValueAccessor, HmhaComboboxInputContext {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  protected readonly accessor = hmhaValueAccessor('');
  protected readonly overlay = hmhaOverlay({ position: 'connected' });
  private readonly generatedInputId = inject(_IdGenerator).getId('hmha-combobox-input-');
  private readonly generatedListboxId = inject(_IdGenerator).getId('hmha-combobox-listbox-');
  private listbox: HmhaComboboxListboxHandle | null = null;

  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The listbox's content — `<ng-template #listbox><div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">...</div></ng-template>`. */
  readonly hmhaCombobox = input.required<TemplateRef<unknown>>();

  readonly inputId = computed(() => this.field?.controlId() ?? this.generatedInputId);
  readonly listboxId = computed(() => this.generatedListboxId);

  private readonly activeOptionIdSignal = signal<string | null>(null);
  protected readonly activeOptionId = this.activeOptionIdSignal.asReadonly();

  // The attached <ng-template> is declared in the consumer's own template,
  // a sibling of this input — not a descendant — so HmhaComboboxListbox
  // can't reach HMHA_COMBOBOX_INPUT through the normal element-injector
  // tree. This child injector is handed to hmhaOverlay().open() so the
  // portal's embedded view gets it explicitly instead (fork 15's fix).
  private readonly listboxInjector = Injector.create({
    providers: [{ provide: HMHA_COMBOBOX_INPUT, useValue: this }],
    parent: inject(Injector),
  });

  writeValue = this.accessor.writeValue;
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  selectValue(value: string): void {
    // Unlike HmhaSelect, there's no separate "code vs. display label"
    // here — this is a plain text field, so its ControlValueAccessor
    // value is simply the text itself, same as HmhaInput. An option's
    // cdkOption value IS its display text (see HmhaComboboxOption) — no
    // separate label to read off the option element.
    this.accessor.setValue(value);
    this.accessor.markTouched();
    this.close();
  }

  registerListbox(listbox: HmhaComboboxListboxHandle): void {
    this.listbox = listbox;
  }

  close(): void {
    this.overlay.close();
    this.listbox = null;
    this.activeOptionIdSignal.set(null);
  }

  protected onInput(event: Event): void {
    this.accessor.setValue((event.target as HTMLInputElement).value);
    if (!this.overlay.isOpen()) {
      this.open();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.overlay.isOpen()) {
        this.close();
      }
      return;
    }

    const keyCode = NAVIGATION_KEY_CODES[event.key];
    if (keyCode === undefined) {
      return;
    }
    if (!this.overlay.isOpen()) {
      if (event.key === 'ArrowDown') {
        this.open();
      }
      return;
    }
    if (!this.listbox) {
      return;
    }
    // Real DOM focus stays in this input the whole time (that's the point
    // of active-descendant mode — see combobox-listbox.ts), so
    // CdkListbox's own (keydown) host listener, bound to its own element,
    // never sees these via bubbling. Forwarding a fresh event directly at
    // that element is the documented way to drive it without moving focus.
    const forwarded = new KeyboardEvent('keydown', { key: event.key, bubbles: false });
    Object.defineProperty(forwarded, 'keyCode', { get: () => keyCode });
    this.listbox.element.dispatchEvent(forwarded);
    // dispatchEvent() is synchronous — every listener on that element,
    // including CdkListbox's own, has already run by the time it
    // returns. For a plain navigation key that's just a fresh active
    // item to read here; for Enter on an option, triggerOption() already
    // fired valueChange synchronously within that same call, which
    // selectValue() → close() already nulled this.listbox in response
    // to — nothing left to read in that case.
    if (this.listbox) {
      this.activeOptionIdSignal.set(this.listbox.getActiveOptionId());
    }
    event.preventDefault();
  }

  protected open(): void {
    this.overlay.open(this.elementRef.nativeElement, this.hmhaCombobox(), this.listboxInjector);
  }
}
