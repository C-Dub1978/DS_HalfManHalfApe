import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'hmha-card',
  template: `
    <header class="hmha-card-header"><ng-content select="[hmhaCardHeader]" /></header>
    <ng-content />
    <footer class="hmha-card-footer"><ng-content select="[hmhaCardFooter]" /></footer>
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
