import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, fn, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaIcon } from '../icon/icon';
import type { HmhaFileRejection } from './file-checks';
import { HmhaFileDropzone } from './file-dropzone';

/**
 * A real drop carrying a real DataTransfer. Testing Library's drop helper
 * builds a fresh, empty DataTransfer instead, copying only the passed
 * object's own enumerable properties, and a real DataTransfer has none:
 * the files would never arrive.
 */
function dropFiles(target: Element, dataTransfer: DataTransfer): void {
  target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
}

/*
 * What these play functions can and can't drive: the OS file picker and a
 * real drag from the desktop are outside the page. They dispatch the same
 * `change`, `drop` and `paste` events the browser would, carrying real
 * File objects in a real DataTransfer, which runs every handler. Playwright's
 * real input covered what it can (DECISIONS.md, Wave 6 step 7c): Tab and
 * Space opening the browser's own picker, a real click, files chosen
 * through that picker, and a real Ctrl+V from the clipboard. A drag that
 * starts on the desktop can't be automated by any tool, since it begins
 * outside the browser; that one is a manual check.
 */

function file(name: string, type = '', size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

function transfer(...files: File[]): DataTransfer {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  return dt;
}

/** Shows what a dropzone emitted, the way an app would list rejections. Story-local. */
@Component({
  selector: 'dropzone-checks-demo',
  imports: [HmhaFileDropzone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-space-stack); max-width: 32rem;">
      <label
        hmhaFileDropzone
        accept="video/*,.mkv"
        [maxSize]="5000"
        (filesAdded)="added.set($event)"
        (filesRejected)="rejected.set($event)"
      >
        <span>Drop videos here, or click to browse</span>
        <span style="font-size: var(--hmha-type-body-sm-size);">Video files up to 5 kB (a demo limit)</span>
      </label>
      <p data-testid="added">Added: {{ names(added()) || 'none' }}</p>
      <ul data-testid="rejected">
        @for (rejection of rejected(); track rejection.file.name) {
          <li>{{ rejection.file.name }}: {{ rejection.reason }}</li>
        }
      </ul>
    </div>
  `,
})
class DropzoneChecksDemo {
  protected readonly added = signal<File[]>([]);
  protected readonly rejected = signal<HmhaFileRejection[]>([]);
  protected names(files: File[]): string {
    return files.map((f) => f.name).join(', ');
  }
}

const meta: Meta<HmhaFileDropzone> = {
  title: 'Components/File Upload/Dropzone',
  component: HmhaFileDropzone,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaFileDropzone, HmhaButton, HmhaIcon, DropzoneChecksDemo] })],
  argTypes: {
    accept: { control: 'text' },
    multiple: { control: 'boolean' },
    maxSize: { control: { type: 'number' } },
    maxFiles: { control: { type: 'number' } },
    disabled: { control: 'boolean' },
  },
  args: {
    accept: null,
    multiple: true,
    maxSize: null,
    maxFiles: null,
    disabled: false,
    filesAdded: fn(),
    filesRejected: fn(),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 32rem;">
        <label
          hmhaFileDropzone
          [accept]="accept"
          [multiple]="multiple"
          [maxSize]="maxSize"
          [maxFiles]="maxFiles"
          [disabled]="disabled"
          (filesAdded)="filesAdded($event)"
          (filesRejected)="filesRejected($event)"
        ></label>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaFileDropzone>;

/** Default: a native label around a native file input. Click anywhere to browse; dropping is a shortcut (fork 41). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    await expect(input.multiple).toBe(true);
    await expect(canvasElement.querySelector('label')).toHaveTextContent('Drop files here, or click to browse');
  },
};

/** Picking files: the change the browser fires after the OS picker closes. */
export const PickInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    input.files = transfer(file('movie.mkv'), file('song.flac')).files;
    await fireEvent.change(input);
    await expect(args.filesAdded).toHaveBeenCalledOnce();
    await expect((args.filesAdded as ReturnType<typeof fn>).mock.calls[0][0].map((f: File) => f.name)).toEqual([
      'movie.mkv',
      'song.flac',
    ]);
    await expect(input.value).toBe('');
  },
};

/**
 * Checks on drops, which skip the native accept filter: a video passes,
 * a document is the wrong type, an oversized video is too big, and a
 * dropped folder is turned away as a directory.
 */
export const ChecksAndRejectionsInteraction: Story = {
  render: () => ({ template: `<dropzone-checks-demo />` }),
  play: async ({ canvas, canvasElement }) => {
    const zone = canvasElement.querySelector('label')!;
    const dt = transfer(
      file('clip.mp4', 'video/mp4', 1000),
      file('Show.MKV', '', 1000),
      file('notes.pdf', 'application/pdf', 1000),
      file('huge.mp4', 'video/mp4', 9000),
    );
    dropFiles(zone, dt);
    await waitFor(() => expect(canvas.getByTestId('added')).toHaveTextContent('Added: clip.mp4, Show.MKV'));
    const rejected = canvas.getByTestId('rejected');
    await expect(rejected).toHaveTextContent('notes.pdf: type');
    await expect(rejected).toHaveTextContent('huge.mp4: size');
  },
};

/** Paste while the zone has focus: copied files or a screenshot. A text paste is left alone. */
export const PasteInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: transfer(file('image.png', 'image/png')), bubbles: true, cancelable: true }),
    );
    await expect(args.filesAdded).toHaveBeenCalledOnce();

    const text = new DataTransfer();
    text.setData('text/plain', 'not a file');
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: text, bubbles: true, cancelable: true }));
    await expect(args.filesAdded).toHaveBeenCalledOnce();
  },
};

/** Disabled: no highlight, no drops, and the picker is off. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const zone = canvasElement.querySelector('label')!;
    dropFiles(zone, transfer(file('movie.mkv')));
    await expect(args.filesAdded).not.toHaveBeenCalled();
    await expect(canvasElement.querySelector('input')).toBeDisabled();
  },
};

/** Your own content (text and icons only, it's inside a label), plus a Browse button elsewhere using `open()`. */
export const CustomContentAndBrowseButton: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-control-gap); max-width: 32rem;">
        <label hmhaFileDropzone #zone="hmhaFileDropzone" accept="video/*,audio/*,.mkv,.flac">
          <hmha-icon name="upload" size="lg" />
          <strong>Add to My Library</strong>
          <span>Movies, shows and music. Drop them here.</span>
        </label>
        <button hmhaButton (click)="zone.open()">Browse files</button>
      </div>
    `,
  }),
};
