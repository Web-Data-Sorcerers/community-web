import {
  VISIBILITY_PAGES,
  getPageState,
} from '../src/data/site-visibility-registry.mjs';
import {
  loadVisibility,
  visibilityHeaders,
} from './site-visibility.mjs';
import { getSiteOrigin, canonicalUrl } from '../src/data/site-url.mjs';

/**
 * Builds standard XML sitemap urlset containing only indexable public pages.
 * @param {Array} pages
 * @param {object} visibility
 * @param {URL | string} origin
 * @returns {string}
 */
export function buildSitemapXml(pages, visibility, origin) {
  const indexablePages = pages.filter((page) => {
    if (page.path.includes('/lab/') || page.path.includes('/admin/')) return false;
    if (page.id === 'recruitment-apply') return false;
    return getPageState(visibility, page.id);
  });

  const urlEntries = indexablePages
    .map((page) => `  <url>\n    <loc>${canonicalUrl(page.path, origin)}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

/**
 * Builds standard XML sitemap index pointing to canonical sitemap.xml.
 * @param {URL | string} origin
 * @returns {string}
 */
export function buildSitemapIndexXml(origin) {
  const sitemapUrl = canonicalUrl('/sitemap.xml', origin);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${sitemapUrl}</loc>\n  </sitemap>\n</sitemapindex>\n`;
}

/**
 * Handles incoming sitemap.xml request with fresh visibility and fail-closed 503.
 * @param {{ site?: URL | string, loadVisibilityImpl?: () => Promise<any> }} [options]
 */
export async function handleSitemapRequest({
  site,
  loadVisibilityImpl = loadVisibility,
} = {}) {
  let visibility;
  try {
    visibility = await loadVisibilityImpl();
  } catch {
    return new Response('Visibility configuration unavailable', {
      status: 503,
      headers: {
        ...visibilityHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '5',
      },
    });
  }

  const origin = site ?? new URL(getSiteOrigin());
  const xml = buildSitemapXml(VISIBILITY_PAGES, visibility, origin);

  return new Response(xml, {
    status: 200,
    headers: {
      ...visibilityHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'noindex, follow',
      'X-Visibility-Revision': visibility.revision,
    },
  });
}

/**
 * Handles incoming sitemap-index.xml request with fresh visibility and fail-closed 503.
 * @param {{ site?: URL | string, loadVisibilityImpl?: () => Promise<any> }} [options]
 */
export async function handleSitemapIndexRequest({
  site,
  loadVisibilityImpl = loadVisibility,
} = {}) {
  let visibility;
  try {
    visibility = await loadVisibilityImpl();
  } catch {
    return new Response('Visibility configuration unavailable', {
      status: 503,
      headers: {
        ...visibilityHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '5',
      },
    });
  }

  const origin = site ?? new URL(getSiteOrigin());
  const xml = buildSitemapIndexXml(origin);

  return new Response(xml, {
    status: 200,
    headers: {
      ...visibilityHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'noindex, follow',
      'X-Visibility-Revision': visibility.revision,
    },
  });
}
