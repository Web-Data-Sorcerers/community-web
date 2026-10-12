import sharp from 'sharp';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

import { VISIBILITY_PAGES } from '../src/data/site-visibility-registry.mjs';
import { DEFAULT_SITE_URL, canonicalUrl } from '../src/data/site-url.mjs';
import { RECRUITMENT_CAMPAIGN } from '../src/data/recruitment-campaign.mjs';
import { buildSitemapXml } from '../server/sitemap.mjs';
import { loadVisibility } from '../server/site-visibility.mjs';

const DIST = existsSync('dist/client') ? 'dist/client' : 'dist';
const EXPECTED_ORIGIN =
  process.env.EXPECTED_ORIGIN ?? process.env.SITE_URL ?? DEFAULT_SITE_URL;

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
};

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const documents = await Promise.all(
  htmlFiles.map(async (file) => ({
    route: '/' + relative(DIST, file).replace(/index\.html$/, ''),
    html: await readFile(file, 'utf8'),
  })),
);

if (process.env.PREVIEW_URL) {
  for (const page of VISIBILITY_PAGES) {
    const response = await fetch(new URL(page.path, process.env.PREVIEW_URL), {
      cache: 'no-store',
    });
    assert.equal(response.status, 200, page.path);
    documents.push({ route: page.path, html: await response.text() });
  }
}

const metasOf = (html) =>
  [...html.matchAll(/<meta\s+([^>]+?)\/?>/g)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g))
      attrs[a[1]] = a[2];
    return attrs;
  });
const decode = (s) =>
  (s ?? '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

const issues = [];
const titles = new Map();

for (const { route, html } of documents) {
  const metas = metasOf(html);
  if (
    route.startsWith('/admin/') &&
    !metas.some((m) => m.name === 'robots' && m.content.includes('noindex'))
  )
    issues.push('/admin/: missing noindex');
  const meta = (key, value) =>
    decode(metas.find((m) => m[key] === value)?.content ?? null);
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim());

  if (!title) issues.push(`${route}: missing <title>`);
  else if (titles.has(title) && !route.startsWith('/admin'))
    issues.push(`${route}: duplicate title (also ${titles.get(title)})`);
  else titles.set(title, route);

  const description = meta('name', 'description');
  if (!description && !route.startsWith('/admin'))
    issues.push(`${route}: missing meta description`);
  else if (
    description &&
    (description.length < 50 || description.length > 200)
  )
    issues.push(`${route}: description length ${description.length}`);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical && !route.startsWith('/admin')) issues.push(`${route}: missing canonical`);
  else if (canonical) {
    if (!/^https:\/\//.test(canonical))
      issues.push(`${route}: canonical not absolute (${canonical})`);
    if (!canonical.startsWith(EXPECTED_ORIGIN))
      issues.push(`${route}: canonical wrong origin (${canonical}), expected ${EXPECTED_ORIGIN}`);
    const expectedCanonical = canonicalUrl(route, EXPECTED_ORIGIN);
    if (canonical !== expectedCanonical && !route.startsWith('/admin'))
      issues.push(`${route}: canonical (${canonical}) != expected (${expectedCanonical})`);
  }

  if (!route.startsWith('/admin')) {
    for (const key of [
      'og:type',
      'og:title',
      'og:description',
      'og:url',
      'og:image',
      'og:image:width',
      'og:image:height',
      'og:image:alt',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
    ]) {
      if (!meta('property', key) && !meta('name', key))
        issues.push(`${route}: missing ${key}`);
    }
    const ogUrl = meta('property', 'og:url');
    if (ogUrl && canonical && ogUrl !== canonical)
      issues.push(`${route}: og:url (${ogUrl}) != canonical (${canonical})`);
    if (meta('name', 'twitter:card') !== 'summary_large_image')
      issues.push(`${route}: twitter:card should be summary_large_image`);
    if (meta('property', 'og:image:width') !== '1200')
      issues.push(`${route}: og:image:width != 1200`);
    if (meta('property', 'og:image:height') !== '630')
      issues.push(`${route}: og:image:height != 630`);
  }

  const ld = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  if (!ld.length && !route.startsWith('/admin')) issues.push(`${route}: missing JSON-LD`);
  for (const block of ld) {
    try {
      const parsed = JSON.parse(block[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item['@type'] === 'Organization') {
          if (!item['@id']?.startsWith(EXPECTED_ORIGIN))
            issues.push(`${route}: Organization @id missing or wrong origin (${item['@id']})`);
          if (!Array.isArray(item.sameAs) || item.sameAs.length === 0)
            issues.push(`${route}: Organization missing sameAs social profiles`);
        }
        if (item['@type'] === 'WebSite') {
          if (!item['@id']?.startsWith(EXPECTED_ORIGIN))
            issues.push(`${route}: WebSite @id missing or wrong origin (${item['@id']})`);
        }
        if (item['@type'] === 'JobPosting') {
          if (item.validThrough !== RECRUITMENT_CAMPAIGN.endDate)
            issues.push(
              `${route}: JobPosting validThrough (${item.validThrough}) != campaign end (${RECRUITMENT_CAMPAIGN.endDate})`,
            );
          if (item.datePosted !== RECRUITMENT_CAMPAIGN.datePosted)
            issues.push(
              `${route}: JobPosting datePosted (${item.datePosted}) != original date (${RECRUITMENT_CAMPAIGN.datePosted})`,
            );
        }
      }
    } catch {
      issues.push(`${route}: invalid JSON-LD`);
    }
  }
}

