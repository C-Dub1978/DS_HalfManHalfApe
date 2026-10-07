import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaDialog } from './dialog';
import { HmhaDrawer } from './drawer';

@Component({
  selector: 'drawer-host',
  imports: [HmhaDialog, HmhaDrawer],
  template: `
    <dialog hmhaDialog hmhaDrawer [placement]="placement" [(open)]="isOpen" aria-labelledby="nav-title">
      <h2 id="nav-title">Navigation</h2>
      <button type="button" (click)="isOpen.set(false)">Close</button>
    </dialog>
  `,
})
class DrawerHost {
  readonly isOpen = signal(false);
  placement: 'start' | 'end' = 'start';
}

describe('HmhaDrawer', () => {
  // A fresh fixture per test, with any plain-field state set before the
  // first detectChanges() — mutating a plain (non-signal) field on an
  // already-checked zoneless fixture trips NG0100, the same constraint
  // documented in card.spec.ts.
  function create(state: Partial<Pick<DrawerHost, 'placement'>> = {}) {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    const fixture = TestBed.createComponent(DrawerHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return { fixture, dialog: fixture.nativeElement.querySelector('dialog') as HTMLDialogElement };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('defaults to data-placement="start"', () => {
    const { dialog } = create();
    expect(dialog.getAttribute('data-placement')).toBe('start');
  });

  it('reflects an explicit end placement', () => {
    const { dialog } = create({ placement: 'end' });
    expect(dialog.getAttribute('data-placement')).toBe('end');
  });

  it("still opens as a real modal — all of HmhaDialog's own behavior comes along unchanged", () => {
    const { fixture, dialog } = create();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.matches(':modal')).toBe(true);
  });

  it("a backdrop click still closes it — HmhaDialog's dismissal logic is untouched by the directive", () => {
    const { fixture, dialog } = create();
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(false);
  });

  it('is axe-clean when open, for both placements, in both modes', async () => {
    for (const placement of ['start', 'end'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const { fixture, dialog } = create({ placement });
        document.documentElement.setAttribute('data-hmha-mode', mode);
        fixture.componentInstance.isOpen.set(true);
        fixture.detectChanges();

        const results = await axe.run(dialog, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`placement="${placement}", mode="${mode}"`).toEqual([]);

        dialog.close();
      }
    }
  });
});
