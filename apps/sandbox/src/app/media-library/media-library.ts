import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HmhaAlert,
  HmhaAlertTitle,
  HmhaAvatar,
  HmhaBadge,
  HmhaButton,
  HmhaEmptyState,
  HmhaEmptyStateTitle,
  HmhaField,
  HmhaFileDropzone,
  HmhaIcon,
  HmhaIconButton,
  HmhaInput,
  HmhaNavGroup,
  HmhaNavItem,
  HmhaNavList,
  HmhaSegment,
  HmhaSegmentedControl,
  HmhaSkeleton,
  HmhaSlider,
  HmhaSpinner,
  HmhaToast,
  HmhaUploadItem,
  HmhaUploadList,
  type HmhaFileRejection,
  type HmhaUploadStatus,
} from '@halfmanhalfape/hmha-ui';

export type LibrarySection = 'movies' | 'shows' | 'music' | 'uploads';

export interface Title {
  readonly id: string;
  readonly name: string;
  readonly year: number;
  readonly section: Exclude<LibrarySection, 'uploads'>;
  readonly status: 'new' | 'processing' | null;
}

export interface Upload {
  readonly id: number;
  readonly file: File;
  readonly status: HmhaUploadStatus;
  readonly progress: number | null;
  readonly error: string | null;
  readonly attempt: number;
}

const TITLES: readonly Title[] = [
  { id: 'bbb', name: 'Big Buck Bunny', year: 2008, section: 'movies', status: 'new' },
  { id: 'sintel', name: 'Sintel', year: 2010, section: 'movies', status: null },
  { id: 'tos', name: 'Tears of Steel', year: 2012, section: 'movies', status: 'processing' },
  { id: 'cosmos', name: 'Cosmos Laundromat', year: 2015, section: 'shows', status: null },
];

const SECTION_NAMES: Record<LibrarySection, string> = {
  movies: 'Movies',
  shows: 'Shows',
  music: 'Music',
  uploads: 'Uploads',
};

/** How far each fake upload moves per step, and how many steps "processing" lasts. */
const STEP_PERCENT = 25;
const PROCESSING_STEPS = 2;

function clock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The Wave 6 gate: a media library screen composing every component the
 * wave added. Every piece of state (the current section, the view, loading,
 * the uploads and their journey, the player, the edit form) lives here, in
 * the app; the components only show it and report intents (fork 21).
 *
 * Uploads run on a fake engine: nothing leaves the browser. With
 * `autoAdvance` on it steps on a timer, which only writes signals (zoneless
 * change detection picks those up; invariant 4). Tests turn it off and call
 * `step()` themselves.
 */
