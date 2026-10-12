// Loopback-only asset reuse/guard verification; no production mutations.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4364');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
fs.mkdirSync('artifacts/navigation-next/local', { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const proof = [];
  for (const mode of ['saveData', 'slow', 'failed', 'invalid', 'hostile']) {
    const c = await b.newContext({
      viewport: { width: 390, height: 900 },
      reducedMotion: 'reduce',
    });
    await c.addInitScript((mode) => {
      sessionStorage.setItem('ds:splash', '1');
      localStorage.setItem('ds:sound', 'off');
      if (mode === 'saveData' || mode === 'slow')
        Object.defineProperty(navigator, 'connection', {
          value: {
            saveData: mode === 'saveData',
            effectiveType: mode === 'slow' ? '2g' : '4g',
          },
        });
    }, mode);
    const p = await c.newPage(),
      requests = [],
      errors = [];
    p.on('request', (r) => requests.push(new URL(r.url()).pathname));
    p.on('pageerror', (e) => errors.push(e.message));
    if (['failed', 'invalid', 'hostile'].includes(mode))
      await p.route('**/navigation-styles.json', (r) =>
        r.fulfill({
          status: mode === 'failed' ? 503 : 200,
          contentType: 'application/json',
          body:
            mode === 'invalid'
              ? 'null'
              : mode === 'hostile'
                ? JSON.stringify({
                    '/recruitment': [
                      'https://example.com/test.css',
                      '/api/admin/site-visibility',
                      '/recruitment',
                      '/_astro/noncss.js',
                    ],
                  })
                : '{}',
        }),
      );
    await p.goto(base.href);
    await p.waitForTimeout(1800);
    const hadManifest = requests.includes('/navigation-styles.json');
    if (mode === 'saveData' || mode === 'slow')
      assert.equal(hadManifest, false);
    assert.equal(requests.includes('/api/admin/site-visibility'), false);
    assert.equal(requests.includes('/recruitment'), false);
    await p.locator('.mobile-menu summary').click();
    await p.locator('a.nav-link[href="/recruitment"]:visible').click();
    await p.waitForURL('**/recruitment');
    await p.locator('.available-roles').waitFor();
    assert.deepEqual(errors, []);
    proof.push({ mode, hadManifest, errors });
    await c.close();
  }
  await b.close();
  fs.writeFileSync(
    'artifacts/navigation-next/local/guards.json',
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
