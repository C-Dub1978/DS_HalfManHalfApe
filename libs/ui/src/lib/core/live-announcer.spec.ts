import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { hmhaLiveAnnouncer } from './live-announcer';

describe('hmhaLiveAnnouncer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('returns CDK’s own LiveAnnouncer singleton', () => {
    const announcer = TestBed.runInInjectionContext(() => hmhaLiveAnnouncer());
    expect(announcer).toBe(TestBed.inject(LiveAnnouncer));
  });

  it('puts the styles that hide its live region on the page', () => {
    // Without them, every announcement shows as visible text at the foot of
    // the page (Wave 6 step 9c). Other specs in the same run may already
    // have loaded them, so this checks the outcome, not a before/after.
    TestBed.runInInjectionContext(() => hmhaLiveAnnouncer());
    const probe = document.createElement('div');
    probe.className = 'cdk-visually-hidden';
    probe.textContent = 'An announcement';
    document.body.appendChild(probe);
    const style = getComputedStyle(probe);
    expect(style.position).toBe('absolute');
    expect(probe.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    probe.remove();
  });
});