// OG image exists in dist and is 1200×630
const ogPath = join(DIST, 'og/og-default.jpg');
if (!existsSync(ogPath)) issues.push('dist/og/og-default.jpg missing');
else {
  const meta = await sharp(ogPath).metadata();
  if (meta.width !== 1200 || meta.height !== 630)
    issues.push(
      `og-default.jpg is ${meta.width}x${meta.height}, expected 1200x630`,
    );
  const size = (await stat(ogPath)).size;
  if (size > 1_000_000) issues.push(`og-default.jpg too large (${size} bytes)`);
}

// robots.txt
const robotsPath = join(DIST, 'robots.txt');
if (!existsSync(robotsPath)) issues.push('dist/robots.txt missing');
else {
  const robots = await readFile(robotsPath, 'utf8');
  if (!/User-agent: \*/i.test(robots)) issues.push('robots.txt: no user-agent');
  if (!/Sitemap: https:\/\//.test(robots))
    issues.push('robots.txt: missing absolute Sitemap');
  if (!robots.includes(`Sitemap: ${EXPECTED_ORIGIN}/sitemap.xml`))
    issues.push(`robots.txt: missing sitemap for ${EXPECTED_ORIGIN}`);
}

// Sitemap validation
let sitemapXml = '';
if (process.env.PREVIEW_URL) {
  const sitemapRes = await fetch(new URL('/sitemap.xml', process.env.PREVIEW_URL));
  assert.equal(sitemapRes.status, 200, 'sitemap.xml status');
  sitemapXml = await sitemapRes.text();
} else {
  // Test local visibility against sitemap builder
  try {
    const visibility = await loadVisibility();
    sitemapXml = buildSitemapXml(VISIBILITY_PAGES, visibility, EXPECTED_ORIGIN);
  } catch {
    // If upstream visibility unavailable locally, use snapshot
    const snapshot = JSON.parse(
      await readFile(
        new URL('../src/data/site-visibility-snapshot.json', import.meta.url),
        'utf8',
      ),
    );
    sitemapXml = buildSitemapXml(VISIBILITY_PAGES, snapshot, EXPECTED_ORIGIN);
  }
}

if (!sitemapXml) issues.push('sitemap.xml generation failed');
else {
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.some((loc) => new URL(loc).pathname.startsWith('/admin')))
    issues.push('admin included in sitemap');
  for (const loc of locs) {
    if (!loc.startsWith(EXPECTED_ORIGIN))
      issues.push(`sitemap url wrong origin: ${loc}`);
    if (!loc.endsWith('/'))
      issues.push(`sitemap url missing trailing slash: ${loc}`);
  }
}

if (issues.length) {
  console.log(`SEO AUDIT FAILED (${issues.length}):`);
  for (const i of issues) console.log('  - ' + i);
  process.exit(1);
}
console.log(
  `SEO AUDIT PASS — ${documents.length} pages audited, canonical origin ${EXPECTED_ORIGIN}, robots + sitemap + schema OK.`,
);
