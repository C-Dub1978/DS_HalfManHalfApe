import { type Signal, type WritableSignal, isSignal, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

/**
 * Shared ControlValueAccessor plumbing for hmha-ui's form controls (Input,
 * Checkbox, Switch, RadioGroup and Slider). Not exported from public-api.ts — it's
 * an internal implementation detail, not part of the published API surface.
 *
 * `writeValue` (Forms → component) deliberately does not call `onChange`;
 * only `setValue` (component → Forms, i.e. user-driven edits) does. Getting
 * this backwards is the most common ControlValueAccessor bug — centralizing
 * it here means it only has to be gotten right once.
 */
export interface HmhaValueAccessor<T> extends ControlValueAccessor {
  readonly value: Signal<T>;
  readonly disabled: Signal<boolean>;
  setValue(value: T): void;
  markTouched(): void;
}

/**
 * Pass a plain initial value, and the accessor owns its own signal. Pass a
 * `WritableSignal` (a component's own two-way `model()`, as Slider does),
 * and the accessor reads and writes that signal instead, so Forms and the
 * model binding share one source of truth (fork 35). A control's value is
 * never itself a signal, so `isSignal()` tells the two apart; Angular 20
 * (the floor) has no `isWritableSignal()` to be stricter with.
 */
export function hmhaValueAccessor<T>(initial: T | WritableSignal<T>): HmhaValueAccessor<T> {
  const value: WritableSignal<T> = isSignal(initial) ? (initial as WritableSignal<T>) : signal(initial);
  const disabled = signal(false);
  let onChange: (value: T) => void = () => {};
  let onTouched: () => void = () => {};

  return {
    value: value.asReadonly(),
    disabled: disabled.asReadonly(),
    setValue(next: T) {
      value.set(next);
      onChange(next);
    },
    markTouched() {
      onTouched();
    },
    writeValue(next: T) {
      value.set(next);
    },
    registerOnChange(fn: (value: T) => void) {
      onChange = fn;
    },
    registerOnTouched(fn: () => void) {
      onTouched = fn;
    },
    setDisabledState(isDisabled: boolean) {
      disabled.set(isDisabled);
    },
  };
}
