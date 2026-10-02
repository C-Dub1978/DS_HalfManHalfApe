import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

function overlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane [hmhaMenu]');
}

@Component({
  selector: 'menu-trigger-host',
  imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem],
  template: `
    <button #trigger [hmhaMenuTrigger]="menuTpl">Actions</button>
    <ng-template #menuTpl>
      <div hmhaMenu>
        <button hmhaMenuItem>Edit</button>
        <button hmhaMenuItem>Delete</button>
      </div>
    </ng-template>
  `,
})
class MenuTriggerHost {
  readonly trigger = viewChild.required(HmhaMenuTrigger);
}

describe('HmhaMenuTrigger', () => {
  let fixture: ComponentFixture<MenuTriggerHost>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuTriggerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuTriggerHost);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    fixture.componentInstance.trigger().close();
  });

  it('creates as a real <button type="button"> advertising a menu popup', () => {
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('starts closed, with aria-expanded false and nothing in the overlay', () => {
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(overlayPanel()).toBeNull();
  });

  it('opens the menu and sets aria-expanded on click', () => {
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(overlayPanel()).toBeTruthy();
  });

  it('closes the menu on a second click (toggle)', () => {
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(overlayPanel()).toBeNull();
  });

  it('returns focus to the trigger when the menu closes', () => {
    button.click();
    fixture.detectChanges();
    fixture.componentInstance.trigger().close();
    fixture.detectChanges();
    expect(document.activeElement).toBe(button);
  });

  it('re-opening after a close disposes the previous overlay instead of leaking a second panel', () => {
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(document.querySelectorAll('.cdk-overlay-pane [hmhamenu]').length).toBe(1);
  });
});
