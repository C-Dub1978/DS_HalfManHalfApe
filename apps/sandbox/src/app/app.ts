import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { SelectionModel } from '@angular/cdk/collections';
import {
  HmhaButton,
  HmhaCard,
  HmhaCheckbox,
  HmhaComboboxInput,
  HmhaComboboxListbox,
  HmhaComboboxOption,
  HmhaDataGrid,
  HmhaDataGridResizeHandle,
  HmhaDataGridSortButton,
  HmhaDialog,
  HmhaField,
  HmhaIcon,
  HmhaIconButton,
  HmhaInput,
  HmhaMenu,
  HmhaMenuItem,
  HmhaMenuTrigger,
  HmhaPagination,
  HmhaRadio,
  HmhaRadioGroup,
  HmhaSelectListbox,
  HmhaSelectOption,
  HmhaSelectTrigger,
  HmhaSwitch,
  HmhaTab,
  HmhaTabList,
  HmhaTabPanel,
  HmhaTable,
  HmhaTableCell,
  HmhaTableHeaderCell,
  HmhaTableRow,
  HmhaTabs,
  HmhaToast,
  HmhaTooltip,
  type HmhaSortDirection,
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

interface DirectoryPerson {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

function createPerson(id: string, name: string, email: string, role: string): DirectoryPerson {
  return { id, name, email, role };
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
    HmhaDataGrid,
    HmhaDataGridResizeHandle,
    HmhaDataGridSortButton,
    HmhaDialog,
    HmhaField,
    HmhaIcon,
    HmhaIconButton,
    HmhaInput,
    HmhaMenu,
    HmhaMenuItem,
    HmhaMenuTrigger,
    HmhaPagination,
    HmhaRadio,
    HmhaRadioGroup,
    HmhaSelectListbox,
    HmhaSelectOption,
    HmhaSelectTrigger,
    HmhaSwitch,
    HmhaTab,
    HmhaTabList,
    HmhaTabPanel,
    HmhaTable,
    HmhaTableCell,
    HmhaTableHeaderCell,
    HmhaTableRow,
    HmhaTabs,
    HmhaTooltip,
    CdkListbox,
    CdkOption,
    FormsModule,
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

  // Wave 4 gate — "Directory" screen. Pagination, Table and Data Grid
  // composed together: sorting and column resizing live entirely in the
  // Data Grid's own pieces, row selection reuses HmhaCheckbox feeding a
  // real bulk action, and Pagination slices the same array the grid
  // renders — the array, the sort state, the selected ids and the
  // current page all live here, in the app, not in any Hmha component
  // (fork 21).
  protected readonly directoryPage = signal(1);
  protected readonly directoryPageSize = 8;
  protected readonly directorySort = signal<HmhaSortDirection | null>(null);

  protected readonly directory = signal<DirectoryPerson[]>([
    createPerson('d1', 'Ada Lovelace', 'ada@example.com', 'Engineer'),
    createPerson('d2', 'Grace Hopper', 'grace@example.com', 'Admiral'),
    createPerson('d3', 'Alan Turing', 'alan@example.com', 'Engineer'),
    createPerson('d4', 'Katherine Johnson', 'katherine@example.com', 'Mathematician'),
    createPerson('d5', 'Margaret Hamilton', 'margaret@example.com', 'Engineer'),
    createPerson('d6', 'Hedy Lamarr', 'hedy@example.com', 'Inventor'),
    createPerson('d7', 'Radia Perlman', 'radia@example.com', 'Engineer'),
    createPerson('d8', 'Barbara Liskov', 'barbara@example.com', 'Engineer'),
    createPerson('d9', 'Frances Allen', 'frances@example.com', 'Researcher'),
    createPerson('d10', 'Dorothy Vaughan', 'dorothy@example.com', 'Mathematician'),
    createPerson('d11', 'Mary Jackson', 'mary@example.com', 'Engineer'),
    createPerson('d12', 'Annie Easley', 'annie@example.com', 'Mathematician'),
    createPerson('d13', 'Shafi Goldwasser', 'shafi@example.com', 'Researcher'),
    createPerson('d14', 'Edsger Dijkstra', 'edsger@example.com', 'Researcher'),
    createPerson('d15', 'Donald Knuth', 'donald@example.com', 'Researcher'),
    createPerson('d16', 'Tim Berners-Lee', 'tim@example.com', 'Engineer'),
    createPerson('d17', 'Vint Cerf', 'vint@example.com', 'Engineer'),
    createPerson('d18', 'Linus Torvalds', 'linus@example.com', 'Engineer'),
    createPerson('d19', 'Guido van Rossum', 'guido@example.com', 'Engineer'),
    createPerson('d20', 'Anita Borg', 'anita@example.com', 'Researcher'),
    createPerson('d21', 'Jean Bartik', 'jean@example.com', 'Engineer'),
    createPerson('d22', 'Kathleen Booth', 'kathleen@example.com', 'Researcher'),
    createPerson('d23', 'Joan Clarke', 'joan@example.com', 'Mathematician'),
  ]);

  protected readonly sortedDirectory = computed(() => {
    const direction = this.directorySort();
    if (!direction) {
      return this.directory();
    }
    return [...this.directory()].sort((a, b) =>
      direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  });

  protected readonly directoryPageCount = computed(() =>
    Math.max(1, Math.ceil(this.sortedDirectory().length / this.directoryPageSize)),
  );
  protected readonly clampedDirectoryPage = computed(() => Math.min(this.directoryPage(), this.directoryPageCount()));
  protected readonly visibleDirectory = computed(() => {
    const start = (this.clampedDirectoryPage() - 1) * this.directoryPageSize;
    return this.sortedDirectory().slice(start, start + this.directoryPageSize);
  });

  private readonly directorySelection = new SelectionModel<string>(true);
  protected readonly selectedDirectoryIds = signal<ReadonlySet<string>>(new Set());

  protected readonly allVisibleSelected = computed(
    () =>
      this.visibleDirectory().length > 0 &&
      this.visibleDirectory().every((person) => this.selectedDirectoryIds().has(person.id)),
  );
  protected readonly someVisibleSelected = computed(
    () => !this.allVisibleSelected() && this.visibleDirectory().some((person) => this.selectedDirectoryIds().has(person.id)),
  );

  constructor() {
    this.directorySelection.changed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.selectedDirectoryIds.set(new Set(this.directorySelection.selected));
    });
  }

  protected directorySortRequest(direction: HmhaSortDirection): void {
    this.directorySort.set(direction);
  }

  protected directorySortAria(): 'ascending' | 'descending' | 'none' {
    const direction = this.directorySort();
    if (!direction) {
      return 'none';
    }
    return direction === 'asc' ? 'ascending' : 'descending';
  }

  protected isDirectorySelected(id: string): boolean {
    return this.selectedDirectoryIds().has(id);
  }

  protected toggleDirectoryRow(id: string): void {
    this.directorySelection.toggle(id);
  }

  protected toggleAllVisibleDirectoryRows(): void {
    const ids = this.visibleDirectory().map((person) => person.id);
    if (this.allVisibleSelected()) {
      this.directorySelection.deselect(...ids);
    } else {
      this.directorySelection.select(...ids);
    }
  }

  protected removeSelectedDirectoryRows(): void {
    const ids = this.selectedDirectoryIds();
    const count = ids.size;
    if (count === 0) {
      return;
    }
    this.directory.update((rows) => rows.filter((row) => !ids.has(row.id)));
    this.directorySelection.clear();
    this.toast.show(`${count} ${count === 1 ? 'person' : 'people'} removed from the directory`);
  }
}
