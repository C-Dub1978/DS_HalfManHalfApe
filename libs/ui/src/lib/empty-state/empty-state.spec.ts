import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import * as axe from 'axe-core';
import { HmhaButton } from '../button/button';
import type { HmhaIconName } from '../icon/icon-registry';
import { HmhaTable } from '../table/table';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaEmptyState, HmhaEmptyStateTitle, type HmhaEmptyStateSize } from './empty-state';

@Component({
  selector: 'empty-state-host',
  imports: [HmhaEmptyState, HmhaEmptyStateTitle, HmhaButton],
  template: `
    <div hmhaEmptyState [icon]="icon()" [size]="size()" [announce]="announce()">
      <h2 hmhaEmptyStateTitle>{{ title() }}</h2>
      Upload a movie, show or album to start building it.
      @if (withAction()) {
        <button hmhaButton tone="primary" hmhaEmptyStateActions>Upload something</button>
      }
    </div>
  `,
})
class EmptyStateHost {
  readonly title = signal('Your library is empty');
  readonly icon = signal<HmhaIconName | null>('upload');
  readonly size = signal<HmhaEmptyStateSize>('md');
  readonly announce = signal<'none' | 'polite'>('none');
  readonly withAction = signal(true);
}

@Component({
  selector: 'empty-table-host',
  imports: [HmhaEmptyState, HmhaEmptyStateTitle, HmhaTable, HmhaTableCell],
  template: `
    <table hmhaTable aria-label="Search results">
      <tbody>
        <tr>
          <td hmhaTableCell colspan="3">
            <div hmhaEmptyState size="sm" icon="search">
              <h3 hmhaEmptyStateTitle>No results for “bunny”</h3>
              Try a different spelling, or search your library instead.
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class EmptyTableHost {}

describe('HmhaEmptyState', () => {
  let fixture: ComponentFixture<EmptyStateHost>;
  let host: EmptyStateHost;
  let state: HTMLElement;
  let announce: jasmine.Spy;

  async function create(setup: (h: EmptyStateHost) => void = () => {}) {
    fixture = TestBed.createComponent(EmptyStateHost);
    host = fixture.componentInstance;
    setup(host);
    fixture.detectChanges();
    await fixture.whenStable();
    state = fixture.nativeElement.querySelector('[hmhaEmptyState]');
  }
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  const px = (name: string) => {
    const probe = document.createElement('div');
    probe.style.width = `var(${name})`;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  };

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    document.body.style.color = 'var(--hmha-color-text)';
    await TestBed.configureTestingModule({
      imports: [EmptyStateHost, EmptyTableHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('projects a real heading, the message and the actions', async () => {
    await create();
    expect(state.querySelector('h2[hmhaEmptyStateTitle]')?.textContent).toBe('Your library is empty');
    expect(state.querySelector('.hmha-empty-state-message')?.textContent?.trim()).toBe(
      'Upload a movie, show or album to start building it.',
    );
    expect(state.querySelector('.hmha-empty-state-actions button')?.textContent?.trim()).toBe('Upload something');
  });

  it('gives the heading the heading face at the size the empty state sets', async () => {
    await create();
    const title = state.querySelector('[hmhaEmptyStateTitle]') as HTMLElement;
    const root = getComputedStyle(document.documentElement);
    expect(getComputedStyle(title).fontSize).toBe(root.getPropertyValue('--hmha-type-heading-sm-size').trim());

    host.size.set('sm');
    await settle();
    expect(getComputedStyle(title).fontSize).toBe(root.getPropertyValue('--hmha-type-label-md-size').trim());
  });

  it('shows a decorative icon, larger at md than at sm, and none when unset', async () => {
    await create();
    const icon = () => state.querySelector('.hmha-empty-state-icon') as HTMLElement | null;
    expect(icon()!.getAttribute('aria-hidden')).toBe('true');
    expect(icon()!.querySelector('svg')!.getBoundingClientRect().width).toBeCloseTo(px('--hmha-icon-lg') * 2, 0);

    host.size.set('sm');
    await settle();
    expect(icon()!.querySelector('svg')!.getBoundingClientRect().width).toBeCloseTo(px('--hmha-icon-lg'), 0);

    host.icon.set(null);
    await settle();
    expect(icon()).toBeNull();
  });

  it('leaves no empty action row when there are no actions', async () => {
    await create((h) => h.withAction.set(false));
    expect(getComputedStyle(state.querySelector('.hmha-empty-state-actions')!).display).toBe('none');
  });

  it('announces nothing by default', async () => {
    await create();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(announce).not.toHaveBeenCalled();
  });

  /** Past the settle window, so a pending announcement has fired. */
  const settled = () => new Promise((resolve) => setTimeout(resolve, 600));

  it('announces its heading and text politely once settled, not its action labels', async () => {
    await create((h) => h.announce.set('polite'));
    expect(announce).withContext('waits for the text to settle').not.toHaveBeenCalled();
    await settled();
    expect(announce).toHaveBeenCalledOnceWith(
      'Your library is empty Upload a movie, show or album to start building it.',
      'polite',
    );
  });

  it('announces only the final text after a burst of changes, such as a query being typed', async () => {
    await create((h) => {
      h.announce.set('polite');
      h.title.set('No results for “z”');
    });
    for (const query of ['zz', 'zzz']) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // typing speed
      host.title.set(`No results for “${query}”`);
      await settle();
    }
    await settled();
    expect(announce.calls.allArgs()).toEqual([
      ['No results for “zzz” Upload a movie, show or album to start building it.', 'polite'],
    ]);
  });

  it('announces again when the text changes after it had settled', async () => {
    await create((h) => h.announce.set('polite'));
    await settled();
    host.title.set('Still nothing here');
    await settle();
    await settled();
    expect(announce.calls.allArgs().map(([text]) => text)).toEqual([
      'Your library is empty Upload a movie, show or album to start building it.',
      'Still nothing here Upload a movie, show or album to start building it.',
    ]);
  });

  it('cancels a pending announcement when it goes away mid-settle', async () => {
    await create((h) => h.announce.set('polite'));
    fixture.destroy();
    await settled();
    expect(announce).not.toHaveBeenCalled();
  });

  it('sits inside a table cell in place of rows, axe-clean', async () => {
    const table = TestBed.createComponent(EmptyTableHost);
    table.detectChanges();
    await table.whenStable();
    expect(table.nativeElement.querySelector('td [hmhaEmptyState] h3')?.textContent).toBe('No results for “bunny”');
    const results = await axe.run(table.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });

  it('is axe-clean at both sizes, both modes', async () => {
    // The primary action is an HmhaButton, whose background transitions on
    // a mode switch: wait for it before sampling colours (Wave 4 step 1A).
    const transitions = () => new Promise((resolve) => setTimeout(resolve, 150));
    await create();
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const size of ['md', 'sm'] as const) {
        host.size.set(size);
        await settle();
        await transitions();
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} ${size}`).toEqual([]);
      }
    }
  });
});
