// Warm immutable CSS only. Navigation HTML and visibility always stay fresh.
const warmed = new Set();
let manifest;
let running = false;
const permitted = () => {
  const connection = navigator.connection;
  return (
    document.visibilityState === 'visible' &&
    !connection?.saveData &&
    !['slow-2g', '2g'].includes(connection?.effectiveType)
  );
};
const idle = () =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve);
    else setTimeout(resolve, 1200);
  });
async function warm() {
  if (running || !permitted()) return;
  running = true;
  try {
    await idle();
    if (!permitted()) return;
    manifest ??= fetch('/navigation-styles.json', {
      cache: 'no-cache',
      priority: 'low',
      signal: AbortSignal.timeout(5000),
    })
      .then((response) => (response.ok ? response.json() : {}))
      .then((routes) => (routes && typeof routes === 'object' ? routes : {}))
      .catch(() => ({}));
    const routes = await manifest;
    for (const anchor of document.querySelectorAll('.navbar a[href]')) {
      const target = new URL(anchor.href, location.href);
      if (target.origin !== location.origin) continue;
      const path = target.pathname.replace(/\/$/, '') || '/';
      for (const href of Array.isArray(routes[path]) ? routes[path] : []) {
        if (
          !permitted() ||
          document.documentElement.classList.contains('navigation-pending')
        )
          return;
        if (warmed.size >= 6) return;
        if (typeof href !== 'string' || !/^\/_astro\/[\w.-]+\.css$/.test(href))
          continue;
        if (
          warmed.has(href) ||
          [...document.querySelectorAll('link[rel="stylesheet"]')].some(
            (link) => link.getAttribute('href') === href,
          )
        )
          continue;
        warmed.add(href);
        await new Promise((resolve) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = href;
          link.fetchPriority = 'low';
          const done = () => {
            clearTimeout(timer);
            link.remove();
            resolve();
          };
          const timer = setTimeout(done, 5000);
          link.onload = link.onerror = done;
          document.head.append(link);
        });
        await idle();
      }
    }
  } finally {
    running = false;
  }
}
// Start after initial critical resources; swaps keep this single listener set.
window.addEventListener('load', warm, { once: true });
document.addEventListener('astro:page-load', () => {
  if (document.readyState === 'complete') void warm();
});
document.addEventListener('visibilitychange', () => {
  if (permitted()) void warm();
});
