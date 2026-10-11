import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  defaultVisibility,
  VISIBILITY_PAGES,
} from '../src/data/site-visibility-registry.mjs';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4348');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const file =
    process.env.SITE_VISIBILITY_FILE || '/tmp/ds-visibility-fixture.json',
  original = await readFile(file, 'utf8'),
  proof = [],
  errors = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
let config;
async function set(data) {
  config = structuredClone(data);
  config.revision = randomUUID();
  await writeFile(file, JSON.stringify(config));
}
async function html(path) {
  const start = performance.now(),
    r = await fetch(new URL(path, base), { cache: 'no-store' }),
    body = await r.text();
  return { r, body, ms: performance.now() - start };
}
try {
  await mkdir('artifacts/site-visibility', { recursive: true });
  await set(defaultVisibility());
  for (const p of VISIBILITY_PAGES) {
    const { r, body } = await html(p.path);
    assert.equal(r.status, 200, p.path);
    for (const key of [
      'cache-control',
      'cdn-cache-control',
      'vercel-cdn-cache-control',
    ])
      assert.equal(r.headers.get(key), 'no-store');
    assert.equal(
      body.includes('id="chamber-title"'),
      ['about', 'hall-of-frames'].includes(p.id),
    );
    assert.match(body, /rel="canonical"/);
    proof.push({ case: 'default', page: p.id, status: r.status });
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 903 },
    reducedMotion: 'reduce',
  });
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/admin/site-visibility', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      for (const c of body.payload.changes) {
        if (c.sectionId)
          config.pages[c.pageId].sections[c.sectionId] = c.enabled;
        else config.pages[c.pageId].enabled = c.enabled;
      }
      await set(config);
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: config, csrf: 'synthetic' }),
    });
  });
  await page.route('**/api/admin/projects', (r) =>
    r.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"ok":false}',
    }),
  );
  await page.route('**/api/admin/team', (r) =>
    r.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"ok":false}',
    }),
  );
  await page.route('**/api/admin/recruitment/**', (r) =>
    r.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"ok":false}',
    }),
  );
  await page.goto(new URL('/admin/#pages', base).href);
  await page.locator('#panel-pages #workspace').waitFor({ state: 'visible' });
  await page.locator('#panel-pages [data-section-id=projects]').uncheck();
  await page.locator('#panel-pages #save').click();
  await page.waitForFunction(() =>
    document
      .querySelector('#panel-pages #status')
      .textContent.includes('Perubahan tersimpan'),
  );
  await page.goto(base.href);
  assert.equal(await page.locator('#projects').count(), 0);
  assert.equal(await page.locator('a[href="#projects"]').count(), 0);
  proof.push({
    case: 'acknowledged-fixture-save-next-visit',
    revision: config.revision,
  });
  // The existing Astro router requests current HTML on link navigation/history.
  await page
    .locator('.nav-link')
    .filter({ hasText: 'Recruitment' })
    .first()
    .click();
  await page.waitForURL('**/recruitment');
  config.pages.home.sections.projects = true;
  await set(config);
  await page.goBack();
  await page.waitForSelector('#projects');
  assert.equal(
    await page
      .locator('meta[name=ds-visibility-revision]')
      .getAttribute('content'),
    config.revision,
  );
  await page.goForward();
  await page.waitForURL('**/recruitment');
  proof.push({ case: 'client-navigation-and-history' });
  const all = defaultVisibility();
  for (const p of Object.values(all.pages)) p.enabled = true;
  await set(all);
  await page.goto(new URL('/recruitment/roles/data/', base).href);
  assert.equal(await page.locator('.role-detail').count(), 1);
  config.pages['recruitment-apply'].enabled = false;
  await set(config);
  await page.reload();
  assert.equal(await page.locator('a[href*="/recruitment/apply"]').count(), 0);
  config.pages.recruitment.sections['available-roles'] = false;
  await set(config);
  await page.reload();
  assert.equal(
    await page.locator('.back').getAttribute('href'),
    '/recruitment/',
  );
  await page.goto(new URL('/hods/data/?from=recruitment', base).href);
  assert.equal(
    await page.locator('.back').getAttribute('href'),
    '/recruitment#who-should-join',
  );
  config.pages.recruitment.sections['who-should-join'] = false;
  await set(config);
  await page.reload();
  assert.equal(
    await page.locator('.back').getAttribute('href'),
    '/recruitment/',
  );
  config.pages.recruitment.enabled = false;
  await set(config);
  await page.reload();
  assert.equal(await page.locator('.back').getAttribute('href'), '/#domains');
  for (const p of ['role-data', 'recruitment-apply']) {
    const { body } = await html(VISIBILITY_PAGES.find((x) => x.id === p).path);
    assert.match(body, /id="chamber-title"/);
    assert.equal(config.pages[p].enabled, p === 'role-data');
  }
  proof.push({ case: 'parent-inheritance-and-context-back' });
  await set(all);
  for (const p of VISIBILITY_PAGES.filter((x) => x.parent === 'home'))
    config.pages[p.id].enabled = false;
  for (const p of VISIBILITY_PAGES.filter(
    (x) => x.parent === 'recruitment' && x.id.startsWith('role-'),
  ))
    config.pages[p.id].enabled = false;
  await set(config);
  await page.goto(base.href);
  assert.equal(await page.locator('.domain-card').count(), 0);
  assert.equal(await page.locator('.rail-arrow:enabled').count(), 0);
  await page.goto(new URL('/recruitment/#available-roles', base).href);
  assert.equal(await page.locator('#available-roles').count(), 0);
  assert.equal(await page.locator('a[href="#available-roles"]').count(), 0);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => scrollY), 0);
  config.pages['hods-data'].enabled = true;
  config.pages['role-data'].enabled = true;
  await set(config);
  await page.goto(base.href);
  assert.equal(await page.locator('.domain-card').count(), 1);
  await page.goto(new URL('/recruitment/', base).href);
  assert.equal(
    (await page.locator('.role-link').count()) ||
      (await page.locator('a[href="/recruitment/roles/data"]').count()),
    1,
  );
  proof.push({ case: 'zero-and-one-card' });
  await set(defaultVisibility());
  await page.goto(new URL('/about/', base).href);
  const unchanged = await page
    .locator('meta[name=ds-visibility-revision]')
    .getAttribute('content');
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    ),
  );
  await page.waitForTimeout(300);
  assert.equal(
    await page
      .locator('meta[name=ds-visibility-revision]')
      .getAttribute('content'),
    unchanged,
  );
  config.pages.about.enabled = true;
  await set(config);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true }),
    ),
  );
  await page.waitForSelector('.about-hero');
  assert.equal(
    await page
      .locator('meta[name=ds-visibility-revision]')
      .getAttribute('content'),
    config.revision,
  );
  proof.push({ case: 'persisted-pageshow-revision-probe' });
  await set(defaultVisibility());
  config.pages.recruitment.enabled = false;
  config.pages.partners.enabled = false;
  config.pages.contact.enabled = false;
  await set(config);
  await page.goto(new URL('/about/', base).href);
  assert.equal(await page.locator('.chamber-actions a').count(), 1);
  assert.equal(
    await page.locator('.chamber-actions a').getAttribute('href'),
    '/',
  );
  assert.equal((await page.locator('.navbar .nav-link').count()) > 0, true);
  proof.push({
    case: 'development-destinations-filtered-primary-navigation-preserved',
  });
  await writeFile(file, '{"invalid":true}');
  for (const path of ['/', '/about/', '/recruitment/']) {
    const { r, body } = await html(path);
    assert.equal(r.status, 503);
    assert.match(body, /temporarily unavailable/i);
  }
  await set(defaultVisibility());
  assert.equal((await html('/')).r.status, 200);
  assert.equal((await html('/hods/unknown/')).r.status, 404);
  assert.equal((await html('/recruitment/roles/unknown/')).r.status, 404);
  assert.equal((await html('/images/cms/team/invalid.webp')).r.status, 400);
  assert.equal((await html('/api/admin/site-visibility')).r.status, 503);
  assert.equal((await html('/api/cms/content')).r.status, 200);
  proof.push({ case: 'fail-closed-recovery-routing-existing-api-media' });
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await nojs.newPage();
  await staticPage.goto(new URL('/about/', base).href);
  assert.equal(
    await staticPage.locator('#chamber-title').textContent(),
    'Page Under Development',
  );
  assert.equal(await staticPage.locator('.chamber-actions a').count(), 4);
  await staticPage.goto(base.href);
  assert.equal(await staticPage.locator('#projects').count(), 1);
  await nojs.close();
  proof.push({ case: 'no-js-SSR' });
  const samples = [];
  for (let i = 0; i < 20; i++) samples.push((await html('/contact/')).ms);
  samples.sort((a, b) => a - b);
  proof.push({
    case: 'local-request-timing',
    p50: samples[10],
    p95: samples[19],
    samples,
  });
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/site-visibility/public-proof.json',
    JSON.stringify({ proof, errors }, null, 2),
  );
  console.log('PUBLIC PASS', proof.length);
} finally {
  await writeFile(file, original);
  await browser.close();
}
