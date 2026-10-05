import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

function items(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('.cdk-overlay-pane [hmhaMenuItem]'));
}

@Component({
  selector: 'menu-item-host',
  imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem],
  template: `
    <button [hmhaMenuTrigger]="menuTpl">Actions</button>
    <ng-template #menuTpl>
      <div hmhaMenu>
        <button hmhaMenuItem (click)="onSelect('rename')">Rename</button>
        <button hmhaMenuItem disabled (click)="onSelect('archived')">Archived</button>
        <button hmhaMenuItem (click)="onSelect('delete')">Delete</button>
      </div>
    </ng-template>
  `,
})
class MenuItemHost {
  selected: string | null = null;
  onSelect(action: string): void {
    this.selected = action;
  }
}

describe('HmhaMenuItem', () => {
  let fixture: ComponentFixture<MenuItemHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuItemHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  });

  it('creates as a real type="button" with role="menuitem"', () => {
    const [first] = items();
    expect(first.tagName).toBe('BUTTON');
    expect(first.type).toBe('button');
    expect(first.getAttribute('role')).toBe('menuitem');
  });

  it('reflects the disabled input as a real disabled attribute', () => {
    const [, archived] = items();
    expect(archived.disabled).toBe(true);
  });

  it('a disabled item is skipped by the roving tabindex (never gets tabindex=0)', () => {
    const [, archived] = items();
    expect(archived.tabIndex).toBe(-1);
  });

  it("invokes the consumer's own click handler", () => {
    const [first] = items();
    first.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBe('rename');
  });

  it('clicking a disabled item fires neither the consumer handler nor closes the menu', () => {
    const [, archived] = items();
    archived.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBeNull();
    expect(document.querySelector('.cdk-overlay-pane [hmhaMenu]')).toBeTruthy();
  });

  it('clicking an enabled item closes the menu after invoking the handler', () => {
    const [first] = items();
    first.click();
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-pane [hmhaMenu]')).toBeNull();
  });
});
