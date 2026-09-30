import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shell heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Half Man Half Ape');
  });

  it('shows validation errors across Field/Input/RadioGroup/Checkbox after submitting an empty form', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const errors = Array.from(fixture.nativeElement.querySelectorAll('.hmha-field-error')).map(
      (el) => (el as HTMLElement).textContent,
    );
    expect(errors).toContain('Name is required.');
    expect(errors).toContain('Email is required.');
    expect(errors).toContain('Select a plan.');
    expect(errors).toContain('You must agree to continue.');
    expect(fixture.nativeElement.querySelector('.success')).toBeNull();
  });

  it('the Wave 2 gate: filling out every component and submitting validates end to end', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const name = el.querySelector('input[formcontrolname="name"]') as HTMLInputElement;
    name.value = 'Jane Doe';
    name.dispatchEvent(new Event('input'));

    const email = el.querySelector('input[formcontrolname="email"]') as HTMLInputElement;
    email.value = 'jane@example.com';
    email.dispatchEvent(new Event('input'));

    const plan = el.querySelector('input[value="medium"]') as HTMLInputElement;
    plan.checked = true;
    plan.dispatchEvent(new Event('change'));

    const terms = el.querySelector('input[hmhacheckbox]') as HTMLInputElement;
    terms.checked = true;
    terms.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const form = el.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(el.querySelector('.hmha-field-error')).toBeNull();
    expect(el.querySelector('.success')?.textContent).toContain('Account created');
  });
});
