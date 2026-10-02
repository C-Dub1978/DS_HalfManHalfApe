import { InjectionToken, type Signal } from '@angular/core';
import type { FocusableOption } from '@angular/cdk/a11y';

/**
 * In its own file, not menu.ts — HmhaMenu needs the real HmhaMenuItem class
 * (for contentChildren(HmhaMenuItem)) and HmhaMenuItem needs this token, so
 * putting the token in either component's own file would make menu.ts and
 * menu-item.ts import each other. `activeItem` is typed as CDK's own
 * FocusableOption, not the concrete HmhaMenuItem class, for the same reason.
 */
export interface HmhaMenuContext {
  readonly activeItem: Signal<FocusableOption | null>;
  close(): void;
}

export const HMHA_MENU = new InjectionToken<HmhaMenuContext>('HMHA_MENU');
