import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaFileDropzone } from './file-dropzone';
import { HmhaUploadItem, type HmhaUploadStatus } from './upload-item';
import { HmhaUploadList } from './upload-list';

/**
 * A real drop carrying a real DataTransfer. Testing Library's drop helper
 * builds a fresh, empty DataTransfer instead, copying only the passed
 * object's own enumerable properties, and a real DataTransfer has none:
 * the files would never arrive.
 */
function dropFiles(target: Element, dataTransfer: DataTransfer): void {
  target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
}

/** A stand-in poster, inlined so no story touches the network. Image data, not styling. */
const POSTER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60">` +
      `<rect width="40" height="60" fill="#2f4a5c"/><circle cx="20" cy="24" r="9" fill="#f1c7a3"/>` +
      `</svg>`,
  );

interface Upload {
  id: number;
  name: string;
  size: number;
  progress: number | null;
  status: HmhaUploadStatus;
  error: string | null;
  attempts: number;
}

/**
 * A fake upload engine, standing in for Uppy or Stackfi's own code. It's
 * driven only through the components' public inputs and outputs: files in
 * from the dropzone, state out to the rows, actions back from the rows.
 * Uploads take about a second, then "transcode" briefly; any file named
 * with "fail" fails at 60% on its first attempt and succeeds on retry.
 * Story-local; nothing here is library API.
 */
