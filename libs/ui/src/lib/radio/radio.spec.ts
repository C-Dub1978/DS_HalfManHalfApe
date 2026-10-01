import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaRadio } from './radio';
import { HmhaRadioGroup } from './radio-group';

// HmhaRadio requires (not optionally injects) HMHA_RADIO_GROUP — used
// outside an HmhaRadioGroup, it throws Angular's own NG0201 at creation
// time. That's intentional (see radio.ts's class comment and README), but
// isn't asserted here: the error surfaces through Angular's own async
// error-reporting path in this zoneless TestBed setup, not as a
// synchronous throw either `toThrow()` or a manual try/catch can capture.

@Component({
  selector: 'radio-group-host',
  imports: [HmhaRadioGroup, HmhaRadio],
  template: `
    <fieldset hmhaRadioGroup>
      <input type="radio" hmhaRadio value="a" size="sm" data-testid="a" />
      <input type="radio" hmhaRadio value="b" [disabled]="bDisabled" data-testid="b" />
    </fieldset>
  `,
})
class RadioGroupHost {
  bDisabled = false;
}

describe('HmhaRadio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioGroupHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('creates as a real type="radio" input inside a group', () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    fixture.detectChanges();
    const radio: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="a"]');
    expect(radio.type).toBe('radio');
  });

  it("shares the group's generated name across all radios in that group", () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    fixture.detectChanges();
    const a: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="a"]');
    const b: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="b"]');
    expect(a.name).toBeTruthy();
    expect(a.name).toBe(b.name);
  });

  it('two separate group instances get distinct names', () => {
    const one = TestBed.createComponent(RadioGroupHost);
    one.detectChanges();
    const two = TestBed.createComponent(RadioGroupHost);
    two.detectChanges();

    const nameOne = (one.nativeElement.querySelector('[data-testid="a"]') as HTMLInputElement).name;
    const nameTwo = (two.nativeElement.querySelector('[data-testid="a"]') as HTMLInputElement).name;
    expect(nameOne).not.toBe(nameTwo);
  });

  it('reflects the size input as a data attribute', () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    fixture.detectChanges();
    const a: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="a"]');
    expect(a.getAttribute('data-size')).toBe('sm');
  });

  it('selecting one radio checks it and leaves its sibling unchecked (native radio-group behaviour)', () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    fixture.detectChanges();
    const a: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="a"]');
    const b: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="b"]');

    a.checked = true;
    a.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(a.checked).toBe(true);
    expect(b.checked).toBe(false);

    b.checked = true;
    b.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });

  it('disables an individual radio via its own standalone disabled input, independent of its siblings', () => {
    const fixture = TestBed.createComponent(RadioGroupHost);
    fixture.componentInstance.bDisabled = true;
    fixture.detectChanges();

    const a: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="a"]');
    const b: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="b"]');
    expect(a.disabled).toBe(false);
    expect(b.disabled).toBe(true);
  });
});
