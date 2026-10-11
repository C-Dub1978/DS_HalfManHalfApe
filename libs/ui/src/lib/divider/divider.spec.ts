import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HmhaDivider } from './divider';

@Component({
  selector: 'divider-host',
  imports: [HmhaDivider],
  template: `
    <hr hmhaDivider [orientation]="orientation" [length]="length" [color]="color" [inset]="inset" />
  `,
})
class DividerHost {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  length: string | null = null;
  color: string | null = null;
  inset = false;
}

describe('HmhaDivider', () => {
  function create(state: Partial<DividerHost> = {}) {
    const fixture = TestBed.createComponent(DividerHost);
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return { fixture, divider: fixture.nativeElement.querySelector('[hmhaDivider]') as HTMLElement };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('creates as a real <hr>, horizontal by default', () => {
    const { divider } = create();
    expect(divider.tagName).toBe('HR');
    expect(divider.getAttribute('data-orientation')).toBe('horizontal');
    expect(divider.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('reflects an explicit vertical orientation', () => {
    const { divider } = create({ orientation: 'vertical' });
    expect(divider.getAttribute('data-orientation')).toBe('vertical');
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('has an implicit separator role from the native <hr> — no explicit role attribute needed', () => {
    const { divider } = create();
    expect(divider.getAttribute('role')).toBeNull();
    expect(divider.matches('hr')).toBe(true);
  });

  it('sets the length as width when horizontal', () => {
    const { divider } = create({ length: '50%' });
    expect(divider.style.width).toBe('50%');
    expect(divider.style.height).toBe('');
  });

  it('sets the length as height when vertical', () => {
    const { divider } = create({ orientation: 'vertical', length: '4rem' });
    expect(divider.style.height).toBe('4rem');
    expect(divider.style.width).toBe('');
  });

  it('forwards the color input into the --hmha-divider-color component token', () => {
    const { divider } = create({ color: 'red' });
    expect(divider.style.getPropertyValue('--hmha-divider-color')).toBe('red');
  });

  it('leaves --hmha-divider-color unset when no color is given, so the token default applies', () => {
    const { divider } = create();
    expect(divider.style.getPropertyValue('--hmha-divider-color')).toBe('');
  });

  it('reflects data-inset only when inset is true', () => {
    const { divider: notInset } = create();
    expect(notInset.getAttribute('data-inset')).toBeNull();

    const { divider: isInset } = create({ inset: true });
    expect(isInset.getAttribute('data-inset')).toBe('');
  });
});
