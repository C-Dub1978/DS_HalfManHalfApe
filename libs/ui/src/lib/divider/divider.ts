import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import type { HmhaOrientation } from '../core/types';

/**
 * `<hr>`'s implicit ARIA role is already `separator` — no `role`
 * attribute needed. `aria-orientation` is set explicitly either way,
 * matching how `data-tone`/`data-size` are always reflected on
 * `HmhaButton` regardless of whether the value is the default
 * (DECISIONS.md fork 28).
 */
@Component({
  selector: 'hr[hmhaDivider]',
  template: '',
  styleUrl: './divider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-inset]': "inset() ? '' : null",
    '[attr.aria-orientation]': 'orientation()',
    '[style.width]': 'widthOverride()',
    '[style.height]': 'heightOverride()',
    '[style.--hmha-divider-color]': 'color()',
  },
})
export class HmhaDivider {
  readonly orientation = input<HmhaOrientation>('horizontal');
  /** A real CSS length (`'50%'`, `'4rem'`, …) — a consumer-supplied runtime value, not a token; see fork 28. */
  readonly length = input<string | null>(null);
  /** Forwarded straight into the `--hmha-divider-color` component token — see fork 28. */
  readonly color = input<string | null>(null);
  readonly inset = input(false, { transform: booleanAttribute });

  protected readonly widthOverride = computed(() => (this.orientation() === 'horizontal' ? this.length() : null));
  protected readonly heightOverride = computed(() => (this.orientation() === 'vertical' ? this.length() : null));
}
