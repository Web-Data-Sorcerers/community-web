// Ephemeral only. No external URL option: this verifier applies SQL and synthetic DML.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { APPLICATION_FIELDS } from '../server/recruitment-contract.mjs';
import {
  TRANSITIONS,
  STATUSES,
} from '../server/recruitment-review-contract.mjs';
const migration =
  'supabase/migrations/20261008111118_recruitment_review_workflow.sql';
const actor = '11111111-1111-4111-8111-111111111111';
const base = await mkdtemp(join(tmpdir(), 'ds-review-pg-'));
const data = join(base, 'data'),
  sock = join(base, 'sock'),
  port = String(55600 + Math.floor(Math.random() * 200));
await mkdir(sock);
const args = ['-h', sock, '-p', port, '-U', 'postgres'];
const checks = [];
function raw(sql) {
  return spawnSync('psql', [...args, '-v', 'ON_ERROR_STOP=1', '-tAc', sql], {
    encoding: 'utf8',
  });
}
function sql(q) {
  const r = raw(q);
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}
const literal = (v) =>
  `convert_from(decode('${Buffer.from(JSON.stringify(v)).toString('hex')}','hex'),'UTF8')::jsonb`;
const rpc = (name, params) =>
  JSON.parse(
    sql(
      `set role service_role; select public.${name}('${actor}',${params});`,
    ).replace(/^SET\s*/, ''),
  );
const list = (f) => rpc('admin_list_applications_v2', literal(f));
const stats = (f) => rpc('admin_get_stats_v2', literal(f));
const detail = (id) => rpc('admin_get_application_v2', `'${id}'::uuid`);
const status = (id, v, to, extra = {}) =>
  rpc(
    'admin_update_application_status',
    literal({
      receipt: id,
      request_id: randomUUID(),
      expected_version: v,
      status: to,
      reason: 'synthetic reason',
      ...extra,
    }),
  );
const note = (id, v, body, extra = {}) =>
  rpc(
    'admin_add_review_note',
    literal({
      receipt: id,
      request_id: randomUUID(),
      expected_version: v,
      body,
      ...extra,
    }),
  );
function check(name, fn) {
  fn();
  checks.push({ name, ok: true });
  console.log('PASS ' + name);
}
function seed(n) {
  sql(
    `truncate private.recruitment_review_events,private.recruitment_review_notes,private.recruitment_application_reviews,private.recruitment_applications; insert into private.recruitment_applications(receipt,content_hash,fields,received_at) select gen_random_uuid(),repeat('a',64),jsonb_build_object('full_name','Synthetic '||g,'email','qa'||g||'@example.invalid','primary_hods',case when g%2=0 then 'data' else 'core' end), '2026-01-01T00:00:00Z'::timestamptz from generate_series(1,${n}) g;`,
  );
}
const history = (id, notes, p = {}) =>
  rpc(
    notes ? 'admin_list_review_notes' : 'admin_list_review_events',
    `'${id}'::uuid,${literal(p)}`,
  );
