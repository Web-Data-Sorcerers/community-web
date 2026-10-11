import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4348',
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
const proof = [];
try {
  for (const mode of ['late-read', 'failed-read', 'late-write']) {
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    let release,
      reads = 0,
      writes = 0;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/**', async (route) => {
      if (
        new URL(route.request().url()).pathname != '/api/admin/site-visibility'
      )
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: '{"ok":false}',
        });
      const isRead = route.request().method() === 'GET';
      if (isRead) reads++;
      else writes++;
      if (
        (mode === 'late-read' && isRead) ||
        (mode === 'late-write' && !isRead)
      )
        await new Promise((resolve) => (release = resolve));
      try {
        await route.fulfill({
          status: mode === 'failed-read' ? 503 : 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: mode !== 'failed-read',
            data: defaultVisibility(),
            csrf: 'synthetic',
          }),
        });
      } catch {}
    });
    await page.goto(base + '/admin/#pages', { waitUntil: 'domcontentloaded' });
    const panel = page.locator('#panel-pages');
    if (mode === 'late-read') {
      await page.waitForFunction(() =>
        document
          .querySelector('#panel-pages #status')
          .textContent.includes('Memuat Pages'),
      );
      await page.evaluate(() =>
        document.dispatchEvent(new CustomEvent('ds:admin-session-ended')),
      );
      release();
      await page.waitForTimeout(200);
      assert.equal(await panel.locator('#workspace').isVisible(), false);
      assert.equal(await panel.locator('#page-list').textContent(), '');
    } else if (mode === 'failed-read') {
      await page.waitForFunction(() =>
        document
          .querySelector('#panel-pages #status')
          .textContent.includes('belum bisa dimuat'),
      );
      assert.equal(await panel.locator('#workspace').isVisible(), false);
      assert.equal(await panel.locator('#bootstrap-reload').isEnabled(), true);
    } else {
      await panel.locator('#workspace').waitFor({ state: 'visible' });
      await panel.locator('[data-section-id=projects]').uncheck();
      await panel.locator('#save').click();
      await page.waitForFunction(
        () => document.querySelector('#panel-pages #save').disabled,
      );
      await page.evaluate(() =>
        document
          .querySelector('#panel-pages #save')
          .dispatchEvent(new MouseEvent('click', { bubbles: true })),
      );
      assert.equal(writes, 1);
      await page.evaluate(() =>
        document.dispatchEvent(new CustomEvent('ds:admin-session-ended')),
      );
      release();
      await page.waitForTimeout(200);
      assert.equal(await panel.locator('#workspace').isVisible(), false);
      assert.equal(await panel.locator('#page-list').textContent(), '');
    }
    assert.equal(reads, 1);
    assert.deepEqual(errors, []);
    proof.push({ mode, reads, writes, errors });
    await page.close();
  }
  await writeFile(
    'artifacts/site-visibility/race-proof.json',
    JSON.stringify(proof, null, 2),
  );
  console.log('RACE PASS', proof.length);
} finally {
  await browser.close();
}
