import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'hmha-card',
  template: `
    <div class="hmha-card-header"><ng-content select="[hmhaCardHeader]" /></div>
    <ng-content />
    <div class="hmha-card-footer"><ng-content select="[hmhaCardFooter]" /></div>
  `,
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-elevated]': 'elevated() || null',
  },
})
export class HmhaCard {
  readonly elevated = input(false, { transform: booleanAttribute });
}
