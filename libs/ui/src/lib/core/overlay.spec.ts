import { Component, type ElementRef, TemplateRef, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { hmhaOverlay } from './overlay';

function dispatchOutsideClick(): void {
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

@Component({
  selector: 'overlay-connected-host',
  template: `
    <button #trigger type="button">Open</button>
    <ng-template #content><div class="overlay-content">Hello from overlay</div></ng-template>
  `,
})
class OverlayConnectedHost {
  readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  readonly overlay = hmhaOverlay({ position: 'connected' });
}

@Component({
  selector: 'overlay-no-dismiss-host',
  template: `
    <button #trigger type="button">Open</button>
    <ng-template #content><div class="overlay-content">Hello from overlay</div></ng-template>
  `,
})
class OverlayNoDismissHost {
  readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  readonly overlay = hmhaOverlay({ position: 'connected', dismissOnOutsideInteraction: false });
}

@Component({
  selector: 'overlay-modal-host',
  template: `<ng-template #content><div class="overlay-content">Modal content</div></ng-template>`,
})
class OverlayModalHost {
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  readonly overlay = hmhaOverlay({ position: 'global-center', hasBackdrop: true });
}

@Component({
  selector: 'overlay-corner-host',
  template: `<ng-template #content><div class="overlay-content">Toast content</div></ng-template>`,
})
class OverlayCornerHost {
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  readonly overlay = hmhaOverlay({ position: 'global-fixed-corner' });
}

describe('hmhaOverlay — connected position', () => {
  let fixture: ComponentFixture<OverlayConnectedHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayConnectedHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayConnectedHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.overlay.close();
  });

  it('starts closed', () => {
    expect(fixture.componentInstance.overlay.isOpen()).toBe(false);
  });

  it('requires an origin — "connected" position has nothing to anchor to without one', () => {
    const { overlay, content } = fixture.componentInstance;
    expect(() => overlay.open(null, content())).toThrow();
  });

  it('opens and attaches the content to the DOM', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    expect(overlay.isOpen()).toBe(true);
    expect(document.querySelector('.overlay-content')?.textContent).toContain('Hello from overlay');
  });

  it('close() detaches the content and sets isOpen false', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    overlay.close();
    expect(overlay.isOpen()).toBe(false);
    expect(document.querySelector('.overlay-content')).toBeNull();
  });

  it('closes on Escape', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    const pane = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    pane.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlay.isOpen()).toBe(false);
  });

  it('closes on an outside click, with no backdrop required', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    dispatchOutsideClick();
    expect(overlay.isOpen()).toBe(false);
  });

  it('re-opening disposes the previous overlay instead of leaking a second one', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    overlay.open(trigger().nativeElement, content());
    expect(document.querySelectorAll('.overlay-content').length).toBe(1);
  });

  // Nothing guarantees a host destroyed while its overlay is open got a
  // chance to call close() first — a hover-driven Tooltip removed from the
  // DOM mid-hover is a real example, not a hypothetical one. Without this,
  // the overlay's DOM node and its dismissal subscriptions leak forever.
  it('disposes the open overlay automatically when the host is destroyed', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());
    expect(document.querySelector('.overlay-content')).toBeTruthy();

    fixture.destroy();
    expect(document.querySelector('.overlay-content')).toBeNull();
  });
});

describe('hmhaOverlay — dismissOnOutsideInteraction: false', () => {
  let fixture: ComponentFixture<OverlayNoDismissHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayNoDismissHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayNoDismissHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.overlay.close();
  });

  it('Escape and outside clicks do not close it — only an explicit close() does', () => {
    const { overlay, trigger, content } = fixture.componentInstance;
    overlay.open(trigger().nativeElement, content());

    const pane = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    pane.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlay.isOpen()).toBe(true);

    dispatchOutsideClick();
    expect(overlay.isOpen()).toBe(true);

    overlay.close();
    expect(overlay.isOpen()).toBe(false);
  });
});

describe('hmhaOverlay — global-center with a backdrop (Dialog shape)', () => {
  let fixture: ComponentFixture<OverlayModalHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayModalHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayModalHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.overlay.close();
  });

  it('renders a backdrop and closes when it is clicked', () => {
    const { overlay, content } = fixture.componentInstance;
    overlay.open(null, content());
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    expect(overlay.isOpen()).toBe(false);
  });
});

describe('hmhaOverlay — global-fixed-corner (Toast shape)', () => {
  let fixture: ComponentFixture<OverlayCornerHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayCornerHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayCornerHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.componentInstance.overlay.close();
  });

  it('opens with no backdrop (a toast should never block the page)', () => {
    const { overlay, content } = fixture.componentInstance;
    overlay.open(null, content());
    expect(overlay.isOpen()).toBe(true);
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
  });
});
