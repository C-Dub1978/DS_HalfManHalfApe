import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HmhaButton, HmhaCard, HmhaIcon } from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'sandbox-root',
  imports: [HmhaButton, HmhaCard, HmhaIcon],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
