// Test-only colour helpers, shared by the Skeleton and Avatar specs. Not
// exported from public-api.ts, so it never ships in the package.

/**
 * Any CSS colour, as the browser would paint it over `ground` (default
 * opaque white), read back from a 1x1 canvas. The canvas does the parsing
 * and the alpha compositing, so oklch(), color(srgb …) and color-mix() all
 * work without a colour library.
 */
export function paint(css: string, ground?: [number, number, number]): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.fillStyle = ground ? `rgb(${ground.join(' ')})` : '#fff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** WCAG 2 contrast ratio between two sRGB colours. */
export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const lum = (rgb: [number, number, number]) => {
    const [r, g, bl] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
