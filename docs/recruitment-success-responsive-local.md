# Recruitment success responsive fix — local, 12 Oct 2026

Owner reported a broken mobile confirmation after submitting recruitment.
Root cause: success-screen changed to display:flex (row by default), while its
heading/body/receipt/action were direct children. Existing responsive CSS targets
success-card/body/actions wrappers which were missing. Row children and the long
UUID exceeded mobile bounds; section overflow:clip obscured the overflow.

Restore existing card/body/actions wrappers. Card width100%/max680/min-width0,
border-box, column gap24, existing padding56/48 desktop32/24 mobile, radius24.
Title clamp24–36 with explicit line-height and wrapping. Body min-width0/width100
and overflow-wrap:anywhere; receipt keeps exact identifier/text and receives a
16px padded surface. Existing mobile actions stack; button label remains intact.
Success scroll-margin112 keeps confirmation below fixed Navbar. Existing design
fonts/colours retained; no new Figma composition or artwork. Strict spacing grid.

Submission/storage/confirmation/retry/auth/backend contracts unchanged. No
production application submitted. Dedicated browser QA intercepts intake GET/POST
locally, completes all four steps via actual validation and submit handler, echoes
the request UUID, then checks success hidden-state/focus/receipt and responsive
containment at320/360/375/390/414/768/820/1024/1440 × both motion modes. Enlarged
text checks wrapping. Screenshots/proof: artifacts/recruitment-success/.
No commit/push/deploy authorized for this fix; production remainsa397373. Existing
unrelated dirty evidence/reference assets preserved. Actual Safari not claimed.

Local acceptance PASS: Node22 check/build0errors/0warnings, scoped Prettier/
spacing PASS. Real client mock-submit confirms exact receipt, hidden form/stepper
and focus;18 width/motion success layouts PASS plus enlarged type in both modes.
All content/button/UUID inside viewport, title below Navbar, no browser errors.
390px normal-motion screenshot visually inspected: coherent stacked card with
fully readable confirmation/receipt/action. No production write/commit/push.
