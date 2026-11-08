import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import * as axe from 'axe-core';
import { HmhaUploadItem, type HmhaUploadStatus } from './upload-item';
import { HmhaUploadList } from './upload-list';

const STATUSES: HmhaUploadStatus[] = ['queued', 'uploading', 'paused', 'processing', 'ready', 'failed'];

@Component({
  selector: 'upload-item-host',
  imports: [HmhaUploadList, HmhaUploadItem],
  template: `
    <ul hmhaUploadList aria-label="Uploads">
      <li
        hmhaUploadItem
        [name]="name()"
        [size]="size()"
        [progress]="progress()"
        [status]="status()"
        [statusLabel]="statusLabel()"
        [error]="error()"
        [pausable]="pausable()"
        [preview]="preview()"
        (cancel)="events.push('cancel')"
        (retry)="events.push('retry')"
        (pause)="events.push('pause')"
        (resume)="events.push('resume')"
        (remove)="events.push('remove')"
      >
        <p data-testid="metadata">Title: Big Buck Bunny</p>
      </li>
    </ul>
  `,
})
class UploadItemHost {
  readonly name = signal('movie.mkv');
  readonly size = signal<number | null>(4_200_000_000);
  readonly progress = signal<number | null>(42);
  readonly status = signal<HmhaUploadStatus>('uploading');
  readonly statusLabel = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly pausable = signal(false);
  readonly preview = signal<Blob | string | null>(null);
  readonly events: string[] = [];
}

