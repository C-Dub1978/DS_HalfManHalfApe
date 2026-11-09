import { InjectionToken } from '@angular/core';
import type { HmhaNavList } from './nav-list';

/**
 * How a nav list finds the list it's nested in, and a group the list it
 * sits in. A token rather than the class itself, because the group and the
 * list each need the other and a direct class import both ways would be
 * circular. Internal, not exported from public-api.ts.
 */
export const HMHA_NAV_LIST = new InjectionToken<HmhaNavList>('HMHA_NAV_LIST');
