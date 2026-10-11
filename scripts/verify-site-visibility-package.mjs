// Verify the shipped function without access to workspace node_modules.
// All backend/auth/save traffic is synthetic and unknown outbound is blocked.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import {
  defaultVisibility,
  VISIBILITY_PAGES,
} from '../src/data/site-visibility-registry.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:4352',
  dir = path.join(root, 'artifacts/site-visibility/package-verification');
await fs.mkdir(dir, { recursive: true });
Object.assign(process.env, {
  NODE_ENV: 'development',
  CMS_ADMIN_ORIGIN: origin,
  CMS_ADMIN_SESSION_SECRET: randomBytes(32).toString('base64'),
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: 'synthetic',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
  SUPABASE_ACCESS_TOKEN: 'synthetic',
  SITE_VISIBILITY_SOURCE: 'supabase',
  CMS_DATA_SOURCE: 'local',
});
let state = defaultVisibility(),
  allowed = true,
  writes = 0,
  reads = 0,
  unknown = 0;
const receipts = new Map();
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init),
    url = new URL(request.url);
  if (url.origin === 'https://placeholder.supabase.co') {
    if (url.pathname === '/auth/v1/token')
      return Response.json({
        access_token: 'synthetic',
        refresh_token: 'synthetic',
        expires_in: 3600,
        user: { id: '11111111-1111-1111-1111-111111111111' },
      });
    if (url.pathname === '/auth/v1/user')
      return Response.json({ id: '11111111-1111-1111-1111-111111111111' });
    if (url.pathname.endsWith('/cms_verify_admin'))
      return Response.json({ ok: allowed, email: 'owner@example.test' });
    if (url.pathname.endsWith('/cms_rate_limit_check'))
      return Response.json({ ok: true, limited: false });
    if (url.pathname.endsWith('/cms_rate_limit_reset'))
      return Response.json({ ok: true });
    if (url.pathname.endsWith('/site_visibility_load')) {
      reads++;
      return Response.json(state);
    }
  }
  if (
    url.origin === 'https://api.supabase.com' &&
    url.pathname === '/v1/projects/yejrdckcmlxrkklgtrwy/database/query'
  ) {
    const { query } = await request.json();
    assert.match(query, /^select public\.site_visibility_save\(/);
    writes++;
    const values = [...query.matchAll(/decode\('([a-f0-9]+)','hex'\)/g)].map(
      (m) => Buffer.from(m[1], 'hex').toString(),
    );
    assert.equal(values.length, 4);
    const [actor, revision, id, changes] = values;
    assert.equal(actor, '11111111-1111-1111-1111-111111111111');
    if (receipts.has(id)) return Response.json([{ result: receipts.get(id) }]);
    if (revision !== state.revision)
      return Response.json([
        { result: { ok: false, error: { code: 'CONFLICT' }, data: state } },
      ]);
    for (const c of JSON.parse(changes)) {
      const target = c.sectionId
        ? state.pages[c.pageId].sections
        : state.pages[c.pageId];
      target[c.sectionId || 'enabled'] = c.enabled;
    }
    state.revision = randomUUID();
    const result = { ok: true, data: structuredClone(state) };
    receipts.set(id, result);
    return Response.json([{ result }]);
  }
  unknown++;
  throw Error('Unexpected outbound request blocked');
};
const packed = await fs.mkdtemp('/tmp/ds-vis-packed-after-');
await fs.cp(path.join(root, '.vercel/output/functions/_render.func'), packed, {
  recursive: true,
});
const vc = JSON.parse(await fs.readFile(packed + '/.vc-config.json'));
const { default: app } = await import(packed + '/' + vc.handler);
const send = (path, options = {}) =>
  app.fetch(new Request(origin + path, options));
