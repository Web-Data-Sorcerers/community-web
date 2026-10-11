// READ ONLY: provider GET, public GET and visibility loader RPC; never save.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createVisibilityLoader } from '../server/site-visibility.mjs';
import {
  VISIBILITY_PAGES,
  getPageState,
} from '../src/data/site-visibility-registry.mjs';
const dir =
  process.env.NAV_ARTIFACT_DIR || 'artifacts/navigation-performance-local';
await fs.mkdir(dir, { recursive: true });
const headers = { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN };
const team = 'team_r2F97SVy81OD2LcBIbqM6p8x';
const get = async (path) => {
  const r = await fetch('https://api.vercel.com' + path + '?teamId=' + team, {
    headers,
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw Error(path + ' ' + r.status);
  return r.json();
};
const p = await get('/v9/projects/prj_3KbX29t6DYN1RMTy88lKHXd0IUVE');
const d = await get('/v13/deployments/' + p.targets.production.id);
const alias = await get(
  '/v4/aliases/data-sorcerers-community-sigma.vercel.app',
);
const cfg = await createVisibilityLoader()();
assert.equal(d.readyState, 'READY');
assert.equal(alias.deploymentId || alias.deployment?.id, d.id);
assert.equal(d.nodeVersion, '22.x');
assert.equal(JSON.parse(d.meta.lambdaRuntimeStats).nodejs, 12);
assert.equal(
  d.lambdas.reduce((n, lambda) => n + (lambda.output?.length || 0), 0),
  12,
);
if (process.env.NAV_EXPECT_SHA)
  assert.equal(d.meta.githubCommitSha, process.env.NAV_EXPECT_SHA);
if (process.env.NAV_EXPECT_REGION)
  assert.deepEqual(d.regions, [process.env.NAV_EXPECT_REGION]);
const dbResponse = await fetch(
  'https://api.supabase.com/v1/projects/yejrdckcmlxrkklgtrwy',
  {
    headers: { Authorization: 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN },
    signal: AbortSignal.timeout(30000),
  },
);
assert.equal(dbResponse.status, 200);
const db = await dbResponse.json();
assert.equal(db.status, 'ACTIVE_HEALTHY');
assert.equal(db.region, 'ap-southeast-1');
assert.equal(Object.keys(cfg.pages).length, 19);
assert.equal(
  Object.values(cfg.pages).reduce(
    (n, page) => n + Object.keys(page.sections).length,
    0,
  ),
  21,
);
assert.equal(cfg.pages.home.enabled, true);
const routes = [];
let cms;
for (const path of [
  ...VISIBILITY_PAGES.map((page) => page.path),
  '/admin',
  '/admin/',
  '/admin/team',
  '/admin/team/',
  '/admin/recruitment',
  '/admin/recruitment/',
  '/api/admin/site-visibility',
  '/api/admin/projects',
  '/api/admin/team',
  '/api/admin/recruitment/applications',
  '/api/site-visibility/revision',
  '/api/cms/content',
  '/api/recruitment/application',
]) {
  const r = await fetch(
    'https://data-sorcerers-community-sigma.vercel.app' + path,
    { cache: 'no-store', signal: AbortSignal.timeout(30000) },
  );
  const body = await r.text();
  assert.equal(r.status, path.startsWith('/api/admin/') ? 401 : 200, path);
  assert.match(r.headers.get('cache-control') || '', /no-store/, path);
  const page = VISIBILITY_PAGES.find((page) => page.path === path);
  if (page) {
    assert.equal(r.headers.get('x-visibility-revision'), cfg.revision, path);
    assert.equal(
      body.includes('id="chamber-title"'),
      !getPageState(cfg, page.id),
      path,
    );
    assert.equal(r.headers.get('cdn-cache-control'), 'no-store', path);
    assert.ok(
      ['MISS', 'BYPASS'].includes(r.headers.get('x-vercel-cache')),
      path,
    );
    assert.ok(
      !body.includes('Local review fixture') &&
        !r.headers.has('x-local-review-fixture'),
      path,
    );
    if (process.env.NAV_EXPECT_REGION)
      assert.equal(
        r.headers.get('x-vercel-id')?.split('::')[1],
        process.env.NAV_EXPECT_REGION,
        path + ' compute',
      );
  }
  if (path.startsWith('/admin'))
    assert.match(r.headers.get('x-robots-tag') || '', /noindex/, path);
  if (path === '/')
    assert.equal(
      body.includes('id="projects"'),
      cfg.pages.home.sections.projects,
      path,
    );
  if (path === '/api/site-visibility/revision')
    assert.equal(JSON.parse(body).revision, cfg.revision);
  if (path === '/api/cms/content') {
    cms = JSON.parse(body);
    assert.equal(cms.source, 'supabase');
  }
  if (process.env.NAV_EXPECT_REGION && path.startsWith('/api/'))
    assert.equal(
      r.headers.get('x-vercel-id')?.split('::')[1],
      process.env.NAV_EXPECT_REGION,
      path + ' compute',
    );
  routes.push({
    path,
    status: r.status,
    cache: r.headers.get('cache-control'),
    robots: r.headers.get('x-robots-tag'),
    revision: r.headers.get('x-visibility-revision'),
    edge: r.headers.get('x-vercel-id'),
    projectsPresent: path === '/' ? body.includes('id="projects"') : undefined,
  });
}
const media = JSON.stringify(cms).match(
  /\/images\/cms\/[a-z-]+\/[a-f0-9]{64}\.webp/,
)?.[0];
assert.ok(media, 'existing public CMS media');
const mediaResponse = await fetch(
  'https://data-sorcerers-community-sigma.vercel.app' + media,
  { signal: AbortSignal.timeout(30000) },
);
assert.equal(mediaResponse.status, 200);
assert.match(mediaResponse.headers.get('content-type') || '', /image\/webp/);
const mediaBytes = (await mediaResponse.arrayBuffer()).byteLength;
for (const path of ['/hods/not-a-domain/', '/recruitment/roles/not-a-role/']) {
  const r = await fetch(
    'https://data-sorcerers-community-sigma.vercel.app' + path,
    { signal: AbortSignal.timeout(30000) },
  );
  await r.arrayBuffer();
  assert.equal(r.status, 404, path);
  routes.push({ path, status: r.status });
}
const evidence = {
  time: new Date().toISOString(),
  provider: {
    current: p.targets?.production?.id,
    sha: p.targets?.production?.meta?.githubCommitSha,
    defaultRegions: p.resourceConfig?.functionDefaultRegions,
    projectNode: p.nodeVersion,
  },
  deployment: {
    id: d.id,
    status: d.readyState,
    sha: d.meta?.githubCommitSha,
    url: d.url,
    alias: d.alias,
    node: d.nodeVersion,
    runtimeStats: d.meta?.lambdaRuntimeStats,
    regions: d.regions,
    lambdas: d.lambdas?.map((x) => ({
      region: x.region,
      runtime: x.runtime,
      outputs: x.output?.map((y) => ({
        path: y.path,
        runtime: y.lambda?.runtime,
      })),
    })),
    aliasDeploymentId: alias.deploymentId || alias.deployment?.id,
  },
  visibility: cfg,
  backend: { region: db.region, status: db.status },
  content: {
    source: cms.source,
    revision: cms.data?.revision,
    sha256: createHash('sha256').update(JSON.stringify(cms.data)).digest('hex'),
  },
  media: { path: media, status: mediaResponse.status, bytes: mediaBytes },
  routes,
};
await fs.writeFile(dir + '/preflight.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence));
