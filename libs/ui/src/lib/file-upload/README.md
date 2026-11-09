# File Upload

Upload **UI**, never upload transport: `HmhaFileDropzone` takes files
in, `HmhaUploadList`/`HmhaUploadItem` show each file's whole journey.
These components never make a network request: you, or an upload engine such as Uppy, own chunking,
multipart, presigned URLs, retries, concurrency and metadata. The
components take files in, show what's happening, and tell you what the
user asked for. See `DECISIONS.md` fork 41.

## HmhaFileDropzone

```html
<label
  hmhaFileDropzone
  accept="video/*,audio/*,.mkv,.flac"
  [maxSize]="20_000_000_000"
  (filesAdded)="startUploads($event)"
  (filesRejected)="showRejections($event)"
></label>
```

A native `<label>` around a native `<input type="file" multiple>`.
Clicking anywhere in the zone opens the file picker with no script, and
the input underneath is what the keyboard and assistive tech reach, named
by the zone's own text. Dragging files onto the zone is a shortcut on top
of that: the picker is the primary path, because a drag-only control fails
WCAG's requirement for an alternative to dragging, and mobile has no drag
and drop at all.

With no content of its own it shows an upload icon and "Drop files here,
or click to browse". Project your own content to replace that, but keep
it non-interactive (text and icons only): it sits inside a `<label>`, so a
nested button would fight it for the click.

### Checks before anything starts

`accept`, `maxSize` and `maxFiles` turn files away early with a reason,
emitted on `filesRejected`. They apply to dropped and pasted files too,
which skip the native `accept` filter entirely. They're courtesy checks
for fast feedback, not security: your server still validates everything
it receives (for Stackfi, `ffprobe`).

**Leave all three unset and every file passes through untouched.** If an
upload library does its own validation (Uppy's `restrictions`, for
example), leave them unset so there's one source of truth for what's
allowed, and show that library's rejections yourself.

**`accept`:** list file extensions alongside MIME types, for example
`video/*,audio/*,.mkv,.flac`. Browsers often report no MIME type at all for
`.mkv`, `.flac` and other less common formats, so `video/*` alone would
turn a perfectly good `.mkv` away. Extensions match case-insensitively
(`.MKV` matches `.mkv`).

**`maxFiles` limits one selection,** meaning a single pick, drop or paste.
**It is not a total.** The dropzone doesn't own your upload list and
can't see how many files Uppy (or your own code) already has queued, so
an overall cap belongs to the consumer: Uppy's
`restrictions.maxNumberOfFiles`, or binding the room that's left,
`[maxFiles]="limit - uploads().length"`.

**Folders are turned away,** with the reason `'directory'`. A dropped
folder is detected (through `webkitGetAsEntry()`) rather than passed on as
the unreadable zero-byte "file" browsers report for it. Its contents
aren't uploaded: folder traversal is a possible later feature. Files
dropped alongside the folder are still added.

The same logic is exported for your own use: `hmhaFileMatchesAccept(file,
accept)` and `hmhaCheckFiles(files, { accept, maxSize, maxFiles })`.

### Drag and drop details it handles

- **No flicker:** dragging across the zone's own child elements doesn't
  drop the highlight (`data-dragging`).
- **Only files:** dragging text or links over the zone does nothing.
- **A missed drop doesn't leave the page:** while at least one dropzone
  is on screen, a file dropped just outside it is caught, instead of the
  browser opening it in place of your app. In Electron that would replace
  the whole window. The guard only acts on drags that carry files, only
  when nothing else already handled the event, and never stops
  propagation, so your own drop handlers elsewhere still run. It's
  removed with the last dropzone.
- **Disabled means fully inert:** no highlight, a "not allowed" drop
  cursor, drops ignored, and the picker disabled.

### Announcements

After every add, a polite screen-reader announcement says what happened:
"2 files added. x.exe not added: it isn't an accepted file type." Through
CDK's `LiveAnnouncer`, which clears the live region before each message,
so adding the same file twice is announced twice. The messages are English
for now.

### Paste

While the zone has focus (Tab to it, or click it and dismiss the picker),
Ctrl+V or Cmd+V adds copied files or a screenshot, through the same checks
and announcements as picking or dropping. A screenshot usually arrives
named `image.png`. Paste is deliberately not page-wide: that would take
over every paste on the page, text fields included. A plain text paste is
left alone.

### A separate Browse button

`exportAs: 'hmhaFileDropzone'` exposes `open()`:

```html
<label hmhaFileDropzone #zone="hmhaFileDropzone" (filesAdded)="add($event)"></label>
<button hmhaButton (click)="zone.open()">Browse files</button>
```

