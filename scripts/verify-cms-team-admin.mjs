import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { normalizeProjectImage } from '../server/cms-media.mjs';
const root = new URL('../', import.meta.url);
const snapshot = JSON.parse(
  await readFile(new URL('src/data/cms-snapshot.json', root)),
);
const groups = [
  { id: 'leader', title: 'Leader Team', members: snapshot.team.leaderTeam },
  ...snapshot.team.hodsTeams,
];
const original = groups.flatMap((g) =>
  g.members.map((m, i) => ({
    ...m,
    id: g.id + '-' + (i + 1),
    group: g.id,
    order: i + 1,
  })),
);
const png = await sharp({
  create: { width: 302, height: 442, channels: 4, background: '#9b7bff' },
})
  .png()
  .toBuffer();
// 20 MP flat-colour PNG: small bytes but above the server 16 MP decode limit,
// so the browser must downscale before uploading.
const hugePng = await sharp({
  create: { width: 5000, height: 4000, channels: 3, background: '#9b7bff' },
})
  .png()
  .toBuffer();
const media = await normalizeProjectImage(png, 'image/png', 'team');
const output = new URL('artifacts/cms-team/', root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
});
const report = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let records = structuredClone(original),
      revision = 'initial',
      conflict = false,
      unauthorized = false,
      saved = 0,
      uploads = 0,
      retry = 0,
      accept = true;
    page.on('dialog', (d) => (accept ? d.accept() : d.dismiss()));
    const state = () => ({
      members: records,
      revision,
      groups: groups.map(({ id, title }) => ({ id, title })),
      photoPresets: [
        ...new Set(['marchel', 'zidan-rose', ...records.map((m) => m.photo)]),
      ],
      minMembers: 1,
      maxMembers: 8,
      publicationPending: false,
    });
    await page.route('http://team-admin.test/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === '/api/admin/team') {
        let result;
        const body =
          request.method() === 'POST'
            ? request.postDataJSON()
            : { operation: 'load' };
        if (unauthorized)
          result = { ok: false, error: { code: 'UNAUTHORIZED' } };
        else if (body.operation === 'load')
          result = { ok: true, data: state() };
        else if (body.operation === 'retry') {
          retry++;
          result = { ok: true, data: { publicationPending: true } };
        } else if (conflict)
          result = { ok: false, error: { code: 'CONFLICT' } };
        else {
          saved++;
          const member = body.payload.member;
          let id = member?.id;
          if (body.operation === 'add') {
            id = 'mock-' + saved;
            records.push({ ...member, id });
          } else if (body.operation === 'save')
            records = records.map((m) => (m.id === id ? member : m));
          else {
            id = body.payload.id;
            records = records.filter((m) => m.id !== id);
          }
          revision = 'saved-' + saved;
          result = {
            ok: true,
            data: {
              ...state(),
              affectedId: id,
              publicationPending: true,
            },
          };
        }
        return route.fulfill({ json: { ...result, csrf: 'mock-csrf' } });
      }
      if (url.pathname === '/api/admin/media') {
        assert.equal(url.searchParams.get('collection'), 'team');
        if (request.method() === 'POST') {
          uploads++;
          return route.fulfill({
            json: { ok: true, data: { image: media.image } },
          });
        }
        return route.fulfill({
          contentType: 'image/webp',
          body: Buffer.from(media.data, 'base64'),
        });
      }
      if (url.pathname === '/api/admin/projects') {
        return route.fulfill({
          json: {
            ok: true,
            data: {
              projects: snapshot.projects,
              revision: 'initial',
              imagePresets: snapshot.projects.map((p) => p.image),
              minProjects: 1,
              maxProjects: 8,
              publicationPending: false,
            },
            csrf: 'mock-csrf',
          },
        });
      }
      if (url.pathname === '/api/recruitment/application') {
        return route.fulfill({ json: { ok: true, accepting: true } });
      }
      if (url.pathname.startsWith('/api/admin/recruitment/')) {
        return route.fulfill({
          json: {
            ok: true,
            data: { applications: [], total_global: 0, filtered: 0, items: [] },
            csrf: 'mock-csrf',
          },
        });
      }
      if (url.pathname === '/api/admin/auth/login')
        return route.fulfill({ json: { ok: true, csrf: 'mock-csrf' } });
      if (url.pathname === '/api/admin/auth/logout')
        return route.fulfill({ json: { ok: true } });
      try {
        const path =
          url.pathname === '/'
            ? 'admin/team/index.html'
            : url.pathname.slice(1);
        const body = await readFile(new URL('dist/' + path, root));
        const types = {
          html: 'text/html',
          js: 'text/javascript',
          css: 'text/css',
          webp: 'image/webp',
          png: 'image/png',
          woff2: 'font/woff2',
        };
        return route.fulfill({
          body,
          contentType:
            types[path.split('.').at(-1)] || 'application/octet-stream',
        });
      } catch {
        return route.fulfill({ status: 404 });
      }
    });
    await page.goto('http://team-admin.test/');
    const teamPanel = page.locator('#panel-team');
    await teamPanel.waitFor({ state: 'attached' });
    await teamPanel.locator('#workspace').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await teamPanel.locator('.project-choice').count(), 25);

    // Tab test: switch to Projects and back to Team
    const projectsPanel = page.locator('#panel-projects');
    assert.equal(await projectsPanel.isHidden(), true);
    await page.locator('.admin-module-link[data-tab="projects"]').click();
    await projectsPanel.waitFor({ state: 'visible' });
    assert.equal(await teamPanel.isHidden(), true);
    assert.equal(await projectsPanel.locator('.project-choice').count(), 4);

    await page.locator('.admin-module-link[data-tab="team"]').click();
    await teamPanel.waitFor({ state: 'visible' });
    assert.equal(await projectsPanel.isHidden(), true);
    assert.equal(await teamPanel.locator('.project-choice').count(), 25);

    await teamPanel.locator('#name').fill('<b>Literal name</b>');
    await teamPanel.locator('#save').click();
    await teamPanel
      .getByText('Perubahan tersimpan. Penerbitan dimulai', { exact: false })
      .waitFor();
    assert.equal(await teamPanel.locator('.project-choice b').count(), 0);
    assert.equal(saved, 1);
    await teamPanel.locator('#retry').click();
    await teamPanel.getByText('Penerbitan dimulai', { exact: false }).waitFor();
    assert.equal(retry, 1);
    assert.equal(saved, 1);
    await teamPanel.locator('#image-upload').setInputFiles({
      name: 'portrait.png',
      mimeType: 'image/png',
      buffer: png,
    });
    await teamPanel.getByText('Foto siap.', { exact: false }).waitFor();
    assert.equal(uploads, 1);
    assert.equal(saved, 1);
    // Oversized (20 MP) photo is downscaled client-side then uploaded.
    await teamPanel.locator('#image-upload').setInputFiles({
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: hugePng,
    });
    await teamPanel.getByText('Foto siap.', { exact: false }).waitFor();
    assert.equal(uploads, 2);
    await teamPanel.locator('#save').click();
    await teamPanel.getByText('Penerbitan dimulai', { exact: false }).waitFor();
    assert.equal(records[0].photo, media.image);
    await teamPanel.locator('#add').click();
    await teamPanel.locator('#group').selectOption('data');
    await teamPanel.locator('#name').fill('New member');
    await teamPanel.locator('#role').fill('Role');
    await teamPanel.locator('#order').fill('2');
    await teamPanel.locator('#save').click();
    await teamPanel.getByText('Penerbitan dimulai', { exact: false }).waitFor();
    assert.equal(records.length, 26);
    accept = false;
    await teamPanel.locator('#delete').click();
    assert.equal(records.length, 26);
    accept = true;
    await teamPanel.locator('#delete').click();
    await teamPanel.getByText('Penerbitan dimulai', { exact: false }).waitFor();
    assert.equal(records.length, 25);
    conflict = true;
    await teamPanel.locator('#name').fill('Keep pending');
    await teamPanel.locator('#save').click();
    await teamPanel
      .getByText('Team sudah berubah.', { exact: false })
      .waitFor();
    assert.equal(await teamPanel.locator('#name').inputValue(), 'Keep pending');
    accept = false;
    await teamPanel.locator('#reload').click();
    assert.equal(await teamPanel.locator('#name').inputValue(), 'Keep pending');
    accept = true;
    conflict = false;
    await teamPanel.locator('#reload').click();
    await teamPanel
      .locator('#status')
      .filter({ hasText: 'Pilih anggota yang ingin diubah.' })
      .waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false);
    await teamPanel.locator('#name').focus();
    assert.equal(
      await teamPanel
        .locator('#name')
        .evaluate((e) => getComputedStyle(e).outlineStyle),
      'solid',
    );
    await page.screenshot({
      path: new URL('admin-' + width + '.png', output).pathname,
      fullPage: true,
    });
    unauthorized = true;
    await teamPanel.locator('#reload').evaluate((e) => (e.hidden = false));
    await teamPanel.locator('#reload').click();
    await teamPanel
      .getByText('Masuk dengan akun owner', { exact: false })
      .waitFor();
    assert.equal(await teamPanel.locator('#workspace').isVisible(), false);
    assert.deepEqual(errors, []);
    report.push({ width, result: 'PASS', saved, uploads, retry });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  new URL('admin-report.json', output),
  JSON.stringify(report, null, 2),
);
console.log(
  'Team admin browser PASS: 4 widths, CRUD/upload/conflict/retry/expiry.',
);
