import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPublicMediaHandler,
  createPublicContentHandler,
} from '../server/cms-public.mjs';

test('public media handler: validates inputs and methods', async () => {
  const handler = createPublicMediaHandler({
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    },
    fetchImpl: async () => new Response('ok'),
  });

  // Non-GET
  const postRes = await handler(
    new Request('https://test/api/media', { method: 'POST' }),
  );
  assert.equal(postRes.status, 405);

  // Missing collection
  const noCol = await handler(
    new Request(
      'https://test/api/media?hash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    ),
  );
  assert.equal(noCol.status, 400);

  // Invalid collection
  const badCol = await handler(
    new Request(
      'https://test/api/media?collection=invalid&hash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    ),
  );
  assert.equal(badCol.status, 400);

  // Invalid hash
  const badHash = await handler(
    new Request('https://test/api/media?collection=team&hash=xyz'),
  );
  assert.equal(badHash.status, 400);
});

test('public media handler: serves upstream image with immutable cache headers', async () => {
  let requestedUrl = '';
  let authHeader = '';

  const validHash =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const dummyWebp = new Uint8Array([82, 73, 70, 70]);

  const handler = createPublicMediaHandler({
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'my-service-role-key',
    },
    fetchImpl: async (url, opts) => {
      requestedUrl = url;
      authHeader = opts.headers.Authorization;
      return new Response(dummyWebp, {
        status: 200,
        headers: { 'Content-Type': 'image/webp' },
      });
    },
  });

  const res = await handler(
    new Request(`https://test/api/media?collection=team&hash=${validHash}`),
  );

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/webp');
  assert.ok(res.headers.get('cache-control').includes('immutable'));
  assert.ok(res.headers.get('cache-control').includes('public'));
  assert.equal(authHeader, 'Bearer my-service-role-key');
  assert.ok(requestedUrl.includes(`/team/${validHash}.webp`));
});

test('public content handler: falls back gracefully to local snapshot when offline or local', async () => {
  const handler = createPublicContentHandler({
    env: { CMS_DATA_SOURCE: 'local' },
  });

  const res = await handler(new Request('https://test/api/cms/content'));
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.source, 'snapshot');
  assert.ok(Array.isArray(json.data.projects));
  assert.ok(json.data.team.leaderTeam.length > 0);
  assert.ok(
    res.headers.get('cache-control').includes('stale-while-revalidate'),
  );
});

test('public content handler: maps Supabase RPCs when online and falls back on error', async () => {
  const projectsMock = {
    projects: [
      {
        id: 'p1',
        title: 'Project 1',
        tags: ['Tag 1', 'Tag 2'],
        description: 'Desc',
        image: '/images/cms/projects/dummy.webp',
      },
    ],
    revision: 'rev-projects-1',
  };

  const teamMock = {
    groups: [
      { id: 'leader', title: 'Leader Team' },
      { id: 'data', title: 'Data Team' },
    ],
    members: [
      {
        id: 'm1',
        group: 'leader',
        order: 1,
        name: 'Lead 1',
        role: 'Role 1',
        photo: 'marchel',
      },
      {
        id: 'm2',
        group: 'data',
        order: 1,
        name: 'Data 1',
        role: 'Role 2',
        photo: 'zidan-rose',
      },
    ],
    revision: 'rev-team-1',
  };

  const handler = createPublicContentHandler({
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      CMS_DATA_SOURCE: 'supabase',
    },
    fetchImpl: async (url) => {
      if (url.includes('cms_load_projects')) {
        return Response.json(projectsMock);
      }
      if (url.includes('cms_load_team')) {
        return Response.json(teamMock);
      }
      return new Response('Not Found', { status: 404 });
    },
  });

  const res = await handler(new Request('https://test/api/cms/content'));
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.source, 'supabase');
  assert.equal(json.data.projects[0].id, 'p1');
  assert.equal(json.data.team.leaderTeam[0].name, 'Lead 1');
  assert.equal(json.data.team.hodsTeams[0].members[0].name, 'Data 1');
  assert.equal(json.data.revision, 'rev-projects-1:rev-team-1');
});
