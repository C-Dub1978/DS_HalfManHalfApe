import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { By } from '@angular/platform-browser';
import * as axe from 'axe-core';
import { HmhaButton } from '../button/button';
import { contrast, paint } from '../core/testing/paint';
import { HmhaIcon } from '../icon/icon';
import { HmhaAlert, HmhaAlertTitle, type HmhaAlertAnnounce, type HmhaAlertTone } from './alert';

const TONES: HmhaAlertTone[] = ['info', 'success', 'warning', 'danger'];

@Component({
  selector: 'alert-host',
  imports: [HmhaAlert, HmhaAlertTitle, HmhaButton],
  template: `
    <div
      hmhaAlert
      [tone]="tone()"
      [announce]="announce()"
      [dismissible]="dismissible()"
      (dismissed)="dismissals = dismissals + 1"
    >
      <strong hmhaAlertTitle>You've used 90% of your storage</strong>
      Uploads will stop at 100%.
      @if (withAction()) {
        <button hmhaButton size="sm" hmhaAlertActions>Upgrade storage</button>
      }
    </div>
  `,
})
class AlertHost {
  readonly tone = signal<HmhaAlertTone>('warning');
  readonly announce = signal<HmhaAlertAnnounce>('none');
  readonly dismissible = signal(false);
  readonly withAction = signal(true);
  dismissals = 0;
}

describe('HmhaAlert', () => {
  let fixture: ComponentFixture<AlertHost>;
  let host: AlertHost;
  let alert: HTMLElement;
  let announce: jasmine.Spy;

  async function create(state: { announce?: HmhaAlertAnnounce; withAction?: boolean } = {}) {
    fixture = TestBed.createComponent(AlertHost);
    host = fixture.componentInstance;
    if (state.announce) host.announce.set(state.announce);
    if (state.withAction !== undefined) host.withAction.set(state.withAction);
    fixture.detectChanges();
    await fixture.whenStable();
    alert = fixture.nativeElement.querySelector('[hmhaAlert]');
  }
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    document.body.style.color = 'var(--hmha-color-text)';
    await TestBed.configureTestingModule({
      imports: [AlertHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('names its tone in words for assistive tech, with the matching icon', async () => {
    await create();
    const expected: Record<HmhaAlertTone, [string, string]> = {
      info: ['Info', 'info'],
      success: ['Success', 'circle-check'],
      warning: ['Warning', 'triangle-alert'],
      danger: ['Error', 'circle-alert'],
    };
    for (const tone of TONES) {
      host.tone.set(tone);
      await settle();
      const icon = alert.querySelector('.hmha-alert-icon')!;
      expect(alert.getAttribute('data-tone')).toBe(tone);
      expect([icon.getAttribute('role'), icon.getAttribute('aria-label')]).withContext(tone).toEqual(['img', expected[tone][0]]);
      const glyph = fixture.debugElement.query(By.css('.hmha-alert-icon hmha-icon')).componentInstance as HmhaIcon;
      expect(glyph.name()).withContext(tone).toBe(expected[tone][1]);
    }
  });

  it('projects the title, the message and the actions into their places', async () => {
    await create();
    expect(alert.querySelector('.hmha-alert-body > [hmhaAlertTitle]')?.textContent).toBe("You've used 90% of your storage");
    expect(alert.querySelector('.hmha-alert-message')?.textContent?.trim()).toBe('Uploads will stop at 100%.');
    expect(alert.querySelector('.hmha-alert-actions button')?.textContent?.trim()).toBe('Upgrade storage');
  });

  it('styles the title, whatever element the consumer chose', async () => {
    await create();
    const title = alert.querySelector('[hmhaAlertTitle]') as HTMLElement;
    const weight = getComputedStyle(document.documentElement).getPropertyValue('--hmha-type-label-md-weight').trim();
    expect(getComputedStyle(title).fontWeight).toBe(weight);
    expect(getComputedStyle(title).fontFamily).toBe(getComputedStyle(alert).fontFamily);
    expect(getComputedStyle(title).display).toBe('block');
  });

  it('leaves no empty action row when there are no actions', async () => {
    await create({ withAction: false });
    expect(getComputedStyle(alert.querySelector('.hmha-alert-actions')!).display).toBe('none');
  });

  it('sizes the icon box to exactly one line of the alert’s text', async () => {
    // Guards against sizing it from the unitless line-height token, which
    // is invalid CSS for a length and silently collapses the box.
    await create();
    const lineHeight = parseFloat(getComputedStyle(alert).lineHeight);
    expect(alert.querySelector('.hmha-alert-icon')!.getBoundingClientRect().height).toBeCloseTo(lineHeight, 0);
  });

  it('offers a named Dismiss button only when dismissible, and reports the press', async () => {
    await create();
    expect(alert.querySelector('.hmha-alert-dismiss')).toBeNull();
    host.dismissible.set(true);
    await settle();
    const dismiss = alert.querySelector('.hmha-alert-dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');
    dismiss.click();
    expect(host.dismissals).toBe(1);
    expect(fixture.nativeElement.querySelector('[hmhaAlert]')).withContext('removal is the consumer’s call').toBeTruthy();
  });

  it('announces nothing by default: an alert present on load is read in page order', async () => {
    await create();
    expect(announce).not.toHaveBeenCalled();
  });

  for (const politeness of ['polite', 'assertive'] as const) {
    it(`announces "${politeness}" with its tone, title and message, but not its action labels`, async () => {
      await create({ announce: politeness });
      expect(announce).toHaveBeenCalledOnceWith(
        "Warning: You've used 90% of your storage Uploads will stop at 100%.",
        politeness,
      );
    });
  }

  it('renders readable text and icon (4.5:1) in every tone, both modes', async () => {
    await create();
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const tone of TONES) {
        host.tone.set(tone);
        await settle();
        const style = getComputedStyle(alert);
        const fill = paint(style.backgroundColor);
        expect(contrast(paint(style.color, fill), fill)).withContext(`${mode} ${tone}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('is axe-clean in every tone, dismissible, both modes', async () => {
    // HmhaButton (the action and Dismiss) transitions its background on a
    // token change, so a mode switch needs the transition to finish before
    // colours are sampled: the same wait button.spec.ts and
    // pagination.spec.ts already use (Wave 4 step 1A).
    const transitions = () => new Promise((resolve) => setTimeout(resolve, 150));
    await create();
    host.dismissible.set(true);
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const tone of TONES) {
        host.tone.set(tone);
        await settle();
        await transitions();
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} ${tone}`).toEqual([]);
      }
    }
  });
});
