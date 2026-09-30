import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HmhaButton,
  HmhaCard,
  HmhaCheckbox,
  HmhaField,
  HmhaIcon,
  HmhaIconButton,
  HmhaInput,
  HmhaRadio,
  HmhaRadioGroup,
  HmhaSwitch,
} from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'sandbox-root',
  imports: [
    HmhaButton,
    HmhaCard,
    HmhaCheckbox,
    HmhaField,
    HmhaIcon,
    HmhaIconButton,
    HmhaInput,
    HmhaRadio,
    HmhaRadioGroup,
    HmhaSwitch,
    ReactiveFormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly fb = inject(FormBuilder);

  protected readonly submitted = signal(false);

  protected readonly signupForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    plan: ['', Validators.required],
    notifications: [true],
    terms: [false, Validators.requiredTrue],
  });

  protected get nameError(): string {
    const control = this.signupForm.controls.name;
    return control.touched && control.hasError('required') ? 'Name is required.' : '';
  }

  protected get emailError(): string {
    const control = this.signupForm.controls.email;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    return '';
  }

  protected get planError(): string {
    const control = this.signupForm.controls.plan;
    return control.touched && control.hasError('required') ? 'Select a plan.' : '';
  }

  protected get termsError(): string {
    const control = this.signupForm.controls.terms;
    return control.touched && control.hasError('required') ? 'You must agree to continue.' : '';
  }

  protected onSubmit(): void {
    this.signupForm.markAllAsTouched();
    this.submitted.set(this.signupForm.valid);
  }
}
