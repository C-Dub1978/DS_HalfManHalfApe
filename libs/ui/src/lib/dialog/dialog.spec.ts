import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaDialog } from './dialog';

@Component({
  selector: 'dialog-host',
  imports: [HmhaDialog],
  template: `
    <button type="button" (click)="isOpen.set(true)">Open dialog</button>
    <dialog hmhaDialog [(open)]="isOpen" [dismissible]="dismissible" aria-labelledby="dlg-title">
      <h2 id="dlg-title">Delete item?</h2>
      <p>This action cannot be undone.</p>
      <button type="button" (click)="isOpen.set(false)">Cancel</button>
    </dialog>
  `,
})
class DialogHost {
  readonly isOpen = signal(false);
  dismissible = true;
}

describe('HmhaDialog', () => {
  let fixture: ComponentFixture<DialogHost>;
  let dialog: HTMLDialogElement;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [DialogHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHost);
    dialog = fixture.nativeElement.querySelector('dialog');
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    if (dialog.open) dialog.close();
  });

  it('creates as a real native <dialog>, closed by default', () => {
    expect(dialog).toBeTruthy();
    expect(dialog.open).toBe(false);
  });

  it('setting open(true) calls showModal() — a real modal, not just a visible block', () => {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.matches(':modal')).toBe(true);
  });

  it('setting open(false) closes it', () => {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    fixture.componentInstance.isOpen.set(false);
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
  });

  it('a native close event syncs the open model back to false', () => {
    // Dispatched directly rather than relying on dialog.close()'s own event
    // firing: confirmed via a real Chromium (Playwright) that close() does
    // fire 'close' in practice, but Karma's ChromeHeadlessNoSandbox launcher
    // doesn't for <dialog> specifically — a launcher limitation, not a bug
    // in this component. This tests this component's own reaction, which is
    // what's actually ours to get right; see the sandbox gate (step 9) for
    // the real-browser proof of the full interactive flow.
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('close'));
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('a click on the backdrop (target === the dialog itself) calls close() on a dismissible dialog', () => {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(false);
  });

  it('a click on projected content (target !== the dialog) does not close it', () => {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    const heading = dialog.querySelector('h2') as HTMLElement;
    heading.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(true);
  });

  it('cancel (Escape) is allowed through on a dismissible dialog', () => {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(false);
  });

  it('non-dismissible: backdrop click and cancel are both blocked', () => {
    fixture.componentInstance.dismissible = false;
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(true);

    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
  });

  it('is axe-clean when open, in both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const results = await axe.run(dialog, { runOnly: ['wcag2a', 'wcag2aa'] });
      expect(results.violations).withContext(`mode="${mode}"`).toEqual([]);

      fixture.componentInstance.isOpen.set(false);
      fixture.detectChanges();
    }
  });
});
