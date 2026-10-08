# Recruitment review — implementasi lokal A–D

## Login owner berhasil; GET workflow perlu routing fix lokal (8 Oct 2026)

Faiz approved exact12POST+guardedfixturecleanup (`okee terus?`). Actual login via
loopback helper succeeded HTTP200/password cleared; Projects/Team GET200,
Pendaftar stats GET400 INVALID_INPUT, equivalent authenticated POST stats200.
No fixture submit/status/note/race/retry/cleanup has executed. The isolated local helper subsequently exited during diagnostic shutdown
(ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING); its memory-only session was lost.
No credentials were persisted; no fixture was submitted. Helper now reports
progress/status, bounds waits and preserves a successful login on read-check failure.
Owner login is needed again after the routing fix becomes live.

Local fix strips only a single provider-owned `...route` query value matching
recognized /api/admin/recruitment/{endpoint} path. Vercel filesystem route builder
uses the literal bracket segment name in rewrite query; strict filter whitelist
had treated this metadata as applicant filter input. Unknown/mismatched/duplicate
queries still reject; auth/Origin/CSRF/POST body preserved. No SQL/Auth/env/grant/
public/UI/dependency changes. Source evidence and repro in
[acceptance checkpoint](recruitment-review-live-acceptance.md).

Node22 focused QA: recruitment42PASS (3new regression cases), CMS auth9PASS;
build0errors/23pages,19publicHTML same-local-input exact/snapshot unchanged,
dist71textfiles secrets0/diff actual secrets0/migration hash unchanged.
Original fullCMS94PASS+10TeamSKIP/7gates+SEO/four-width mocks are prior baseline;
not rerun/claimed as fresh route-fix full suite. Fix local only, not deployed.
Production remains READY e3fa488 with GET failure under actual owner session;
positive workflow acceptance pending. NEXT exact new HEAD SHA approval→one push→
READY and new secure owner login/actual GET proof→approved fixture12POST+
guarded cleanup. Do not reapply SQL or reuse consumed e3fa488 push approval.

## Workflow pendaftar LIVE e3fa488 — migration dan push selesai (8 Oct 2026)

Faiz (`push`, lalu `okee` untuk migration prerequisite) menyetujui exact HEAD
`e3fa488f9a20544439779987974fc8e232178f00` dan additive migration
`supabase/migrations/20261008111118_recruitment_review_workflow.sql`, SHA256
`8b58a828d32d8b2201f659196ad846edfd58e85b3698d866e83e460a12d5ccf4`,
target Supabase web-community/yejrdckcmlxrkklgtrwy. Applied satu kali dengan
lock_timeout5s/statement_timeout60s; current PostgreSQL17.11, applications0 dan
other/waiting affected-table locks0 saat preflight. Backup encrypted di luar repo
mencakup definitions/ACL/schema metadata + aggregate fingerprints + exact SQL;
file600/key terpisah, authenticated decrypt/parse/byte equality dan ciphertext
tamper denial PASS. Bukan full database/data backup; no applicant payload export.

Catalog setelah apply:3private tables/4indexes/8helpers/7service-only wrappers/
3RLS deny policies; function sources exact SQL, old definitions/ACL unchanged,
direct table/helper privileges anon/authenticated/service_role0. Canonical answer
fingerprint dan CMS/recruitment permission fingerprints unchanged; review rows0.
Tidak membuat/mengubah user/grant/allowlist/env/provider/intake/CMS content.

Satu push origin/main ke community-web selesai; izin exactSHA consumed.
Production Current+primaryalias READY `dpl_BNKYG3xmg5ANjWe8LH4XZ66ct9hh`, exacte3fa488;
provider READY **08 Oct 2026 11:43:07.731 UTC /
18:43:07.731 WIB**. Workspace probe clock
terpisah. Actual build prebuild/remote snapshot/23pages PASS; provider Node24.x
existing retained, QA lokal22.23.0. Public19/19HTML byte exact against fresh live
baseline captured before push;8anonymous CMS/recruitment GET endpoints401;
recruitment accepting:true/OPEN retained. Content/grant/allowlist fingerprint
read-only final unchanged; Projects4/applications0/media0 at audit time.

