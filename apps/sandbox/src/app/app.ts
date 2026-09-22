import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HmhaButton, HmhaCard, HmhaIcon, HmhaIconButton } from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'sandbox-root',
  imports: [HmhaButton, HmhaCard, HmhaIcon, HmhaIconButton],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