@Component({
  selector: 'fake-upload-engine-demo',
  imports: [HmhaFileDropzone, HmhaUploadList, HmhaUploadItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-space-stack); max-width: 36rem;">
      <label hmhaFileDropzone accept="video/*,audio/*,.mkv,.flac" (filesAdded)="add($event)"></label>
      <ul hmhaUploadList aria-label="Uploads">
        @for (upload of uploads(); track upload.id) {
          <li
            hmhaUploadItem
            [name]="upload.name"
            [size]="upload.size"
            [progress]="upload.progress"
            [status]="upload.status"
            [statusLabel]="upload.status === 'processing' ? 'Transcoding' : null"
            [error]="upload.error"
            (cancel)="drop(upload.id)"
            (remove)="drop(upload.id)"
            (retry)="retry(upload.id)"
          ></li>
        }
      </ul>
    </div>
  `,
})
class FakeUploadEngineDemo {
  protected readonly uploads = signal<Upload[]>([]);
  private nextId = 1;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  add(files: File[]): void {
    for (const file of files) {
      const upload: Upload = {
        id: this.nextId++,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued',
        error: null,
        attempts: 0,
      };
      this.uploads.update((list) => [...list, upload]);
      this.later(150, () => this.start(upload.id));
    }
  }

  retry(id: number): void {
    this.patch(id, { status: 'queued', error: null, progress: 0 });
    this.later(150, () => this.start(id));
  }

  drop(id: number): void {
    this.uploads.update((list) => list.filter((u) => u.id !== id));
  }

  private start(id: number): void {
    const upload = this.find(id);
    if (!upload) return;
    this.patch(id, { status: 'uploading', progress: 0, attempts: upload.attempts + 1 });
    this.tick(id);
  }

  private tick(id: number): void {
    const upload = this.find(id);
    if (!upload || upload.status !== 'uploading') return;
    const progress = (upload.progress ?? 0) + 20;
    if (upload.name.includes('fail') && upload.attempts === 1 && progress >= 60) {
      this.patch(id, { status: 'failed', progress: 60, error: 'The connection was lost.' });
      return;
    }
    if (progress >= 100) {
      // The bytes are in; the server's work begins.
      this.patch(id, { status: 'processing', progress: 100 });
      this.later(500, () => this.patch(id, { status: 'ready' }));
      return;
    }
    this.patch(id, { progress });
    this.later(150, () => this.tick(id));
  }

  private find(id: number): Upload | undefined {
    return this.uploads().find((u) => u.id === id);
  }

  private patch(id: number, changes: Partial<Upload>): void {
    this.uploads.update((list) => list.map((u) => (u.id === id ? { ...u, ...changes } : u)));
  }

  private later(ms: number, fn: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }
}

const meta: Meta<HmhaUploadItem> = {
  title: 'Components/File Upload/Upload Item',
  component: HmhaUploadItem,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaUploadList, HmhaUploadItem, FakeUploadEngineDemo] })],
  argTypes: {
    status: { control: 'select', options: ['queued', 'uploading', 'paused', 'processing', 'ready', 'failed'] },
    progress: { control: { type: 'range', min: 0, max: 100 } },
    statusLabel: { control: 'text' },
    error: { control: 'text' },
    pausable: { control: 'boolean' },
  },
  args: {
    name: 'Big Buck Bunny (2008).mkv',
    size: 4_200_000_000,
    progress: 42,
    status: 'uploading',
    statusLabel: null,
    error: null,
    pausable: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <ul hmhaUploadList aria-label="Uploads" style="max-width: 36rem;">
        <li
          hmhaUploadItem
          [name]="name"
          [size]="size"
          [progress]="progress"
          [status]="status"
          [statusLabel]="statusLabel"
          [error]="error"
          [pausable]="pausable"
        ></li>
      </ul>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaUploadItem>;

/** One row: inputs only, outputs only, no knowledge of any upload library (fork 41). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('list', { name: 'Uploads' })).toBeInTheDocument();
    await expect(canvas.getByRole('progressbar', { name: 'Upload progress for Big Buck Bunny (2008).mkv' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Pause upload of Big Buck Bunny (2008).mkv' })).toBeInTheDocument();
  },
};

/**
 * The whole journey, one row per step: an upload isn't finished when the
 * bytes arrive. `processing` (here worded "Transcoding") always shows an
 * indeterminate bar.
 */
export const WholeJourney: Story = {
  render: () => ({
    props: { poster: POSTER },
    template: `
      <ul hmhaUploadList aria-label="Uploads" style="max-width: 36rem;">
        <li hmhaUploadItem name="Sintel.mkv" [size]="1_500_000_000" status="queued"></li>
        <li hmhaUploadItem name="Tears of Steel.mp4" [size]="740_000_000" [progress]="42" status="uploading" pausable></li>
        <li hmhaUploadItem name="Elephants Dream.mov" [size]="420_000_000" [progress]="70" status="paused" pausable></li>
        <li hmhaUploadItem name="Big Buck Bunny.mkv" [size]="4_200_000_000" status="processing" statusLabel="Transcoding"></li>
        <li hmhaUploadItem name="Cosmos Laundromat.mkv" [size]="2_100_000_000" status="ready" [preview]="poster"></li>
        <li
          hmhaUploadItem
          name="Spring.mp4"
          [size]="310_000_000"
          [progress]="60"
          status="failed"
          error="The connection was lost."
        ></li>
      </ul>
    `,
  }),
  play: async ({ canvas }) => {
    const transcoding = canvas.getByRole('progressbar', { name: 'Transcoding Big Buck Bunny.mkv' }) as HTMLProgressElement;
    await expect(transcoding.matches(':indeterminate')).toBe(true);
    await expect(canvas.getByRole('button', { name: 'Retry upload of Spring.mp4' })).toHaveAccessibleDescription(
      'The connection was lost.',
    );
  },
};

/** A long name wraps rather than being cut off, so the part that tells files apart stays visible. */
export const LongName: Story = {
  args: {
    name: 'My Vacation 2026 - Day 3 - Beach at sunset - final edit - export v3 (4K HDR).mkv',
    status: 'processing',
    statusLabel: 'Transcoding',
  },
};

/**
 * End to end with a fake engine: drop two files; both upload, one fails
 * at 60% and the other goes on through transcoding to ready; retry the
 * failure and it finishes too. The engine only touches the rows' inputs
 * and outputs, exactly as Uppy or Stackfi's own code would.
 */
export const FakeEngineJourneyInteraction: Story = {
  render: () => ({ template: `<fake-upload-engine-demo />` }),
  play: async ({ canvas, canvasElement }) => {
    const zone = canvasElement.querySelector('label')!;
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(2048)], 'Big Buck Bunny.mkv'));
    dt.items.add(new File([new Uint8Array(1024)], 'will-fail.mp4', { type: 'video/mp4' }));
    dropFiles(zone, dt);

    const row = (name: string) => canvas.getByText(name).closest('li')!;
    await waitFor(() => expect(row('will-fail.mp4')).toHaveAttribute('data-status', 'failed'), { timeout: 5000 });
    await expect(canvas.getByText('The connection was lost.')).toBeInTheDocument();
    await waitFor(() => expect(row('Big Buck Bunny.mkv')).toHaveAttribute('data-status', 'processing'), {
      timeout: 5000,
    });
    await waitFor(() => expect(row('Big Buck Bunny.mkv')).toHaveAttribute('data-status', 'ready'), { timeout: 5000 });

    await userEvent.click(canvas.getByRole('button', { name: 'Retry upload of will-fail.mp4' }));
    await waitFor(() => expect(row('will-fail.mp4')).toHaveAttribute('data-status', 'ready'), { timeout: 5000 });

    await userEvent.click(canvas.getByRole('button', { name: 'Remove will-fail.mp4' }));
    await waitFor(() => expect(canvas.queryByText('will-fail.mp4')).toBeNull());
  },
};
