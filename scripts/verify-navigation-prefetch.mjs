// Read-only inventory: viewport, focus and hover without activating links.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { VISIBILITY_PAGES } from '../src/data/site-visibility-registry.mjs';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4356');
const local = ['localhost', '127.0.0.1'].includes(base.hostname);
assert.ok(
  local || base.origin === 'https://data-sorcerers-community-sigma.vercel.app',
);
const b = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const requests = [],
  errors = [];
try {
  const p = await b.newPage({ reducedMotion: 'reduce' });
  await p.addInitScript(() => {
    sessionStorage.setItem('ds:splash', '1');
    localStorage.setItem('ds:sound', 'off');
  });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.route('**/*', (r) => {
    const q = r.request(),
      u = new URL(q.url());
    assert.ok(['GET', 'HEAD'].includes(q.method()));
    if (local && u.origin !== base.origin) return r.abort();
    requests.push({ path: u.pathname, type: q.resourceType() });
    return r.continue();
  });
  await p.goto(new URL('/recruitment', base).href, {
    waitUntil: 'domcontentloaded',
  });
  await p.locator('#available-roles').scrollIntoViewIfNeeded();
  await p.locator('a[href="/recruitment/roles/data"]').first().focus();
  await p.locator('a[href="/recruitment/roles/data"]').first().hover();
  await p.waitForTimeout(1400);
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(700);
  const inventory = await p.locator('a').evaluateAll((nodes) =>
    nodes.map((e) => ({
      href: e.getAttribute('href'),
      prefetch: e.getAttribute('data-astro-prefetch'),
      category: e.closest('.navbar')
        ? 'navbar'
        : e.classList.contains('button')
          ? 'button'
          : e.closest('.footer')
            ? 'footer'
            : 'card/other',
    })),
  );
  const controlled = new Set(
    VISIBILITY_PAGES.map((p) => p.path.replace(/\/$/, '') || '/'),
  );
  const html = requests.filter(
    (r) =>
      r.type !== 'document' && controlled.has(r.path.replace(/\/$/, '') || '/'),
  );
  const proof = {
    time: new Date().toISOString(),
    origin: base.origin,
    scope:
      'Agent Chromium GET/HEAD only; recruitment role viewport/focus/hover + footer scroll, no link activated',
    inventory,
    requests,
    speculativeHtml: html,
    errors,
  };
  await fs.writeFile(
    process.env.PREFETCH_PROOF ||
      'artifacts/navigation-performance-local/prefetch-after.json',
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify({ speculativeHtml: html, errors }));
  if (local) assert.equal(html.length, 0);
  assert.equal(errors.length, 0);
} finally {
  await b.close();
}
