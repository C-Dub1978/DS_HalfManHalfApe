import { InjectionToken, type Signal } from '@angular/core';

/**
 * Separate file so `HmhaStepList` and `HmhaStep` can each import the
 * token without importing each other — `HmhaStepList` needs
 * `contentChildren(HmhaStep)` for step order, so declaring this token
 * inside either component's own file would create a circular import
 * (the same reasoning as Menu's `menu-context.ts`, fork 15, and Chip's
 * `chip-set-context.ts`, fork 24).
 */
export interface HmhaStepListContext {
  /** Step `value`s in DOM order — what lets each HmhaStep compute its own position relative to the current step. */
  readonly stepValues: Signal<readonly string[]>;
}

export const HMHA_STEP_LIST = new InjectionToken<HmhaStepListContext>('HMHA_STEP_LIST');
