import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

function overlay(selector: string): HTMLElement | null {
  return document.querySelector(`.cdk-overlay-pane ${selector}`);
}

function toastText(appRef: ApplicationRef): string | null {
  // HmhaToast's panel is a ComponentPortal attached with no
  // ViewContainerRef (fork 17) — rendered via ApplicationRef.attachView()
  // rather than a view fixture.detectChanges() owns, so its first render
  // needs this flush instead (same as toast.spec.ts).
  appRef.tick();
  return document.querySelector('[hmhaToastPanel]')?.textContent ?? null;
}

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
    expect(compiled.querySelector('h1')?.textContent).toContain('HMHA');
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

  describe('Wave 3 gate — Team screen', () => {
    let fixture: ComponentFixture<App>;
    let el: HTMLElement;
    let appRef: ApplicationRef;

    beforeEach(() => {
      fixture = TestBed.createComponent(App);
      appRef = TestBed.inject(ApplicationRef);
      fixture.detectChanges();
      el = fixture.nativeElement as HTMLElement;
    });

    it('defaults to the Members tab, with Invite and Danger zone hidden', () => {
      const panels = Array.from(el.querySelectorAll('[hmhaTabPanel]')) as HTMLElement[];
      expect(panels[0].hidden).toBe(false);
      expect(panels[1].hidden).toBe(true);
      expect(panels[2].hidden).toBe(true);
    });

    it('Tabs: clicking Invite switches panels', () => {
      const inviteTab = Array.from(el.querySelectorAll('[hmhaTab]')).find(
        (tab) => tab.textContent?.trim() === 'Invite',
      ) as HTMLButtonElement;
      inviteTab.click();
      fixture.detectChanges();

      const panels = Array.from(el.querySelectorAll('[hmhaTabPanel]')) as HTMLElement[];
      expect(panels[0].hidden).toBe(true);
      expect(panels[1].hidden).toBe(false);
    });

    it('Select: changing a member\'s role updates their FormControl and the trigger label', () => {
      const trigger = el.querySelector('.role-trigger') as HTMLButtonElement;
      expect(trigger.textContent).toContain('Owner');

      trigger.click();
      fixture.detectChanges();
      const adminOption = overlay('[cdkoption="Admin"]') as HTMLElement;
      adminOption.click();
      fixture.detectChanges();

      expect(trigger.textContent).toContain('Admin');
    });

    it('Menu → Dialog → Toast: removing a member via the kebab menu', () => {
      const startingCount = el.querySelectorAll('.member-row').length;
      const removedName = el.querySelector('.member-identity strong')?.textContent?.trim();
      const menuTrigger = el.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement;
      menuTrigger.click();
      fixture.detectChanges();

      const removeItem = overlay('[hmhaMenuItem]') as HTMLButtonElement;
      removeItem.click();
      fixture.detectChanges();

      const dialog = el.querySelector('dialog[aria-labelledby="remove-title"]') as HTMLDialogElement;
      expect(dialog.open).toBe(true);
      expect(dialog.textContent).toContain(removedName);

      const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Remove',
      ) as HTMLButtonElement;
      confirmButton.click();
      fixture.detectChanges();

      expect(dialog.open).toBe(false);
      expect(el.querySelectorAll('.member-row').length).toBe(startingCount - 1);
      expect(el.textContent).not.toContain(removedName);
      expect(toastText(appRef)).toContain(`${removedName} removed from the team`);
    });

    it('Dialog: cancelling a removal leaves the member in place', () => {
      const startingCount = el.querySelectorAll('.member-row').length;
      const menuTrigger = el.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement;
      menuTrigger.click();
      fixture.detectChanges();

      (overlay('[hmhaMenuItem]') as HTMLButtonElement).click();
      fixture.detectChanges();

      const dialog = el.querySelector('dialog[aria-labelledby="remove-title"]') as HTMLDialogElement;
      const cancelButton = Array.from(dialog.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Cancel',
      ) as HTMLButtonElement;
      cancelButton.click();
      fixture.detectChanges();

      expect(dialog.open).toBe(false);
      expect(el.querySelectorAll('.member-row').length).toBe(startingCount);
    });

    it('Combobox → Toast: sending an invite', () => {
      const inviteTab = Array.from(el.querySelectorAll('[hmhaTab]')).find(
        (tab) => tab.textContent?.trim() === 'Invite',
      ) as HTMLButtonElement;
      inviteTab.click();
      fixture.detectChanges();

      const comboInput = el.querySelector('input[role="combobox"]') as HTMLInputElement;
      comboInput.value = 'Dana Osei';
      comboInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const sendButton = Array.from(el.querySelectorAll('button')).find(
        (button) => button.textContent?.trim().includes('Send invite'),
      ) as HTMLButtonElement;
      expect(sendButton.disabled).toBe(false);
      sendButton.click();
      fixture.detectChanges();

      expect(toastText(appRef)).toContain('Invitation sent to Dana Osei');
      expect(comboInput.value).toBe('');
    });

    it('Dialog → Toast: deleting the workspace from the Danger zone tab', () => {
      const dangerTab = Array.from(el.querySelectorAll('[hmhaTab]')).find(
        (tab) => tab.textContent?.trim() === 'Danger zone',
      ) as HTMLButtonElement;
      dangerTab.click();
      fixture.detectChanges();

      const deleteButton = Array.from(el.querySelectorAll('button')).find(
        (button) => button.textContent?.trim().includes('Delete workspace'),
      ) as HTMLButtonElement;
      deleteButton.click();
      fixture.detectChanges();

      const dialog = el.querySelector('dialog[aria-labelledby="delete-workspace-title"]') as HTMLDialogElement;
      expect(dialog.open).toBe(true);

      const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Delete',
      ) as HTMLButtonElement;
      confirmButton.click();
      fixture.detectChanges();

      expect(dialog.open).toBe(false);
      expect(toastText(appRef)).toContain('Workspace deleted');
    });
  });
});
