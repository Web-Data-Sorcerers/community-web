import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeProjectImage,
  verifyProjectMedia,
  MEDIA_INPUT_LIMIT,
} from '../server/cms-media.mjs';
import { syncCmsSnapshot } from '../scripts/cms-client.mjs';
import { createAdminHandler } from '../server/cms-admin.mjs';
const baseline = JSON.parse(
  await readFile(new URL('../src/data/cms-snapshot.json', import.meta.url)),
);
const raster = (format = 'png') =>
  sharp({
    create: { width: 64, height: 48, channels: 3, background: '#9b7bff' },
  })
    .toFormat(format)
    .toBuffer();

const teamRpc = (snapshot = baseline) => {
  const members = [];
  const groups = [];
  for (const ht of snapshot.team.hodsTeams) {
    groups.push({ id: ht.id, title: ht.title });
    for (const [i, m] of ht.members.entries()) {
      members.push({
        id: ht.id + '-' + (i + 1),
        group: ht.id,
        name: m.name,
        role: m.role,
        photo: m.photo,
        order: i + 1,
      });
    }
  }
  for (const [i, m] of snapshot.team.leaderTeam.entries()) {
    members.push({
      id: 'leader-' + (i + 1),
      group: 'leader',
      name: m.name,
      role: m.role,
      photo: m.photo,
      order: i + 1,
    });
  }
  groups.unshift({ id: 'leader', title: '' });
  return {
    members,
    groups,
    revision: 'a'.repeat(64),
    photoPresets: ['marchel', 'zidan-rose'],
    minMembers: 1,
    maxMembers: 8,
    minGroups: 7,
    publicationPending: false,
    affectedId: null,
  };
};

