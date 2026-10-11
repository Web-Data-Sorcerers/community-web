// Ephemeral socket-only database; never accepts a production URL.
import { spawnSync, spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const base = await mkdtemp(join(tmpdir(), 'ds-visibility-pg-')),
  data = join(base, 'data'),
  sock = join(base, 'sock');
await mkdir(sock);
const port = String(56000 + Math.floor(Math.random() * 1000));
const args = [
  '-h',
  sock,
  '-p',
  port,
  '-U',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
  '-tAc',
];
const raw = (q) => spawnSync('psql', [...args, q], { encoding: 'utf8' });
const sql = (q) => {
  const r = raw(q);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim().replace(/^SET\s*/, '');
};
const actor = '11111111-1111-4111-8111-111111111111';
const literal = (v) =>
  `convert_from(decode('${Buffer.from(JSON.stringify(v)).toString('hex')}','hex'),'UTF8')::jsonb`;
const load = () =>
  JSON.parse(
    sql('set role service_role;select public.site_visibility_load();'),
  );
const query = (rev, id, changes) =>
  `set role service_role;select public.site_visibility_save('${actor}','${rev}','${id}',${literal(changes)});`;
const save = (rev, changes, id = randomUUID()) =>
  JSON.parse(sql(query(rev, id, changes)));
const change = { pageId: 'home', sectionId: 'projects', enabled: false };
let checks = 0;
const check = (label, fn) => {
  fn();
  checks++;
  console.log('PASS ' + label);
};
try {
  assert.equal(
    spawnSync(
      'initdb',
      ['-D', data, '-U', 'postgres', '--auth=trust', '--no-sync'],
      { encoding: 'utf8' },
    ).status,
    0,
  );
  assert.equal(
    spawnSync(
      'pg_ctl',
      [
        '-D',
        data,
        '-o',
        `-p ${port} -k ${sock} -c listen_addresses=''`,
        '-l',
        join(base, 'log'),
        'start',
      ],
      { encoding: 'utf8' },
    ).status,
    0,
  );
  sql(
    `create schema private;create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create table private.cms_admin_permissions(auth_id uuid primary key,active boolean);insert into private.cms_admin_permissions values('${actor}',true);`,
  );
  const migration = await readFile(
    'supabase/migrations/20261011160000_site_visibility.sql',
    'utf8',
  );
  sql(migration);
  check('seed exact defaults', () =>
    assert.deepEqual(load(), defaultVisibility()),
  );
  const before = load(),
    id = randomUUID(),
    saved = save(before.revision, [change], id);
  check('atomic save and one event', () => {
    assert.equal(saved.ok, true);
    assert.equal(load().pages.home.sections.projects, false);
    assert.equal(
      sql('select count(*) from private.site_visibility_events'),
      '1',
    );
  });
  check('exact replay precedes revision conflict', () =>
    assert.deepEqual(save(before.revision, [change], id), saved),
  );
  check('same ID different payload', () =>
    assert.equal(
      save(before.revision, [{ ...change, enabled: true }], id).error.code,
      'ID_CONFLICT',
    ),
  );
  check('stale revision', () =>
    assert.equal(save(before.revision, [change]).error.code, 'CONFLICT'),
  );
  check('no-op no revision/audit churn', () => {
    assert.equal(
      save(saved.data.revision, [change]).data.revision,
      saved.data.revision,
    );
    assert.equal(
      sql('select count(*) from private.site_visibility_events'),
      '1',
    );
  });
  for (const changes of [
    [{ pageId: 'home', enabled: false }],
    [{ pageId: 'x', enabled: true }],
    [{ ...change, enabled: 'false' }],
    [change, change],
    [change, { pageId: 'about', sectionId: 'fake', enabled: true }],
    [{ pageId: 'about', enabled: true, x: 1 }],
  ])
    check('invalid batch rollback ' + checks, () => {
      const c = load();
      assert.equal(save(c.revision, changes).error.code, 'INVALID_INPUT');
      assert.deepEqual(load(), c);
    });
  check('rerun seed preserves saved owner state', () => {
    sql(migration);
    assert.deepEqual(load(), saved.data);
  });
  for (const role of ['anon', 'authenticated', 'service_role'])
    for (const table of ['state', 'events', 'requests'])
      check(role + ' direct table denied ' + table, () =>
        assert.notEqual(
          raw(`set role ${role};select * from private.site_visibility_${table}`)
            .status,
          0,
        ),
      );
  for (const role of ['anon', 'authenticated'])
    for (const q of [
      'select public.site_visibility_load()',
      query(saved.data.revision, randomUUID(), [change]).replace(
        'set role service_role;',
        '',
      ),
    ])
      check(role + ' wrapper denied', () =>
        assert.notEqual(raw(`set role ${role};${q}`).status, 0),
      );
  check('grant revoke denies even replay', () => {
    sql(
      `update private.cms_admin_permissions set active=false where auth_id='${actor}'`,
    );
    assert.equal(save(before.revision, [change], id).error.code, 'FORBIDDEN');
    sql(
      `update private.cms_admin_permissions set active=true where auth_id='${actor}'`,
    );
  });
  const run = (q) =>
    new Promise((resolve) => {
      const c = spawn('psql', [...args, q]);
      let o = '',
        e = '';
      c.stdout.on('data', (v) => (o += v));
      c.stderr.on('data', (v) => (e += v));
      c.on('close', (code) => resolve({ code, o, e }));
    });
  const rev = load().revision;
  const race = await Promise.all([
    run(query(rev, randomUUID(), [{ ...change, enabled: true }])),
    run(query(rev, randomUUID(), [{ pageId: 'contact', enabled: false }])),
  ]);
  for (const r of race) assert.equal(r.code, 0, r.e);
  assert.deepEqual(
    race.map((r) => JSON.parse(r.o.replace(/^SET\s*/, '')).ok).sort(),
    [false, true],
  );
  checks++;
  console.log('PASS concurrent writers one success one conflict');
  // Transactional failure after state update must roll back state + event + request.
  sql(
    "create function private.visibility_test_fail() returns trigger language plpgsql as $$begin raise exception 'synthetic';end$$;create trigger visibility_test_fail before insert on private.site_visibility_events for each row execute function private.visibility_test_fail();",
  );
  const c = load();
  const toggle = { pageId: 'partners', enabled: !c.pages.partners.enabled };
  assert.notEqual(raw(query(c.revision, randomUUID(), [toggle])).status, 0);
  assert.deepEqual(load(), c);
  checks++;
  await mkdir('artifacts/site-visibility', { recursive: true });
  await writeFile(
    'artifacts/site-visibility/db-proof.json',
    JSON.stringify(
      {
        checks,
        ephemeral: true,
        postgres: sql('select version()'),
        safeupdateInstalled: sql(
          "select count(*) from pg_available_extensions where name='safeupdate'",
        ),
      },
      null,
      2,
    ),
  );
  console.log('DB PASS ' + checks);
} finally {
  spawnSync('pg_ctl', ['-D', data, '-m', 'immediate', 'stop'], {
    encoding: 'utf8',
  });
  await rm(base, { recursive: true, force: true });
}
