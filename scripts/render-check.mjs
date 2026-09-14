// Serves a built static app and asserts it actually renders in a real
// headless browser. Used by verify-install-matrix.sh so the phase-2 install
// gate doesn't depend on any particular Angular version's default test
// runner (Karma vs Vitest, etc).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: render-check.mjs <static-dir>');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url;
  try {
    const body = await readFile(join(dir, path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`http://localhost:${port}/`);
  await page.waitForSelector('[data-testid="smoke-button"]', { timeout: 5000 });

  if (errors.length > 0) {
    throw new Error(`Console/page errors during render:\n${errors.join('\n')}`);
  }

  const text = await page.textContent('[data-testid="smoke-button"]');
  if (!text?.includes('Smoke test')) {
    throw new Error(`Unexpected button text: "${text}"`);
  }

  console.log('✓ rendered, button present, no console errors');
} finally {
  await browser.close();
  server.close();
}