### Inputs and outputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `accept` | `string \| null` | `null` | `<input accept>` syntax: `.mp4`, `video/*`, `audio/mpeg`. Extensions match case-insensitively, and a file the browser reports no type for (`.mkv`, often) still matches by extension. |
| `multiple` | `boolean` | `true` | Off: one file per add, the rest rejected for `'count'`. |
| `maxSize` | `number \| null` | `null` | Bytes. |
| `maxFiles` | `number \| null` | `null` | Files per selection (one pick, drop or paste), not a total. |
| `disabled` | `boolean` | `false` | Disables the picker and ignores drops. |

| Output | Payload | Fires |
| --- | --- | --- |
| `filesAdded` | `File[]` | Files that passed the checks. |
| `filesRejected` | `HmhaFileRejection[]` | `{ file, reason }` for each file turned away: `'type'`, `'size'`, `'count'` or `'directory'`. |

### Component tokens — the override API

| Token | Default | Notes |
| --- | --- | --- |
| `--hmha-file-dropzone-border` | `var(--hmha-color-border-strong)` | The dashed edge. `action` on hover and while dragging. |
| `--hmha-file-dropzone-bg` | `transparent` | `action-subtle` while dragging. |
| `--hmha-file-dropzone-fg` | `var(--hmha-color-text-muted)` | `action` while dragging. |

## HmhaUploadList and HmhaUploadItem

```html
<ul hmhaUploadList aria-label="Uploads">
  @for (upload of uploads(); track upload.id) {
    <li
      hmhaUploadItem
      [name]="upload.name"
      [size]="upload.size"
      [progress]="upload.progress"
      [status]="upload.status"
      [error]="upload.error"
      [statusLabel]="upload.status === 'processing' ? 'Transcoding' : null"
      pausable
      (cancel)="cancel(upload.id)"
      (retry)="retry(upload.id)"
      (pause)="pause(upload.id)"
      (resume)="resume(upload.id)"
      (remove)="remove(upload.id)"
    >
      <!-- optional: your own metadata fields for this file -->
    </li>
  }
</ul>
```

One row per file, **inputs only, outputs only**: a row knows nothing about
Uppy or any transport. You render rows with your own `@for` over your own
upload state, and you act on what they emit. `HmhaUploadList` is the
native `<ul>` around them, with `role="list"` stated, because Safari drops
a list's semantics once its bullets are styled away.

### The whole journey, not only the upload

An upload isn't finished when the bytes arrive: a server may still have
work to do (Stackfi transcodes). So status covers every step:

| `status` | Badge | Progress bar | Actions |
| --- | --- | --- | --- |
| `queued` | Queued (neutral) | none | Cancel |
| `uploading` | Uploading (primary) | `progress`, 0–100 or `null` for indeterminate | Cancel, plus Pause if `pausable` |
| `paused` | Paused (neutral) | `progress` | Cancel, plus Resume if `pausable` |
| `processing` | Processing (primary) | **always indeterminate**, whatever `progress` says | none |
| `ready` | Ready (success) | none | Remove |
| `failed` | Failed (danger) | `progress` in red, if you still pass one | Retry, Remove |

`statusLabel` replaces the badge's wording, such as "Transcoding" for
`processing`. `error` shows under a `failed` row and is tied to its Retry
button, so a screen reader hears why before deciding to retry. Only set
`pausable` if your transport can really pause (Uppy can with its tus and
S3 multipart uploaders).

### Thumbnails

Pass the file itself as `preview` and image files show a thumbnail:

```html
<li hmhaUploadItem [name]="upload.name" [preview]="upload.file" ...></li>
```

The row makes an object URL for an image and revokes it when `preview`
changes or the row is destroyed, so a long session doesn't hold every
image in memory. Video and audio keep the file icon: drawing a frame from
a video would mean decoding it in the browser, which is the server's job.
Pass a URL string instead and it's used as it is, which suits a poster
the server generates once processing finishes:

```ts
preview: upload.status === 'ready' ? upload.posterUrl : upload.file
```

A preview that fails to load falls back to the icon, and a new one gets a
fresh try. The thumbnail is decorative (`alt=""`), since the file's name
sits right beside it.

### Accessibility

- **Every action is named with its file:** "Cancel upload of movie.mkv",
  "Retry upload of movie.mkv", "Remove movie.mkv". In a list of identical
  icon buttons, "Cancel" alone wouldn't say which file.
- **Each progress bar is named too:** "Upload progress for movie.mkv", or
  the status wording during `processing` ("Transcoding movie.mkv").
