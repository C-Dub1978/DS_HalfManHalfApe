import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  // A native <ul> of HmhaUploadItem rows. The consumer renders the rows
  // with their own @for over their own upload state (fork 41).
  selector: 'ul[hmhaUploadList]',
  template: '<ng-content />',
  styleUrl: './upload-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Safari drops a list's semantics once its bullets are styled away;
    // stating the role keeps "list, 3 items" for every screen reader.
    role: 'list',
  },
})
export class HmhaUploadList {}
