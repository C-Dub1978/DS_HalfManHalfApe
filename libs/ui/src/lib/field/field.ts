import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  type Signal,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { hmhaLiveAnnouncer } from '../core/live-announcer';

/** A control's character count against its limit (fork 47). */
export interface HmhaFieldCounter {
  readonly length: number;
  readonly max: number;
}

/** How long typing must pause before a polite count announcement. */
const COUNT_SETTLE_MS = 500;
/** Announce only once this share of the limit or less remains, or when over. */
const COUNT_ANNOUNCE_THRESHOLD = 0.2;

/** "You have 20 characters remaining" / "You have 12 characters too many". */
export function hmhaCountMessage({ length, max }: HmhaFieldCounter): string {
  const left = max - length;
  const n = Math.abs(left);
  const unit = n === 1 ? 'character' : 'characters';
  return left >= 0 ? `You have ${n} ${unit} remaining` : `You have ${n} ${unit} too many`;
}

/**
 * DI contract a wrapped control optionally injects
 * (`inject(HMHA_FIELD, { optional: true })`) to reflect the field's
 * id/invalid/required/describedBy state onto itself. Keeps HmhaField
 * decoupled from knowing what control it wraps — Input, Checkbox,
 * RadioGroup, Switch, or a consumer's own custom control all consume the
 * same contract.
 *
 * `labelId` exists because `<label for>` only associates with labelable
 * elements (input, select, textarea, button, output, meter, progress) — a
 * `<fieldset>` (what HmhaRadioGroup wraps) isn't one of them. A control
 * built on a non-labelable host binds `[attr.aria-labelledby]="labelId()"`
 * instead of relying on `controlId`/`for`.
 */
export interface HmhaFieldContext {
  readonly controlId: Signal<string>;
  readonly labelId: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly describedBy: Signal<string | null>;
  /**
   * A control with a character limit (`HmhaInput`'s `maxCharacters`)
   * hands its count here, and the field shows and announces the message.
   * Optional to call; a control without a limit never does (fork 47).
   */
  registerCounter(counter: Signal<HmhaFieldCounter | null>): void;
}

export const HMHA_FIELD = new InjectionToken<HmhaFieldContext>('HMHA_FIELD');

@Component({
  selector: 'hmha-field',
  template: `
    <label [attr.for]="controlId()" [id]="labelElId" class="hmha-field-label">
      <span>{{ label() }}</span>
      @if (required()) {
        <span class="hmha-field-required" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (error()) {
      <div [id]="errorId" class="hmha-field-error" role="alert">{{ error() }}</div>
    } @else if (hint()) {
      <div [id]="hintId" class="hmha-field-hint">{{ hint() }}</div>
    }
    @if (counter(); as count) {
      <div [id]="counterId" class="hmha-field-counter" [attr.data-over]="count.length > count.max ? '' : null">
        {{ countMessage() }}
      </div>
    }
  `,
  styleUrl: './field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'hmhaField',
  providers: [{ provide: HMHA_FIELD, useExisting: forwardRef(() => HmhaField) }],
})
export class HmhaField implements HmhaFieldContext {
  private readonly id = inject(_IdGenerator).getId('hmha-field-');
  protected readonly hintId = `${this.id}-hint`;
  protected readonly errorId = `${this.id}-error`;
  protected readonly labelElId = `${this.id}-label`;
  protected readonly counterId = `${this.id}-counter`;
  private readonly counterSource = signal<Signal<HmhaFieldCounter | null> | null>(null);
  protected readonly counter = computed(() => this.counterSource()?.() ?? null);
  protected readonly countMessage = computed(() => {
    const count = this.counter();
    return count ? hmhaCountMessage(count) : '';
  });

  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  readonly controlId = computed(() => this.id);
  readonly labelId = computed(() => this.labelElId);
  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed<string | null>(() => {
    // aria-describedby takes several ids: the hint or error, then the count.
    const ids = [this.error() ? this.errorId : this.hint() ? this.hintId : null, this.counter() ? this.counterId : null];
    return ids.filter(Boolean).join(' ') || null;
  });

  registerCounter(counter: Signal<HmhaFieldCounter | null>): void {
    this.counterSource.set(counter);
  }

  constructor() {
    // Announce the count politely, but only near or over the limit, and
    // only once typing pauses: "460 remaining" at every pause would be
    // noise. Never on first render. The timer only schedules an
    // announcement, never a view update (invariant 4).
    const announcer = hmhaLiveAnnouncer();
    let first = true;
    let spoken = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    effect(() => {
      const count = this.counter();
      if (first) {
        first = false;
        return;
      }
      clearTimeout(timer);
      if (!count) return;
      const near = count.max - count.length <= count.max * COUNT_ANNOUNCE_THRESHOLD;
      if (!near) return;
      const message = hmhaCountMessage(count);
      timer = setTimeout(() => {
        if (message === spoken) return;
        spoken = message;
        void announcer.announce(message, 'polite');
      }, COUNT_SETTLE_MS);
    });
  }
}