- **Announcements mark the moments that matter, never every percent:**
  "movie.mkv uploaded, transcoding.", "movie.mkv is ready.",
  "movie.mkv failed. The connection was lost." They fire only on a
  change, so a list first rendered with finished files stays quiet.
- **After Remove, move focus yourself.** The button the user pressed goes
  away with its row, so focus the next row's first button, or the list.

### Inputs and outputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` (required) | | |
| `size` | `number \| null` | `null` | Bytes, shown through `hmhaFormatBytes`. |
| `progress` | `number \| null` | `null` | 0–100, or `null` for indeterminate. |
| `status` | `HmhaUploadStatus` | `'queued'` | See the table above. |
| `statusLabel` | `string \| null` | `null` | Replaces the badge's default wording. |
| `error` | `string \| null` | `null` | Shown on a `failed` row. |
| `preview` | `Blob \| string \| null` | `null` | A thumbnail. An image `File`/`Blob` previews through an object URL the row creates and revokes (on change and when the row goes away); video and audio keep the file icon. A URL string is used as is. |
| `pausable` | `boolean` | `false` | Offer Pause and Resume while uploading. |

Outputs: `cancel`, `retry`, `pause`, `resume`, `remove`, each with no
payload: you already know which upload the row is.

## Wiring it to Uppy

`@uppy/core` runs with no UI of its own, and its S3 plugin uploads
straight to S3-compatible storage (MinIO included) as presigned multipart
chunks. Uppy owns the transport; these components own the screen. This is
a sketch against Uppy's core API: check the method and plugin option names
against the Uppy version you install.

```ts
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import type { HmhaUploadStatus } from '@halfmanhalfape/hmha-ui';

interface Upload {
  id: string;
  name: string;
  size: number;
  progress: number | null;
  status: HmhaUploadStatus;
  error: string | null;
}

export class UploadsPage {
  readonly uploads = signal<Upload[]>([]);
  /** What your API says happens after the bytes land: transcoding, then ready or failed. */
  private readonly serverStatus = new Map<string, HmhaUploadStatus>();

  private readonly uppy = new Uppy({ autoProceed: true, restrictions: { maxNumberOfFiles: 20 } })
    .use(AwsS3, { shouldUseMultipart: true /* plus your presigning endpoints */ });

  constructor() {
    // Uppy's state changes become the rows' inputs. Progress events are
    // frequent; throttle this if a big batch makes it busy.
    this.uppy.on('state-update', () => this.sync());
  }

  add(files: File[]) {
    this.uppy.addFiles(files.map((file) => ({ name: file.name, type: file.type, data: file })));
  }
  cancel(id: string) { this.uppy.removeFile(id); }
  retry(id: string) { this.uppy.retryUpload(id); }
  pause(id: string) { this.uppy.pauseResume(id); }
  resume(id: string) { this.uppy.pauseResume(id); }
  remove(id: string) { this.uppy.removeFile(id); }

  private sync() {
    this.uploads.set(this.uppy.getFiles().map((file) => ({
      id: file.id,
      name: file.name ?? 'Untitled',
      size: file.size ?? 0,
      progress: file.progress.percentage ?? null,
      error: file.error ?? null,
      status: file.error ? 'failed'
        : file.progress.uploadComplete ? (this.serverStatus.get(file.id) ?? 'processing')
        : file.isPaused ? 'paused'
        : file.progress.uploadStarted ? 'uploading'
        : 'queued',
    })));
  }
}
```

```html
<label hmhaFileDropzone accept="video/*,audio/*,.mkv,.flac" (filesAdded)="add($event)"></label>
<ul hmhaUploadList aria-label="Uploads"> <!-- rows as above --> </ul>
```

Uppy's `restrictions` do the validation here, so the dropzone's own
checks stay unset (one source of truth). When your API reports the
transcode finished or failed, set `serverStatus` and call `sync()`.

## File sizes

`hmhaFormatBytes(bytes)` uses **decimal units** (1 kB = 1000 bytes), so
4,200,000,000 bytes reads "4.2 GB". That matches macOS, iOS and most
Linux file managers, and how drives are sold. **Windows Explorer divides by
1024 but still writes "KB"/"MB"/"GB"**, so on Windows the same file shows
as about "3.9 GB". The difference grows with size (about 7% at gigabytes).
If your users compare against Explorer, that's the reason the numbers
won't match exactly.

## Unsupported

`::ng-deep`, selectors targeting internal DOM (the hidden input), or
overriding by specificity, per the encapsulation contract in
`DECISIONS.md` fork 05. Set a component token instead.
