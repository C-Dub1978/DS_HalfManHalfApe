/**
 * Hand-authored, build-time-only SVG markup — bundled straight into the
 * library, no external sprite fetch and no runtime HTTP request. Each entry
 * is the inner markup of a 24x24 viewBox, styled with `currentColor` so it
 * inherits the surrounding text/tone colour rather than carrying its own.
 */
export const HMHA_ICONS = {
  check:
    '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />',
  close:
    '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />',
  'chevron-down':
    '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />',
  spinner:
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25" />' +
    '<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />',
} as const satisfies Record<string, string>;

export type HmhaIconName = keyof typeof HMHA_ICONS;
