import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HmhaButton } from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'sandbox-root',
  imports: [HmhaButton],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
