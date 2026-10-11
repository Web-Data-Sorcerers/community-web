// Local discovery/routing only; this never calls Vercel build/deploy APIs.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { getTransformedRoutes } from '@vercel/routing-utils';
const config = JSON.parse(await fs.readFile('vercel.json'));
const previous = JSON.parse(
  execFileSync('git', ['show', 'HEAD:vercel.json'], { encoding: 'utf8' }),
);
assert.deepEqual(config.regions, ['sin1']);
assert.deepEqual(
  { ...config, regions: undefined },
  { ...previous, regions: undefined },
);
const transformed = getTransformedRoutes(config);
assert.equal(transformed.error, null);
for (const path of [
  '/admin',
  '/admin/',
  '/admin/team',
  '/admin/team/',
  '/admin/recruitment',
  '/admin/recruitment/',
]) {
  const headers = transformed.routes
    .filter((r) => r.headers && new RegExp(r.src).test(path))
    .flatMap((r) => Object.entries(r.headers));
  assert.ok(
    headers.some(
      ([k, v]) => k.toLowerCase() === 'cache-control' && v === 'no-store',
    ),
    path,
  );
  assert.ok(
    headers.some(
      ([k, v]) =>
        k.toLowerCase() === 'x-robots-tag' && v === 'noindex, nofollow',
    ),
    path,
  );
}
const runtime = JSON.parse(
  await fs.readFile('.vercel/output/functions/_render.func/.vc-config.json'),
);
assert.equal(runtime.runtime, 'nodejs22.x');
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n');
const { require_dist3 } =
  await import('/home/faiz/.npm-global/lib/node_modules/vercel/dist/chunks/chunk-VPI2ZRPP.js');
const result = await require_dist3().detectBuilders(
  files,
  JSON.parse(await fs.readFile('package.json')),
  {
    ...config,
    projectSettings: {
      framework: 'astro',
      nodeVersion: '24.x',
      buildCommand: 'npm run build',
      installCommand: 'npm ci',
      outputDirectory: 'dist',
    },
    ignoreBuildScript: true,
    featHandleMiss: true,
    workPath: process.cwd(),
  },
);
assert.equal((result.errors || []).length, 0);
const rootApis = result.builders.filter((b) => b.use === '@vercel/node');
assert.equal(rootApis.length, 11);
const proof = {
  time: new Date().toISOString(),
  runtime,
  regions: config.regions,
  rootApis: rootApis.map((b) => b.src),
  expectedFunctions: 12,
  routingValid: true,
  regionOverrides: runtime.regions ?? null,
  effectiveDeployedRegion:
    'PENDING approved deployment; local output cannot establish effective cloud region',
};
await fs.writeFile(
  'artifacts/navigation-performance-local/region-package.json',
  JSON.stringify(proof, null, 2),
);
console.log(JSON.stringify(proof));
