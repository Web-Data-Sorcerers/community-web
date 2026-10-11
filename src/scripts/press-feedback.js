// Touch browsers can defer :active until gesture recognition. Paint on
// pointerdown without intercepting navigation, submission or scrolling.
let pressed;
function release() {
  pressed?.removeAttribute('data-pressed');
  pressed = undefined;
}
document.addEventListener(
  'pointerdown',
  (event) => {
    release();
    if (!event.isPrimary || event.button !== 0) return;
    const button = event.target.closest?.(
      '.button, .form-submit, .btn-step-action',
    );
    if (
      !button ||
      button.matches(':disabled, [aria-disabled="true"], [aria-busy="true"]')
    )
      return;
    pressed = button;
    button.setAttribute('data-pressed', 'true');
  },
  { passive: true },
);
for (const name of [
  'pointerup',
  'pointercancel',
  'scroll',
  'astro:before-swap',
])
  document.addEventListener(name, release, { passive: true, capture: true });
window.addEventListener('blur', release);
window.addEventListener('pageshow', release);
