// One local page or section per pass. Never points at a remote host.
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PAGE_BY_ID } from '../src/data/site-visibility-registry.mjs';
const [pageId, sectionId, marker] = process.argv.slice(2),
  page = PAGE_BY_ID[pageId];
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4350');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
assert.ok(page);
const file =
  process.env.SITE_VISIBILITY_FILE || '/tmp/ds-visibility-fixture.json';
const original = await readFile(file, 'utf8'),
  data = JSON.parse(original),
  proof = [];
try {
  for (const enabled of [false, true]) {
    data.revision = randomUUID();
    data.pages[pageId].enabled = sectionId ? true : enabled;
    if (sectionId) data.pages[pageId].sections[sectionId] = enabled;
    if (page.parent) data.pages[page.parent].enabled = true;
    await writeFile(file, JSON.stringify(data));
    const r = await fetch(new URL(page.path, base), { cache: 'no-store' }),
      html = await r.text();
    assert.equal(r.status, 200);
    for (const key of [
      'cache-control',
      'cdn-cache-control',
      'vercel-cdn-cache-control',
    ])
      assert.equal(r.headers.get(key), 'no-store');
    assert.equal(r.headers.get('x-visibility-revision'), data.revision);
    if (sectionId)
      assert.equal(
        html.includes(marker),
        enabled,
        `${pageId}.${sectionId}: ${marker}`,
      );
    else {
      assert.equal(html.includes('id="chamber-title"'), !enabled);
      if (!enabled) {
        assert.match(html, /noindex, follow/);
        assert.doesNotMatch(html, /class="footer"/);
      }
    }
    proof.push({ enabled, status: r.status, revision: data.revision });
  }
} finally {
  await writeFile(file, original);
}
await appendFile(
  'docs/page-section-visibility-local.md',
  `\nP5 ${pageId}${sectionId ? '.' + sectionId : ''}: off/on raw HTML, all three no-store headers and current revision PASS. ${sectionId ? 'Inactive component absent.' : 'Inactive page uses approved chamber and noindex, follow.'}\n`,
);
console.log('PASS', pageId, sectionId || 'page', proof.length);