describe('HmhaUploadItem', () => {
  let fixture: ComponentFixture<UploadItemHost>;
  let host: UploadItemHost;
  let row: HTMLElement;
  let announce: jasmine.Spy;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  const buttonNames = () => Array.from(row.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'));
  const button = (name: string) =>
    Array.from(row.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === name)!;
  const bar = () => row.querySelector('progress') as HTMLProgressElement | null;
  const badge = () => row.querySelector('[hmhaBadge]') as HTMLElement;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    document.body.style.color = 'var(--hmha-color-text)';

    await TestBed.configureTestingModule({
      imports: [UploadItemHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
    fixture = TestBed.createComponent(UploadItemHost);
    host = fixture.componentInstance;
    row = fixture.nativeElement.querySelector('li');
    await settle();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
    document.body.style.color = '';
  });

  it('lives in a list that keeps its list semantics', () => {
    expect(fixture.nativeElement.querySelector('ul').getAttribute('role')).toBe('list');
  });

  it('shows the file name and its size', () => {
    expect(row.textContent).toContain('movie.mkv');
    expect(row.textContent).toContain('4.2 GB');
  });

  it('labels and colours the status badge for every step of the journey', async () => {
    const expected: Record<HmhaUploadStatus, [string, string]> = {
      queued: ['Queued', 'neutral'],
      uploading: ['Uploading', 'primary'],
      paused: ['Paused', 'neutral'],
      processing: ['Processing', 'primary'],
      ready: ['Ready', 'success'],
      failed: ['Failed', 'danger'],
    };
    for (const status of STATUSES) {
      host.status.set(status);
      await settle();
      expect([badge().textContent?.trim(), badge().getAttribute('data-tone')])
        .withContext(status)
        .toEqual(expected[status]);
      expect(row.getAttribute('data-status')).toBe(status);
    }
  });

  it('takes the consumer’s wording for the badge, such as "Transcoding"', async () => {
    host.status.set('processing');
    host.statusLabel.set('Transcoding');
    await settle();
    expect(badge().textContent?.trim()).toBe('Transcoding');
  });

  it('falls back to the default wording for an empty label (an interpolated null)', async () => {
    host.status.set('processing');
    host.statusLabel.set('');
    await settle();
    expect(badge().textContent?.trim()).toBe('Processing');
  });

  it('offers exactly the right actions for each status, each named with the file', async () => {
    const expected: Record<HmhaUploadStatus, { plain: string[]; pausable: string[] }> = {
      queued: { plain: ['Cancel upload of movie.mkv'], pausable: ['Cancel upload of movie.mkv'] },
      uploading: {
        plain: ['Cancel upload of movie.mkv'],
        pausable: ['Pause upload of movie.mkv', 'Cancel upload of movie.mkv'],
      },
      paused: {
        plain: ['Cancel upload of movie.mkv'],
        pausable: ['Resume upload of movie.mkv', 'Cancel upload of movie.mkv'],
      },
      processing: { plain: [], pausable: [] },
      ready: { plain: ['Remove movie.mkv'], pausable: ['Remove movie.mkv'] },
      failed: {
        plain: ['Retry upload of movie.mkv', 'Remove movie.mkv'],
        pausable: ['Retry upload of movie.mkv', 'Remove movie.mkv'],
      },
    };
    for (const status of STATUSES) {
      for (const pausable of [false, true]) {
        host.status.set(status);
        host.pausable.set(pausable);
        await settle();
        expect(buttonNames())
          .withContext(`${status}${pausable ? ' (pausable)' : ''}`)
          .toEqual(expected[status][pausable ? 'pausable' : 'plain']);
      }
    }
  });

  it('emits the matching output for every action', async () => {
    host.pausable.set(true);
    host.status.set('uploading');
    await settle();
    button('Pause upload of movie.mkv').click();
    button('Cancel upload of movie.mkv').click();
    host.status.set('paused');
    await settle();
    button('Resume upload of movie.mkv').click();
    host.status.set('failed');
    await settle();
    button('Retry upload of movie.mkv').click();
    button('Remove movie.mkv').click();
    expect(host.events).toEqual(['pause', 'cancel', 'resume', 'retry', 'remove']);
  });

  it('shows upload progress while uploading or paused, labelled with the file', async () => {
    for (const status of ['uploading', 'paused'] as const) {
      host.status.set(status);
      await settle();
      expect(bar()).withContext(status).toBeTruthy();
      expect(bar()!.getAttribute('value')).toBe('42');
      expect(bar()!.getAttribute('aria-label')).toBe('Upload progress for movie.mkv');
    }
  });

  it('shows the server’s work after the upload as indeterminate, whatever progress says', async () => {
    host.status.set('processing');
    host.statusLabel.set('Transcoding');
    host.progress.set(100);
    await settle();
    expect(bar()!.matches(':indeterminate')).toBe(true);
    expect(bar()!.getAttribute('aria-label')).toBe('Transcoding movie.mkv');
  });

  it('hides the bar when queued or ready', async () => {
    for (const status of ['queued', 'ready'] as const) {
      host.status.set(status);
      await settle();
      expect(bar()).withContext(status).toBeNull();
    }
  });

  it('shows a failed row’s progress in red, its error, and ties the error to Retry', async () => {
    host.status.set('failed');
    host.error.set('The connection was lost.');
    await settle();
    expect(bar()!.getAttribute('data-tone')).toBe('danger');
    const error = row.querySelector('.hmha-upload-item-error')!;
    expect(error.textContent).toBe('The connection was lost.');
    expect(button('Retry upload of movie.mkv').getAttribute('aria-describedby')).toBe(error.id);
  });

  it('shows the error only on a failed row', async () => {
    host.error.set('Stale message');
    host.status.set('uploading');
    await settle();
    expect(row.querySelector('.hmha-upload-item-error')).toBeNull();
  });

  it('shows the file icon when there is no preview', () => {
    expect(row.querySelector('.hmha-upload-item-thumb hmha-icon')).toBeTruthy();
    expect(row.querySelector('.hmha-upload-item-thumb img')).toBeNull();
  });

  it('previews an image File through an object URL, decorative beside the name', async () => {
    host.preview.set(new File([new Uint8Array(4)], 'poster.png', { type: 'image/png' }));
    await settle();
    const img = row.querySelector('.hmha-upload-item-thumb img') as HTMLImageElement;
    expect(img.src.startsWith('blob:')).toBe(true);
    expect(img.getAttribute('alt')).toBe('');
  });

  it('keeps the icon for a video or audio File', async () => {
    host.preview.set(new File([new Uint8Array(4)], 'movie.mkv', { type: 'video/x-matroska' }));
    await settle();
    expect(row.querySelector('.hmha-upload-item-thumb img')).toBeNull();
  });

  it('uses a URL string as it is, such as a poster the server generated', async () => {
    host.preview.set('https://media.example/posters/abc.jpg');
    await settle();
    expect((row.querySelector('.hmha-upload-item-thumb img') as HTMLImageElement).src).toBe(
      'https://media.example/posters/abc.jpg',
    );
  });

  it('revokes each object URL when the preview changes and when the row goes away', async () => {
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    host.preview.set(new File([new Uint8Array(4)], 'a.png', { type: 'image/png' }));
    await settle();
    const first = (row.querySelector('.hmha-upload-item-thumb img') as HTMLImageElement).src;

    host.preview.set(new File([new Uint8Array(4)], 'b.png', { type: 'image/png' }));
    await settle();
    expect(revoke).toHaveBeenCalledWith(first);
    const second = (row.querySelector('.hmha-upload-item-thumb img') as HTMLImageElement).src;

    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith(second);
  });

  it('falls back to the icon when a preview fails to load, and retries a new one', async () => {
    host.preview.set('https://media.example/expired.jpg');
    await settle();
    row.querySelector('.hmha-upload-item-thumb img')!.dispatchEvent(new Event('error'));
    await settle();
    expect(row.querySelector('.hmha-upload-item-thumb img')).toBeNull();

    host.preview.set('https://media.example/fresh.jpg');
    await settle();
    expect(row.querySelector('.hmha-upload-item-thumb img')).toBeTruthy();
  });

  it('projects the consumer’s metadata fields', () => {
    expect(row.querySelector('[data-testid="metadata"]')?.textContent).toBe('Title: Big Buck Bunny');
  });

  it('announces the upload finishing, the file being ready, and failure, but not every step', async () => {
    host.status.set('paused');
    await settle();
    host.status.set('uploading');
    await settle();
    expect(announce).not.toHaveBeenCalled();

    host.statusLabel.set('Transcoding');
    host.status.set('processing');
    await settle();
    host.statusLabel.set(null);
    host.status.set('ready');
    await settle();
    host.error.set('Unsupported codec.');
    host.status.set('failed');
    await settle();
    expect(announce.calls.allArgs()).toEqual([
      ['movie.mkv uploaded, transcoding.', 'polite'],
      ['movie.mkv is ready.', 'polite'],
      ['movie.mkv failed. Unsupported codec.', 'polite'],
    ]);
  });

  it('stays quiet when first rendered, even for a finished file', async () => {
    const quiet = TestBed.createComponent(UploadItemHost);
    quiet.componentInstance.status.set('ready');
    quiet.detectChanges();
    await quiet.whenStable();
    expect(announce).not.toHaveBeenCalled();
  });

  it('is axe-clean in every status, both modes', async () => {
    host.pausable.set(true);
    host.error.set('The connection was lost.');
    for (const mode of ['light', 'dark'] as const) {
      document.documentElement.setAttribute('data-hmha-mode', mode);
      for (const status of STATUSES) {
        host.status.set(status);
        await settle();
        const results = await axe.run(fixture.nativeElement, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode} ${status}`).toEqual([]);
      }
    }
  });
});
