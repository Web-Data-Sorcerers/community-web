# Workflow live acceptance — fixture konkret

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

Prepared local; Faiz approved the exact12POST+guarded cleanup scope with
`okee terus?` after the concrete proposal. No fixture mutation executed.
Initial agent browser tab2 opened as an anonymous login shell. The local helper
subsequently performed a real owner login (HTTP200), clearing password. Projects/
Team GET200; recruitment stats GET400 while equivalent POST stats200. The diagnostic helper later exited; its memory-only session was lost.
No fixture executed. New secure owner login is required after routing fix deployment.
No password, cookies or CSRF are stored in artifacts.
The owner personal browser session is separate from the agent browser.
Local loopback login helper at http://127.0.0.1:4393 uses the actual production
login UI in an isolated browser context; password/email/cookies/CSRF remain in
process/context memory only, no storageState/HAR/trace/credential artifacts.
Login alone performs shared module reads and refresh, not fixture mutations.
Positive live workflow acceptance pending; GET routing fix required before fixture; no fixture submit/status/note/race/retry/
cleanup has run. Exact12POST+guarded cleanup scope is approved; execution awaits routing fix
deployment and new secure owner session.

## Owner login diagnostic and local fix

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
