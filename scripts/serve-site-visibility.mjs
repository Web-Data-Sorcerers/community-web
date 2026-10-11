// Local Vercel generated-function harness; never a deployment server.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReviewFixture } from './site-visibility-review-fixture.mjs';
const reviewFixture = createReviewFixture();
const root = resolve('.vercel/output/static'),
  port = Number(process.env.PORT || 4348);
const { default: app } = await import(
  pathToFileURL(
    resolve(
      '.vercel/output/functions/_render.func/.vercel/output/server/entry.mjs',
    ),
  )
);
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.html': 'text/html',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + '/')) file = '';
    if (req.method === 'GET' || req.method === 'HEAD')
      try {
        if ((await stat(file)).isDirectory()) file += '/index.html';
        const bytes = await readFile(file);
        res.setHeader(
          'Content-Type',
          types[extname(file)] || 'application/octet-stream',
        );
        res.end(req.method === 'HEAD' ? undefined : bytes);
        return;
      } catch {}
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(!['GET', 'HEAD'].includes(req.method)
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const response =
      (await reviewFixture?.(request)) || (await app.fetch(request));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(
      req.method === 'HEAD'
        ? undefined
        : Buffer.from(await response.arrayBuffer()),
    );
  } catch (error) {
    res.statusCode = 500;
    res.end('Local harness error');
    console.error(error);
  }
}).listen(port, '127.0.0.1', () =>
  console.log(
    `Local generated function ready ${port}${reviewFixture ? ' (isolated review fixture)' : ''}`,
  ),
);
