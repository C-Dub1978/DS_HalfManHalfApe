import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { HmhaBadge } from '../badge/badge';
import { HmhaButton } from '../button/button';
import { HmhaIconButton } from '../button/icon-button';
import type { HmhaTone } from '../core/types';
import { HmhaIcon } from '../icon/icon';
import { HmhaProgressBar } from '../progress-bar/progress-bar';
import { hmhaFormatBytes } from './format-bytes';
import { hmhaLiveAnnouncer } from '../core/live-announcer';

/**
 * The whole journey of one file, not only its upload: after the bytes
 * arrive, the server may still be working (Stackfi transcodes), so
 * `processing` sits between `uploading` and `ready`.
 */
export type HmhaUploadStatus = 'queued' | 'uploading' | 'paused' | 'processing' | 'ready' | 'failed';

const STATUS: Record<HmhaUploadStatus, { label: string; tone: HmhaTone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  uploading: { label: 'Uploading', tone: 'primary' },
  paused: { label: 'Paused', tone: 'neutral' },
  processing: { label: 'Processing', tone: 'primary' },
  ready: { label: 'Ready', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

@Component({
  // A native list item, inside HmhaUploadList's <ul>, so assistive tech
  // hears "list, 3 items" and each file as one item.
  selector: 'li[hmhaUploadItem]',
  imports: [HmhaBadge, HmhaButton, HmhaIconButton, HmhaIcon, HmhaProgressBar],
  template: `
    <div class="hmha-upload-item-main">
      <span class="hmha-upload-item-thumb">
        @if (thumbnail()) {
          <!-- alt="": decorative, the file's name sits right beside it. -->
          <img [src]="thumbnail()" alt="" (error)="thumbnailFailed.set(true)" />
        } @else {
          <hmha-icon name="file" />
        }
      </span>
      <div class="hmha-upload-item-info">
        <span class="hmha-upload-item-name">{{ name() }}</span>
        <span class="hmha-upload-item-meta">
          @if (sizeText()) {
            <span>{{ sizeText() }}</span>
          }
          <span hmhaBadge [tone]="tone()">{{ label() }}</span>
        </span>
      </div>
      <div class="hmha-upload-item-actions">
        @if (canPauseResume()) {
          @if (status() === 'paused') {
            <button hmhaButton hmhaIconButton size="sm" [label]="'Resume upload of ' + name()" (click)="resume.emit()">
              <hmha-icon name="play" size="sm" />
            </button>
          } @else {
            <button hmhaButton hmhaIconButton size="sm" [label]="'Pause upload of ' + name()" (click)="pause.emit()">
              <hmha-icon name="pause" size="sm" />
            </button>
          }
        }
        @if (status() === 'failed') {
          <button
            hmhaButton
            hmhaIconButton
            size="sm"
            [label]="'Retry upload of ' + name()"
            [attr.aria-describedby]="error() ? errorId : null"
            (click)="retry.emit()"
          >
            <hmha-icon name="rotate-ccw" size="sm" />
          </button>
        }
        @if (canCancel()) {
          <button hmhaButton hmhaIconButton size="sm" [label]="'Cancel upload of ' + name()" (click)="cancel.emit()">
            <hmha-icon name="close" size="sm" />
          </button>
        }
        @if (canRemove()) {
          <button hmhaButton hmhaIconButton size="sm" [label]="'Remove ' + name()" (click)="remove.emit()">
            <hmha-icon name="trash-2" size="sm" />
          </button>
        }
      </div>
    </div>
    @if (showProgress()) {
      <progress
        hmhaProgressBar
        [attr.aria-label]="progressLabel()"
        [value]="barValue()"
        [tone]="status() === 'failed' ? 'danger' : 'primary'"
      ></progress>
    }
    @if (status() === 'failed' && error()) {
      <p class="hmha-upload-item-error" [id]="errorId">{{ error() }}</p>
    }
    <!-- The consumer's own metadata fields (title, description), if any. -->
    <ng-content />
  `,
  styleUrl: './upload-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-status]': 'status()',
  },
})
export class HmhaUploadItem {
  private readonly announcer = hmhaLiveAnnouncer();
  protected readonly errorId = inject(_IdGenerator).getId('hmha-upload-item-error-');

  readonly name = input.required<string>();
  /** Bytes. `null` hides the size. */
  readonly size = input<number | null>(null);
  /**
   * 0 to 100, or `null` for indeterminate. Shown while `uploading` and
   * `paused`, and on a `failed` row; `processing` is always indeterminate.
   */
  readonly progress = input<number | null>(null);
  readonly status = input<HmhaUploadStatus>('queued');
  /** Replace the status badge's default wording, such as "Transcoding" for `processing`. */
  readonly statusLabel = input<string | null>(null);
  /**
   * A thumbnail. A `File`/`Blob` previews only if it's an image (the row
   * makes an object URL and revokes it when this changes or the row goes
   * away); video and audio keep the file icon. A URL string is used as it
   * is, such as a poster the server generated after processing.
   */
  readonly preview = input<Blob | string | null>(null);
  /** Shown on a `failed` row. */
  readonly error = input<string | null>(null);
  /** Offer pause and resume while uploading. Only set it if your transport can actually pause. */
  readonly pausable = input(false, { transform: booleanAttribute });

  readonly cancel = output<void>();
  readonly retry = output<void>();
  readonly pause = output<void>();
  readonly resume = output<void>();
  readonly remove = output<void>();

  // `||`, not `??`: an interpolated `statusLabel="{{ … }}"` turns null into
  // '', which must still fall back to the default wording.
  private readonly objectUrl = signal<string | null>(null);
  /** Resets whenever the preview changes, so a new one gets a fresh attempt. */
  protected readonly thumbnailFailed = linkedSignal({ source: this.preview, computation: () => false });
  protected readonly thumbnail = computed(() => {
    if (this.thumbnailFailed()) return null;
    const preview = this.preview();
    return typeof preview === 'string' ? preview || null : this.objectUrl();
  });

  protected readonly label = computed(() => this.statusLabel() || STATUS[this.status()].label);
  protected readonly tone = computed(() => STATUS[this.status()].tone);
  protected readonly sizeText = computed(() => {
    const size = this.size();
    return size === null ? '' : hmhaFormatBytes(size);
  });

  protected readonly canCancel = computed(() => ['queued', 'uploading', 'paused'].includes(this.status()));
  protected readonly canPauseResume = computed(
    () => this.pausable() && (this.status() === 'uploading' || this.status() === 'paused'),
  );
  protected readonly canRemove = computed(() => this.status() === 'ready' || this.status() === 'failed');

  protected readonly showProgress = computed(() => {
    const status = this.status();
    if (status === 'processing') return true;
    if (status === 'failed') return this.progress() !== null;
    return status === 'uploading' || status === 'paused';
  });
  /** `processing` is always indeterminate: the server's work has no byte count. */
  protected readonly barValue = computed(() => (this.status() === 'processing' ? null : this.progress()));
  protected readonly progressLabel = computed(() =>
    this.status() === 'processing' ? `${this.label()} ${this.name()}` : `Upload progress for ${this.name()}`,
  );

  constructor() {
    // An image Blob becomes an object URL for as long as it's the preview.
    // The cleanup revokes it on the next change and on destroy, so a long
    // upload session doesn't keep every thumbnail's memory alive.
    effect((onCleanup) => {
      const preview = this.preview();
      if (preview instanceof Blob && preview.type.startsWith('image/')) {
        const url = URL.createObjectURL(preview);
        this.objectUrl.set(url);
        onCleanup(() => URL.revokeObjectURL(url));
      } else {
        this.objectUrl.set(null);
      }
    });

    // Announce the moments that matter, never every percent: the upload
    // finishing (processing), the file becoming ready, or failing. Only on
    // a change, so a list rendered with finished files stays quiet.
    let previous: HmhaUploadStatus | undefined;
    effect(() => {
      const status = this.status();
      const name = this.name();
      if (previous !== undefined && status !== previous) {
        const message =
          status === 'processing'
            ? `${name} uploaded, ${this.label().toLowerCase()}.`
            : status === 'ready'
              ? `${name} is ready.`
              : status === 'failed'
                ? // The error is the consumer's own sentence, punctuated
                  // however they wrote it, so it follows rather than being
                  // spliced in.
                  `${name} failed.${this.error() ? ` ${this.error()}` : ''}`
                : null;
        if (message) void this.announcer.announce(message, 'polite');
      }
      previous = status;
    });
  }
}
