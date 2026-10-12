import { defineMiddleware } from 'astro:middleware';
import { pageForPath } from './data/site-visibility-registry.mjs';
import {
  loadVisibility,
  visibilityHeaders,
  visibilityUnavailable,
} from '../server/site-visibility.mjs';
export const onRequest = defineMiddleware(async (context, next) => {
  const page = pageForPath(context.url.pathname);
  if (!page) return next();
  const started = performance.now();
  try {
    context.locals.visibility = await loadVisibility();
    context.locals.visibilityPageId = page.id;
  } catch {
    const response = visibilityUnavailable();
    response.headers.set(
      'Server-Timing',
      `visibility;dur=${(performance.now() - started).toFixed(1)}`,
    );
    return response;
  }
  const loaded = performance.now();
  const response = await next();
  const timing = `visibility;dur=${(loaded - started).toFixed(1)}, render;dur=${(performance.now() - loaded).toFixed(1)}`;
  response.headers.append('Server-Timing', timing);
  for (const [key, value] of Object.entries(visibilityHeaders))
    response.headers.set(key, value);
  response.headers.set(
    'X-Visibility-Revision',
    context.locals.visibility!.revision,
  );
  return response;
});
