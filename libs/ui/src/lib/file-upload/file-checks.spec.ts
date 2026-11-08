import { hmhaCheckFiles, hmhaFileMatchesAccept } from './file-checks';
import { hmhaFormatBytes } from './format-bytes';

function file(name: string, type = '', size = 10): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('hmhaFileMatchesAccept', () => {
  it('accepts everything when accept is empty or missing', () => {
    expect(hmhaFileMatchesAccept(file('a.exe'), null)).toBe(true);
    expect(hmhaFileMatchesAccept(file('a.exe'), '  ')).toBe(true);
  });

  it('matches extensions case-insensitively', () => {
    expect(hmhaFileMatchesAccept(file('Movie.MP4', 'video/mp4'), '.mp4')).toBe(true);
    expect(hmhaFileMatchesAccept(file('movie.mp4'), '.MKV, .mp4')).toBe(true);
    expect(hmhaFileMatchesAccept(file('movie.avi'), '.mkv,.mp4')).toBe(false);
  });

  it('matches wildcard and exact MIME types', () => {
    expect(hmhaFileMatchesAccept(file('a.mp4', 'video/mp4'), 'video/*')).toBe(true);
    expect(hmhaFileMatchesAccept(file('a.mp3', 'audio/mpeg'), 'video/*')).toBe(false);
    expect(hmhaFileMatchesAccept(file('a.mp3', 'audio/mpeg'), 'audio/mpeg')).toBe(true);
  });

  it('lets a file with no reported type match by extension', () => {
    // Browsers often report '' for .mkv and .flac.
    expect(hmhaFileMatchesAccept(file('show.mkv', ''), 'video/*,.mkv')).toBe(true);
    expect(hmhaFileMatchesAccept(file('show.mkv', ''), 'video/*')).toBe(false);
  });
});

describe('hmhaCheckFiles', () => {
  it('sorts files into accepted and rejected, with a reason each', () => {
    const files = [file('a.mp4', 'video/mp4', 10), file('b.exe', '', 10), file('c.mp4', 'video/mp4', 999)];
    const { accepted, rejected } = hmhaCheckFiles(files, { accept: 'video/*', maxSize: 100 });
    expect(accepted.map((f) => f.name)).toEqual(['a.mp4']);
    expect(rejected.map((r) => [r.file.name, r.reason])).toEqual([
      ['b.exe', 'type'],
      ['c.mp4', 'size'],
    ]);
  });

  it('applies the count limit to files that passed the other checks', () => {
    const files = [file('x.exe'), file('a.mp4', 'video/mp4'), file('b.mp4', 'video/mp4'), file('c.mp4', 'video/mp4')];
    const { accepted, rejected } = hmhaCheckFiles(files, { accept: 'video/*', maxFiles: 2 });
    expect(accepted.map((f) => f.name)).toEqual(['a.mp4', 'b.mp4']);
    expect(rejected.map((r) => [r.file.name, r.reason])).toEqual([
      ['x.exe', 'type'],
      ['c.mp4', 'count'],
    ]);
  });

  it('passes everything through untouched when no options are set', () => {
    const files = [file('setup.exe'), file('x', '', 0), file('Movie.MKV')];
    expect(hmhaCheckFiles(files, {})).toEqual({ accepted: files, rejected: [] });
  });

  it('treats a zero size limit as a real limit, and null as none', () => {
    expect(hmhaCheckFiles([file('a', '', 1)], { maxSize: 0 }).rejected.length).toBe(1);
    expect(hmhaCheckFiles([file('a', '', 1)], { maxSize: null }).accepted.length).toBe(1);
  });
});

describe('hmhaFormatBytes', () => {
  const cases: [number, string][] = [
    [0, '0 B'],
    [512, '512 B'],
    [1500, '1.5 kB'],
    [1_000_000, '1 MB'],
    [4_200_000_000, '4.2 GB'],
    [-1, ''],
  ];
  for (const [bytes, expected] of cases) {
    it(`${bytes} → "${expected}"`, () => expect(hmhaFormatBytes(bytes, 'en-US')).toBe(expected));
  }
});
