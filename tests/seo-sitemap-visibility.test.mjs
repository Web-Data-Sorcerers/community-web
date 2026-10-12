import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VISIBILITY_PAGES,
  defaultVisibility,
} from '../src/data/site-visibility-registry.mjs';
import {
  buildSitemapXml,
  handleSitemapRequest,
  handleSitemapIndexRequest,
} from '../server/sitemap.mjs';
import { canonicalUrl } from '../src/data/site-url.mjs';
import { RECRUITMENT_CAMPAIGN } from '../src/data/recruitment-campaign.mjs';
import { roles } from '../src/data/roles.ts';

test('canonicalUrl generates consistent query-free canonicals matching registry', () => {
  const origin = 'https://community.data-sorcerers.com';
  assert.equal(canonicalUrl('/', origin), 'https://community.data-sorcerers.com/');
  assert.equal(canonicalUrl('/recruitment', origin), 'https://community.data-sorcerers.com/recruitment/');
  assert.equal(canonicalUrl('/recruitment/', origin), 'https://community.data-sorcerers.com/recruitment/');
  assert.equal(
    canonicalUrl('/recruitment/roles/data?ref=share', origin),
    'https://community.data-sorcerers.com/recruitment/roles/data/',
  );
  assert.equal(canonicalUrl('/sitemap.xml', origin), 'https://community.data-sorcerers.com/sitemap.xml');
  assert.equal(canonicalUrl('/#organization', origin), 'https://community.data-sorcerers.com/#organization');
});

test('sitemap reflects visibility state: disabled and parent-disabled pages excluded', () => {
  const origin = 'https://community.data-sorcerers.com';
  const config = defaultVisibility();

  // In default config: about and hall-of-frames are disabled (false).
  // All other pages are enabled: home(1), recruitment(1), partners(1), contact(1), 6 hods, 6 roles, 1 apply = 17 pages.
  const xml = buildSitemapXml(VISIBILITY_PAGES, config, origin);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  assert.ok(!locs.includes('https://community.data-sorcerers.com/about/'));
  assert.ok(!locs.includes('https://community.data-sorcerers.com/hall-of-frames/'));
  assert.ok(!locs.includes('https://community.data-sorcerers.com/recruitment/apply/'));
  assert.ok(locs.includes('https://community.data-sorcerers.com/'));
  assert.ok(locs.includes('https://community.data-sorcerers.com/recruitment/'));
  assert.ok(locs.includes('https://community.data-sorcerers.com/recruitment/roles/data/'));

  // Test dynamic update: if partners is disabled, it is excluded
  const configWithDisabledPartners = structuredClone(config);
  configWithDisabledPartners.pages['partners'].enabled = false;
  const xml2 = buildSitemapXml(VISIBILITY_PAGES, configWithDisabledPartners, origin);
  const locs2 = [...xml2.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(!locs2.includes('https://community.data-sorcerers.com/partners/'));

  // Test parent inheritance: if recruitment is disabled, all roles and apply are excluded
  const configWithDisabledRecruitment = structuredClone(config);
  configWithDisabledRecruitment.pages['recruitment'].enabled = false;
  const xml3 = buildSitemapXml(VISIBILITY_PAGES, configWithDisabledRecruitment, origin);
  const locs3 = [...xml3.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(!locs3.includes('https://community.data-sorcerers.com/recruitment/'));
  assert.ok(!locs3.includes('https://community.data-sorcerers.com/recruitment/roles/data/'));
  assert.ok(!locs3.includes('https://community.data-sorcerers.com/recruitment/apply/'));
});

test('sitemap handlers return valid XML with no-store headers and fail closed on upstream error', async () => {
  const site = new URL('https://community.data-sorcerers.com');
  const mockConfig = defaultVisibility();

  const successRes = await handleSitemapRequest({
    site,
    loadVisibilityImpl: async () => mockConfig,
  });
  assert.equal(successRes.status, 200);
  assert.equal(successRes.headers.get('content-type'), 'application/xml; charset=utf-8');
  assert.equal(successRes.headers.get('cache-control'), 'no-store');
  assert.equal(successRes.headers.get('x-visibility-revision'), mockConfig.revision);

  const text = await successRes.text();
  assert.ok(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(text.includes('<urlset'));

  const indexRes = await handleSitemapIndexRequest({
    site,
    loadVisibilityImpl: async () => mockConfig,
  });
  assert.equal(indexRes.status, 200);
  const indexText = await indexRes.text();
  assert.ok(indexText.includes('<sitemapindex'));
  assert.ok(indexText.includes('https://community.data-sorcerers.com/sitemap.xml'));

  // Upstream error test: fail closed with 503
  const failRes = await handleSitemapRequest({
    site,
    loadVisibilityImpl: async () => {
      throw new Error('Supabase unreachable');
    },
  });
  assert.equal(failRes.status, 503);
  assert.equal(failRes.headers.get('retry-after'), '5');
});

test('campaign dates are unified across RECRUITMENT_CAMPAIGN and roles', () => {
  assert.equal(RECRUITMENT_CAMPAIGN.endDate, '2026-11-12');
  assert.equal(RECRUITMENT_CAMPAIGN.deadlineText, 'Deadline: 12 November 2026');
  for (const role of roles) {
    assert.equal(role.deadline, 'Deadline: 12 November 2026');
  }
});

test('legacy host redirect preserves query and path but excludes admin/api/preview', async () => {
  const { getLegacyHostRedirect } = await import('../src/data/site-url.mjs');

  // Legacy public host redirect
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-sigma.vercel.app/'),
    'https://community.data-sorcerers.com/',
  );
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-sigma.vercel.app/recruitment/?role=data'),
    'https://community.data-sorcerers.com/recruitment/?role=data',
  );

  // Admin routes excluded
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-sigma.vercel.app/admin'),
    null,
  );
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-sigma.vercel.app/admin/recruitment'),
    null,
  );

  // API routes excluded
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-sigma.vercel.app/api/media'),
    null,
  );

  // Canonical custom host not redirected (no loop)
  assert.equal(
    getLegacyHostRedirect('https://community.data-sorcerers.com/recruitment/'),
    null,
  );

  // Preview deployments not redirected
  assert.equal(
    getLegacyHostRedirect('https://data-sorcerers-community-preview-123.vercel.app/recruitment/'),
    null,
  );

  // Localhost not redirected
  assert.equal(
    getLegacyHostRedirect('http://localhost:4321/recruitment/'),
    null,
  );
});