test('media normalizes raster uploads, bounds pixels/bytes and verifies hash and decode', async () => {
  for (const format of ['png', 'jpeg', 'webp']) {
    const media = await normalizeProjectImage(
      await raster(format),
      'image/' + format,
    );
    assert.match(media.image, /^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/);
    const bytes = await verifyProjectMedia(media, media.image);
    assert.equal((await sharp(bytes).metadata()).format, 'webp');
    await assert.rejects(
      verifyProjectMedia(
        { ...media, data: Buffer.from('wrong').toString('base64') },
        media.image,
      ),
    );
    await assert.rejects(
      verifyProjectMedia(media, '/images/cms/projects/../bad.webp'),
    );
  }
  for (const [bytes, mime] of [
    [Buffer.from('<svg/>'), 'image/png'],
    [await raster(), 'image/jpeg'],
    [Buffer.alloc(MEDIA_INPUT_LIMIT + 1), 'image/png'],
    [Buffer.from('bad'), 'text/html'],
  ])
    await assert.rejects(normalizeProjectImage(bytes, mime));
  const large = await sharp({
    create: { width: 5000, height: 4000, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  await assert.rejects(normalizeProjectImage(large, 'image/png'));
  const raw = Buffer.alloc(64 * 96 * 3, 200);
  raw.fill(50, 64 * 48 * 3);
  const animated = await sharp(raw, {
    raw: { width: 64, height: 96, channels: 3, pageHeight: 48 },
  })
    .webp()
    .toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);
  await assert.rejects(normalizeProjectImage(animated, 'image/webp'));
});

test('prebuild caches verified private media before atomic snapshot write, refetches corrupt cache, preserves snapshot on failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-cms-media-'));
  try {
    const media = await normalizeProjectImage(await raster(), 'image/png');
    const changed = structuredClone(baseline);
    changed.projects[0].image = media.image;
    const snapshotPath = join(dir, 'snapshot.json');
    await writeFile(snapshotPath, JSON.stringify(baseline));
    let bad = true,
      mediaCalls = 0;
    const options = {
      snapshotPath,
      mediaRoot: join(dir, 'public'),
      env: {
        SUPABASE_URL: 'https://placeholder.supabase.co',
        SUPABASE_ANON_KEY: 'placeholder',
        SUPABASE_SERVICE_ROLE_KEY: 'private-build-test',
      },
      fetchImpl: async (url, requestOptions) => {
        const href = typeof url === 'string' ? url : url.href;
        if (href.includes('/rest/v1/rpc/'))
          assert.equal(
            requestOptions.headers.Authorization,
            'Bearer placeholder',
          );
        if (href.includes('/rest/v1/rpc/cms_load_projects'))
          return Response.json(changed);
        if (href.includes('/rest/v1/rpc/cms_load_team'))
          return Response.json(teamRpc());
        if (href.includes('/rest/v1/rpc/cms_load_partners'))
          return Response.json({ partners: baseline.partners });
        if (href.includes('/rest/v1/rpc/cms_load_hods'))
          return Response.json({ hods: baseline.hods });
        if (href.includes('/rest/v1/rpc/cms_load_domains'))
          return Response.json({ domains: baseline.domains });
        if (href.includes('/rest/v1/rpc/cms_load_roles'))
          return Response.json({ roles: baseline.roles });
        if (href.includes('/storage/v1/object/cms-media/')) {
          assert.equal(
            requestOptions.headers.Authorization,
            'Bearer private-build-test',
          );
          mediaCalls++;
          return bad
            ? new Response(null, { status: 404 })
            : new Response(Buffer.from(media.data, 'base64'), {
                headers: { 'Content-Type': 'image/webp' },
              });
        }
        assert.fail('Unexpected non-Supabase request');
        const parsed = new URL(href);
        if (parsed.searchParams.get('action') === 'media') {
          mediaCalls++;
          return Response.json(
            bad ? { error: { code: 'INVALID_CMS_DATA' } } : media,
          );
        }
        return Response.json(changed);
      },
    };
    await assert.rejects(
      syncCmsSnapshot({
        ...options,
        env: { ...options.env, SUPABASE_SERVICE_ROLE_KEY: undefined },
      }),
      /Media fetch requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/,
    );
    assert.equal(mediaCalls, 0);
    await assert.rejects(
      syncCmsSnapshot(options),
      /media (fetch or validation failed|fetch failed)/,
    );
    assert.deepEqual(JSON.parse(await readFile(snapshotPath)), baseline);
    bad = false;
    await syncCmsSnapshot(options);
    assert.deepEqual(JSON.parse(await readFile(snapshotPath)), changed);
    const cached = join(dir, 'public', media.image.slice(1));
    assert.equal(
      createHash('sha256')
        .update(await readFile(cached))
        .digest('hex'),
      media.image.split('/').at(-1).slice(0, 64),
    );
    const count = mediaCalls;
    await syncCmsSnapshot(options);
    assert.equal(mediaCalls, count);
    await writeFile(cached, 'corrupt');
    await syncCmsSnapshot(options);
    assert.equal(mediaCalls, count + 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('native media route enforces session/CSRF, normalizes Storage uploads and serves private preview', async () => {
  const origin = 'https://admin.example.test';
  const png = await raster();
  const expected = await normalizeProjectImage(png, 'image/png');
  const env = {
    NODE_ENV: 'production',
    CMS_ADMIN_ORIGIN: origin,
    CMS_ADMIN_SESSION_SECRET: Buffer.alloc(32).toString('base64'),
    SUPABASE_URL: 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY: 'placeholder-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
    SUPABASE_ACCESS_TOKEN: 'placeholder',
  };
  const data = {
    projects: baseline.projects,
    revision: 'a'.repeat(64),
    imagePresets: baseline.projects.map((p) => p.image),
    minProjects: 1,
    maxProjects: 8,
    publicationPending: false,
  };
  const calls = [];
  const handle = createAdminHandler({
    env,
    fetchImpl: async (url, options) => {
      const href = String(url);
      if (href.includes('/auth/v1/token'))
        return Response.json({
          access_token: 'private-access',
          refresh_token: 'private-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: '11111111-1111-1111-1111-111111111111' },
        });
      if (href.includes('/auth/v1/user'))
        return Response.json({
          id: '11111111-1111-1111-1111-111111111111',
          email: 'owner@example.test',
        });
      if (href.includes('cms_verify_admin'))
        return Response.json({ ok: true, email: 'owner@example.test' });
      if (href.includes('cms_rate_limit'))
        return Response.json({ ok: true, limited: false });
      if (typeof url === 'string' && url.includes('/rest/v1/rpc/'))
        return Response.json(data);
      if (typeof url === 'string' && url.includes('/storage/v1/')) {
        if (options.method === 'POST') {
          assert.deepEqual(
            Buffer.from(options.body),
            Buffer.from(expected.data, 'base64'),
          );
          assert.equal(options.headers['x-upsert'], 'true');
          calls.push({ storageUpload: url });
        }
        return new Response(Buffer.from(expected.data, 'base64'), {
          headers: { 'Content-Type': 'image/webp' },
        });
      }
      assert.fail('Unexpected request outside Supabase');
    },
  });
  const req = (path, options) => new Request(origin + path, options);
  assert.equal(
    (
      await handle(
        req('/api/admin/media', { method: 'POST', body: png }),
        'media',
      )
    ).status,
    401,
  );
  const loginResponse = await handle(
    req('/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.test', password: 'pw' }),
    }),
    'login',
  );
  const cookie = loginResponse.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  const loaded = await (
    await handle(req('/projects', { headers: { Cookie: cookie } }), 'projects')
  ).json();
  const headers = {
    Cookie: cookie,
    Origin: origin,
    'X-CSRF-Token': loaded.csrf,
    'Content-Type': 'image/png',
  };
  assert.equal(
    (
      await handle(
        req('/media', {
          method: 'POST',
          headers: { Cookie: cookie },
          body: png,
        }),
        'media',
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        req('/media', { method: 'POST', headers, body: '<svg/>' }),
        'media',
      )
    ).status,
    400,
  );
  const uploaded = await (
    await handle(req('/media', { method: 'POST', headers, body: png }), 'media')
  ).json();
  assert.equal(uploaded.data.image, expected.image);
  const preview = await handle(
    req('/media?image=' + encodeURIComponent(expected.image), {
      headers: { Cookie: cookie },
    }),
    'media',
  );
  assert.equal(preview.headers.get('Content-Type'), 'image/webp');
  assert.deepEqual(
    Buffer.from(await preview.arrayBuffer()),
    Buffer.from(expected.data, 'base64'),
  );
  assert.equal(
    calls.filter((c) => c.storageUpload?.includes('/cms-media/projects/'))
      .length,
    1,
  );
});

