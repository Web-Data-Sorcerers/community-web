# Workflow live acceptance — fixture konkret

## Workflow LIVE14e62af — accepted dan fixture cleaned (8 Oct 2026)

Implementasi A–D lokal selesai; migration additive sudah applied pada existing
Supabase web-community/yejrdckcmlxrkklgtrwy. Production Current+primaryalias READY
exact `14e62aff1614436b9d9a90a359b3f2800b4a6f23`, deployment
`dpl_GadJRkTnfiRe2QeZKCzknKrBAJcX`; provider READY
**08 Oct 2026 12:24:06.468 UTC /19:24:06.468 WIB**. Fresh post-cleanup checks
confirm exact deployment, recruitment **OPEN**, public19/19HTML byte exact,
Projects4/apps0/media0 and content/grant/allowlist fingerprints unchanged.

Fresh actual owner login200/shared Projects+Team+Pendaftar GET200/refresh200;
authenticated workflow GET stats/list/detail/notes/history accepted. Approved
exact synthetic fixture scope (`okee terus?`) executed **12/12 POST**:
real public form submit+identical retry2, status transitions5 including accepted
and reopening, append-only notes2, exact successful-note replay1, concurrent
same-version writes2. Intake produced one applicant; replay had one effect;
race returned200/409 and one winning effect, final version8/status shortlisted,
notes2/events8. Every verified step preserved all38 canonical answers/hash and
received metadata. Trusted actor/CMS permission/recruitment allowlist and
Origin+CSRF remained enforced; no bypass or new reviewer account.

Actual authenticated UI390/1440 PASS:24 nonblank/array answer fields displayed
(existing blank-field omission), API/DB all38 exact, notes2/history8,
no overflow/pageerrors0/password empty and script-like note text safely rendered.
Guarded exact receipt/hash/38fields/actor/request/child ledger cleanup committed:
events8→notes2→review1→application1 deleted. Fixture absent in DB/API; other
applicant count/fingerprint unchanged, read-audit preserved. Global logout200,
private UI cleared and8anonymous admin endpoints401. Both isolated browser
contexts closed; owned loopback helper4393 stopped. No credentials/cookies/CSRF
or real applicant payload persisted in docs/artifacts.

Checkpoint states: plan proposals documented; local implementation/QA complete;
migration applied; feature+routing fix deployed; positive owner/workflow acceptance
**accepted** with synthetic fixture cleaned. Original local fullQA remains
CMS94PASS+10Team liveSKIP, recruitment39PASS, workflow PostgreSQL142/intake13,
7gates+SEO, four-width Native/Team/workflow mocks, snapshot/public parity and
secrets0. Routing regression QA42 recruitment+9auth PASS is distinct from that
full baseline; actual live acceptance above supplies owner/fixture proof.

No further SQL/Auth/grant/allowlist/env/provider/CMS/Team/content/hook/Google
mutation or push. Exact14e62af push approval consumed. This post-acceptance docs
checkpoint is LOCAL ONLY, not pushed. Proof ignored
artifacts/recruitment-review/{live-workflow-proof,owner-session-proof}.json and
route-fix-release/{acceptance-final-state,push-deployment,push-public}.json.
Historical sections below describe previous checkpoints, not current pending work.

## Historical preparation and approval scope

Prepared 8 Oct 2026; no live fixture mutation executed. Production READY exact
`e3fa488f9a20544439779987974fc8e232178f00`, deployment
`dpl_BNKYG3xmg5ANjWe8LH4XZ66ct9hh`; primary alias
https://data-sorcerers-community-sigma.vercel.app, existing Supabase
web-community/yejrdckcmlxrkklgtrwy.

## Exact fixture dan request scope

One synthetic applicant only, email domain example.invalid, validated canonical
38 fields. No real applicant payload retained here. Synthetic receipt:
`5752a503-3833-4909-9437-14346d13add3`; canonical SHA256:
`46e0eb71da12ca2ddf236645f7a1ef7fd9b4954bac5cbc7673cd1348969d9db3`. Payload is validated in the ignored local fixture plan;
new request UUIDs will be bound to an execution ledger before POST, never random
retry intents. Shared owner session must be established via actual login, not SQL
actor impersonation, grant bypass or a newly provisioned account.

