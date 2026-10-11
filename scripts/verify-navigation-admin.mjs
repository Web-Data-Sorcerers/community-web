// Synthetic read timing only. Never uses an owner session or applicant data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4356');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const requests = [],
  tabs = [],
  errors = [];
let activeResponse = 0;
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest('.admin-module-link');
        if (!link) return;
        const start = performance.now();
        window.__tabFrame = undefined;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            window.__tabFrame = {
              tab: link.dataset.tab,
              ms: performance.now() - start,
              shown: !document.querySelector('#panel-' + link.dataset.tab)
                .hidden,
            };
          }),
        );
      },
      true,
    );
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', async (route) => {
    assert.equal(route.request().method(), 'GET');
    const path = new URL(route.request().url()).pathname;
    requests.push({ path, time: performance.now() });
    if (path === '/api/admin/site-visibility') {
      await new Promise((r) => setTimeout(r, 1800));
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: defaultVisibility(),
          csrf: 'synthetic',
        }),
      });
      activeResponse = performance.now();
    } else
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: '{"ok":false,"error":{"code":"UNAUTHORIZED"}}',
      });
  });
  const start = performance.now();
  await page.goto(new URL('/admin/#pages', base).href, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#panel-pages #workspace').waitFor({ state: 'visible' });
  const dataReady = performance.now() - start;
  for (const tab of ['projects', 'team', 'recruitment'])
    await page.waitForFunction(
      (tab) =>
        ['#login-form', '#login'].some((id) => {
          const el = document.querySelector('#panel-' + tab + ' ' + id);
          return el && !el.hidden;
        }),
      tab,
    );
  for (const tab of [
    'team',
    'recruitment',
    'projects',
    'pages',
    'team',
    'pages',
  ]) {
    const before = requests.length,
      t = performance.now();
    await page.locator(`.admin-module-link[data-tab="${tab}"]`).click();
    await page.waitForFunction((tab) => window.__tabFrame?.tab === tab, tab);
    const frame = await page.evaluate(() => window.__tabFrame);
    tabs.push({
      tab,
      shellMs: frame.ms,
      driverMs: performance.now() - t,
      shown: frame.shown,
      newRequests: requests.length - before,
    });
  }
  const competition = requests.filter(
    (r) => r.path !== '/api/admin/site-visibility' && r.time < activeResponse,
  );
  const proof = {
    time: new Date().toISOString(),
    provenance:
      'Local generated Node22 shell, synthetic active Pages GET delayed 1800ms; other tabs synthetic anonymous401; data readiness separate from shell timing',
    dataReady,
    competition: competition.map((r) => r.path),
    requests: requests.map((r) => ({ path: r.path, ms: r.time - start })),
    tabs,
    errors,
  };
  await fs.mkdir('artifacts/navigation-performance-local', { recursive: true });
  await fs.writeFile(
    process.env.ADMIN_PROOF ||
      'artifacts/navigation-performance-local/admin-before.json',
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof));
  if (process.env.EXPECT_BOUNDED === '1') assert.equal(competition.length, 0);
  assert.equal(errors.length, 0);
} finally {
  await browser.close();
}
