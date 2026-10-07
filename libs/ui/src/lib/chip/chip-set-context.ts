import { InjectionToken } from '@angular/core';
import type { FocusableOption } from '@angular/cdk/a11y';

/**
 * Separate file so `HmhaChip` and `HmhaChipSet` can each import the token
 * without importing each other — `HmhaChipSet` needs `contentChildren(
 * HmhaChip)`, so declaring this token inside either component's own file
 * would create a circular import (the same reasoning as Menu's
 * `menu-context.ts`, fork 15).
 */
export interface HmhaChipSetContext {
  readonly activeChip: () => FocusableOption | null;
}

export const HMHA_CHIP_SET = new InjectionToken<HmhaChipSetContext>('HMHA_CHIP_SET');
