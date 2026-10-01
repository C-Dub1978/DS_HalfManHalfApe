import { type Signal, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

/**
 * Shared ControlValueAccessor plumbing for hmha-ui's form controls (Input,
 * Checkbox, Switch, and RadioGroup). Not exported from public-api.ts — it's
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

export function hmhaValueAccessor<T>(initial: T): HmhaValueAccessor<T> {
  const value = signal(initial);
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
