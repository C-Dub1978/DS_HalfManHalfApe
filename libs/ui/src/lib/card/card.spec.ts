import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { HmhaCard } from './card';

@Component({
  selector: 'card-slots-host',
  imports: [HmhaCard],
  template: `
    <hmha-card [elevated]="elevated">
      <span hmhaCardHeader>Header</span>
      <p>Body copy.</p>
      <span hmhaCardFooter>Footer</span>
    </hmha-card>
  `,
})
class CardSlotsHost {
  elevated = false;
}

@Component({
  selector: 'card-bare-host',
  imports: [HmhaCard],
  template: `<hmha-card><p>Just body copy.</p></hmha-card>`,
})
class CardBareHost {}

describe('HmhaCard', () => {
  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');

    await TestBed.configureTestingModule({
      imports: [CardSlotsHost, CardBareHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
  });

  /**
   * `elevated` is set before the fixture's first `detectChanges()`, never
   * mutated on an already-checked fixture — zoneless TestBed's checkNoChanges
   * pass flags a plain-field mutation between two `detectChanges()` calls as
   * a stray change, even though the DOM update itself is correct.
   */
  function createCard(elevated = false) {
    const fixture = TestBed.createComponent(CardSlotsHost);
    fixture.componentInstance.elevated = elevated;
    fixture.detectChanges();
    return { fixture, card: fixture.nativeElement.querySelector('hmha-card') as HTMLElement };
  }

  it('creates', () => {
    const { card } = createCard();
    expect(card).toBeTruthy();
  });

  it('has no data-elevated attribute by default', () => {
    const { card } = createCard();
    expect(card.hasAttribute('data-elevated')).toBe(false);
  });

  it('reflects the elevated input as a data attribute', () => {
    const { card } = createCard(true);
    expect(card.getAttribute('data-elevated')).toBe('true');
  });

  it('projects header, body and footer content', () => {
    const { card } = createCard();
    expect(card.textContent).toContain('Header');
    expect(card.textContent).toContain('Body copy.');
    expect(card.textContent).toContain('Footer');
  });

  it('collapses the header/footer wrapper when nothing is projected into them', () => {
    const bareFixture = TestBed.createComponent(CardBareHost);
    bareFixture.detectChanges();
    const bareCard = bareFixture.nativeElement.querySelector('hmha-card');
    expect(bareCard.querySelector('.hmha-card-header')?.children.length).toBe(0);
    expect(bareCard.querySelector('.hmha-card-footer')?.children.length).toBe(0);
  });

  it('is axe-clean, elevated and flat, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);

      for (const elevated of [false, true]) {
        const { fixture } = createCard(elevated);
        const results = await axe.run(fixture.nativeElement, {
          runOnly: ['wcag2a', 'wcag2aa'],
        });
        expect(results.violations).withContext(`mode="${mode}" elevated=${elevated}`).toEqual([]);
      }
    }
  });
});
