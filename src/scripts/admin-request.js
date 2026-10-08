// Shared same-origin transport for the private admin entrypoints only.
// It never stores tokens, PII or response bodies: callers own all state.
export const READ_DEADLINE_MS = 15000;
export const SLOW_NOTICE_MS = 3000;

export function createTransport(fetchImpl = fetch) {
  return async function send(url, options = {}) {
    const { method = 'GET', headers, body, signal, deadline } = options;
    const controller = new AbortController();
    let timedOut = false;
    const relay = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', relay);
    }
    const timer =
      deadline && deadline > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, deadline)
        : null;
    try {
      const response = await fetchImpl(url, {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        headers,
        body,
        signal: controller.signal,
      });
      const text = await response.text();
      let result = {};
      let malformed = false;
      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          malformed = true;
        }
      } else malformed = true;
      return { response, result, malformed };
    } catch {
      if (timedOut) return { response: null, result: null, timeout: true };
      if (controller.signal.aborted)
        return { response: null, result: null, cancelled: true };
      return { response: null, result: null, network: true };
    } finally {
      if (timer) clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', relay);
    }
  };
}

export function createSlowNotice(render, delay = SLOW_NOTICE_MS) {
  let token = 0;
  return function arm(text) {
    render(text);
    const mine = ++token;
    const timer = setTimeout(() => {
      if (mine !== token) return;
      render('Data belum selesai dimuat. Masih menunggu sampai batas waktu.');
    }, delay);
    return () => {
      if (mine === token) token++;
      clearTimeout(timer);
    };
  };
}
