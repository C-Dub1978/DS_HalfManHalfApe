import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as axe from 'axe-core';
import { MediaLibrary } from './media-library';

/**
 * The Wave 6 gate: one screen composing every component the wave added
 * (Nav List with a group, Segmented Control, Skeleton, Spinner, Badge,
 * Avatar, Empty State, File Upload with Progress Bar, Alert, Slider,
 * pressed toggle buttons, a counted Textarea), driven the way a person
 * would, end to end.
 */
describe('Wave 6 gate — Media library', () => {
  let fixture: ComponentFixture<MediaLibrary>;
  let lib: MediaLibrary;
  let el: HTMLElement;
  let appRef: ApplicationRef;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const byText = <T extends HTMLElement>(selector: string, text: string | RegExp) =>
    Array.from(el.querySelectorAll<T>(selector)).find((n) =>
      typeof text === 'string' ? n.textContent?.trim() === text : text.test(n.textContent ?? ''),
    );
  const navLink = (text: string) => byText<HTMLAnchorElement>('a[hmhaNavItem]', new RegExp(`^\\s*${text}`))!;
  const button = (name: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.getAttribute('aria-label') === name || b.textContent?.trim() === name,
    )!;
  const dropFiles = async (files: File[]) => {
    const input = el.querySelector<HTMLInputElement>('[hmhaFileDropzone] input[type="file"]')!;
    const transfer = new DataTransfer();
    files.forEach((f) => transfer.items.add(f));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await settle();
  };
  const row = (name: string) => byText<HTMLLIElement>('li[hmhaUploadItem]', new RegExp(name))!;
  const stepTimes = async (n: number) => {
    for (let i = 0; i < n; i++) lib.step();
    await settle();
  };

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    await TestBed.configureTestingModule({
      imports: [MediaLibrary],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(MediaLibrary);
    fixture.componentRef.setInput('autoAdvance', false);
    fixture.componentRef.setInput('loadMs', 50);
    lib = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
    el = fixture.nativeElement;
    await settle();
  });

  afterEach(() => document.documentElement.removeAttribute('data-hmha-mode'));

  it('opens on Movies: the page marked in the nav, its section marked, titles with status badges', () => {
    expect(navLink('Movies').getAttribute('aria-current')).toBe('page');
    expect(navLink('Library').getAttribute('aria-current')).toBe('true');
    expect(el.querySelector('h3')?.textContent).toBe('Movies');
    expect(byText('[hmhaBadge]', 'New')).toBeTruthy();
    expect(byText('[hmhaBadge]', 'Processing')).toBeTruthy();
    const avatar = el.querySelector('[hmhaAvatar]')!;
    expect(avatar.getAttribute('role')).toBe('img');
    expect(avatar.getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(avatar.textContent?.trim()).toBe('AL');
  });

  it('Nav List group: closing Library hides Movies/Shows/Music; the link itself never toggles', async () => {
    const toggle = el.querySelector<HTMLButtonElement>('li[hmhaNavGroup] .hmha-nav-group-toggle')!;
    toggle.click();
    await settle();
    expect(lib.libraryOpen()).toBeFalse();
    expect(navLink('Movies').closest('ul')!.hidden).toBeTrue();
    toggle.click();
    await settle();
    expect(navLink('Movies').closest('ul')!.hidden).toBeFalse();
  });

  it('Segmented Control: switching to List changes the layout of the titles', async () => {
    const list = () => el.querySelector('ul.titles')!;
    expect(list().getAttribute('data-view')).toBe('grid');
    (el.querySelector('label[hmhaSegment][value="list"]') as HTMLElement).click();
    await settle();
    expect(lib.view()).toBe('list');
    expect(list().getAttribute('data-view')).toBe('list');
  });

  it('Refresh: a busy button with a spinner and skeleton rows, then the titles again', async () => {
    button('Refresh').click();
    await settle();
    expect(button('Refresh').getAttribute('aria-busy')).toBe('true');
    expect(button('Refresh').disabled).toBeTrue();
    expect(button('Refresh').querySelector('hmha-spinner')).toBeTruthy();
    const loadingList = el.querySelector('ul[aria-busy="true"]')!;
    expect(loadingList.querySelectorAll('[hmhaSkeleton]').length).toBe(6);

    await wait(80);
    await settle();
    expect(el.querySelector('ul[aria-busy="true"]')).toBeNull();
    expect(byText('.title span', /Big Buck Bunny/)).toBeTruthy();
  });

  it('Empty State: Music has nothing yet, and its action goes to Uploads', async () => {
    navLink('Music').click();
    await settle();
    const empty = el.querySelector('[hmhaEmptyState]')!;
    expect(empty.querySelector('h4')?.textContent).toBe('No music yet');
    (empty.querySelector('button') as HTMLButtonElement).click();
    await settle();
    expect(navLink('Uploads').getAttribute('aria-current')).toBe('page');
    expect(navLink('Library').hasAttribute('aria-current')).toBeFalse();
  });

  describe('Uploads', () => {
    beforeEach(async () => {
      navLink('Uploads').click();
      await settle();
    });

    it('turns a non-media file away with a warning Alert, and starts the rest', async () => {
      await dropFiles([
        new File(['x'], 'trailer.mp4', { type: 'video/mp4' }),
        new File(['x'], 'notes.txt', { type: 'text/plain' }),
      ]);
      const warning = el.querySelector('[hmhaAlert][data-tone="warning"]')!;
      expect(warning.textContent).toContain('1 file was not added');
      expect(warning.textContent).toContain('notes.txt: not a video or audio file');
      expect(row('trailer.mp4')).toBeTruthy();
      expect(row('notes.txt')).toBeUndefined();
    });

    it('shows each file’s whole journey, counted in the nav badge until it’s ready', async () => {
      await dropFiles([new File(['x'.repeat(2048)], 'trailer.mp4', { type: 'video/mp4' })]);
      const badge = () => navLink('Uploads').querySelector('[hmhaBadge]');
      expect(badge()?.textContent?.trim()).toBe('1 in progress');
      expect(row('trailer.mp4').textContent).toContain('Queued');

      await stepTimes(2); // started, then 25%
      expect(row('trailer.mp4').textContent).toContain('Uploading');
      expect(row('trailer.mp4').querySelector<HTMLProgressElement>('progress')!.value).toBe(25);

      await stepTimes(3); // 50, 75, 100 → processing
      expect(row('trailer.mp4').textContent).toContain('Transcoding');
      expect(row('trailer.mp4').querySelector<HTMLProgressElement>('progress')!.hasAttribute('value')).toBeFalse();

      await stepTimes(2);
      expect(row('trailer.mp4').textContent).toContain('Ready');
      expect(badge()).toBeNull();
    });

    it('a failed upload raises a danger Alert; Retry failed recovers it, and the Alert goes', async () => {
      await dropFiles([
        new File(['x'], 'corrupt-take.mkv', { type: '' }),
        new File(['x'], 'trailer.mp4', { type: 'video/mp4' }),
      ]);
      await stepTimes(3); // start, 25, 50 → the corrupt file fails
      expect(row('corrupt-take.mkv').textContent).toContain('Failed');
      expect(row('corrupt-take.mkv').textContent).toContain('The connection dropped.');
      const danger = byText<HTMLElement>('[hmhaAlert]', /1 upload failed/)!;
      expect(danger.getAttribute('data-tone')).toBe('danger');
      expect(row('trailer.mp4').textContent).toContain('Uploading');

      (danger.querySelector('button') as HTMLButtonElement).click();
      await settle();
      expect(byText('[hmhaAlert]', /upload failed/)).toBeUndefined();
      await stepTimes(8);
      expect(row('corrupt-take.mkv').textContent).toContain('Ready');
    });
  });

  describe('Player', () => {
    it('Play swaps its label to Pause (an action, not a toggle); Shuffle and Mute are pressed toggles', async () => {
      button('Play').click();
      await settle();
      expect(button('Pause')).toBeTruthy();
      expect(button('Pause').hasAttribute('aria-pressed')).toBeFalse();

      expect(button('Mute').getAttribute('aria-pressed')).toBe('false');
      button('Mute').click();
      await settle();
      expect(button('Mute').getAttribute('aria-pressed')).toBe('true');
      expect(el.querySelector<HTMLInputElement>('input[aria-label="Volume"]')!.disabled).toBeTrue();
    });

    it('the Seek slider writes the position and speaks it as time', async () => {
      const seek = el.querySelector<HTMLInputElement>('input[aria-label="Seek"]')!;
      seek.value = '83';
      seek.dispatchEvent(new Event('input'));
      await settle();
      expect(lib.position()).toBe(83);
      expect(seek.getAttribute('aria-valuetext')).toBe('1:23 of 9:56');
    });
  });

  describe('Edit details', () => {
    it('counts the description, and saves the quality picked in the Segmented Control', async () => {
      const description = el.querySelector<HTMLTextAreaElement>('textarea[hmhaInput]')!;
      const counter = () => description.closest('hmha-field')!.querySelector('.hmha-field-counter')!.textContent?.trim();
      expect(counter()).toBe(`You have ${120 - description.value.length} characters remaining`);

      (el.querySelector('form label[hmhaSegment][value="4k"]') as HTMLElement).click();
      await settle();
      expect(lib.details.controls.quality.value).toBe('4k');

      button('Save').click();
      await settle();
      appRef.tick();
      expect(document.querySelector('[hmhaToastPanel]')?.textContent).toContain('Saved “Big Buck Bunny” at 4k');
    });

    it('shows a required error instead of saving with no title', async () => {
      lib.details.controls.title.setValue('');
      button('Save').click();
      await settle();
      expect(byText('hmha-field', /Give the title a name\./)).toBeTruthy();
    });
  });

  it('is axe-clean in both modes: library, empty state, and uploads mid-journey with a failure', async () => {
    const check = async (where: string) => {
      for (const mode of ['light', 'dark'] as const) {
        document.documentElement.setAttribute('data-hmha-mode', mode);
        await settle();
        await wait(150); // background transitions after a mode switch
        const results = await axe.run(el, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${where}, ${mode}`).toEqual([]);
      }
    };
    await check('movies');
    navLink('Music').click();
    await check('music, empty');
    navLink('Uploads').click();
    await settle();
    await dropFiles([new File(['x'], 'corrupt.mkv', { type: '' }), new File(['x'], 'trailer.mp4', { type: 'video/mp4' })]);
    await stepTimes(3);
    await check('uploads');
  });
});
