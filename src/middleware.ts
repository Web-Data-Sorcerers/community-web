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
  try {
    context.locals.visibility = await loadVisibility();
    context.locals.visibilityPageId = page.id;
  } catch {
    return visibilityUnavailable();
  }
  const response = await next();
  for (const [key, value] of Object.entries(visibilityHeaders))
    response.headers.set(key, value);
  response.headers.set(
    'X-Visibility-Revision',
    context.locals.visibility!.revision,
  );
  return response;
});
