/**
 * Why a file was turned away before the consumer ever saw it. `directory`
 * is a dropped folder: folders aren't traversed (yet), so they're turned
 * away rather than passed on as a zero-byte "file".
 */
export type HmhaFileRejectionReason = 'type' | 'size' | 'count' | 'directory';

export interface HmhaFileRejection {
  readonly file: File;
  readonly reason: HmhaFileRejectionReason;
}

export interface HmhaFileCheckOptions {
  /** The same syntax as `<input accept>`: `.mp4`, `video/*`, `audio/mpeg`, comma-separated. */
  readonly accept?: string | null;
  /** Bytes. */
  readonly maxSize?: number | null;
  /** How many files one add may contain. */
  readonly maxFiles?: number | null;
}

/**
 * Whether `file` matches an `accept` string. Native `accept` only filters
 * the picker, and a drop or paste bypasses it entirely, so every route in
 * is checked here too. Extensions are matched case-insensitively, and a
 * file whose browser-reported type is empty (common for `.mkv` and
 * `.flac`) can still match by extension.
 */
export function hmhaFileMatchesAccept(file: File, accept: string | null | undefined): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Splits one add into accepted files and rejections, in order: type, then
 * size, then count (the files past `maxFiles` among those that passed).
 * With no options set, every file passes through untouched. These are
 * courtesy checks for a fast "that won't work" in the UI, not security:
 * the server still validates everything it receives.
 */
export function hmhaCheckFiles(
  files: readonly File[],
  { accept, maxSize, maxFiles }: HmhaFileCheckOptions,
): { accepted: File[]; rejected: HmhaFileRejection[] } {
  const accepted: File[] = [];
  const rejected: HmhaFileRejection[] = [];
  for (const file of files) {
    if (!hmhaFileMatchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
    else if (maxSize != null && file.size > maxSize) rejected.push({ file, reason: 'size' });
    else if (maxFiles != null && accepted.length >= maxFiles) rejected.push({ file, reason: 'count' });
    else accepted.push(file);
  }
  return { accepted, rejected };
}