Proposed/local/applied/deployed selesai; **positive owner/live workflow mutation
acceptance pending**. Tidak login owner baru, fixture submit/status/note/conflict/
retry/cleanup, hook, explicit redeploy/env change, Team write atau Google action.
Anonymous3module shells390/1440 (6cases) PASS, overflow0/passwordempty/pageerrors0;
harness lama menunggu label status historis, diperbarui ke label current lalu
rerun PASS. Shell proof bukan owner acceptance. NEXT owner shared read-only acceptance
→ separate concrete synthetic12POST+guarded child cleanup approval. Jangan gunakan
izin migration/push ini untuk fixture atau push checkpoint berikutnya.

Checkpoint sesudah push ini lokal saja, tidak dipush tambahan. Proof ignored
artifacts/recruitment-review/live-prepare.json, live-apply.json,
live-catalog-verified.json, live-content-baseline.json, live-final-state.json,
live-public-baseline.json, push-deployment.json, push-build-proof.json,
push-public.json dan admin-anonymous-shells.json. Historical local-only sections
below describe the prior checkpoint, not current applied/deployed state.

8 Oct 2026. Authorized Faiz: implementasi lokal saja. Baseline HEAD `3f4b8e9`,
production accepted `e59abde`. Production recruitment OPEN; shared Auth accepted.
Migration workflow belum applied, fitur belum deployed/accepted live.

## Desain final dan inventaris UI sebelum kode

Default master plan §1–18 dipakai: delapan status, transition/reasons, notes
append-only, 50/page, WIB, keputusan internal. Canonical 38 fields/hash immutable.
Existing auth module digunakan tanpa perubahan. Reads service-only; writes SQL
mengunci CMS permission → recruitment allowlist → applicant, lalu dedupe/version.
Semua mutation atomik state/note/event. Wrapper lama dipertahankan.

Admin custom tidak punya Figma node/PNG. Natural scroll mengikuti fullscreen plan
admin exception; tidak hero/100svh baru. Tokens: #050507/#16141f/#fff/#bcb7cb/
#9b7bff/#393344; BluuNext700 heading40/48 dan24/30, Manrope400/700 body16/24.
Max1280, padding32 desktop/16 mobile, gap8/16/24/32, controls min48. Existing
local fonts/navigation; tidak menambah artwork/dependency atau public UI.

Surface sequence:

1. Nav/auth existing: shared 3menu, lifecycle tetap; cek password kosong/keyboard.
2. Stats/filter/list: global vs filtered, 8status/domain counts, labeled search,
   status/domain/date/sort/reset/reload. Table dalam scroll wrapper; pagination
   request server, bounded50/page, unique timestamp+receipt, server as_of.
3. Detail/status: seluruh canonical answers; text-safe; metadata version/reviewer,
   allowed transitions, inline terminal/reopen confirmation, focused conflict.
4. Notes/history: draft DOM/memory, append-only author/time, bounded20/page,
   dirty navigation confirmation, unresolved retry exact UUID+payload; clear on
   logout/401/403, session/request generation menolak stale responses.

Acceptance tiap surface: synthetic320/390/768/1440, no document overflow/errors,
keyboard focus, loading/empty/error/saved/conflict/unconfirmed/privacy states.
Full7gates+SEO akhir menjaga baseline public; mock bukan live mutation acceptance.

## Gate live tetap terpisah

Apply: exact SQL/objects existing project web-community/yejrdckcmlxrkklgtrwy,
backup definitions/ACL dan state terenkripsi bila diperlukan + approval konkret.
Push: exact HEAD SHA baru, satu origin/main community-web; e59abde consumed.
Fixture: proposal12POST + guarded child cleanup approval baru. Tidak auto-run.
Rollback forward fix; deployment lama memakai RPC lama, metadata baru tetap.

## Hasil A–D lokal dan audit