const results = [];
for (const path of [
  '/api/admin/site-visibility',
  '/api/admin/projects',
  '/api/admin/team',
  '/api/admin/recruitment/applications',
]) {
  const r = await send(path);
  assert.equal(r.status, 401);
  results.push({ path, status: r.status });
}
const login = await send('/api/admin/auth/login', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'owner@example.test', password: 'synthetic' }),
});
assert.equal(login.status, 200);
const csrf = (await login.json()).csrf,
  cookie = login.headers
    .getSetCookie()
    .map((x) => x.split(';')[0])
    .join('; ');
const headers = {
  Cookie: cookie,
  Origin: origin,
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrf,
};
const get = await send('/api/admin/site-visibility', { headers });
assert.equal(get.status, 200);
const initial = (await get.json()).data;
assert.equal(Object.keys(initial.pages).length, 19);
assert.equal(
  Object.values(initial.pages).reduce(
    (count, page) => count + Object.keys(page.sections).length,
    0,
  ),
  21,
);
const revisionResponse = await send('/api/site-visibility/revision');
assert.equal(revisionResponse.status, 200);
assert.equal((await revisionResponse.json()).revision, initial.revision);
const body = JSON.stringify({
  operation: 'save',
  payload: {
    expectedRevision: initial.revision,
    requestId: randomUUID(),
    changes: [{ pageId: 'home', sectionId: 'projects', enabled: false }],
  },
});
for (const bad of [
  { Origin: 'https://evil.invalid' },
  { 'X-CSRF-Token': 'bad' },
]) {
  const r = await send('/api/admin/site-visibility', {
    method: 'POST',
    headers: { ...headers, ...bad },
    body,
  });
  assert.equal(r.status, 403);
  results.push({ guard: Object.keys(bad)[0], status: r.status });
}
assert.equal(writes, 0);
const save = await send('/api/admin/site-visibility', {
  method: 'POST',
  headers,
  body,
});
assert.equal(save.status, 200);
const changed = (await save.json()).data;
assert.equal(changed.pages.home.sections.projects, false);
assert.notEqual(changed.revision, initial.revision);
assert.equal(writes, 1);
const home = await send('/');
const html = await home.text();
assert.equal(home.status, 200);
assert.equal(home.headers.get('x-visibility-revision'), changed.revision);
assert.equal(html.includes('id="projects"'), false);
assert.equal(html.includes('href="#projects"'), false);
results.push({
  check: 'fixture save -> fresh SSR revision and Projects/Explore absent',
  pass: true,
});
allowed = false;
const denied = await send('/api/admin/site-visibility', { headers });
assert.equal(denied.status, 403);
assert.equal(writes, 1);
allowed = true;
const restore = await send('/api/admin/site-visibility', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    operation: 'save',
    payload: {
      expectedRevision: state.revision,
      requestId: randomUUID(),
      changes: [{ pageId: 'home', sectionId: 'projects', enabled: true }],
    },
  }),
});
assert.equal(restore.status, 200);
for (const p of VISIBILITY_PAGES) {
  const r = await send(p.path);
  assert.equal(r.status, 200);
  for (const h of [
    'cache-control',
    'cdn-cache-control',
    'vercel-cdn-cache-control',
  ])
    assert.equal(r.headers.get(h), 'no-store');
  assert.equal(r.headers.get('x-visibility-revision'), state.revision);
  await r.body.cancel();
}
for (const path of ['/hods/not-a-domain/', '/recruitment/roles/not-a-role/'])
  assert.equal((await send(path)).status, 404);
assert.equal(unknown, 0);
assert.equal(state.pages.home.sections.projects, true);
const evidence = {
  scope:
    'isolated packed Node22 function outside workspace; real shared Auth with synthetic upstream; all unknown outbound blocked; no production credentials',
  results,
  publicRoutes: 19,
  login: true,
  permissionRecheck: true,
  finalProjects: true,
  syntheticWrites: writes,
  loaderReads: reads,
  unknownOutbound: unknown,
};
await fs.writeFile(
  dir + '/compiled-auth-routing.json',
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence));
