import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import * as axe from 'axe-core';
import type { HmhaFileRejection } from './file-checks';
import { HmhaFileDropzone } from './file-dropzone';

/*
 * What this file can and can't verify (CLAUDE.md, "know which layer"): a
 * real drag of files from the desktop, and the OS file picker, are outside
 * the page, so Karma can't produce them. It can build a real DataTransfer
 * holding real File objects and dispatch the same drag events and `change`
 * the browser would, which exercises every handler here. A genuine desktop
 * drag is checked with Playwright alongside the stories.
 */

@Component({
  selector: 'dropzone-host',
  imports: [HmhaFileDropzone],
  template: `
    <label
      hmhaFileDropzone
      [accept]="accept()"
      [maxSize]="maxSize()"
      [maxFiles]="maxFiles()"
      [multiple]="multiple()"
      [disabled]="disabled()"
      (filesAdded)="added.push($event)"
      (filesRejected)="rejected.push($event)"
    ></label>
  `,
})
class DropzoneHost {
  readonly zone = viewChild.required(HmhaFileDropzone);
  readonly accept = signal<string | null>(null);
  readonly maxSize = signal<number | null>(null);
  readonly maxFiles = signal<number | null>(null);
  readonly multiple = signal(true);
  readonly disabled = signal(false);
  readonly added: File[][] = [];
  readonly rejected: HmhaFileRejection[][] = [];
}


@Component({
  selector: 'two-dropzones-host',
  imports: [HmhaFileDropzone],
  template: `
    @if (showA()) {
      <label hmhaFileDropzone>A</label>
    }
    @if (showB()) {
      <label hmhaFileDropzone>B</label>
    }
  `,
})
class TwoDropzonesHost {
  readonly showA = signal(true);
  readonly showB = signal(true);
}

function file(name: string, type = '', size = 10): File {
  return new File([new Uint8Array(size)], name, { type });
}

function transfer(...files: File[]): DataTransfer {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  return dt;
}

