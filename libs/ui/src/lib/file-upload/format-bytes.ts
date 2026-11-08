const UNITS = ['B', 'kB', 'MB', 'GB', 'TB'] as const;

/**
 * A byte count as people read it: "512 B", "1.5 MB", "4.2 GB". Decimal
 * (1000-based) units, matching how operating systems and storage vendors
 * label file sizes, at most one decimal place.
 */
export function hmhaFormatBytes(bytes: number, locale?: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit++;
  }
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value);
  return `${number} ${UNITS[unit]}`;
}
