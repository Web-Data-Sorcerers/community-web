import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  defaultVisibility,
  VISIBILITY_PAGES,
  getPageState,
  getSectionState,
  developmentDestinations,
} from '../src/data/site-visibility-registry.mjs';
import {
  validateVisibility,
  validateSave,
  parseStrictJson,
} from '../server/site-visibility-contract.mjs';
test('exact registry, defaults, independent sections and inheritance', () => {
  const c = defaultVisibility();
  assert.equal(VISIBILITY_PAGES.length, 19);
  validateVisibility(c);
  assert.equal(getPageState(c, 'about'), false);
  c.pages.home.sections.projects = false;
  c.pages['hall-of-frames'].enabled = true;
  assert.equal(getSectionState(c, 'hall-of-frames', 'projects'), true);
  c.pages.recruitment.enabled = false;
  assert.equal(getPageState(c, 'role-data'), false);
  assert.equal(c.pages['role-data'].enabled, true);
  assert.deepEqual(
    developmentDestinations(c, 'contact').map((d) => d.href),
    ['/', '/partners/'],
  );
});
test('strict config rejects unknown, missing, nonboolean and Home false', () => {
  for (const mutate of [
    (c) => delete c.pages.about,
    (c) => (c.pages.home.enabled = false),
    (c) => (c.pages.contact.sections.fake = true),
    (c) => (c.pages.about.enabled = 'false'),
    (c) => (c.revision = 'bad'),
    (c) => (c.extra = 1),
  ]) {
    const c = defaultVisibility();
    mutate(c);
    assert.throws(() => validateVisibility(c));
  }
});
test('save whitelist and duplicate keys/targets', () => {
  const valid = {
    expectedRevision: randomUUID(),
    requestId: randomUUID(),
    changes: [{ pageId: 'home', sectionId: 'projects', enabled: false }],
  };
  validateSave(valid);
  for (const changes of [
    [{ pageId: 'home', enabled: false }],
    [{ pageId: 'contact', sectionId: 'fake', enabled: true }],
    [valid.changes[0], valid.changes[0]],
    [{ pageId: 'home', enabled: 1 }],
    [],
    Array(65).fill(valid.changes[0]),
  ])
    assert.throws(() => validateSave({ ...valid, changes }));
  assert.throws(() => parseStrictJson('{"a":1,"a":2}'));
  assert.throws(() => parseStrictJson('{"a":{"b":1,"b":2}}'));
  assert.deepEqual(parseStrictJson(JSON.stringify(valid)), valid);
});
test('zero roles suppress section and anchor while preference remains', () => {
  const c = defaultVisibility();
  for (const p of VISIBILITY_PAGES.filter((p) => p.id.startsWith('role-')))
    c.pages[p.id].enabled = false;
  assert.equal(getSectionState(c, 'recruitment', 'available-roles'), false);
  assert.equal(c.pages.recruitment.sections['available-roles'], true);
});