function drag(target: EventTarget, type: string, dataTransfer: DataTransfer): DragEvent {
  const event = new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('HmhaFileDropzone', () => {
  let fixture: ComponentFixture<DropzoneHost>;
  let host: DropzoneHost;
  let zone: HTMLLabelElement;
  let input: HTMLInputElement;
  let announce: jasmine.Spy;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    document.body.style.color = 'var(--hmha-color-text)';

    await TestBed.configureTestingModule({
      imports: [DropzoneHost, TwoDropzonesHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
    fixture = TestBed.createComponent(DropzoneHost);
    host = fixture.componentInstance;
    zone = fixture.nativeElement.querySelector('label');
    input = zone.querySelector('input')!;
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('wraps a real, multiple file input, named by the zone’s default text', () => {
    expect(input.type).toBe('file');
    expect(input.multiple).toBe(true);
    expect(zone.textContent).toContain('Drop files here, or click to browse');
  });

  it('passes accept through to the native picker', async () => {
    host.accept.set('video/*,.mkv');
    await settle();
    expect(input.accept).toBe('video/*,.mkv');
  });

  it('emits picked files, then clears the input so the same file can be picked again', () => {
    // The browser hands over a fresh FileList on every pick, so each pick
    // here gets its own DataTransfer around the same File.
    const same = file('a.mp4', 'video/mp4');
    input.files = transfer(same).files;
    expect(input.value).withContext('the browser sets a value once files are chosen').not.toBe('');
    input.dispatchEvent(new Event('change'));
    expect(input.value).toBe('');

    // Choosing the identical file again: with the value cleared, the
    // browser sees a change and fires the event.
    input.files = transfer(same).files;
    input.dispatchEvent(new Event('change'));
    expect(host.added.map((batch) => batch.map((f) => f.name))).toEqual([['a.mp4'], ['a.mp4']]);
  });

  it('passes every file through untouched when accept, maxSize and maxFiles are unset', () => {
    const odd = [file('setup.exe'), file('no-extension'), file('empty.bin', '', 0), file('Movie.MKV')];
    drag(zone, 'drop', transfer(...odd));
    expect(host.added[0]).toEqual(odd);
    expect(host.rejected).toEqual([]);
  });

  it('rejects a dropped folder with the directory reason, passing its sibling files on', () => {
    const dt = transfer(file('a.mp4'), file('Season 1'));
    // A constructed DataTransfer can't hold a real directory, so the two
    // items stand in for what a browser reports for a file and a folder.
    const [a, folder] = Array.from(dt.files);
    Object.defineProperty(dt, 'items', {
      value: [
        { kind: 'file', getAsFile: () => a, webkitGetAsEntry: () => ({ isDirectory: false }) },
        { kind: 'file', getAsFile: () => folder, webkitGetAsEntry: () => ({ isDirectory: true }) },
      ],
    });
    drag(zone, 'drop', dt);
    expect(host.added[0].map((f) => f.name)).toEqual(['a.mp4']);
    expect(host.rejected[0].map((r) => [r.file.name, r.reason])).toEqual([['Season 1', 'directory']]);
  });

  it('emits dropped files and claims the drop so the browser doesn’t open them', () => {
    const event = drag(zone, 'drop', transfer(file('a.mp4'), file('b.mp3')));
    expect(event.defaultPrevented).toBe(true);
    expect(host.added[0].map((f) => f.name)).toEqual(['a.mp4', 'b.mp3']);
  });

  it('checks drops too (they bypass the native accept filter), and reports rejections', async () => {
    host.accept.set('video/*');
    host.maxSize.set(100);
    await settle();
    drag(zone, 'drop', transfer(file('ok.mp4', 'video/mp4'), file('bad.exe'), file('big.mp4', 'video/mp4', 500)));
    expect(host.added[0].map((f) => f.name)).toEqual(['ok.mp4']);
    expect(host.rejected[0].map((r) => [r.file.name, r.reason])).toEqual([
      ['bad.exe', 'type'],
      ['big.mp4', 'size'],
    ]);
  });

  it('takes one file when multiple is off, rejecting the rest for count', async () => {
    host.multiple.set(false);
    await settle();
    drag(zone, 'drop', transfer(file('a.mp4'), file('b.mp4')));
    expect(host.added[0].map((f) => f.name)).toEqual(['a.mp4']);
    expect(host.rejected[0].map((r) => r.reason)).toEqual(['count']);
  });

  it('announces what was added and what was turned away, politely', async () => {
    host.accept.set('video/*');
    await settle();
    drag(zone, 'drop', transfer(file('a.mp4', 'video/mp4'), file('b.mp4', 'video/mp4'), file('x.exe')));
    expect(announce).toHaveBeenCalledOnceWith(
      "2 files added. x.exe not added: it isn't an accepted file type.",
      'polite',
    );
  });

  it('adds pasted files (copied files, a screenshot), checked like any other', async () => {
    host.accept.set('image/*');
    await settle();
    const event = new ClipboardEvent('paste', {
      clipboardData: transfer(file('image.png', 'image/png'), file('notes.txt', 'text/plain')),
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.added[0].map((f) => f.name)).toEqual(['image.png']);
    expect(host.rejected[0].map((r) => [r.file.name, r.reason])).toEqual([['notes.txt', 'type']]);
  });

  it('leaves a plain text paste alone', () => {
    const dt = new DataTransfer();
    dt.setData('text/plain', 'just some text');
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(host.added).toEqual([]);
  });

  it('highlights while files are dragged over, without flickering across children', async () => {
    const dt = transfer(file('a.mp4'));
    drag(zone, 'dragenter', dt);
    drag(zone, 'dragenter', dt); // crossing into a child element
    drag(zone, 'dragleave', dt); // leaving that child
    await settle();
    expect(zone.hasAttribute('data-dragging')).withContext('still over the zone').toBe(true);

    drag(zone, 'dragleave', dt);
    await settle();
    expect(zone.hasAttribute('data-dragging')).toBe(false);
  });

  it('ignores drags that carry no files (text, links)', async () => {
    const dt = new DataTransfer();
    dt.setData('text/plain', 'hello');
    const event = drag(zone, 'dragenter', dt);
    await settle();
    expect(zone.hasAttribute('data-dragging')).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('stops a file dropped outside the zone from opening and leaving the page', () => {
    const outside = drag(document.body, 'drop', transfer(file('a.mp4')));
    expect(outside.defaultPrevented).toBe(true);
    expect(host.added).toEqual([]);
  });

  it('leaves a non-file drag elsewhere on the page completely alone', () => {
    const dt = new DataTransfer();
    dt.setData('text/plain', 'a link or some text');
    expect(drag(document.body, 'dragover', dt).defaultPrevented).toBe(false);
    expect(drag(document.body, 'drop', dt).defaultPrevented).toBe(false);
  });

  it('never stops propagation: a later window listener still sees the drop', () => {
    const seen = jasmine.createSpy('later window listener');
    window.addEventListener('drop', seen);
    drag(document.body, 'drop', transfer(file('a.mp4')));
    window.removeEventListener('drop', seen);
    expect(seen).toHaveBeenCalled();
  });

  it('removes the window guard once its dropzone is destroyed', () => {
    fixture.destroy();
    expect(drag(document.body, 'drop', transfer(file('a.mp4'))).defaultPrevented).toBe(false);
  });

  it('keeps the guard while any dropzone remains, and drops it with the last', async () => {
    fixture.destroy(); // only the two-zone host's dropzones from here on
    const two = TestBed.createComponent(TwoDropzonesHost);
    two.detectChanges();
    await two.whenStable();
    const outsideDrop = () => drag(document.body, 'drop', transfer(file('a.mp4'))).defaultPrevented;

    expect(outsideDrop()).withContext('two on screen').toBe(true);
    two.componentInstance.showA.set(false);
    two.detectChanges();
    await two.whenStable();
    expect(outsideDrop()).withContext('one left').toBe(true);
    two.componentInstance.showB.set(false);
    two.detectChanges();
    await two.whenStable();
    expect(outsideDrop()).withContext('none left').toBe(false);
  });

  it('takes no part in a drag while disabled: no highlight, and a "none" drop effect', async () => {
    host.disabled.set(true);
    await settle();
    const dt = transfer(file('a.mp4'));
    drag(zone, 'dragenter', dt);
    drag(zone, 'dragover', dt);
    await settle();
    expect(zone.hasAttribute('data-dragging')).toBe(false);
    expect(dt.dropEffect).toBe('none');
  });

  it('announces every add, even one identical to the last', () => {
    // LiveAnnouncer clears the live region before each message, so a repeat
    // is spoken again; the dropzone must not de-duplicate on its own.
    drag(zone, 'drop', transfer(file('a.mp4')));
    drag(zone, 'drop', transfer(file('a.mp4')));
    expect(announce.calls.allArgs()).toEqual([
      ['1 file added.', 'polite'],
      ['1 file added.', 'polite'],
    ]);
  });

  it('ignores drops and disables the picker while disabled', async () => {
    host.disabled.set(true);
    await settle();
    drag(zone, 'drop', transfer(file('a.mp4')));
    expect(host.added).toEqual([]);
    expect(input.disabled).toBe(true);
    expect(zone.hasAttribute('data-disabled')).toBe(true);
  });

  it('opens the picker from code, for a "Browse" button elsewhere', () => {
    const click = spyOn(input, 'click');
    host.zone().open();
    expect(click).toHaveBeenCalled();
  });

  it('is axe-clean at rest, while dragging and disabled, both modes', async () => {
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const state of ['rest', 'dragging', 'disabled'] as const) {
        host.disabled.set(state === 'disabled');
        await settle();
        if (state === 'dragging') drag(zone, 'dragenter', transfer(file('a.mp4')));
        await settle();
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} ${state}`).toEqual([]);
        drag(zone, 'drop', transfer(file('reset.mp4')));
      }
    }
  });
});
