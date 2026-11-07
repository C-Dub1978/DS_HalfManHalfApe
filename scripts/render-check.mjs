// Serves a built static app and asserts it actually renders in a real
// headless browser. Used by verify-install-matrix.sh so the phase-2 install
// gate doesn't depend on any particular Angular version's default test
// runner (Karma vs Vitest, etc).
//
// Beyond "the button rendered", each check below drives one CDK-backed
// path for real — overlay, AriaDescriber, _IdGenerator, listbox — so a
// new Angular major that breaks any of them fails here, not in a consumer.
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

  const text = await page.textContent('[data-testid="smoke-button"]');
  if (!text?.includes('Smoke test')) {
    throw new Error(`Unexpected button text: "${text}"`);
  }
  console.log('✓ button rendered');

  // Tokens — the hmha-tokens CSS loaded and the button actually consumes it.
  const action = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--hmha-color-action').trim(),
  );
  const buttonBg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid="smoke-button"]')).backgroundColor,
  );
  if (!action || buttonBg === 'rgba(0, 0, 0, 0)') {
    throw new Error(`Token CSS not applied (--hmha-color-action="${action}", button bg=${buttonBg})`);
  }
  console.log('✓ token CSS loaded and applied');

  // Field/Input — _IdGenerator + the HMHA_FIELD contract wired label → input.
  const inputId = await page.getAttribute('[data-testid="smoke-input"]', 'id');
  const labelFor = await page.getAttribute('hmha-field label', 'for');
  if (!inputId || inputId !== labelFor) {
    throw new Error(`Field label/input not associated (label for="${labelFor}", input id="${inputId}")`);
  }
  console.log('✓ field label associated with input');

  // Tooltip — AriaDescriber describes the host, and hovering opens the overlay.
  const describedBy = await page.getAttribute('[data-testid="smoke-button"]', 'aria-describedby');
  if (!describedBy) throw new Error('Tooltip host has no aria-describedby');
  await page.hover('[data-testid="smoke-button"]');
  await page.waitForSelector('.cdk-overlay-container >> text=Smoke tooltip', { timeout: 5000 });
  console.log('✓ tooltip described and opened in an overlay');

  // Select — opening renders the CDK listbox; picking an option closes it.
  await page.mouse.move(0, 0);
  await page.click('[data-testid="smoke-select"]');
  await page.waitForSelector('[role="listbox"] [role="option"]', { timeout: 5000 });
  await page.click('[role="option"]:has-text("Beta")');
  await page.waitForSelector('[role="listbox"]', { state: 'detached', timeout: 5000 });
  console.log('✓ select listbox opened, selected and closed');

  if (errors.length > 0) {
    throw new Error(`Console/page errors during render:\n${errors.join('\n')}`);
  }
  console.log('✓ no console errors');
} finally {
  await browser.close();
  server.close();
}
