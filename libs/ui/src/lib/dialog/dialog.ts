import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, effect, inject, input, model } from '@angular/core';

@Component({
  selector: 'dialog[hmhaDialog]',
  template: '<ng-content />',
  styleUrl: './dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(cancel)': 'onCancel($event)',
    '(close)': 'onNativeClose()',
    '(click)': 'onBackdropClick($event)',
  },
})
export class HmhaDialog {
  // Native <dialog> + showModal() — not hmhaOverlay/CDK Overlay. The native
  // element already gives a real focus trap, Escape-to-close, top-layer
  // rendering and implicit role="dialog"/aria-modal for free; see
  // DECISIONS.md fork 14 for why this is the one Wave 3 component that
  // doesn't use the shared overlay foundation.
  private readonly elementRef = inject<ElementRef<HTMLDialogElement>>(ElementRef);

  readonly open = model(false);
  /** false for a dialog that must be resolved via its own content (e.g. a required choice), not dismissed casually. */
  readonly dismissible = input(true, { transform: booleanAttribute });

  constructor() {
    effect(() => {
      const dialog = this.elementRef.nativeElement;
      if (this.open()) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected onCancel(event: Event): void {
    if (!this.dismissible()) {
      event.preventDefault();
    }
  }

  protected onNativeClose(): void {
    this.open.set(false);
  }

  protected onBackdropClick(event: MouseEvent): void {
    // A click lands with target === the dialog itself only when it hits the
    // backdrop — a click on projected content targets that inner element.
    if (this.dismissible() && event.target === this.elementRef.nativeElement) {
      this.elementRef.nativeElement.close();
    }
  }
}