@Component({
  selector: 'sandbox-media-library',
  imports: [
    ReactiveFormsModule,
    HmhaAlert,
    HmhaAlertTitle,
    HmhaAvatar,
    HmhaBadge,
    HmhaButton,
    HmhaEmptyState,
    HmhaEmptyStateTitle,
    HmhaField,
    HmhaFileDropzone,
    HmhaIcon,
    HmhaIconButton,
    HmhaInput,
    HmhaNavGroup,
    HmhaNavItem,
    HmhaNavList,
    HmhaSegment,
    HmhaSegmentedControl,
    HmhaSkeleton,
    HmhaSlider,
    HmhaSpinner,
    HmhaUploadItem,
    HmhaUploadList,
  ],
  templateUrl: './media-library.html',
  styleUrl: './media-library.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaLibrary {
  private readonly toast = inject(HmhaToast);
  private readonly fb = inject(FormBuilder);

  /** Step fake uploads on a timer. Tests turn this off and call `step()`. */
  readonly autoAdvance = input(true);
  /** How long a refresh pretends to take. */
  readonly loadMs = input(800);

  // Navigation and view
  readonly section = signal<LibrarySection>('movies');
  readonly libraryOpen = signal(true);
  readonly view = signal<'grid' | 'list'>('grid');
  readonly loading = signal(false);
  protected readonly sectionName = computed(() => SECTION_NAMES[this.section()]);
  protected readonly titles = computed(() => TITLES.filter((t) => t.section === this.section()));

  // Uploads
  readonly uploads = signal<readonly Upload[]>([]);
  readonly rejections = signal<readonly HmhaFileRejection[]>([]);
  private nextId = 1;
  private readonly processingLeft = new Map<number, number>();
  protected readonly activeUploads = computed(
    () => this.uploads().filter((u) => u.status !== 'ready' && u.status !== 'failed').length,
  );
  protected readonly failedUploads = computed(() => this.uploads().filter((u) => u.status === 'failed'));

  // Player
  readonly duration = 596;
  readonly position = signal(0);
  readonly playing = signal(false);
  readonly muted = signal(false);
  readonly shuffle = signal(false);
  readonly volume = signal(70);
  protected readonly positionText = computed(() => `${clock(this.position())} of ${clock(this.duration)}`);

  // Edit details
  readonly details = this.fb.nonNullable.group({
    title: ['Big Buck Bunny', Validators.required],
    description: ['A giant rabbit takes on three bullies.'],
    quality: ['1080p'],
  });

  constructor() {
    let timer: ReturnType<typeof setInterval> | undefined;
    // Started lazily by the first upload, so an idle screen runs no timer.
    this.ensureEngine = () => {
      if (!this.autoAdvance() || timer) return;
      timer = setInterval(() => this.step(), 400);
    };
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  private readonly ensureEngine: () => void;

  go(section: LibrarySection, event?: Event): void {
    event?.preventDefault();
    this.section.set(section);
    if (section !== 'uploads') this.libraryOpen.set(true);
  }

  currentOf(section: LibrarySection): 'page' | null {
    return this.section() === section ? 'page' : null;
  }

  refresh(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), this.loadMs());
  }

  // ---- Uploads: the fake engine ----

  addFiles(files: File[]): void {
    const added = files.map((file) => ({ id: this.nextId++, file, status: 'queued' as const, progress: null, error: null, attempt: 1 }));
    this.uploads.update((list) => [...list, ...added]);
    this.ensureEngine();
  }

  /** One engine step: queued files start, uploads move on, processing finishes. */
  step(): void {
    this.uploads.update((list) =>
      list.map((u): Upload => {
        switch (u.status) {
          case 'queued':
            return { ...u, status: 'uploading', progress: 0 };
          case 'uploading': {
            const progress = Math.min(100, (u.progress ?? 0) + STEP_PERCENT);
            // A file with "corrupt" in its name fails halfway on its first
            // attempt, to show the failure path and a retry that recovers.
            if (progress >= 50 && u.attempt === 1 && u.file.name.includes('corrupt')) {
              return { ...u, status: 'failed', error: 'The connection dropped.' };
            }
            if (progress === 100) {
              this.processingLeft.set(u.id, PROCESSING_STEPS);
              return { ...u, status: 'processing', progress: null };
            }
            return { ...u, progress };
          }
          case 'processing': {
            const left = (this.processingLeft.get(u.id) ?? 1) - 1;
            this.processingLeft.set(u.id, left);
            return left <= 0 ? { ...u, status: 'ready' } : u;
          }
          default:
            return u;
        }
      }),
    );
  }

  retry(id: number): void {
    this.uploads.update((list) => list.map((u) => (u.id === id ? { ...u, status: 'queued', progress: null, error: null, attempt: u.attempt + 1 } : u)));
    this.ensureEngine();
  }

  retryAllFailed(): void {
    for (const u of this.failedUploads()) this.retry(u.id);
  }

  removeUpload(id: number): void {
    this.uploads.update((list) => list.filter((u) => u.id !== id));
  }

  // ---- Player ----

  togglePlay(): void {
    this.playing.update((p) => !p);
  }

  // ---- Edit details ----

  save(): void {
    if (this.details.invalid) {
      this.details.markAllAsTouched();
      return;
    }
    this.toast.show(`Saved “${this.details.controls.title.value}” at ${this.details.controls.quality.value}`);
  }
}
