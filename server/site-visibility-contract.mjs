import {
  VISIBILITY_PAGES,
  PAGE_BY_ID,
} from '../src/data/site-visibility-registry.mjs';
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = () => {
  throw Object.assign(new Error('Invalid visibility input'), {
    code: 'INVALID_INPUT',
  });
};
export const exactKeys = (value, keys) => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(value, k))
  )
    invalid();
};
export function validateVisibility(value) {
  exactKeys(value, ['schemaVersion', 'revision', 'pages']);
  if (value.schemaVersion !== 1 || !UUID.test(value.revision)) invalid();
  exactKeys(
    value.pages,
    VISIBILITY_PAGES.map((p) => p.id),
  );
  for (const page of VISIBILITY_PAGES) {
    const state = value.pages[page.id];
    exactKeys(state, ['enabled', 'sections']);
    if (
      typeof state.enabled !== 'boolean' ||
      (page.protected && !state.enabled)
    )
      invalid();
    exactKeys(
      state.sections,
      page.sections.map((s) => s.id),
    );
    if (Object.values(state.sections).some((v) => typeof v !== 'boolean'))
      invalid();
  }
  return value;
}
export function validateSave(value) {
  exactKeys(value, ['expectedRevision', 'requestId', 'changes']);
  if (
    !UUID.test(value.expectedRevision) ||
    !UUID.test(value.requestId) ||
    !Array.isArray(value.changes) ||
    value.changes.length > 64 ||
    value.changes.length < 1
  )
    invalid();
  const targets = new Set();
  for (const change of value.changes) {
    exactKeys(
      change,
      Object.hasOwn(change, 'sectionId')
        ? ['pageId', 'sectionId', 'enabled']
        : ['pageId', 'enabled'],
    );
    const page = PAGE_BY_ID[change.pageId];
    if (!page || typeof change.enabled !== 'boolean') invalid();
    if (
      Object.hasOwn(change, 'sectionId')
        ? !page.sections.some((s) => s.id === change.sectionId)
        : page.protected && !change.enabled
    )
      invalid();
    const key = `${change.pageId}/${change.sectionId ?? ''}`;
    if (targets.has(key)) invalid();
    targets.add(key);
  }
  return value;
}
// JSON.parse loses duplicate keys; reject them before interpreting an API body.
export function parseStrictJson(text) {
  let i = 0;
  const white = () => {
    while (/\s/.test(text[i] ?? '') && i < text.length) i++;
  };
  const string = () => {
    const start = i++;
    while (i < text.length) {
      if (text[i] === '\\') {
        i += 2;
        continue;
      }
      if (text[i++] === '"') return JSON.parse(text.slice(start, i));
    }
    invalid();
  };
  const value = () => {
    white();
    if (text[i] === '{') {
      i++;
      white();
      const keys = new Set();
      if (text[i] === '}') {
        i++;
        return;
      }
      for (;;) {
        white();
        if (text[i] !== '"') invalid();
        const key = string();
        if (keys.has(key)) invalid();
        keys.add(key);
        white();
        if (text[i++] !== ':') invalid();
        value();
        white();
        const c = text[i++];
        if (c === '}') return;
        if (c !== ',') invalid();
      }
    }
    if (text[i] === '[') {
      i++;
      white();
      if (text[i] === ']') {
        i++;
        return;
      }
      for (;;) {
        value();
        white();
        const c = text[i++];
        if (c === ']') return;
        if (c !== ',') invalid();
      }
    }
    if (text[i] === '"') {
      string();
      return;
    }
    const match = text
      .slice(i)
      .match(
        /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/,
      );
    if (!match) invalid();
    i += match[0].length;
  };
  if (text.length > 32768) invalid();
  try {
    value();
    white();
    if (i !== text.length) invalid();
    return JSON.parse(text);
  } catch {
    invalid();
  }
}