const run = (q) =>
  new Promise((resolve) => {
    const c = spawn('psql', [...args, '-v', 'ON_ERROR_STOP=1', '-tAc', q]);
    let o = '',
      e = '';
    c.stdout.on('data', (d) => (o += d));
    c.stderr.on('data', (d) => (e += d));
    c.on('close', (code) => resolve({ code, o, e }));
  });
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
    'create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;',
  );
  for (const m of [
    '20261006120000_recruitment_intake_pass1.sql',
    '20261007120000_recruitment_pass2_admin_read.sql',
    '20261014010000_cms_auth_pass7.sql',
  ])
    sql(await readFile('supabase/migrations/' + m, 'utf8'));
  const old = sql(
    `select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and (p.proname like 'cms_%' or p.proname like 'admin_%' or p.proname like 'recruitment_%');`,
  );
  const oldOids = sql(
    `select string_agg(p.oid::text,',') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and (p.proname like 'cms_%' or p.proname like 'admin_%' or p.proname like 'recruitment_%');`,
  );
  sql(await readFile(migration, 'utf8'));
  sql(
    `insert into private.cms_admin_permissions(auth_id,email) values('${actor}','reviewer@example.invalid'); insert into private.cms_admin_users(auth_id,email) values('${actor}','reviewer@example.invalid');`,
  );
  check('old RPC definitions and ACL byte fingerprint unchanged', () =>
    assert.equal(
      sql(
        `select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid)) from pg_proc p where p.oid in (${oldOids})`,
      ),
      old,
    ),
  );
  for (const n of [0, 1, 49, 50, 51, 200, 201])
    check(`pagination ${n}, unique tied timestamps and last page`, () => {
      seed(n);
      let seen = [];
      let stamp;
      for (let offset = 0; offset < Math.max(n, 1); offset += 50) {
        let r = list({ limit: 50, offset, ...(stamp ? { as_of: stamp } : {}) });
        stamp = r.as_of;
        assert.equal(r.filtered, n);
        assert.equal(r.total_global, n);
        assert(r.applications.length <= 50);
        assert.equal(r.has_more, offset + r.applications.length < n);
        seen.push(...r.applications.map((a) => a.receipt));
      }
      assert.equal(seen.length, n);
      assert.equal(new Set(seen).size, n);
    });
  check('SQL filters enforce types/ranges/whitelist/date validation', () => {
    for (const f of [
      { limit: 101 },
      { limit: 0 },
      { offset: -1 },
      { offset: '1' },
      { limit: 1.5 },
      { search: [] },
      { actor: 'spoof' },
      { status: 'invalid' },
      { primary_hods: 'bad' },
      { since: '2026-02-30' },
      { since: '2026-02-02', until: '2026-01-01' },
      { sort: 'bad' },
      { as_of: 'infinity' },
      { as_of: '2999-01-01T00:00:00Z' },
    ])
      assert.notEqual(
        raw(
          `set role service_role;select public.admin_list_applications_v2('${actor}',${literal(f)});`,
        ).status,
        0,
      );
  });
  seed(3);
  check(
    'literal search %, underscore, backslash, mixed case and combined filters',
    () => {
      sql(
        `update private.recruitment_applications set fields=fields||jsonb_build_object('full_name',E'Literal %_\\\\ Name') where receipt=(select receipt from private.recruitment_applications limit 1)`,
      );
      for (const search of ['%', '_', '\\', 'literal'])
        assert.equal(list({ search }).filtered, 1);
      assert.equal(list({ search: 'missing' }).filtered, 0);
      const a = list({ search: 'literal' }).applications[0];
      assert.equal(
        list({ search: 'literal', primary_hods: a.primary_hods, status: 'new' })
          .filtered,
        1,
      );
      assert.equal(
        list({ search: 'literal', status: 'reviewing' }).filtered,
        0,
      );
    },
  );
  check(
    'WIB inclusive dates become UTC lower/inclusive and upper/exclusive',
    () => {
      seed(3);
      const ids = list({}).applications.map((a) => a.receipt);
      for (let i = 0; i < 3; i++)
        sql(
          `update private.recruitment_applications set received_at='${['2026-01-01T16:59:59Z', '2026-01-01T17:00:00Z', '2026-01-02T17:00:00Z'][i]}' where receipt='${ids[i]}'`,
        );
      assert.equal(
        list({ since: '2026-01-02', until: '2026-01-02' }).filtered,
        1,
      );
    },
  );
  seed(1);
  let id = list({}).applications[0].receipt;
  const fullFields = Object.fromEntries(
    APPLICATION_FIELDS.map((k) => [k, 'Synthetic ' + k]),
  );
  sql(
    `update private.recruitment_applications set fields=${literal(fullFields)}||fields where receipt='${id}'`,
  );
  check('all38canonical fields preserved in detail', () =>
    assert.equal(Object.keys(detail(id).fields).length, 38),
  );
  const canonical = sql(
    `select md5(fields::text||content_hash||received_at::text||receipt::text||schema_version::text) from private.recruitment_applications where receipt='${id}'`,
  );
  check('default lazy new/version0; no intake backfill', () => {
    assert.equal(detail(id).review.version, 0);
    assert.equal(detail(id).review.status, 'new');
    assert.equal(
      sql('select count(*) from private.recruitment_application_reviews'),
      '0',
    );
  });
  for (const from of Object.keys(STATUSES))
    for (const to of Object.keys(STATUSES))
      check(`transition ${from} -> ${to}`, () => {
        sql(
          `delete from private.recruitment_review_events;delete from private.recruitment_review_notes;delete from private.recruitment_application_reviews;insert into private.recruitment_application_reviews values('${id}','${from}',0,now(),'${actor}','Synthetic')`,
        );
        const r = status(id, 0, to);
        assert.equal(r.ok, TRANSITIONS[from].includes(to));
        if (!r.ok) assert.equal(r.error.code, 'INVALID_TRANSITION');
        assert.equal(
          sql('select count(*) from private.recruitment_review_events'),
          r.ok ? '1' : '0',
        );
      });
  check('terminal and reopen reasons 10–500 codepoints', () => {
    for (const [from, to] of [
      ['new', 'rejected'],
      ['new', 'withdrawn'],
      ['shortlisted', 'accepted'],
      ['accepted', 'reviewing'],
      ['rejected', 'reviewing'],
      ['withdrawn', 'reviewing'],
    ]) {
      sql(
        `delete from private.recruitment_review_events;update private.recruitment_application_reviews set status='${from}',version=0`,
      );
      for (const reason of ['', 'ninechar', 'a'.repeat(501)])
        assert.equal(status(id, 0, to, { reason }).error.code, 'INVALID_INPUT');
      assert(status(id, 0, to, { reason: '😀'.repeat(10) }).ok);
    }
  });
  check(
    'append-only note bounds, unicode, CRLF, controls, spoof validation',
    () => {
      let v = detail(id).review.version;
      for (const body of [
        '',
        ' \n\t',
        'a'.repeat(4001),
        '\u2003\u00a0\ufeff',
        'bad\u0001',
      ])
        assert.equal(note(id, v, body).error.code, 'INVALID_INPUT');
      for (const extra of [
        { actor_id: actor },
        { created_at: 'now' },
        { author_label: 'fake' },
      ])
        assert.equal(note(id, v, 'valid', extra).error.code, 'INVALID_INPUT');
      for (const body of [
        '<script>alert(1)</script>',
        'a'.repeat(4000),
        '😀'.repeat(4000),
        ' first\r\nsecond ',
      ]) {
        assert(note(id, v++, body).ok);
      }
      assert.equal(history(id, true).items.at(-1).body, 'first\nsecond');
    },
  );
  check('all writes leave canonical answers/hash/timestamps unchanged', () =>
    assert.equal(
      sql(
        `select md5(fields::text||content_hash||received_at::text||receipt::text||schema_version::text) from private.recruitment_applications where receipt='${id}'`,
      ),
      canonical,
    ),
  );
  check(
    'same intent retry replays before version check, no duplicate event/note',
    () => {
      const v = detail(id).review.version,
        request_id = randomUUID();
      const first = note(id, v, 'retry', { request_id });
      assert(first.ok);
      const second = note(id, v, 'retry', { request_id });
      assert(second.replayed);
      assert.equal(second.event_id, first.event_id);
      assert.equal(
        note(id, v, 'changed', { request_id }).error.code,
        'ID_CONFLICT',
      );
      assert.equal(
        status(id, v, 'reviewing', { request_id }).error.code,
        'ID_CONFLICT',
      );
    },
  );
  check('note and history bounded20 with unique pagination', () => {
    for (let i = 0; i < 24; i++)
      assert(note(id, detail(id).review.version, 'Synthetic ' + i).ok);
    for (const n of [true, false]) {
      const first = history(id, n),
        second = history(id, n, { offset: 20 });
      assert.equal(first.items.length, 20);
      assert(first.has_more);
      assert(
        new Set([...first.items, ...second.items].map((x) => x.id)).size ===
          first.items.length + second.items.length,
      );
    }
  });
  check(
    'stats filtered/global and zero categories; notes do not inflate counts',
    () => {
      const r = stats({});
      assert.equal(r.total_global, 1);
      assert.equal(r.filtered, 1);
      assert.equal(
        r.by_status.reduce((n, x) => n + x.count, 0),
        1,
      );
      assert.equal(
        r.by_hods.reduce((n, x) => n + x.count, 0),
        1,
      );
      assert.equal(stats({ status: 'new' }).filtered, 0);
    },
  );
  check('atomic event failure rolls back note/state/version', () => {
    sql(
      `create function private.fail_review_event() returns trigger language plpgsql as $$ begin raise exception 'synthetic forced failure'; end $$; create trigger forced_event_failure before insert on private.recruitment_review_events for each row execute function private.fail_review_event();`,
    );
    const before = detail(id),
      n = history(id, true).total;
    assert.notEqual(
      raw(
        `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: id, request_id: randomUUID(), expected_version: before.review.version, body: 'atomic' })})`,
      ).status,
      0,
    );
    assert.equal(detail(id).review.version, before.review.version);
    assert.equal(history(id, true).total, n);
    sql(
      'drop trigger forced_event_failure on private.recruitment_review_events;',
    );
  });
  const v = detail(id).review.version;
  const race = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      run(
        `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: id, request_id: randomUUID(), expected_version: v, body: 'race ' + i })}) from (select pg_sleep(0.2)) s`,
      ),
    ),
  );
  check(
    '8 concurrent same version: exactly one commit, seven409 conflicts',
    () => {
      const results = race.map((r) => {
        assert.equal(r.code, 0);
        return JSON.parse(r.o.replace(/^SET\s*/, ''));
      });
      assert.equal(results.filter((r) => r.ok).length, 1);
      assert.equal(
        results.filter((r) => r.error?.code === 'CONFLICT').length,
        7,
      );
      assert.equal(detail(id).review.version, v + 1);
    },
  );
  const reqid = randomUUID(),
    rv = detail(id).review.version;
  const retries = await Promise.all(
    Array.from({ length: 8 }, () =>
      run(
        `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: id, request_id: reqid, expected_version: rv, body: 'race retry' })}) from (select pg_sleep(0.2)) s`,
      ),
    ),
  );
  check('8 concurrent identical UUID retries: one effect, seven replay', () => {
    const r = retries.map((x) => JSON.parse(x.o.replace(/^SET\s*/, '')));
    assert(r.every((x) => x.ok));
    assert.equal(r.filter((x) => x.replayed).length, 7);
    assert.equal(new Set(r.map((x) => x.event_id)).size, 1);
  });
  check('revoked CMS/recruitment permissions deny reads and mutations', () => {
    for (const table of ['cms_admin_permissions', 'cms_admin_users']) {
      sql(`update private.${table} set active=false`);
      assert.equal(note(id, detailVersion(), 'denied').error.code, 'FORBIDDEN');
      assert.notEqual(
        raw(
          `set role service_role;select public.admin_get_stats_v2('${actor}','{}')`,
        ).status,
        0,
      );
      sql(`update private.${table} set active=true`);
    }
  });
  function detailVersion() {
    return Number(
      sql('select version from private.recruitment_application_reviews'),
    );
  }
  for (const role of ['anon', 'authenticated', 'service_role'])
    for (const t of [
      'recruitment_application_reviews',
      'recruitment_review_notes',
      'recruitment_review_events',
    ])
      for (const op of ['select', 'insert', 'update', 'delete'])
        check(`${role} direct ${t} ${op} denied`, () => {
          const q = {
            select: `select * from private.${t}`,
            insert: `insert into private.${t}(receipt) values('${id}')`,
            update: `update private.${t} set receipt=receipt where receipt='${id}'`,
            delete: `delete from private.${t} where receipt='${id}'`,
          }[op];
          const r = raw(`set role ${role};${q}`);
          assert.notEqual(r.status, 0);
          assert.match(r.stderr, /permission denied/);
        });
  for (const role of ['anon', 'authenticated'])
    for (const [name, params] of [
      ['admin_list_applications_v2', "'{}'"],
      ['admin_get_stats_v2', "'{}'"],
      ['admin_get_application_v2', `'${id}'::uuid`],
      ['admin_list_review_notes', `'${id}'::uuid,'{}'`],
      ['admin_list_review_events', `'${id}'::uuid,'{}'`],
      ['admin_update_application_status', "'{}'"],
      ['admin_add_review_note', "'{}'"],
    ])
      check(`${role} wrapper ${name} denied`, () =>
        assert.match(
          raw(`set role ${role};select public.${name}('${actor}',${params})`)
            .stderr,
          /permission denied/,
        ),
      );
  check(
    'private helpers denied even service_role; fixed path, RLS all-deny',
    () => {
      assert.match(
        raw(
          `set role service_role;select private.recruitment_review_actor('${actor}')`,
        ).stderr,
        /permission denied/,
      );
      assert.equal(
        sql(
          `select count(*) from pg_proc where proname like 'recruitment_review_%' and (not prosecdef or proconfig::text not like '%search_path=pg_catalog%')`,
        ),
        '0',
      );
      assert.equal(
        sql(
          `select count(*) from pg_class where relname in ('recruitment_application_reviews','recruitment_review_notes','recruitment_review_events') and relrowsecurity`,
        ),
        '3',
      );
    },
  );

  // Cross-receipt UUID reuse must serialize even when applicant locks differ.
  sql(
    `insert into private.recruitment_applications(receipt,content_hash,fields) values(gen_random_uuid(),repeat('a',64),'{"full_name":"Synthetic second","email":"second@example.invalid","primary_hods":"data"}')`,
  );
  const other = list({}).applications.find((a) => a.receipt !== id).receipt;
  const crossid = randomUUID();
  const beforeCross = detail(id).review.version;
  const cross = await Promise.all([
    run(
      `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: id, request_id: crossid, expected_version: beforeCross, body: 'cross receipt' })})`,
    ),
    run(
      `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: other, request_id: crossid, expected_version: 0, body: 'cross receipt' })})`,
    ),
  ]);
  check(
    'same actor+UUID cross receipts races one effect and ID_CONFLICT',
    () => {
      const r = cross.map((x) => JSON.parse(x.o.replace(/^SET\s*/, '')));
      assert.equal(r.filter((x) => x.ok).length, 1);
      assert.equal(r.filter((x) => x.error?.code === 'ID_CONFLICT').length, 1);
    },
  );
  // Revocation commits before write takes permission lock: fail closed.
  const revoke = run(
    'begin;update private.cms_admin_permissions set active=false;select pg_sleep(0.4);commit;',
  );
  await new Promise((r) => setTimeout(r, 100));
  const denied = await run(
    `set role service_role;select public.admin_add_review_note('${actor}',${literal({ receipt: id, request_id: randomUUID(), expected_version: detailVersion(), body: 'revocation race' })})`,
  );
  await revoke;
  check(
    'permission revocation race serializes and denies stale permission',
    () => {
      assert.equal(denied.code, 0);
      assert.equal(
        JSON.parse(denied.o.replace(/^SET\s*/, '')).error.code,
        'FORBIDDEN',
      );
    },
  );
  sql('update private.cms_admin_permissions set active=true;');
  check('as_of excludes later normal inserts across pages', () => {
    const first = list({ limit: 1 });
    sql(
      `insert into private.recruitment_applications(receipt,content_hash,fields) values(gen_random_uuid(),repeat('a',64),'{"full_name":"Later synthetic","primary_hods":"data"}')`,
    );
    assert.equal(
      list({ limit: 1, offset: 1, as_of: first.as_of }).filtered,
      first.filtered,
    );
    assert.equal(list({}).filtered, first.filtered + 1);
  });
  seed(10000);
  sql(
    `insert into private.recruitment_application_reviews select receipt,'reviewing',1,now(),'${actor}','Synthetic' from private.recruitment_applications;insert into private.recruitment_review_notes(receipt,body,created_by,author_label) select receipt,'Synthetic scale note','${actor}','Synthetic' from private.recruitment_applications;insert into private.recruitment_review_events(receipt,action,from_status,to_status,reason,actor_id,actor_label,before_version,after_version,request_id,request_hash,result) select receipt,'status_changed','new','reviewing','', '${actor}','Synthetic',0,1,gen_random_uuid(),repeat('a',64),'{}' from private.recruitment_applications;analyze private.recruitment_application_reviews;analyze private.recruitment_review_notes;analyze private.recruitment_review_events;`,
  );
  check('10k synthetic volume bounded, query-plan review', () => {
    sql('analyze private.recruitment_applications;');
    const r = list({ limit: 100, offset: 9900 });
    assert.equal(r.applications.length, 100);
    assert(!r.has_more);
    assert.equal(r.filtered, 10000);
    assert(r.applications.every((a) => a.review.note_count === 1));
    assert.equal(stats({ status: 'reviewing' }).filtered, 10000);
    const plan = sql(
      `explain (analyze,format json) select receipt from private.recruitment_applications order by received_at,receipt limit 50;`,
    );
    assert.match(plan, /recruitment_apps_review_page_idx/);
  });
  await mkdir('artifacts/recruitment-review', { recursive: true });
  await writeFile(
    'artifacts/recruitment-review/db-proof.json',
    JSON.stringify(
      {
        mode: 'ephemeral-only',
        server_version: sql('show server_version'),
        migration,
        sha256: createHash('sha256')
          .update(await readFile(migration))
          .digest('hex'),
        checks,
        passed: true,
      },
      null,
      2,
    ),
  );
  console.log(`Workflow PostgreSQL PASS ${checks.length}/${checks.length}`);
} finally {
  spawnSync('pg_ctl', ['-D', data, 'stop', '-m', 'immediate'], {
    encoding: 'utf8',
  });
  await rm(base, { recursive: true, force: true });
}
