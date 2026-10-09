import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'div[hmhaExpansionPanelContent]',
  template: '<ng-content />',
  styleUrl: './expansion-panel-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmhaExpansionPanelContent {}
