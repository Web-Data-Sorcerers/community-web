import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filters,
  mutation,
  page,
  text,
  queryInput,
  project,
  STATUSES,
  TRANSITIONS,
} from '../server/recruitment-review-contract.mjs';
const id = '22345678-1234-4123-8123-123456789abc';
test('workflow filter whitelist, strict integers, dates and literals', () => {
  assert.deepEqual(filters(), {
    limit: 50,
    offset: 0,
    sort: 'received_at_desc',
  });
  assert.equal(filters({ search: ' %_\\ ' }).search, '%_\\');
  assert.equal(
    filters({
      limit: 100,
      offset: 100000,
      since: '2026-01-01',
      until: '2026-01-02',
      status: 'accepted',
    }).status,
    'accepted',
  );
  for (const input of [
    null,
    [],
    { search: {} },
    { search: 'a'.repeat(201) },
    { search: '\u0000' },
    { limit: null },
    { offset: null },
    { limit: 0 },
    { limit: 101 },
    { limit: '50' },
    { limit: NaN },
    { limit: 1.5 },
    { offset: -1 },
    { offset: 100001 },
    { status: 'other' },
    { primary_hods: 'other' },
    { sort: 'asc' },
    { since: '2026-02-30' },
    { since: '2026-02-01', until: '2026-01-01' },
    { since: null },
    { as_of: 'invalid' },
    { actor: id },
  ])
    assert.throws(() => filters(input));
  for (const query of [
    '?limit=1a',
    '?limit=NaN',
    '?limit=1&limit=2',
    '?actor=id',
  ])
    assert.throws(() =>
      queryInput(new URL('https://example.test/' + query), ['limit']),
    );
});
test('workflow all8statuses/transition matrix and mutation input', () => {
  assert.equal(Object.keys(STATUSES).length, 8);
  assert.equal(Object.keys(TRANSITIONS).length, 8);
  const base = { request_id: id, receipt: id, expected_version: 0 };
  assert.equal(
    mutation({ ...base, body: ' first\r\nlast ' }, 'note').body,
    'first\nlast',
  );
  assert.equal(mutation({ ...base, status: 'reviewing' }, 'status').reason, '');
  for (const bad of [
    { ...base, actor_id: id, body: 'a' },
    { ...base, expected_version: '0', body: 'a' },
    { ...base, body: [] },
    { ...base, status: 'reviewing', reason: null },
    { ...base, status: 'accepted', reason: 'short' },
    { ...base, status: '__proto__' },
    { ...base, request_id: 'invalid', body: 'valid' },
  ])
    assert.throws(() =>
      mutation(bad, Object.hasOwn(bad, 'status') ? 'status' : 'note'),
    );
});
test('notes UTF8/codepoint/control/normalization bounds', () => {
  assert.equal([...text('😀'.repeat(4000), 1, 4000)].length, 4000);
  assert.equal(text('a'.repeat(4000), 1, 4000).length, 4000);
  for (const v of [
    '',
    ' \n\t ',
    'a'.repeat(4001),
    '\u0000',
    '\u0001',
    '\u007f',
    '\ud800',
  ])
    assert.throws(() => text(v, 1, 4000));
  assert.equal(text(' first\r\nnext\rlast ', 1, 4000), 'first\nnext\nlast');
  assert.equal(
    text('<script>alert(1)</script>', 1, 4000),
    '<script>alert(1)</script>',
  );
  assert.throws(() => text('😀'.repeat(4000), 1, 4000, 15999));
});
test('history pagination max20 and strict response projection', () => {
  assert.deepEqual(page({}), { limit: 20, offset: 0 });
  for (const p of [
    { limit: 21 },
    { limit: '20' },
    { offset: -1 },
    { author: 'fake' },
  ])
    assert.throws(() => page(p));
  const r = project(
    {
      ok: false,
      error: { code: 'CONFLICT', message: 'private' },
      secret: 'private',
    },
    'status',
  );
  assert.deepEqual(r, { ok: false, error: { code: 'CONFLICT' } });
  assert.throws(() =>
    project({ applications: Array(51).fill({}) }, 'list', {
      limit: 50,
      offset: 0,
    }),
  );
  assert.throws(() =>
    project(
      {
        found: true,
        receipt: id,
        fields: {},
        review: { status: 'bogus', version: 0 },
      },
      'detail',
    ),
  );
  const n = project(
    {
      items: [{ id, body: 'safe', author_label: 'test', secret: 'private' }],
      total: 1,
      has_more: false,
      limit: 20,
      offset: 0,
    },
    'notes',
    { limit: 20 },
  );
  assert(!Object.hasOwn(n.items[0], 'secret'));
});
