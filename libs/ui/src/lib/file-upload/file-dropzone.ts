import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { HmhaIcon } from '../icon/icon';
import { type HmhaFileRejection, hmhaCheckFiles } from './file-checks';
import { hmhaFormatBytes } from './format-bytes';

/** `null`/`undefined` stay `null` (no limit); anything else is a number. */
function optionalNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : numberAttribute(value, 0);
}

/**
 * The files in a drop, with any dropped folders split out. In Chromium and
 * WebKit a folder arrives in `dataTransfer.files` as a zero-byte entry
 * that can't be read, so it's identified through `webkitGetAsEntry()` (a
 * non-standard but universally shipped API) and set aside. Folders aren't
 * traversed: that's a later feature.
 */
function droppedFiles(dataTransfer: DataTransfer): { files: File[]; directories: File[] } {
  const items = Array.from(dataTransfer.items ?? []).filter((item) => item.kind === 'file');
  if (items.length === 0) return { files: Array.from(dataTransfer.files), directories: [] };
  const files: File[] = [];
  const directories: File[] = [];
  for (const item of items) {
    const file = item.getAsFile();
    if (!file) continue;
    (item.webkitGetAsEntry?.()?.isDirectory ? directories : files).push(file);
  }
  return { files, directories };
}

/** Whether a drag carries files (not text, links or images from the page). */
function carriesFiles(event: DragEvent): boolean {
  return !!event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files');
}

@Component({
  // A native <label> around a native file input: clicking anywhere in the
  // zone opens the picker with no script, the input is what keyboard and
  // assistive tech reach, and the zone's own text becomes its name. Drag
  // and drop is the shortcut on top; the picker is the primary path, since
  // a drag-only control fails WCAG's dragging alternative (fork 41).
  selector: 'label[hmhaFileDropzone]',
  exportAs: 'hmhaFileDropzone',
  imports: [HmhaIcon],
  template: `
    <input
      #input
      type="file"
      class="hmha-file-dropzone-input"
      [multiple]="multiple()"
      [accept]="accept() ?? ''"
      [disabled]="disabled()"
      (change)="onPicked()"
    />
    <ng-content>
      <hmha-icon name="cloud-upload" size="lg" />
      <span>Drop files here, or click to browse</span>
    </ng-content>
  `,
  styleUrl: './file-dropzone.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-dragging]': 'dragging() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
    // Paste, while the zone has focus: Ctrl/Cmd+V of copied files or a
    // screenshot. Deliberately not page-wide, which would hijack every
    // paste on the page, text fields included.
    '(paste)': 'onPaste($event)',
    // While a dropzone is on screen, a file dropped just outside it must
    // not make the browser open the file and leave the page (in Electron,
    // replacing the whole app window). Only file drags are touched, only
    // when nothing else already handled them, and propagation is never
    // stopped. Angular removes these with the component, so the guard
    // lives exactly as long as at least one dropzone is mounted: several
    // on screen each listen, and the first to act marks the event handled,
    // so the rest see `defaultPrevented` and step aside.
    '(window:dragover)': 'guardOutside($event)',
    '(window:drop)': 'guardOutside($event)',
  },
})
export class HmhaFileDropzone {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  /** The same syntax as `<input accept>`. Also enforced on drops, which bypass the native filter. */
  readonly accept = input<string | null>(null);
  readonly multiple = input(true, { transform: booleanAttribute });
  /** Largest file accepted, in bytes. */
  readonly maxSize = input<number | null, unknown>(null, { transform: optionalNumber });
  /**
   * How many files one add may contain. The component doesn't own the
   * upload list, so for an overall cap bind the remaining room:
   * `[maxFiles]="limit - uploads().length"`.
   */
  readonly maxFiles = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Files that passed the checks. Start uploading them. */
  readonly filesAdded = output<File[]>();
  /** Files turned away, each with its reason. */
  readonly filesRejected = output<HmhaFileRejection[]>();

  protected readonly dragging = signal(false);
  /** dragenter/dragleave fire for every child crossed; count them so the highlight doesn't flicker. */
  private dragDepth = 0;

  /** Open the file picker, for a "Browse" button somewhere else on the page. */
  open(): void {
    if (!this.disabled()) this.inputRef().nativeElement.click();
  }

  protected onPicked(): void {
    const input = this.inputRef().nativeElement;
    const files = Array.from(input.files ?? []);
    // Cleared so picking the same file again still fires `change`.
    input.value = '';
    this.add(files);
  }

  protected onDragEnter(event: DragEvent): void {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    this.dragDepth++;
    if (!this.disabled()) this.dragging.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = this.disabled() ? 'none' : 'copy';
  }

  protected onDragLeave(event: DragEvent): void {
    if (!carriesFiles(event)) return;
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging.set(false);
    if (this.disabled()) return;
    const { files, directories } = droppedFiles(event.dataTransfer!);
    this.add(files, directories.map((file) => ({ file, reason: 'directory' as const })));
  }

  protected onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData;
    if (!data) return;
    const items = Array.from(data.items ?? []).filter((item) => item.kind === 'file');
    const files = items.length
      ? items.map((item) => item.getAsFile()).filter((file): file is File => !!file)
      : Array.from(data.files ?? []);
    // A text paste is left alone.
    if (files.length === 0) return;
    event.preventDefault();
    this.add(files);
  }

  protected guardOutside(event: DragEvent): void {
    if (event.defaultPrevented || !carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'none';
  }

  private add(files: File[], alreadyRejected: HmhaFileRejection[] = []): void {
    if (this.disabled() || files.length + alreadyRejected.length === 0) return;
    const checked = hmhaCheckFiles(files, {
      accept: this.accept(),
      maxSize: this.maxSize(),
      maxFiles: this.multiple() ? this.maxFiles() : 1,
    });
    const accepted = checked.accepted;
    const rejected = [...alreadyRejected, ...checked.rejected];
    if (accepted.length) this.filesAdded.emit(accepted);
    if (rejected.length) this.filesRejected.emit(rejected);
    this.announce(accepted.length, rejected);
  }

  private announce(added: number, rejected: HmhaFileRejection[]): void {
    const parts: string[] = [];
    if (added) parts.push(`${added} ${added === 1 ? 'file' : 'files'} added.`);
    for (const { file, reason } of rejected) parts.push(`${file.name} not added: ${this.describe(reason)}.`);
    if (parts.length) void this.announcer.announce(parts.join(' '), 'polite');
  }

  private describe(reason: HmhaFileRejection['reason']): string {
    switch (reason) {
      case 'type':
        return "it isn't an accepted file type";
      case 'size':
        return `it's larger than ${hmhaFormatBytes(this.maxSize() ?? 0)}`;
      case 'count':
        return 'too many files at once';
      case 'directory':
        return "folders can't be uploaded, choose the files inside instead";
    }
  }
}
