import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { syncCmsSnapshot, CMS_MAX_BYTES } from '../scripts/cms-client.mjs';
import {
  normalizeProjectImage,
  MEDIA_OUTPUT_LIMIT,
} from '../server/cms-media.mjs';

const baseline = JSON.parse(
  await readFile(new URL('../src/data/cms-snapshot.json', import.meta.url)),
);
const remote = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'PRIVATE-anon',
};
const names = ['projects', 'team', 'roles', 'domains', 'hods', 'partners'];
function rpc(snapshot = baseline) {
  snapshot = structuredClone(snapshot);
  const groups = [
    { id: 'leader', title: '' },
    ...snapshot.team.hodsTeams.map(({ id, title }) => ({ id, title })),
  ];
  const members = [
    { id: 'leader', members: snapshot.team.leaderTeam },
    ...snapshot.team.hodsTeams,
  ].flatMap((g) =>
    g.members.map((m, i) => ({
      ...m,
      id: g.id + '-' + i,
      group: g.id,
      order: i + 1,
    })),
  );
  return Object.fromEntries(
    names.map((k) => [
      k,
      k === 'team'
        ? { groups, members, affectedId: null, revision: 'a'.repeat(64) }
        : { [k]: snapshot[k], affectedId: null, revision: 'a'.repeat(64) },
    ]),
  );
}
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), 'ds-supabase-build-'));
  const path = join(dir, 'snapshot.json'),
    original = JSON.stringify(baseline);
  await writeFile(path, original);
  try {
    await run({
      dir,
      path,
      original,
      options: {
        snapshotPath: path,
        mediaRoot: join(dir, 'public'),
        env: remote,
      },
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
function requests(data, calls) {
  return async (url, options) => {
    const u = new URL(url);
    assert.equal(u.origin, remote.SUPABASE_URL);
    assert.equal(options.headers.apikey, remote.SUPABASE_ANON_KEY);
    assert.equal(
      options.headers.Authorization,
      'Bearer ' + remote.SUPABASE_ANON_KEY,
    );
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    const name = u.pathname.split('cms_load_')[1];
    assert(names.includes(name));
    calls.push(name);
    return Response.json(data[name]);
  };
}

test('source matrix: offline and explicit local never fetch; deployment and partial config fail closed', async () => {
  await fixture(async ({ options, path, original }) => {
    const noFetch = () => assert.fail('Offline/config failure must not fetch');
    for (const env of [
      {},
      { CMS_API_URL: 'PRIVATE-invalid' },
      { CMS_API_TOKEN: 'PRIVATE-token' },
      { CMS_DATA_SOURCE: 'local', ...remote },
      { CMS_DATA_SOURCE: 'local', SUPABASE_URL: 'incidental' },
    ])
      assert.equal(
        await syncCmsSnapshot({ ...options, env, fetchImpl: noFetch }),
        'local',
      );
    for (const env of [
      { SUPABASE_URL: remote.SUPABASE_URL },
      { SUPABASE_ANON_KEY: 'PRIVATE-anon' },
      { CMS_DATA_SOURCE: 'supabase' },
      { CMS_DATA_SOURCE: 'gas' },
      { CMS_DATA_SOURCE: '' },
      { VERCEL: '1', ...remote },
      { VERCEL_ENV: 'preview', ...remote },
      { VERCEL_ENV: 'production', CMS_DATA_SOURCE: 'local', ...remote },
      { VERCEL: '1', CMS_DATA_SOURCE: 'supabase' },
      {
        ...remote,
        SUPABASE_URL:
          'https://user:PRIVATE-password@example.supabase.co/?PRIVATE-query',
      },
    ])
      await assert.rejects(
        syncCmsSnapshot({ ...options, env, fetchImpl: noFetch }),
        (e) => !e.message.includes('PRIVATE'),
      );
    assert.equal(await readFile(path, 'utf8'), original);
  });
});

test('six anon RPCs form a strict envelope; retained, absent and adversarial GAS config has zero requests', async () => {
  for (const extra of [
    {},
    { CMS_API_URL: 'PRIVATE-invalid' },
    { CMS_API_TOKEN: 'PRIVATE-token' },
    {
      CMS_API_URL: 'https://script.google.com/macros/s/id/exec',
      CMS_API_TOKEN: 'PRIVATE-token',
    },
    { CMS_DATA_SOURCE: 'supabase', VERCEL: '1' },
  ])
    await fixture(async ({ options, path, dir }) => {
      const calls = [],
        data = rpc();
      data.projects.projects[0] = {
        ...data.projects.projects[0],
        title: 'Supabase-only title',
      };
      assert.equal(
        await syncCmsSnapshot({
          ...options,
          env: { ...remote, ...extra },
          fetchImpl: requests(data, calls),
        }),
        'remote',
      );
      assert.deepEqual(calls, names);
      const actual = JSON.parse(await readFile(path));
      assert.deepEqual(actual, {
        ...baseline,
        projects: data.projects.projects,
      });
      assert.equal(Object.keys(actual).length, 7);
      assert.deepEqual(await readdir(dir), ['snapshot.json']);
    });
});

for (const name of names)
  test(`${name} RPC failures are bounded, sanitized, atomic and never fall back`, async () => {
    const failures = [
      () => new Response('PRIVATE-body', { status: 503 }),
      () => {
        throw new Error('PRIVATE-url-token');
      },
      () =>
        new Response('PRIVATE-json', {
          headers: { 'Content-Type': 'application/json' },
        }),
      () => Response.json(null),
      () => Response.json({}),
      () => Response.json({ [name]: null }),
      () => Response.json({ [name]: {} }),
      () =>
        new Response('PRIVATE-html', {
          headers: { 'Content-Type': 'text/html' },
        }),
      () =>
        new Response('x', {
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': String(CMS_MAX_BYTES + 1),
          },
        }),
      () =>
        new Response('x'.repeat(CMS_MAX_BYTES + 1), {
          headers: { 'Content-Type': 'application/json' },
        }),
      (_url, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener(
            'abort',
            () => reject(new Error('PRIVATE-timeout')),
            { once: true },
          ),
        ),
      (_url, { signal }) =>
        new Response(
          new ReadableStream({
            start(c) {
              signal.addEventListener(
                'abort',
                () => c.error(new Error('PRIVATE-body-timeout')),
                { once: true },
              );
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    ];
    for (const failure of failures)
      await fixture(async ({ options, path, original, dir }) => {
        const calls = [],
          normal = requests(rpc(), calls);
        await assert.rejects(
          syncCmsSnapshot({
            ...options,
            timeoutMs: 20,
            fetchImpl: (url, o) =>
              String(url).endsWith('cms_load_' + name)
                ? failure(url, o)
                : normal(url, o),
          }),
          (e) => {
            assert.equal(
              e.message,
              'Supabase RPC cms_load_' + name + ' failed.',
            );
            return true;
          },
        );
        assert.equal(await readFile(path, 'utf8'), original);
        assert.deepEqual(await readdir(dir), ['snapshot.json']);
      });
  });

test('Team conversion rejects unknown, missing or duplicate groups, orphan members, duplicate IDs/orders and missing content', async () => {
  const mutations = [
    (d) => d.groups.pop(),
    (d) => d.groups.push(d.groups[0]),
    (d) => (d.groups[1].id = 'leader'),
    (d) => d.groups.reverse(),
    (d) => d.members.push({ ...d.members[0], id: 'orphan', group: 'unknown' }),
    (d) => d.members.push({ ...d.members[0], id: 'duplicate' }),
    (d) => (d.members[1].id = d.members[0].id),
    (d) => (d.members[0].order = 0),
    (d) => delete d.members[0].name,
    (d) => {
      d.members = d.members.filter((m) => m.group !== 'core');
    },
  ];
  for (const mutate of mutations)
    await fixture(async ({ options, path, original }) => {
      const data = rpc();
      mutate(data.team);
      await assert.rejects(
        syncCmsSnapshot({ ...options, fetchImpl: requests(data, []) }),
        /cms_load_team failed/,
      );
      assert.equal(await readFile(path, 'utf8'), original);
    });
});

for (const collection of ['projects', 'team'])
  test(`${collection} private media: no GAS cold cache, verified warm cache, offline failure and bounded sanitized failures`, async () => {
    const png = await sharp({
      create: { width: 32, height: 32, channels: 3, background: '#9876ff' },
    })
      .png()
      .toBuffer();
    const media = await normalizeProjectImage(png, 'image/png', collection),
      bytes = Buffer.from(media.data, 'base64');
    await fixture(async ({ options, dir, path, original }) => {
      const snapshot = structuredClone(baseline);
      if (collection === 'projects') snapshot.projects[0].image = media.image;
      else snapshot.team.leaderTeam[0].photo = media.image;
      const data = rpc(snapshot),
        normal = requests(data, []);
      let storageCalls = 0;
      const env = { ...remote, SUPABASE_SERVICE_ROLE_KEY: 'PRIVATE-service' };
      const fetchImpl = async (url, o) => {
        if (String(url).includes('/rest/v1/')) return normal(url, o);
        assert.equal(
          String(url),
          remote.SUPABASE_URL +
            '/storage/v1/object/cms-media/' +
            media.image.replace('/images/cms/', ''),
        );
        assert.equal(o.headers.Authorization, 'Bearer PRIVATE-service');
        assert.equal(o.redirect, 'error');
        storageCalls++;
        return new Response(bytes, {
          headers: { 'Content-Type': 'image/webp' },
        });
      };
      await assert.rejects(
        syncCmsSnapshot({ ...options, env: remote, fetchImpl }),
        /SERVICE_ROLE_KEY/,
      );
      assert.equal(await readFile(path, 'utf8'), original);
      assert.equal(
        await syncCmsSnapshot({ ...options, env, fetchImpl }),
        'remote',
      );
      assert.equal(storageCalls, 1);
      const cached = join(dir, 'public', media.image.slice(1));
      assert.deepEqual(await readFile(cached), bytes);
      assert.equal(
        await syncCmsSnapshot({ ...options, env: remote, fetchImpl }),
        'remote',
      );
      assert.equal(storageCalls, 1);
      assert.equal(
        await syncCmsSnapshot({
          ...options,
          env: { CMS_DATA_SOURCE: 'local', ...env },
          fetchImpl: () => assert.fail('Offline'),
        }),
        'local',
      );
      await writeFile(cached, 'corrupt');
      const before = await readFile(path, 'utf8');
      await assert.rejects(
        syncCmsSnapshot({
          ...options,
          env: { CMS_DATA_SOURCE: 'local', ...env },
          fetchImpl: () => assert.fail('Offline'),
        }),
        /cache is missing or invalid/,
      );
      for (const fail of [
        () => new Response(null, { status: 404 }),
        () => {
          throw new Error('PRIVATE-storage-url');
        },
        () =>
          new Response('PRIVATE-wrong', {
            headers: { 'Content-Type': 'image/webp' },
          }),
        () => new Response(bytes, { headers: { 'Content-Type': 'text/html' } }),
        () =>
          new Response(bytes, {
            headers: {
              'Content-Type': 'image/webp',
              'Content-Length': String(MEDIA_OUTPUT_LIMIT + 1),
            },
          }),
        () =>
          new Response(Buffer.alloc(MEDIA_OUTPUT_LIMIT + 1), {
            headers: { 'Content-Type': 'image/webp' },
          }),
        (_u, { signal }) =>
          new Promise((_r, reject) =>
            signal.addEventListener(
              'abort',
              () => reject(new Error('PRIVATE-timeout')),
              { once: true },
            ),
          ),
      ]) {
        await assert.rejects(
          syncCmsSnapshot({
            ...options,
            env,
            timeoutMs: 20,
            fetchImpl: (url, o) =>
              String(url).includes('/rest/v1/') ? normal(url, o) : fail(url, o),
          }),
          (e) => {
            assert.equal(
              e.message,
              'CMS project media fetch or validation failed.',
            );
            return true;
          },
        );
        assert.equal(await readFile(path, 'utf8'), before);
        assert.deepEqual(await readFile(cached), Buffer.from('corrupt'));
        assert.deepEqual(
          await readdir(join(dir, 'public', 'images', 'cms', collection)),
          [media.image.split('/').at(-1)],
        );
      }
    });
  });

test('valid collections exceeding the aggregate envelope budget fail before any write', async () => {
  await fixture(async ({ options, path, original, dir }) => {
    const data = rpc(),
      text = 'x'.repeat(20000);
    data.hods.hods.forEach((h) =>
      h.tabs.forEach((t) =>
        t.sections.forEach((s) => {
          s.title = text;
          if ('text' in s) s.text = text;
          else s.bullets = s.bullets.map(() => text);
        }),
      ),
    );
    // Split the budget across RPCs: no single response may exceed 1 MiB.
    data.hods.hods.forEach((h) =>
      h.tabs.forEach((t) =>
        t.sections.forEach((s) => {
          s.title = 'Title';
          if ('text' in s) s.text = 'x'.repeat(14000);
          else s.bullets = s.bullets.map(() => 'x'.repeat(14000));
        }),
      ),
    );
    data.roles.roles.forEach((r) => {
      r.about = text;
      r.requirements = r.requirements.map(() => text);
    });
    assert(Buffer.byteLength(JSON.stringify(data.hods)) < CMS_MAX_BYTES);
    assert(Buffer.byteLength(JSON.stringify(data.roles)) < CMS_MAX_BYTES);
    await assert.rejects(
      syncCmsSnapshot({ ...options, fetchImpl: requests(data, []) }),
      /snapshot exceeds the size limit/,
    );
    assert.equal(await readFile(path, 'utf8'), original);
    assert.deepEqual(await readdir(dir), ['snapshot.json']);
  });
});
