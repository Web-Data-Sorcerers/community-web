# Mobile performance and recruitment confirmation release — 12 October 2026

Owner explicitly requested “commit dan push” after local acceptance, including
confirmation that the mobile recruitment post-submit layout is fixed.

Scope: batched/cached audio preparation and background suspension; lightweight
mobile motion and static continuous decoration; lighter mobile splash retaining
Home refresh/audio behavior; responsive post-submit card/receipt/actions.
Hero assets/design tokens, fresh visibility/no-store, admin Auth, recruitment
backend and production settings unchanged. No applicant/visibility writes.

Baseline: a397373db83333b5edf0c1e98a40ac004bbd3e1a, remote main matched before release.
One scoped commit and main push with the connected production deployment.
Release SHA and deployment acceptance pending at commit preparation.

Local evidence: [performance implementation](mobile-performance-local.md),
[confirmation layout](recruitment-success-responsive-local.md).
Node22 check/build 0 errors/0 warnings; recruitment44, visibility10, spacing40,
Navbar20, SEO24, formatting, navigation and audio/splash checks PASS.
Mobile browser seven cases, confirmation nine widths x both motion preferences
plus enlarged text, no browser errors. Mock submit only, no production writes.
Synthetic CPU4x warm startup max-task median1219->81ms; final cold samples
778/804->115/143ms. Physical-phone FPS and unconditional autoplay not claimed.

Unrelated dirty documents/assets remain outside the commit. Post-deployment
observations will stay local; no automatic second commit/push.
