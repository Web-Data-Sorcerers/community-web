import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionResumer } from '../src/scripts/admin-session.js';

test('session rechecks deduplicate clicks and wait for a stale anonymous bootstrap', async () => {
  let resolve;
  const initial = new Promise((r) => (resolve = r));
  const workspace = { hidden: true };
  const root = { isConnected: true, querySelector: () => workspace };
  let reads = 0;
  const ensure = createSessionResumer(root, {
    initialRead: () => initial,
    isDirty: () => false,
    load: async () => {
      reads++;
      workspace.hidden = false;
    },
  });
  const a = ensure(),
    b = ensure();
  assert.equal(a, b);
  await Promise.resolve();
  assert.equal(reads, 0);
  resolve();
  await a;
  assert.equal(reads, 1);
  await ensure();
  assert.equal(reads, 1);
});

test('session events preserve healthy drafts/busy states and detached panels', async () => {
  for (const condition of ['healthy', 'dirty', 'detached']) {
    const root = {
      isConnected: condition !== 'detached',
      querySelector: () => ({ hidden: condition !== 'healthy' }),
    };
    const ensure = createSessionResumer(root, {
      initialRead: () => Promise.resolve(),
      isDirty: () => condition === 'dirty',
      load: async () => assert.fail('must not replace panel state'),
    });
    await ensure();
  }
});

test('failed session reads release deduplication for an explicit retry', async () => {
  let reads = 0;
  const root = { isConnected: true, querySelector: () => ({ hidden: true }) };
  const ensure = createSessionResumer(root, {
    initialRead: () => Promise.resolve(),
    isDirty: () => false,
    load: async () => {
      if (++reads === 1) throw Error('network');
    },
  });
  await assert.rejects(ensure(), /network/);
  await ensure();
  assert.equal(reads, 2);
});
