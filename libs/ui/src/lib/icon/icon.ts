import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { HmhaSize } from '../core/types';
import { HMHA_ICONS, type HmhaIconName } from './icon-registry';

@Component({
  selector: 'hmha-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ' +
    '[innerHTML]="markup()"></svg>',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class HmhaIcon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<HmhaIconName>();
  readonly size = input<HmhaSize>('md');

  // Registry entries are hand-authored, build-time constants, never user
  // input, so bypassing sanitization here can't open an XSS path.
  protected readonly markup = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(HMHA_ICONS[this.name()]),
  );
}