Exactly 12 workflow/intake mutation HTTP requests:

1. Public form real submit, then identical intake retry (2 POST, one applicant).
2. Status new→reviewing→shortlisted→interview→accepted→reviewing (5 POST).
   Acceptance and reopening use synthetic reasons, internal decisions only.
3. Append two synthetic internal notes (2 POST).
4. Replay one successful note request, same UUID and body (1 POST, no new effect).
5. Two fixture-only requests at the same latest version, reviewing→shortlisted
   and reviewing→waitlisted (2 POST); expected one success and one conflict409.

Expected final fixture: review version8, status shortlisted or waitlisted,
2 notes,8 events. Every step verifies fixture canonical38answers/hash unchanged,
exact revision/event/note effects and UI390/1440. All authenticated requests use
actual trusted session and both permission checks; POST uses Origin+CSRF.
Authentication login/refresh/logout POSTs are session lifecycle requests, separate
from the 12 intake/workflow requests. Read-only checks have no mutation budget.
Do not blind retry unexpected failures or fabricate acceptance from mock results.

## Cleanup guard dan proof limits

One approved cleanup transaction via existing Management transport: assert exact
receipt/hash/all38fields, exact reviewed version/status,2notes/8events and matching
fixture-only author/request/event ledger; lock fixture/permission rows as needed;
delete verified events→notes→review→application. Assert affected counts and absence.
Compare other-applicant count/fingerprint before and after, excluding exact fixture;
preserve recruitment read-audit logs. Any unexpected child/count/body/hash aborts
cleanup transaction; never broaden target, drop tables or erase audit.

No CMS/Team content write, user/grant/allowlist/env/hook/provider mutation,
recruitment closure, messages, real applicant export or Google actions. No new push.

## Current checkpoint

Accepted on LIVE14e62af; approved12POST and guarded cleanup completed exactly as
recorded in the current checkpoint above. Synthetic fixture absent, other data
unchanged, sessions logged out, loopback helper stopped. No remaining owner login
or fixture execution task for this scope. No new push authorization.

## Historical owner login diagnostic and local fix

The local helper waited for read-only validation after a successful login. Its
recruitment GET stats check returned400 INVALID_INPUT; POST stats with the same
trusted session, Origin and CSRF returned200. This is an actual authenticated
live-read failure, distinct from anonymous shell/mock passes. No fixture exists.

[Vercel filesystem route builder](https://github.com/vercel/vercel/blob/main/packages/fs-detectors/src/detect-builders.ts)
uses the bracket segment name literally in its rewrite query: filename
[...route].js yields metadata key ...route. The current strict GET query validator
rejects unknown fields; a matching provider route parameter reproduces400 locally.

Local adapter now removes only one ...route value matching a known four-segment
/api/admin/recruitment/{endpoint} path, before existing handler validation. It
preserves all other query entries, headers, body/method and trusted auth checks.
Regression tests cover GET stats/list/detail/notes/history, mismatched and duplicate
metadata, unknown/duplicate user filters, anonymous401, POST payload and CSRF403.

Focused route-fix QA under Node22: recruitment42PASS/auth9PASS; build23pages,
public19HTML exact with identical local snapshot input, snapshot unchanged,
dist71textfiles/server secrets0, diff actual credential findings0, exact migration
hash unchanged. Full baseline QA remains historical; no new live-fix acceptance.

A diagnostic attachment to the owned local helper recovered its existing session
flag without credentials/cookie export or a repeated login; helper then exited during diagnostic shutdown with
ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING. Memory-only session was lost; no fixture ran. Scope does not include any production auth/grant change. Owner must log in securely again after the routing fix is deployed. Local fix commit requires a new
exactSHA push approval. After READY, perform new owner login and revalidate real GET/UI reads before invoking
already-approved12POST fixture/guardedcleanup. Do not apply migration again.
