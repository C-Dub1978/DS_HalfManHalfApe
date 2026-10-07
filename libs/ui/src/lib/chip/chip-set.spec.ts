import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaChip } from './chip';
import { HmhaChipSet } from './chip-set';

// CDK's ListKeyManager.onKeydown switches on the legacy numeric
// event.keyCode, which the KeyboardEvent constructor never sets from
// `key` alone — same gap Menu/Tabs' own specs already work around.
const KEY_CODES: Record<string, number> = { ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 };

function dispatchKey(target: Element, key: string): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] });
  target.dispatchEvent(event);
}

@Component({
  selector: 'chip-set-host',
  imports: [HmhaChipSet, HmhaChip],
  template: `
    <div hmhaChipSet ariaLabel="Filters">
      <button hmhaChip selectable="true">Remote</button>
      <button hmhaChip selectable="true" disabled="true">On-site</button>
      <button hmhaChip selectable="true">Hybrid</button>
    </div>
  `,
})
class ChipSetHost {}

describe('HmhaChipSet', () => {
  function create() {
    const fixture = TestBed.createComponent(ChipSetHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      set: el.querySelector('[hmhaChipSet]') as HTMLElement,
      chips: Array.from(el.querySelectorAll('[hmhaChip]')) as HTMLButtonElement[],
    };
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [ChipSetHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  it('creates and projects its chips', () => {
    const { chips } = create();
    expect(chips.length).toBe(3);
  });

  it('sets role="group" and reflects ariaLabel', () => {
    const { set } = create();
    expect(set.getAttribute('role')).toBe('group');
    expect(set.getAttribute('aria-label')).toBe('Filters');
  });

  it('roving tabindex: only the first chip is a tab stop initially', () => {
    const { chips } = create();
    expect(chips[0].getAttribute('tabindex')).toBe('0');
    expect(chips[1].getAttribute('tabindex')).toBe('-1');
    expect(chips[2].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowRight moves the active chip forward, skipping a disabled one', async () => {
    const { fixture, set, chips } = create();
    chips[0].focus();
    dispatchKey(set, 'ArrowRight');
    await fixture.whenStable();

    // chips[1] (On-site) is disabled — the key manager skips straight to chips[2].
    expect(chips[2].getAttribute('tabindex')).toBe('0');
    expect(chips[0].getAttribute('tabindex')).toBe('-1');
    expect(chips[1].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowRight wraps from the last chip back to the first', async () => {
    const { fixture, set, chips } = create();
    chips[0].focus();
    dispatchKey(set, 'ArrowRight'); // -> chips[2] (skipping disabled chips[1])
    await fixture.whenStable();
    dispatchKey(set, 'ArrowRight'); // -> wraps back to chips[0]
    await fixture.whenStable();

    expect(chips[0].getAttribute('tabindex')).toBe('0');
  });

  it('End moves the active chip to the last enabled one', async () => {
    const { fixture, set, chips } = create();
    chips[0].focus();
    dispatchKey(set, 'End');
    await fixture.whenStable();

    expect(chips[2].getAttribute('tabindex')).toBe('0');
  });

  it('Home moves the active chip back to the first', async () => {
    const { fixture, set, chips } = create();
    chips[0].focus();
    dispatchKey(set, 'End');
    await fixture.whenStable();
    dispatchKey(set, 'Home');
    await fixture.whenStable();

    expect(chips[0].getAttribute('tabindex')).toBe('0');
  });

  it('is axe-clean', async () => {
    const { fixture } = create();
    const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
    expect(results.violations).toEqual([]);
  });
});
