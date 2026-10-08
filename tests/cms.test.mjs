import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncCmsSnapshot } from '../scripts/cms-client.mjs';

const baseline = JSON.parse(
  await readFile(
    new URL('../src/data/cms-snapshot.json', import.meta.url),
    'utf8',
  ),
);
const token = 'test-only-anon-key';
const supabaseEnv = {
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: 'placeholder',
};
const supabaseMock = (url) => {
  const href = typeof url === 'string' ? url : url.href;
  if (href.includes('/rest/v1/rpc/cms_load_partners'))
    return Response.json({ partners: baseline.partners });
  if (href.includes('/rest/v1/rpc/cms_load_hods'))
    return jsonResponse({ hods: baseline.hods });
  if (href.includes('/rest/v1/rpc/cms_load_domains'))
    return jsonResponse({ domains: baseline.domains });
  if (href.includes('/rest/v1/rpc/cms_load_roles'))
    return jsonResponse({ roles: baseline.roles });
  if (href.includes('/rest/v1/rpc/cms_load_projects'))
    return jsonResponse(baseline);
  if (href.includes('/rest/v1/rpc/cms_load_team')) {
    // Return response in Supabase RPC format (members + groups)
    const members = [];
    const groups = [];
    const seen = new Set();
    for (const m of baseline.team.leaderTeam) {
      if (seen.has('leader-' + members.length)) continue;
      seen.add('leader-' + members.length);
      members.push({
        id: 'leader-' + (members.length + 1),
        group: 'leader',
        name: m.name,
        role: m.role,
        photo: m.photo,
        order: members.length + 1,
      });
    }
    if (!groups.find((g) => g.id === 'leader'))
      groups.push({ id: 'leader', title: '' });
    for (const ht of baseline.team.hodsTeams) {
      if (!groups.find((g) => g.id === ht.id))
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
    return jsonResponse({
      members,
      groups,
      revision: 'a'.repeat(64),
      photoPresets: ['marchel', 'zidan-rose'],
      minMembers: 1,
      maxMembers: 8,
      minGroups: 7,
      publicationPending: false,
      affectedId: null,
    });
  }
  if (href.includes('/database/query')) return jsonResponse([]);
  return null;
};

const jsonResponse = (value = baseline) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

async function withSnapshot(run) {
  const directory = await mkdtemp(join(tmpdir(), 'ds-cms-test-'));
  const path = join(directory, 'snapshot with spaces.json');
  const original = JSON.stringify(baseline);
  await writeFile(path, original);
  try {
    await run({ directory, path, original });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('offline validates locally without calling fetch; partial Supabase config fails', async () => {
  await withSnapshot(async ({ path, original }) => {
    const fetchImpl = () => {
      throw new Error('Network must not be used offline');
    };
    assert.equal(
      await syncCmsSnapshot({ snapshotPath: path, env: {}, fetchImpl }),
      'local',
    );
    await assert.rejects(
      syncCmsSnapshot({
        snapshotPath: path,
        env: { SUPABASE_ANON_KEY: token },
        fetchImpl,
      }),
      /together/,
    );
    assert.equal(await readFile(path, 'utf8'), original);
  });
});

test('Supabase RPCs atomically replace the snapshot using six anon RPCs', async () => {
  await withSnapshot(async ({ path, directory }) => {
    const changed = structuredClone(baseline);
    changed.projects[0].title = 'Updated project';
    const calls = [];
    assert.equal(
      await syncCmsSnapshot({
        snapshotPath: path,
        env: supabaseEnv,
        fetchImpl: async (url, opts) => {
          const href = typeof url === 'string' ? url : url.href;
          calls.push(href);
          assert.equal(opts.redirect, 'error');
          if (
            href.includes('/rest/v1/rpc/cms_load_projects') ||
            href.includes('/rest/v1/rpc/cms_load_roles') ||
            href.includes('/rest/v1/rpc/cms_load_domains') ||
            href.includes('/rest/v1/rpc/cms_load_hods') ||
            href.includes('/rest/v1/rpc/cms_load_partners')
          )
            return jsonResponse(changed);
          if (href.includes('/database/query')) return jsonResponse([]);
          const response = supabaseMock(url);
          assert(response, 'Unexpected request outside the six Supabase RPCs');
          return response;
        },
      }),
      'remote',
    );
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), changed);
    assert.equal(calls.length, 6);
    assert.deepEqual(await readdir(directory), ['snapshot with spaces.json']);
  });
});