Working tree awal bersih, main3f4b8e9; Node default26 diabaikan, seluruh QA
menggunakan22.23.0. Origin satu URL fetch/push community-web; ls-remote terakhir
masih exact e59abde. Tidak push/fetch ref mutation, testing project tidak dibuat.

Catalog existing Supabase dibaca read-only: PostgreSQL17.11, kedua permission
schemas/types/ACL, applications/generated columns/indexes, signature/definer/ACL
RPC existing. Proposed3tables dan7wrappers absent pada audit awal dan akhir.
Counts saat audit applications0, CMS grant1aktif, recruitment allowlist1aktif.
Fingerprint aggregate tersimpan ignored tanpa payload/identitas pendaftar. Angka0
adalah waktu audit, bukan janji tetap0 karena intake production OPEN.

| Tahap    | Status nyata                                                     |
| -------- | ---------------------------------------------------------------- |
| Proposed | Default master plan §1–18, now used locally atas instruksi owner |
| Local    | A–D implementation + synthetic/ephemeral QA selesai              |
| Applied  | Belum; tidak menjalankan migration production                    |
| Deployed | Belum; production baseline tetap e59abde                         |
| Accepted | Lokal terbukti; owner/live workflow mutation belum diterima      |

## Migration konkret

File: `supabase/migrations/20261008111118_recruitment_review_workflow.sql`.
SHA256: `8b58a828d32d8b2201f659196ad846edfd58e85b3698d866e83e460a12d5ccf4`.

Objek baru, semuanya additive:

- 3private tables: recruitment_application_reviews, recruitment_review_notes,
  recruitment_review_events. PK/FK RESTRICT,8status CHECK, version safe integer,
  UNIQUE(actor_id,request_id), notes bounded, event before/after revision.
- 4indexes: reviews(status,receipt), notes(receipt,created_at,id),
  events(receipt,created_at,id), applications(received_at,receipt).
- 8private helpers: recruitment_review_text/actor/filters/list/stats/detail/history/
  mutate; fixed pg_catalog search_path + SECURITY DEFINER; direct EXECUTE revoked.
- 7public wrappers: admin_list_applications_v2, admin_get_stats_v2,
  admin_get_application_v2, admin_list_review_notes, admin_list_review_events,
  admin_update_application_status, admin_add_review_note. EXECUTE service_role only.
  All wrappers require trusted p_actor_id, including reads; this strengthens the
  proposed read signature so SQL rechecks both permissions for reads too.
- 3RLS ALL-deny policies; revoke all direct table privileges also for service_role.
  No auth user/grant/allowlist/provider provisioning or existing function alteration.

DDL satu BEGIN/COMMIT, no backfill/reseed/trigger intake. CREATE INDEX biasa dalam
transaction dapat menahan writes sementara; FK/index DDL mengunci applications.
Gate live wajib inspect volume/locks baru + backup/approval sebelum apply. Tidak
menganggap local10k timing sebagai maintenance-window production proof.

Write order: CMS permission FOR SHARE → recruitment allowlist FOR SHARE →
transaction advisory actor+request UUID → applications FOR UPDATE → replay/hash →
version/transition → state/note/event. Advisory lock menserialisasi UUID lintas
receipt/operasi. SHA256 DB atas canonical jsonb normalized intent; browser tidak
mengirim actor/hash/result. Exceptions roll back seluruh state/note/event.

Reads via service-only RPC. Writes menggunakan existing Management API transport
seperti CMS untuk menghindari known PostgREST safeupdate limitation; SQL function
name tetap dispatch constants, input UTF8 hex literals, existing credential saja.
Tidak hook/rebuild. Atomic write audit berasal events; read audit tetap best effort
menggunakan wrapper lama, sekarang presence/category/page saja tanpa raw search.

## UI lokal

Surface1nav/login existing preserved;2stats/filter/list bounded;3detail/status;
4notes/history semuanya selesai synthetic4widths. Current page50rows saja ditahan
browser; Prev/Next request baru, shared server as_of. Detail menyembunyikan filter/
stats sementara dan memberi focus heading; natural scroll. Tidak nested modal.
Status memilih draft, terminal/reopen confirmation inline, alasan10–500 wajib.
Notes1–4000codepoints/16KiB/LF/append-only, history dan notes20/page.

