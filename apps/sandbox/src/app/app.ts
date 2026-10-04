import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import {
  HmhaButton,
  HmhaCard,
  HmhaCheckbox,
  HmhaComboboxInput,
  HmhaComboboxListbox,
  HmhaComboboxOption,
  HmhaDialog,
  HmhaField,
  HmhaIcon,
  HmhaIconButton,
  HmhaInput,
  HmhaMenu,
  HmhaMenuItem,
  HmhaMenuTrigger,
  HmhaRadio,
  HmhaRadioGroup,
  HmhaSelectListbox,
  HmhaSelectOption,
  HmhaSelectTrigger,
  HmhaSwitch,
  HmhaTab,
  HmhaTabList,
  HmhaTabPanel,
  HmhaTabs,
  HmhaToast,
  HmhaTooltip,
} from '@halfmanhalfape/hmha-ui';

interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: FormControl<string>;
}

function createMember(id: string, name: string, email: string, role: string): TeamMember {
  return { id, name, email, role: new FormControl(role, { nonNullable: true }) };
}

@Component({
  selector: 'sandbox-root',
  imports: [
    HmhaButton,
    HmhaCard,
    HmhaCheckbox,
    HmhaComboboxInput,
    HmhaComboboxListbox,
    HmhaComboboxOption,
    HmhaDialog,
    HmhaField,
    HmhaIcon,
    HmhaIconButton,
    HmhaInput,
    HmhaMenu,
    HmhaMenuItem,
    HmhaMenuTrigger,
    HmhaRadio,
    HmhaRadioGroup,
    HmhaSelectListbox,
    HmhaSelectOption,
    HmhaSelectTrigger,
    HmhaSwitch,
    HmhaTab,
    HmhaTabList,
    HmhaTabPanel,
    HmhaTabs,
    HmhaTooltip,
    CdkListbox,
    CdkOption,
    ReactiveFormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(HmhaToast);

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

  // Wave 3 gate — "Team" screen. Every Wave 3 component, composed into one
  // real flow rather than shown in isolation: Tabs hold the screen
  // together, each member's role is an HmhaSelect, the kebab HmhaMenu's
  // "Remove" action opens an HmhaDialog, confirming it fires an
  // HmhaToast, an info HmhaTooltip explains what the roles mean, and the
  // Invite tab's HmhaCombobox searches teammates by name.
  protected readonly activeTab = signal('members');

  protected readonly members = signal<TeamMember[]>([
    createMember('1', 'Jordan Blake', 'jordan@example.com', 'Owner'),
    createMember('2', 'Sam Rivera', 'sam@example.com', 'Admin'),
    createMember('3', 'Priya Desai', 'priya@example.com', 'Member'),
  ]);

  protected readonly pendingRemoval = signal<TeamMember | null>(null);
  protected readonly deleteWorkspaceOpen = signal(false);

  protected readonly inviteName = new FormControl('', { nonNullable: true });
  protected readonly availablePeople = ['Dana Osei', 'Marcus Lee', 'Ingrid Novak'];

  protected requestRemoval(member: TeamMember): void {
    this.pendingRemoval.set(member);
  }

  protected onRemovalDialogOpenChange(open: boolean): void {
    if (!open) {
      this.pendingRemoval.set(null);
    }
  }

  protected confirmRemoval(): void {
    const member = this.pendingRemoval();
    if (!member) {
      return;
    }
    this.members.update((current) => current.filter((candidate) => candidate.id !== member.id));
    this.pendingRemoval.set(null);
    this.toast.show(`${member.name} removed from the team`);
  }

  protected sendInvite(): void {
    const name = this.inviteName.value.trim();
    if (!name) {
      return;
    }
    this.toast.show(`Invitation sent to ${name}`);
    this.inviteName.reset();
  }

  protected confirmDeleteWorkspace(): void {
    this.deleteWorkspaceOpen.set(false);
    this.toast.show('Workspace deleted');
  }
}
