import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { VISIBILITY_PAGES } from '../src/data/site-visibility-registry.mjs';
const root = 'artifacts/site-visibility/baseline-public',
  base = process.env.PREVIEW_URL || 'http://127.0.0.1:4348';
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const rows = [];
const normalize = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/\sdata-astro-cid-[a-z0-9]+(?:="")?/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  for (const p of VISIBILITY_PAGES) {
    const before = await readFile(
        root + (p.path === '/' ? '/index.html' : p.path + 'index.html'),
        'utf8',
      ),
      response = await fetch(base + p.path),
      after = await response.text();
    assert.equal(response.status, 200);
    async function body(html) {
      await page.setContent(html);
      return page.evaluate(() =>
        [...document.querySelectorAll('main, footer')]
          .map((el) => el.outerHTML)
          .join(''),
      );
    }
    const a = normalize(await body(before)),
      b = normalize(await body(after));
    if (a !== b) {
      await writeFile(
        'artifacts/site-visibility/parity-' + p.id + '-before.html',
        a,
      );
      await writeFile(
        'artifacts/site-visibility/parity-' + p.id + '-after.html',
        b,
      );
    }
    rows.push({
      page: p.id,
      equal: a === b,
      before: createHash('sha256').update(a).digest('hex'),
      after: createHash('sha256').update(b).digest('hex'),
    });
  }
  await writeFile(
    'artifacts/site-visibility/parity-proof.json',
    JSON.stringify(rows, null, 2),
  );
  assert.deepEqual(
    rows.filter((r) => !r.equal),
    [],
  );
  console.log('DEFAULT COMPOSITION PARITY PASS', rows.length);
} finally {
  await browser.close();
}