Timeout/5xx/network = belum dikonfirmasi, retry manual exact UUID+payload; input
intent dikunci sampai hasil diketahui. Conflict409 mempertahankan draft dan
membaca detail terbaru, intent baru setelah reviewer meninjau. Dirty navigation
confirmation; logout/401/403 membuang data/draft/confirmation label dan menolak
stale replies. Tidak local/session storage, PII query URL untuk search, SDK baru,
external links/analytics, export/bulk/message/Team write.

Konstanta status di server/recruitment-review-status.mjs shared UI. Validator
server terpisah dari import UI supaya Rollup tidak mengubah hash public form.
Temuan initial parity form-script hash corrected; final19HTML byte-exact.

## QA aktual

| Check                                            | Hasil                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| fullCMS tanpa env server                         | 94PASS,10Team live mutation SKIP,0FAIL                           |
| Recruitment intake/shared lifecycle/contract/API | 39PASS,0FAIL                                                     |
| Intake real ephemeral DB                         | 13/13PASS                                                        |
| Workflow real ephemeral PostgreSQL18.6           | 142/142PASS                                                      |
| Build Node22.23.0                                | 0errors,23pages                                                  |
| 7gates + SEO                                     | PASS; responsive468/468, spacing39 + workflow page, pageerrors[] |
| Native/Team/workflow synthetic browser           | Masing-masing320/390/768/1440 PASS                               |
| Snapshot /19publicHTML same input                | Byte exact; snapshot4345f1…4857 unchanged                        |
| Dist scan                                        | 71textfiles termasuk SVG, server secret findings0                |

DB coverage:0/1/49/50/51/200/201 pagination + tied times + final page;10kapps+
10knotes/events;8×8transitions, terminal/reopen reasons, Unicode/control/trim/LF,
all38fields/hash/timestamp immutable, filters %,_,backslash and WIB boundaries,
stats group sums/zero counts, forced event failure rollback,8concurrent writes,
8identical retries, UUID cross receipts, revocation race, as_of insert protection,
role denials on7wrappers and3tables×4operations×3roles. Old RPC definitions/ACL
fingerprint unchanged in ephemeral cluster. Query-plan received_at/receipt index
reviewed with synthetic10k; substring search remains literal scan, no extension.

Workflow browser:5server pages/201rows, filter reset/no matches/empty DB, keyboard,
38fields text-safe, stale list/detail responses, status confirmation/reopen,
conflict/draft preservation, lost response replay1effect,20-item notes/history
pages/long-body wrapping, failed reads/missing receipt, forbidden/login/logout,
late response after logout, password cleared, overflow0/pageerrors0.

Two initial public-browser readiness failures occurred while rebuilding dist;
rerun after stable owned static preview PASS. A browser harness error-label wait
was corrected to match actual UI. Login bootstrap now disables submit until first
session check resolves. These initial failures are not counted as final PASS.

Proof ignored artifacts/recruitment-review/: catalog-baseline/final, public-baseline,
db-proof, browser-proof, integrity-proof, qa-summary; synthetic screenshots/logs.
No credential or real applicant payload in artifacts/docs. Local Postgres18.6 QA
is not execution on live17.11, and mocks are not owner/live mutation proof.

## Next gate E–F

1. Owner review concrete SQL/objects existing web-community/yejrdckcmlxrkklgtrwy,
   encrypted backup/restore scope, current catalog/locks/counts → separate apply approval.
2. One approved migration once → read-only inspect, then approval exact HEAD SHA
   for one origin/main push. Existing e59abde approval consumed; no auto-push.
3. READY/alias exactSHA + owner read-only shared reads/refresh/logout; then separate
   concrete synthetic12POST/conflict/retry and guarded event→note→state→app cleanup.

No applied/deployed/live acceptance claim. Forward rollback retains review metadata,
old read RPCs and prior e59abde deployment; no drop/delete to undo notes.