test('Team private media uses its namespace and is cached before atomic snapshot write', async () => {
  const media = await normalizeProjectImage(
    await raster(),
    'image/png',
    'team',
  );
  assert.match(media.image, /^\/images\/cms\/team\/[a-f0-9]{64}\.webp$/);
  const snapshot = structuredClone(baseline);
  snapshot.team.leaderTeam[0].photo = media.image;
  const dir = await mkdtemp(join(tmpdir(), 'ds-team-cache-'));
  try {
    const path = join(dir, 'snapshot.json');
    await writeFile(path, JSON.stringify(baseline));
    const options = {
      snapshotPath: path,
      mediaRoot: join(dir, 'public'),
      env: {
        SUPABASE_URL: 'https://placeholder.supabase.co',
        SUPABASE_ANON_KEY: 'placeholder',
        SUPABASE_SERVICE_ROLE_KEY: 'private-build-test',
      },
      fetchImpl: async (url, requestOptions) => {
        const href = typeof url === 'string' ? url : url.href;
        if (href.includes('/rest/v1/rpc/'))
          assert.equal(
            requestOptions.headers.Authorization,
            'Bearer placeholder',
          );
        if (href.includes('/rest/v1/rpc/cms_load_projects'))
          return Response.json(snapshot);
        if (href.includes('/rest/v1/rpc/cms_load_team'))
          return Response.json(teamRpc(snapshot));
        if (href.includes('/rest/v1/rpc/cms_load_partners'))
          return Response.json({ partners: baseline.partners });
        if (href.includes('/rest/v1/rpc/cms_load_hods'))
          return Response.json({ hods: baseline.hods });
        if (href.includes('/rest/v1/rpc/cms_load_domains'))
          return Response.json({ domains: baseline.domains });
        if (href.includes('/rest/v1/rpc/cms_load_roles'))
          return Response.json({ roles: snapshot.roles });
        if (href.includes('/storage/v1/object/cms-media/')) {
          assert.equal(
            requestOptions.headers.Authorization,
            'Bearer private-build-test',
          );
          return new Response(Buffer.from(media.data, 'base64'), {
            headers: { 'Content-Type': 'image/webp' },
          });
        }
        assert.fail('Unexpected non-Supabase request');
      },
    };
    await syncCmsSnapshot(options);
    assert.deepEqual(
      await readFile(join(dir, 'public', media.image.slice(1))),
      Buffer.from(media.data, 'base64'),
    );
    await writeFile(join(dir, 'public', media.image.slice(1)), 'corrupt');
    options.fetchImpl = async (url) => {
      const href = typeof url === 'string' ? url : url.href;
      if (href.includes('/rest/v1/rpc/cms_load_projects'))
        return Response.json(snapshot);
      if (href.includes('/rest/v1/rpc/cms_load_team'))
        return Response.json(teamRpc(snapshot));
      if (href.includes('/rest/v1/rpc/cms_load_partners'))
        return Response.json({ partners: baseline.partners });
      if (href.includes('/rest/v1/rpc/cms_load_hods'))
        return Response.json({ hods: baseline.hods });
      if (href.includes('/rest/v1/rpc/cms_load_domains'))
        return Response.json({ domains: baseline.domains });
      if (href.includes('/rest/v1/rpc/cms_load_roles'))
        return Response.json({ roles: snapshot.roles });
      if (href.includes('/storage/v1/object/cms-media/'))
        return new Response(null, { status: 404 });
      assert.fail('Unexpected non-Supabase request');
    };
    await assert.rejects(
      syncCmsSnapshot(options),
      /media (fetch or validation failed|fetch failed)/,
    );
    assert.deepEqual(JSON.parse(await readFile(path)), snapshot);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('native Team media route enforces session/CSRF, normalizes Storage uploads and serves private preview', async () => {
  const origin = 'https://admin.example.test';
  const png = await raster();
  const expected = await normalizeProjectImage(png, 'image/png', 'team');
  const env = {
    NODE_ENV: 'production',
    CMS_ADMIN_ORIGIN: origin,
    CMS_ADMIN_SESSION_SECRET: Buffer.alloc(32).toString('base64'),
    SUPABASE_URL: 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY: 'placeholder-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
    SUPABASE_ACCESS_TOKEN: 'placeholder',
  };
  const data = {
    projects: baseline.projects,
    revision: 'a'.repeat(64),
    imagePresets: baseline.projects.map((p) => p.image),
    minProjects: 1,
    maxProjects: 8,
    publicationPending: false,
  };
  const calls = [];
  const handle = createAdminHandler({
    env,
    fetchImpl: async (url, options) => {
      const href = String(url);
      if (href.includes('/auth/v1/token'))
        return Response.json({
          access_token: 'private-access',
          refresh_token: 'private-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: '11111111-1111-1111-1111-111111111111' },
        });
      if (href.includes('/auth/v1/user'))
        return Response.json({
          id: '11111111-1111-1111-1111-111111111111',
          email: 'owner@example.test',
        });
      if (href.includes('cms_verify_admin'))
        return Response.json({ ok: true, email: 'owner@example.test' });
      if (href.includes('cms_rate_limit'))
        return Response.json({ ok: true, limited: false });
      if (typeof url === 'string' && url.includes('/rest/v1/rpc/'))
        return Response.json(data);
      if (typeof url === 'string' && url.includes('/storage/v1/')) {
        if (options.method === 'POST') {
          assert.deepEqual(
            Buffer.from(options.body),
            Buffer.from(expected.data, 'base64'),
          );
          assert.equal(options.headers['x-upsert'], 'true');
          calls.push({ storageUpload: url });
        }
        return new Response(Buffer.from(expected.data, 'base64'), {
          headers: { 'Content-Type': 'image/webp' },
        });
      }
      assert.fail('Unexpected request outside Supabase');
    },
  });
  const req = (path, options) => new Request(origin + path, options);
  assert.equal(
    (
      await handle(
        req('/api/admin/media', { method: 'POST', body: png }),
        'media',
      )
    ).status,
    401,
  );
  const loginResponse = await handle(
    req('/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.test', password: 'pw' }),
    }),
    'login',
  );
  const cookie = loginResponse.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  const loaded = await (
    await handle(req('/projects', { headers: { Cookie: cookie } }), 'projects')
  ).json();
  const headers = {
    Cookie: cookie,
    Origin: origin,
    'X-CSRF-Token': loaded.csrf,
    'Content-Type': 'image/png',
  };
  assert.equal(
    (
      await handle(
        req('/media?collection=team', {
          method: 'POST',
          headers: { Cookie: cookie },
          body: png,
        }),
        'media',
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        req('/media?collection=team', {
          method: 'POST',
          headers,
          body: '<svg/>',
        }),
        'media',
      )
    ).status,
    400,
  );
  const uploaded = await (
    await handle(
      req('/media?collection=team', { method: 'POST', headers, body: png }),
      'media',
    )
  ).json();
  assert.equal(uploaded.data.image, expected.image);
  const preview = await handle(
    req('/media?collection=team&image=' + encodeURIComponent(expected.image), {
      headers: { Cookie: cookie },
    }),
    'media',
  );
  assert.equal(preview.headers.get('Content-Type'), 'image/webp');
  assert.deepEqual(
    Buffer.from(await preview.arrayBuffer()),
    Buffer.from(expected.data, 'base64'),
  );
  assert.equal(
    calls.filter((c) => c.storageUpload?.includes('/cms-media/team/')).length,
    1,
  );
});
