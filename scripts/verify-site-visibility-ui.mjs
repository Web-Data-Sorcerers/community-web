// Review the real local editor and SSR output, one page/section per pass.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { VISIBILITY_PAGES } from '../src/data/site-visibility-registry.mjs';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4348');
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname));
const file =
  process.env.SITE_VISIBILITY_FILE || '/tmp/ds-visibility-review.json';
assert.ok(file.startsWith('/tmp/'));
const original = await readFile(file, 'utf8');
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const proof = [],
  errors = [];
async function openEditor(page) {
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(new URL('/admin/#pages', base).href);
  await page.locator('#panel-pages #workspace').waitFor({ state: 'visible' });
  await page
    .locator('#panel-pages #review-notice')
    .waitFor({ state: 'visible' });
}
async function select(page, target) {
  const panel = page.locator('#panel-pages');
  if (
    (await panel.locator('#page-picker-toggle').isVisible()) &&
    (await panel
      .locator('#page-picker-toggle')
      .getAttribute('aria-expanded')) === 'false'
  )
    await panel.locator('#page-picker-toggle').click();
  await panel.locator('#page-search').fill(target.path);
  await panel.locator(`[data-select-page="${target.id}"]`).click();
  assert.equal(
    await panel.locator('#selected-page-title').textContent(),
    target.label,
  );
  assert.equal(await panel.locator('#page-list [role=switch]').count(), 0);
  assert.equal(
    await panel.locator('#page-detail [data-section-id]').count(),
    target.sections.length,
  );
}
async function save(page) {
  const result = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === '/api/admin/site-visibility' &&
      r.request().method() === 'POST',
  );
  await page.locator('#panel-pages #save').click();
  const response = await result;
  assert.equal(response.status(), 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  await page.waitForFunction(() =>
    document
      .querySelector('#panel-pages #status')
      .textContent.includes('Perubahan tersimpan'),
  );
  assert.equal(
    await page.locator('#panel-pages #change-summary').isVisible(),
    false,
  );
  return body.data;
}
async function publicContains(page, target, selector) {
  const response = await fetch(new URL(target.path, base), {
    cache: 'no-store',
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const html = await response.text();
  return page.evaluate(
    ({ html, selector }) =>
      !!new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector),
    { html, selector },
  );
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await openEditor(page);
  for (const target of VISIBILITY_PAGES) {
    await select(page, target);
    const input = page.locator(
      '#panel-pages #page-detail [role=switch]:not([data-section-id])',
    );
    if (target.protected) {
      assert.equal(await input.isDisabled(), true);
      proof.push({ page: target.id, protected: true });
    } else {
      if (!(await input.isChecked())) {
        await input.check();
        await save(page);
      }
      await input.uncheck();
      assert.match(
        await page.locator('#panel-pages #change-list').textContent(),
        /Under Development/,
      );
      await save(page);
      assert.equal(await publicContains(page, target, '#chamber-title'), true);
      await input.check();
      await save(page);
      assert.equal(await publicContains(page, target, '#chamber-title'), false);
      proof.push({ page: target.id, pageOffOn: 'PASS' });
    }
    // Section passes are independent; each save is checked against raw SSR HTML.
    for (const section of target.sections) {
      const source = await readFile(
        `src/components/${section.component}.astro`,
        'utf8',
      );
      const opening = source.match(/<section\b[\s\S]*?>/)[0];
      const id = opening.match(/\bid="([^"]+)"/),
        cls = opening.match(/\bclass="([^"]+)"/);
      assert.ok(id || cls);
      const selector = id
        ? `section[id="${id[1]}"]`
        : `section.${cls[1].split(' ')[0]}`;
      const toggle = page.locator(
        `#panel-pages #page-detail [data-section-id="${section.id}"]`,
      );
      await toggle.uncheck();
      assert.equal(
        (await save(page)).pages[target.id].sections[section.id],
        false,
      );
      assert.equal(await publicContains(page, target, selector), false);
      await toggle.check();
      assert.equal(
        (await save(page)).pages[target.id].sections[section.id],
        true,
      );
      assert.equal(await publicContains(page, target, selector), true);
      proof.push({ page: target.id, section: section.id, offOn: 'PASS' });
    }
    console.log('PAGE PASS', target.id, target.sections.length);
  }
  // Draft survives switching/search; page switch and section effect remain clear.
  await select(page, VISIBILITY_PAGES[0]);
  await page.locator('#panel-pages [data-section-id=projects]').uncheck();
  await select(page, VISIBILITY_PAGES[1]);
  await page.locator('#panel-pages [data-section-id=team]').uncheck();
  assert.match(
    await page.locator('#panel-pages #pending-count').textContent(),
    /2 perubahan/,
  );
  await select(page, VISIBILITY_PAGES[0]);
  assert.equal(
    await page.locator('#panel-pages [data-section-id=projects]').isChecked(),
    false,
  );
  assert.match(
    await page.locator('#panel-pages #change-list').textContent(),
    /Explore/,
  );
  await page.locator('#panel-pages #cancel').click();
  for (const role of VISIBILITY_PAGES.filter((p) => p.id.startsWith('role-'))) {
    await select(page, role);
    await page.locator('#panel-pages #page-detail [role=switch]').uncheck();
  }
  await select(
    page,
    VISIBILITY_PAGES.find((p) => p.id === 'recruitment'),
  );
  assert.match(
    await page
      .locator('#visibility-recruitment-available-roles-description')
      .textContent(),
    /semua halaman role nonaktif/,
  );
  assert.equal(
    await page
      .locator('#panel-pages [data-section-id=available-roles]')
      .isChecked(),
    true,
  );
  await select(
    page,
    VISIBILITY_PAGES.find((p) => p.id === 'role-data'),
  );
  await page.locator('#panel-pages #page-detail [role=switch]').check();
  await select(
    page,
    VISIBILITY_PAGES.find((p) => p.id === 'recruitment'),
  );
  assert.match(
    await page
      .locator('#visibility-recruitment-available-roles-description')
      .textContent(),
    /Akan ditampilkan/,
  );
  await page.locator('#panel-pages #cancel').click();
  // Recruitment parent off keeps child preference and shows the reason.
  await select(
    page,
    VISIBILITY_PAGES.find((p) => p.id === 'recruitment'),
  );
  await page
    .locator('#panel-pages #page-detail [role=switch]:not([data-section-id])')
    .uncheck();
  await select(
    page,
    VISIBILITY_PAGES.find((p) => p.id === 'role-data'),
  );
  assert.match(
    await page.locator('#panel-pages #page-detail').textContent(),
    /Tidak tampil karena Recruitment nonaktif/,
  );
  assert.equal(
    await page.locator('#panel-pages #page-detail [role=switch]').isChecked(),
    true,
  );
  await page.locator('#panel-pages #cancel').click();
  await page.close();
  // Reset exact fixture bytes before visual checks; no persistent owner mutation.
  await writeFile(file, original);
  for (const { width, height, zoom } of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
    { width: 390, height: 480 },
    { width: 1440, height: 900, zoom: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await openEditor(page);
    if (zoom)
      await page.evaluate(() => (document.documentElement.style.zoom = '2'));
    for (const target of VISIBILITY_PAGES) {
      await select(page, target);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}: overflow on ${target.id}`,
      );
      if (width < 1024) {
        assert.equal(
          await page.locator('#panel-pages #page-picker-body').isVisible(),
          false,
        );
        assert.equal(
          await page
            .locator('#selected-page-title')
            .evaluate((e) => e === document.activeElement),
          true,
        );
      }
    }
    await select(page, VISIBILITY_PAGES[0]);
    await page.locator('#panel-pages [data-section-id=projects]').focus();
    await page.keyboard.press('Space');
    assert.equal(
      await page.locator('#panel-pages [data-section-id=projects]').isChecked(),
      false,
    );
    assert.equal(
      await page
        .locator('#panel-pages [data-section-id=projects]')
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.locator('#panel-pages #cancel').click();
    if (width < 1024)
      await page.locator('#panel-pages #page-picker-toggle').click();
    await page
      .locator('#panel-pages #page-search')
      .fill('a-page-that-does-not-exist');
    await page
      .locator('#panel-pages #search-empty')
      .waitFor({ state: 'visible' });
    await page.locator('#panel-pages #clear-search').click();
    assert.equal(
      await page.locator('#panel-pages [data-select-page]').count(),
      19,
    );
    await select(page, VISIBILITY_PAGES[1]);
    assert.match(
      await page.locator('#panel-pages #page-detail').textContent(),
      /Halaman ini nonaktif/,
    );
    if (await page.locator('#panel-pages #page-picker-toggle').isVisible())
      await page.locator('#panel-pages #page-picker-toggle').click();
    await page.locator('#panel-pages #page-search').fill('');
    if (await page.locator('#panel-pages #page-picker-toggle').isVisible())
      await page.locator('#panel-pages #page-picker-toggle').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/site-visibility/ui-refined-${width}-${height}${zoom ? '-zoom' : ''}.png`,
      fullPage: true,
    });
    proof.push({
      width,
      height,
      zoom: !!zoom,
      selectedPages: 19,
      overflow: false,
      keyboard: 'PASS',
    });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/site-visibility/ui-refinement-proof.json',
    JSON.stringify({ proof, browserErrors: errors }, null, 2),
  );
  console.log('UI REFINEMENT PASS', proof.length);
} finally {
  await writeFile(file, original);
  await browser.close();
}
