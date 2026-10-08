import { APPLICATION_FIELDS } from './recruitment-contract.mjs';
import {
  STATUSES,
  TRANSITIONS,
  TERMINAL,
  UUID,
} from './recruitment-review-status.mjs';
export {
  STATUSES,
  TRANSITIONS,
  TERMINAL,
  UUID,
} from './recruitment-review-status.mjs';
const invalid = () => {
  throw Object.assign(new Error('INVALID_INPUT'), {
    code: 'INVALID_INPUT',
    status: 400,
  });
};
const object = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
};
const keys = (value, allowed) => {
  object(value);
  if (Object.keys(value).some((k) => !allowed.includes(k))) invalid();
};
const integer = (v, min, max) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) invalid();
  return v;
};
export function text(value, min, max, bytes = 16384) {
  if (
    typeof value !== 'string' ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
      value,
    )
  )
    invalid();
  const s = value.replace(/\r\n?/g, '\n').trim();
  if (
    [...s].length < min ||
    [...s].length > max ||
    Buffer.byteLength(s) > bytes
  )
    invalid();
  return s;
}
const date = (s) => {
  if (
    typeof s !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    s.startsWith('0000-') ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    invalid();
  return s;
};
export function filters(input = {}) {
  keys(input, [
    'search',
    'primary_hods',
    'status',
    'since',
    'until',
    'sort',
    'limit',
    'offset',
    'as_of',
  ]);
  const f = {};
  if (input.search !== undefined) f.search = text(input.search, 0, 200);
  for (const [key, values] of [
    [
      'primary_hods',
      ['', 'data', 'core', 'language', 'vision', 'product', 'growth'],
    ],
    ['status', ['', ...Object.keys(STATUSES)]],
    ['sort', ['received_at_desc', 'received_at_asc']],
  ])
    if (input[key] !== undefined) {
      if (!values.includes(input[key])) invalid();
      f[key] = input[key];
    }
  for (const key of ['since', 'until'])
    if (input[key] !== undefined && input[key] !== '')
      f[key] = date(input[key]);
  if (f.since && f.until && f.since > f.until) invalid();
  f.limit = integer(input.limit === undefined ? 50 : input.limit, 1, 100);
  f.offset = integer(input.offset === undefined ? 0 : input.offset, 0, 100000);
  f.sort ??= 'received_at_desc';
  if (input.as_of !== undefined) {
    if (
      typeof input.as_of !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(
        input.as_of,
      ) ||
      !Number.isFinite(Date.parse(input.as_of))
    )
      invalid();
    f.as_of = input.as_of;
  }
  return f;
}
export function queryInput(url, allowed) {
  const result = {};
  for (const [key, value] of url.searchParams) {
    if (!allowed.includes(key) || key in result) invalid();
    if (['limit', 'offset'].includes(key)) {
      if (!/^\d+$/.test(value)) invalid();
      result[key] = Number(value);
    } else result[key] = value;
  }
  return result;
}
export function receipt(value) {
  if (typeof value !== 'string' || !UUID.test(value)) invalid();
  return value.toLowerCase();
}
export function page(input) {
  keys(input, ['limit', 'offset']);
  return {
    limit: integer(input.limit === undefined ? 20 : input.limit, 1, 20),
    offset: integer(input.offset === undefined ? 0 : input.offset, 0, 100000),
  };
}
export function mutation(input, action) {
  keys(input, [
    'request_id',
    'receipt',
    'expected_version',
    ...(action === 'status' ? ['status', 'reason'] : ['body']),
  ]);
  const r = {
    request_id: receipt(input.request_id),
    receipt: receipt(input.receipt),
    expected_version: integer(
      input.expected_version,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
  };
  if (action === 'status') {
    if (!Object.hasOwn(STATUSES, input.status)) invalid();
    r.status = input.status;
    r.reason = text(input.reason === undefined ? '' : input.reason, 0, 500);
    if (TERMINAL.includes(r.status) && [...r.reason].length < 10) invalid();
  } else r.body = text(input.body, 1, 4000);
  return r;
}
// Strict projections keep upstream diagnostic/PII fields outside the selected contract.
function projectData(result, route, f = {}) {
  object(result);
  const pick = (v, fields) => {
    object(v);
    return Object.fromEntries(
      fields.filter((k) => Object.hasOwn(v, k)).map((k) => [k, v[k]]),
    );
  };
  const count = (v) => integer(v, 0, Number.MAX_SAFE_INTEGER);
  const review = (v) => {
    object(v);
    if (!Object.hasOwn(STATUSES, v.status)) invalid();
    count(v.version);
    count(v.note_count);
    return pick(v, [
      'status',
      'version',
      'updated_at',
      'updated_by',
      'reviewer_label',
      'note_count',
    ]);
  };
  if (route === 'status' || route === 'note') {
    if (result.ok !== true) {
      if (
        ![
          'FORBIDDEN',
          'NOT_FOUND',
          'CONFLICT',
          'ID_CONFLICT',
          'INVALID_TRANSITION',
          'INVALID_INPUT',
        ].includes(result.error?.code)
      )
        invalid();
      return { ok: false, error: { code: result.error.code } };
    }
    receipt(result.receipt);
    count(result.version);
    if (!Object.hasOwn(STATUSES, result.status)) invalid();
    return pick(result, [
      'ok',
      'receipt',
      'status',
      'version',
      'event_id',
      'note_id',
      'replayed',
    ]);
  }
  if (route === 'detail') {
    if (result.found === false) return { found: false };
    receipt(result.receipt);
    object(result.fields);
    if (Object.keys(result.fields).some((k) => !APPLICATION_FIELDS.includes(k)))
      invalid();
    for (const v of Object.values(result.fields)) {
      if (
        !(typeof v === 'string' && v.length <= 8000) &&
        !(
          Array.isArray(v) &&
          v.length <= 100 &&
          v.every((x) => typeof x === 'string' && x.length <= 8000)
        )
      )
        invalid();
    }
    return {
      ...pick(result, [
        'found',
        'receipt',
        'received_at',
        'schema_version',
        'fields',
        'full_name',
        'email',
        'primary_hods',
      ]),
      review: review(result.review),
    };
  }
  const base = pick(result, [
    'total_global',
    'filtered',
    'limit',
    'offset',
    'has_more',
    'as_of',
    'filters_applied',
  ]);
  if (route === 'list') {
    if (
      !Array.isArray(result.applications) ||
      result.applications.length > (f.limit ?? 50)
    )
      invalid();
    count(result.total_global);
    count(result.filtered);
    if (
      result.limit !== f.limit ||
      result.offset !== f.offset ||
      typeof result.has_more !== 'boolean' ||
      !Number.isFinite(Date.parse(result.as_of))
    )
      invalid();
    base.applications = result.applications.map((a) => {
      receipt(a.receipt);
      return {
        ...pick(a, [
          'receipt',
          'full_name',
          'email',
          'primary_hods',
          'received_at',
          'schema_version',
        ]),
        review: review(a.review),
      };
    });
    return base;
  }
  if (route === 'stats') {
    count(result.total_global);
    count(result.filtered);
    for (const [key, label, values] of [
      ['by_status', 'status', Object.keys(STATUSES)],
      [
        'by_hods',
        'hods',
        ['data', 'core', 'language', 'vision', 'product', 'growth'],
      ],
    ]) {
      if (
        !Array.isArray(result[key]) ||
        result[key].length !== values.length ||
        new Set(result[key].map((x) => x[label])).size !== values.length
      )
        invalid();
      base[key] = result[key].map((x) => {
        if (!values.includes(x[label])) invalid();
        return { [label]: x[label], count: count(x.count) };
      });
      if (base[key].reduce((n, x) => n + x.count, 0) !== result.filtered)
        invalid();
    }
    return base;
  }
  if (!Array.isArray(result.items) || result.items.length > (f.limit ?? 20))
    invalid();
  count(result.total);
  base.total = result.total;
  base.items = result.items.map((x) =>
    pick(
      x,
      route === 'notes'
        ? ['id', 'body', 'created_by', 'author_label', 'created_at']
        : [
            'id',
            'action',
            'from_status',
            'to_status',
            'reason',
            'note_id',
            'actor_id',
            'actor_label',
            'created_at',
            'before_version',
            'after_version',
          ],
    ),
  );
  return base;
}

export function project(...args) {
  try {
    return projectData(...args);
  } catch {
    throw new Error('INVALID_UPSTREAM_RESPONSE');
  }
}
