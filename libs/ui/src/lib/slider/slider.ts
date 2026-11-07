import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { HmhaOrientation, HmhaSize } from '../core/types';
import { hmhaValueAccessor } from '../core/value-accessor';
import { HMHA_FIELD } from '../field/field';

/** `step` takes a number, or `'any'` for a continuous value (a media timeline). */
function stepAttribute(value: unknown): number | 'any' {
  return value === 'any' ? 'any' : numberAttribute(value, 1);
}

/** `(value - min) / (max - min)` as a CSS percentage, clamped to the track. */
function percent(value: number, min: number, max: number): string {
  if (max <= min) return '0%';
  const ratio = (value - min) / (max - min);
  return `${Math.min(1, Math.max(0, ratio)) * 100}%`;
}

@Component({
  selector: 'input[hmhaSlider]',
  // <input> is a void element — nothing to template. The track, fill and
  // thumb are the browser's own range-input parts, styled in slider.css.
  template: '',
  styleUrl: './slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HmhaSlider), multi: true }],
  host: {
    // The directive's whole identity — an <input> defaults to type="text".
    // Native range gives role="slider", aria-valuenow/min/max, arrow/Page/
    // Home/End keys, pointer + touch drag and track-click for free (fork 35).
    type: 'range',
    '[attr.id]': 'field?.controlId() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-orientation]': 'orientation()',
    // A vertical range is drawn vertical by CSS (writing-mode), which the
    // accessibility tree can't see — so the orientation is stated outright.
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-valuetext]': 'valueText() ?? null',
    '[attr.data-invalid]': '(invalid() || field?.invalid()) ? "" : null',
    '[attr.aria-invalid]': '(invalid() || field?.invalid()) ? true : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-required]': 'field?.required() ? true : null',
    '[attr.data-scrubbing]': 'scrubbing() ? "" : null',
    '[disabled]': 'disabled() || accessor.disabled()',
    '[style.--_hmha-slider-fill]': 'fill()',
    '[style.--_hmha-slider-buffered]': 'bufferedFill()',
    '(input)': 'onInput()',
    '(change)': 'valueCommit.emit(value())',
    '(pointerdown)': 'setScrubbing(true)',
    // Document-level, because the pointer is routinely released outside
    // the slider mid-drag.
    '(document:pointerup)': 'setScrubbing(false)',
    '(document:pointercancel)': 'setScrubbing(false)',
    '(blur)': 'accessor.markTouched()',
  },
})
export class HmhaSlider implements ControlValueAccessor {
  protected readonly field = inject(HMHA_FIELD, { optional: true });
  private readonly el: HTMLInputElement = inject(ElementRef).nativeElement;

  /**
   * The current value. Two-way bindable on its own (`[(value)]` — a player
   * writing the playhead several times a second) and also the value Forms
   * reads and writes, through the same signal (fork 35).
   */
  readonly value = model(0);
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input<number | 'any', unknown>(1, { transform: stepAttribute });
  /**
   * How far a media source has loaded, in the same units as `value`, drawn
   * as a lighter band ahead of the fill. `null` (the default) draws none.
   */
  readonly buffered = input<number | null>(null);
  /** Human-readable value for assistive tech — "1:23 of 4:56", "Volume 40%". */
  readonly valueText = input<string | null>(null);
  readonly orientation = input<HmhaOrientation>('horizontal');
  readonly size = input<HmhaSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  /** The user let go: pointer released, or a key press finished. Seek here. */
  readonly valueCommit = output<number>();
  /**
   * `true` on pointer down, `false` on release or cancel. A player stops
   * writing `value` from `timeupdate` while this is `true`, so playback
   * doesn't fight the user's drag.
   */
  readonly scrubbingChange = output<boolean>();

  private readonly scrubbingState = signal(false);
  readonly scrubbing = this.scrubbingState.asReadonly();

  protected readonly accessor = hmhaValueAccessor<number>(this.value);

  protected readonly fill = computed(() => percent(this.value(), this.min(), this.max()));
  protected readonly bufferedFill = computed(() => {
    const buffered = this.buffered();
    // Never behind the fill: what's been played has, by definition, loaded.
    return buffered === null
      ? this.fill()
      : percent(Math.max(buffered, this.value()), this.min(), this.max());
  });

  constructor() {
    // Written imperatively, in this order, rather than as four host property
    // bindings. A range input clamps `value` to the [min, max] it has at the
    // moment `value` is set, so `value` must always land last — and it has
    // to be re-applied whenever min/max/step change, not only when `value`
    // does. (A playhead set before the media's duration is known would
    // otherwise stay clamped to the old max for good.)
    effect(() => {
      this.el.min = String(this.min());
      this.el.max = String(this.max());
      this.el.step = String(this.step());
      this.el.value = String(this.value());
    });
  }

  writeValue(value: number | null): void {
    // Forms writes null on reset(); a range input has no empty state.
    this.accessor.writeValue(value ?? this.min());
  }
  registerOnChange = this.accessor.registerOnChange;
  registerOnTouched = this.accessor.registerOnTouched;
  setDisabledState = this.accessor.setDisabledState;

  protected onInput(): void {
    this.accessor.setValue(this.el.valueAsNumber);
  }

  protected setScrubbing(next: boolean): void {
    if (next && this.el.disabled) return;
    if (this.scrubbingState() === next) return;
    this.scrubbingState.set(next);
    this.scrubbingChange.emit(next);
  }
}
