// Refresh only an anonymous panel, using the existing same-origin cookie.
// A session event must never replace a healthy editor's draft or pending save.
export function createSessionResumer(root, { initialRead, load, isDirty }) {
  let pending;
  return function ensureSession() {
    if (pending) return pending;
    pending = Promise.resolve()
      .then(async () => {
        await initialRead();
        if (
          !root.isConnected ||
          !root.querySelector('#workspace')?.hidden ||
          isDirty()
        )
          return;
        await load();
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}
