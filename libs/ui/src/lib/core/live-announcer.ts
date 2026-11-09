import { inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';

/**
 * CDK's LiveAnnouncer, with the CSS that hides its live region guaranteed
 * to be on the page. LiveAnnouncer puts its messages in an element with the
 * `cdk-visually-hidden` class but, unlike AriaDescriber or FocusTrapFactory,
 * never loads the styles behind that class (checked in CDK 20 and 22). On a
 * page where nothing else has loaded them, every announcement would show up
 * as stray visible text (Wave 6 step 9c). This loads them the same way CDK's
 * own classes do, so no consumer setup is needed.
 *
 * `_CdkPrivateStyleLoader`/`_VisuallyHiddenLoader` are underscore exports
 * of `@angular/cdk/private`, like `_IdGenerator`: present in every
 * supported major, and the install matrix's smoke app checks the live
 * region really is hidden on each one (fork 33). Internal to libs/ui; not
 * exported from public-api.ts.
 */
export function hmhaLiveAnnouncer(): LiveAnnouncer {
  inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  return inject(LiveAnnouncer);
}
