# Dashboard admin — master plan performance, loading dan feedback

8 Oct 2026. Owner meminta PLAN untuk percepatan seluruh dashboard admin dan
pesan loading/error/success. Status **PROPOSED / PLAN ONLY**; belum implementasi,
timing authenticated baru, SQL, config, deployment atau owner acceptance baru.
Terpisah dari fix foto Team lokal. Production14e62af workflow accepted tetap.

Dokumen ini diperinci menjadi handoff eksekusi AI baru: §1–10 tujuan/desain;
§11–22 baseline, file map, algoritme, kontrak state/transport, tasks/DoD,
QA commands, acceptance dan rollback. Prompt siap salin:
[kickoff AI baru](admin-performance-feedback-kickoff.md). Membaca prompt contoh
tidak memberi izin implementasi pada sesi PLAN ONLY ini.

## 1. Tujuan dan batas

Projects `/admin/`, Team `/admin/team/`, Pendaftar `/admin/recruitment/`, shared
login/refresh/logout, upload, save/delete/publication, status/note/conflict/retry.
Respons UI cepat, data pertama muncul tanpa request berulang, pesan setiap
operasi jelas. Existing Supabase dan dependencies; tanpa provider/infra baru.
Public form/UI, CMS content, grants/users/allowlist/env/OPEN tidak berubah.

Target usulan, **bukan hasil ukur atau janji instan**:

| Ukuran                   | Target awal                                    | Kondisi                                        |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| Feedback klik/input      | ≤100ms p95                                     | UI lokal, tidak menunggu API                   |
| Struktur/skeleton awal   | ≤200ms setelah JS siap                         | Tidak memuat data privat sebelum izin          |
| Data pertama modul       | ≤1s p50 / ≤2s p95                              | Warm, jaringan baik; evaluasi setelah baseline |
| Konfirmasi save terlihat | ≤100ms setelah response sukses                 | Bukan sebelum DB commit                        |
| Pekerjaan sekunder       | Tidak menghalangi data utama                   | Statistik/history dapat loading sendiri        |
| Cold/slow request        | Feedback progres, batas tunggu dan retry jelas | Timing dilaporkan terpisah                     |

Jika bottleneck jaringan/region menghalangi target, laporkan ukurannya dan opsi
konkret; jangan menyembunyikan latensi atau mengubah infra otomatis.

## 2. Temuan source audit

| Surface               | Bukti saat ini                                                                               | Implikasi                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recruitment bootstrap | `src/scripts/recruitment-admin.js`: stats → loadList → stats                                 | 3 request berurutan, statistik diduplikasi                                             |
| Recruitment list      | Daftar dirender sebelum filtered stats; stats memakai list `as_of`                           | Jaga konsistensi snapshot, jangan asal parallel dengan timestamp berbeda               |
| Recruitment detail    | Detail → notes/history parallel                                                              | Detail bisa ditampilkan dahulu; notes/history tidak harus mengunci form sepanjang read |
| Recruitment save      | Mutation → detail+notes/history → list → stats; `saving` false di finally                    | Acknowledgement dan interaksi tertunda oleh refresh pendukung                          |
| Recruitment fetch     | Tidak ada browser AbortController/deadline; generation guard sudah ada                       | Response lama diabaikan tetapi request tetap berjalan                                  |
| Projects fetch        | `src/scripts/cms-admin-editor.js`: load GET, busy global, fetch tanpa deadline               | Read dan mutation perlu status/recovery berbeda                                        |
| Team fetch            | `src/scripts/cms-team-editor.js`: `setBusy` menonaktifkan semua button                       | Proses satu area membuat dashboard terasa terkunci                                     |
| CMS backend           | `server/cms-admin.mjs`: auth → RPC/Management write → publication hook                       | Tersimpan dan permintaan publikasi harus dibedakan dari situs sudah live               |
| Shared auth           | `server/cms-auth.mjs`: getUser → cms_verify_admin tiap request                               | Trusted identity/permission wajib, bukan kandidat bypass                               |
| Recruitment backend   | `server/recruitment-admin.mjs`: auth → admin_verify_identity → data RPC → awaited read audit | Beberapa perjalanan upstream per request; ukur durasi tiap tahap                       |

Audit read saat ini awaited, walau failure ditoleransi. Jangan memindahkan audit
ke promise tanpa await pada serverless: delivery bisa hilang. Gabungan RPC/audit
hanya opsi fase terpisah setelah profil dan review SQL; pertahankan audit.
Belum ada bukti root cause region, cold start atau query DB lambat.

## 3. Tahap A — ukur sebelum optimasi

Tambahkan instrumentation lokal/in-process: waktu navigasi, JS ready, feedback,
first usable data, total settle; API time auth identity/CMS permission/recruitment
permission/data/audit/publication, request count, bytes dan status. Timing output
hanya aggregate/module/action/status; tidak URL query ber-PII, body, actor email,
receipt nyata, token/cookie/CSRF/credential. Tidak HAR/trace/storageState sensitif.

Ukur Projects/Team/Pendaftar: initial load, reload, pindah modul, filter/page,
detail, synthetic save/upload, timeout, conflict dan logout. Pisahkan cache/warm
dan cold, mobile390/desktop1440, normal dan jaringan lambat; laporkan sample n,
p50/p95 dan worst, bukan satu request tercepat. Contoh baseline lokal20 reads
per skenario warm; cold alami dilaporkan terpisah tanpa force restart production.
Mutation mocks dan temporary PostgreSQL dahulu. Live login/read-only terpisah;
live fixture/save/upload/hook/cleanup harus punya scope approval konkret baru.

Read-only deployment region/log metadata bila relevan; tidak menyalin raw logs
yang mungkin berisi payload. Tooling provider existing, tanpa telemetry baru.
[Vercel slow function guide](https://vercel.com/docs/functions/debug-slow-functions)
menjelaskan diagnosis duration/cold start/region. Database query plan diuji lokal
pakai synthetic data dahulu sesuai
[Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization).
Tidak enable EXPLAIN endpoint atau extensions baru di live.

## 4. Tahap B — hapus request berulang, tampilkan data utama dahulu

Default prioritas: Pendaftar → Team → Projects → shared navigation/auth UX.

Pendaftar initial load: langsung satu **GET applications** untuk validasi sesi+
permissions existing dan data pertama, sekaligus memperoleh CSRF response untuk
request selanjutnya. Jangan langsung memanggil existing `loadList` POST dengan
CSRF kosong. Lalu satu filtered stats memakai `as_of` response
list. Hapus stats bootstrap duplikat:3 menjadi2 read request, daftar tidak lagi
menunggu initial stats. Skeleton statistik terpisah. Filter tetap submit existing;
tidak otomatis fetch setiap karakter. Jika live search dipilih kemudian, debounce
dan minimum input disepakati; tidak masuk default.

Dedupe hanya read identik yang sedang in-flight pada modul/session generation,
endpoint+normalized filters+as_of. Tidak gabungkan audit berbeda, mutation, atau
request setelah logout/identity change. Abort read saat input/screen/session
berubah, tetap generation guard karena abort tidak menjamin server berhenti.

Detail muncul segera setelah detail response; notes/history loading masing-masing,
partial error bisa retry per panel. Mutation sukses: update hanya field metadata
yang benar-benar ada dalam response, tampilkan acknowledgement segera; invalidate
affected list/stats/notes/history dan refresh dengan urutan dependensi `as_of`.
Jangan menampilkan version/status fiktif; form write baru tetap disabled hingga
fresh revision terkonfirmasi. Saving network dan revalidating UI dipisahkan.

Projects/Team: tampilkan list begitu load response selesai; upload hanya mengunci
kontrol upload/save yang bergantung pada foto. Save/delete tetap mengunci operasi
yang dapat konflik. Pindah modul tidak boleh membuang draft tanpa konfirmasi.
Render small field changes daripada rebuild seluruh DOM jika diukur bermanfaat.

## 5. Tahap C — loading dan status konsisten

Desain admin custom existing, tidak ada node Figma baru. Pertahankan Manrope,
Bluu Next, palette gelap/violet, spacing8–32, max1280, padding32/16,
controls48 existing. Inventaris per surface: login, navigation, module toolbar,
list/form/detail, stats/notes/history, upload, save/publication, logout.
Tidak mengganti layout publik. Per-section plan SOP sebelum implementasi UI.

State model: idle → loading → ready/empty/partial/error; mutation terpisah
draft → saving → confirmed/conflict/rejected/unknown → reconciling.

Skeleton sesuai bentuk konten pada initial load, fixed geometry untuk mencegah
layout shift; tidak spinner fullscreen. Reload di modul yang sama menjaga data
yang sudah valid terlihat dengan label “Memperbarui…”; 401/403 segera clear semua
data privat. Empty hanya setelah response sukses0, bukan sebelum request selesai.
Tidak menghalangi seluruh nav karena stats/history sedang loading.

Loading terlihat langsung; setelah3s beri pesan lambat dan tindakan yang tepat.
Read deadline awal15s sebagai kandidat, diselaraskan dengan timeout server dan
hasil pengukuran. Tombol “Coba lagi” hanya mengulang panel yang gagal. Tidak fake
progress percentage; indeterminate untuk upload tanpa byte progress terukur.
Mutation timeout tidak diberi label pasti “gagal”; server bisa sudah commit.

## 6. Pesan yang direncanakan

| Keadaan                   | Contoh pesan                                                    | Tindakan                                            |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Initial load              | “Memuat pendaftar…”                                             | Skeleton bagian data                                |
| Reload                    | “Memperbarui daftar…”                                           | Data lama pada screen yang sama tetap terlihat      |
| Slow read                 | “Data belum selesai dimuat.”                                    | Tetap menunggu sampai deadline; retry setelah gagal |
| Empty global              | “Belum ada pendaftar.”                                          | Normal, bukan error                                 |
| Empty filter              | “Tidak ada pendaftar sesuai filter.”                            | Reset filter                                        |
| Read offline/timeout      | “Data belum bisa dimuat. Coba lagi.”                            | Retry panel; jangan logout otomatis                 |
| Save pending              | “Menyimpan perubahan…”                                          | Disable write relevan                               |
| Confirmed review          | “Status diperbarui.” / “Catatan ditambahkan.”                   | Refresh pendukung                                   |
| Confirmed CMS save        | “Perubahan tersimpan. Penerbitan diminta.”                      | Jangan klaim sudah live                             |
| Publication partial/error | “Perubahan tersimpan, tetapi penerbitan belum berhasil.”        | Retry publication, tidak ulang save                 |
| Unknown write result      | “Hasil penyimpanan belum terkonfirmasi. Periksa data terbaru.”  | Reconcile sebelum retry                             |
| Exact workflow replay     | “Kiriman ini sudah tersimpan. Tidak ada duplikasi.”             | Tidak tambah effect                                 |
| Conflict409               | “Data sudah berubah. Muat versi terbaru; draft tetap tersedia.” | Review ulang sebelum write baru                     |
| Input invalid             | “Periksa [field yang salah].”                                   | Inline field error+focus                            |
| Forbidden403              | “Akun ini tidak memiliki akses ke modul ini.”                   | Clear private module data                           |
| Session expired401        | “Sesi berakhir. Masuk lagi untuk melanjutkan.”                  | Clear private data/password                         |
| Logout success            | “Sudah keluar.”                                                 | Semua module session data cleared                   |
| Logout failure            | “Belum bisa keluar. Coba lagi.”                                 | Jangan mengklaim session terminated                 |

Pesan penting persistent inline dekat aksi. Toast hanya pelengkap untuk success
singkat; tidak menghilangkan error/draft. role=status/aria-live polite untuk status,
role=alert untuk error relevan, aria-busy per panel, focus tanpa stealing saat
background refresh, keyboard dan prefers-reduced-motion terjaga.

## 7. Tahap D — recovery, izin dan privasi

Setiap API request tetap trusted actor+CMS permission; recruitment allowlist juga.
POST Origin+CSRF, sealed cookie dan global logout tetap. Tidak membuat cache auth
lintas request atau memperpanjang permission freshness untuk mengejar latency.

Default **tanpa persistent PII cache**: tidak localStorage/sessionStorage/IndexedDB,
Service Worker, CDN/shared cache, browser token, global server session object.
In-flight dedupe bukan response cache. DOM data pada screen aktif boleh tetap
terlihat selama reload, tetapi revoke401/403/logout/navigation expiry membersihkan.
Existing module routes full-page navigation; cache memory tidak otomatis hidup
lintas page. Persistent admin shell adalah opsi tahap lanjut, bukan asumsi quick win.

Read retry bounded dan manual default. Workflow write retry mempertahankan UUID
dan payload identik untuk intent yang belum dikonfirmasi. Projects/Team/upload
tidak dianggap idempotent hanya karena workflow idempotent: jangan automatic retry
POST mereka. Reconcile state/revision dahulu; field draft non-secret tetap tersedia
selama session valid. Password tidak dipertahankan. Global refresh single-flight
hanya di document context yang sama; test rotated-cookie races antartab.

## 8. Tahap E — backend berdasarkan bukti

Bila B–D belum memenuhi target, gunakan profiling A untuk pilih satu optimasi:
combined protected read RPC/list+stats dengan satu snapshot; request-scoped
dedupe verifikasi identitas yang benar-benar redundant; query/index lokal dengan
synthetic cardinalities50/500/5000, filter/sort/count/explain. Default tetap existing
SQL/Auth, dan protected operations tidak boleh mulai sebelum izin diverifikasi.

Gabungan permission/data/audit memerlukan proof revoke/race/ACL dan mempertahankan
audit semantics. Jangan parallelize authorization dependent steps sembarangan.
SQL additive lokal optional hanya jika benefit terbukti; live apply memerlukan
exact objects/project+backup approval. Region/provider/env/upgrade tetap opsi
review terpisah, tidak bagian eksekusi default. Tidak fire-and-forget audit,
menonaktifkan grant checks atau mengklaim cold start tanpa data.

## 9. QA dan acceptance

Local: existing fullCMS tanpa server env sehingga10Team live mutation SKIP,
recruitment/auth/Origin/CSRF/conflict/retry tests, workflow ephemeral PostgreSQL
bila kontrak workflow berubah. Mocks320/390/768/1440 untuk3module + shared auth:
fast/delayed/timeout/offline/400/401/403/409/429/500/malformed JSON,
out-of-order responses, double click, navigate while pending, expired/revoked
session, rotated CSRF, note XSS safety, failed panel without blocking others.
Mutations unknown→reconcile, replay single effect, unchanged draft, global clear.

Compare before/after timing and request counts with same fixtures/environment;
delay mocks membuktikan UX/sequence, bukan real Supabase latency.7gates+SEO,
public HTML/snapshot parity, dist/diff secrets0; admin-only asset hash changes
dicatat bila memengaruhi bundling, jangan melonggarkan parity tanpa alasan.

Live release terpisah: exact HEAD SHA approval→one push→READY/primaryalias→
secure owner read-only metrics. Live mutation/fixture/hook/cleanup membutuhkan
izin baru konkret; fixture12POST sebelumnya sudah selesai/consumed, bukan izin
uji baru. Recruitment OPEN, existing data/grants/content/provider unchanged.

## 10. Deliverables dan urutan eksekusi

1. A: baseline timing/request graph + bottleneck verdict, no sensitive artifacts.
2. B: remove duplicate reads + priority rendering; before/after call count proof.
3. C–D: shared loading/feedback/recovery behavior dan copy matrix accepted lokal.
4. QA:3modules/auth mocks, gates/parity/privacy and measurable improvement report.
5. E hanya jika profil membuktikan perlu: local reviewed SQL/backend proposal.
6. Commit/local reviewable diff; exact push approval; live acceptance scope terpisah.

Rekomendasi: **A–D dahulu**. Tidak perlu dependency/infra/upgrade atau SQL baru
untuk menghapus request berulang dan membuat UI lebih responsif. Implementasi
performance belum diotorisasi oleh pesan plan ini; NEXT review plan → instruksi
eksekusi lokal. Semua target di atas masih proposed, bukan applied/deployed/accepted.

## 11. Baseline aktual dan urutan baca AI baru

Workspace `/home/faiz/ds/ds5opencode`. Bahasa Indonesia, panggil owner bro.
Pada audit planning ini working tree awal clean, HEAD plan awal
`3cb5d53df36ffb8bba223dc26756192af0757faa`; foto Team lokal
`5c56f0dd3e5cc144ba01a269c0a98484fdf7e6cb`. HEAD checkpoint detail berikutnya
dilihat dari git log, bukan dianggap otomatis deployed.

Production accepted terakhir `14e62aff1614436b9d9a90a359b3f2800b4a6f23`,
Current+primaryalias READY `dpl_GadJRkTnfiRe2QeZKCzknKrBAJcX`, existing Supabase
web-community/yejrdckcmlxrkklgtrwy. Status itu checkpoint sebelumnya, bukan hasil
probe production baru pada pass planning ini. Recruitment OPEN/shared login
accepted; workflow migration sudah applied, jangan apply ulang. Fixture sebelumnya
12POST sudah selesai+cleaned dan semua session uji logout. Helper4393 sudah stop;
AI baru tidak punya credential/session aktif. Jangan minta password di chat.

Origin satu fetch/push URL community-web; production remote alias URL yang sama.
Testing absent, jangan recreate. Izin push14e62af consumed. Pending foto lokal
harus dipertahankan saat membandingkan baseline performance; tidak dicampur klaim
public parity terhadap live yang belum mendapat fix foto.

Urutan awal wajib:

1. `git status --short`, log/refs/remotes dan Node22; jangan reset/stash perubahan asing.
2. `AGENTS.md` terbaru → `docs/ai-handoff.md` → master plan ini seluruh §1–22.
3. `docs/cms-migration-todo.md` → `docs/cms-sop.md`.
4. Sebelum UI: `docs/pixel-precision-sop.md`, `docs/assets.md`,
   `docs/page-fullscreen-migration-plan.md`; existing admin custom tanpa node baru.
5. Workflow correctness: `docs/recruitment-review-workflow-plan.md`§1–18,
   `docs/recruitment-review-local-implementation.md`,
   `docs/recruitment-review-live-acceptance.md` dan `docs/admin-unified-recruitment-plan.md`.
6. Baca file map §12, tests dan mocked transport sebelum mengubahnya.

Checkpoint di awal dokumen mengalahkan arsip GAS/testing/closed di bawah.
GAS code dihapus; jangan recreate atau meminta inventory Google. Jangan mengulang
setup CMS, auth, users/grants/allowlist/SQL. Local Node22.23.0 pernah tersedia
di `/tmp/ds-cms-node22/node_modules/node-linux-x64/bin/node`; cek executable/version,
jangan menganggap `/tmp` persist. Pakai Node22 existing lain bila path hilang.

## 12. File map dan batas perubahan default

| File                                                                                                                | Tugas konkret                                                    | Batas                                                        |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/scripts/recruitment-admin.js`                                                                                  | bootstrap/list/detail/generation/loading/sendMutation/recovery   | Preserve filters/as_of/page/version/UUID/canonical answers   |
| `src/scripts/cms-team-editor.js`                                                                                    | split busy scopes, load/mutate/upload/login/logout/message       | No Team live DML; preserve group/revision/limits             |
| `src/scripts/cms-admin-editor.js`                                                                                   | load/save/delete/upload/publication/message/session clear        | Preserve existing Projects CRUD contract                     |
| `src/pages/admin/recruitment.astro`                                                                                 | panel skeletons/status/retry/aria                                | Keep IDs used by script and current geometry                 |
| `src/pages/admin/team.astro`                                                                                        | skeleton/feedback/busy scopes                                    | Keep field/form IDs and media input semantics                |
| `src/pages/admin/index.astro`                                                                                       | Projects skeleton/feedback/busy scopes                           | Same constraints                                             |
| `src/components/admin/AdminNavigation.astro`                                                                        | visible navigation busy/draft affordance if needed               | Anchors3module; no persistent SPA shell default              |
| Proposed `src/scripts/admin-request.js`                                                                             | shared same-origin bounded transport + session-generation hooks  | Only create if duplication merits it; no auth token storage  |
| Proposed `src/scripts/admin-feedback.js`                                                                            | shared message/state rendering and scoped ARIA                   | Prefer small helpers; avoid new UI framework                 |
| `server/recruitment-admin.mjs`, `server/cms-admin.mjs`                                                              | local timing hooks/mock profile only by default                  | No RPC/body/ACL/audit/hook behavior change in quick wins     |
| `server/cms-auth.mjs`                                                                                               | inspect timings/correctness; fixture injected fetch existing     | No auth rewrite/cache/permission TTL change                  |
| `server/recruitment-admin-route.mjs`, `api/admin/recruitment/[...route].js`                                         | retain deployed Vercel metadata normalization                    | Unknown/duplicate/mismatched filters still rejected          |
| `tests/cms-auth.test.mjs`, `tests/cms-native-admin.test.mjs`                                                        | only meaningful changed-boundary regression cases                | No live credentials loaded                                   |
| `tests/recruitment-review-contract.test.mjs`, `tests/recruitment-shared-admin.test.mjs`                             | API/status/version/privacy/CSRF regressions                      | Preserve coverage, not implementation mirrors                |
| `scripts/verify-cms-native-admin.mjs`, `scripts/verify-cms-team-admin.mjs`, `scripts/verify-recruitment-review.mjs` | extend existing actual built-page mocks/delays/errors            | Keep existing assertions unless scope intentionally changes  |
| Proposed `scripts/verify-admin-performance.mjs`                                                                     | deterministic request-count/UX timing scenarios and safe summary | Synthetic data; no production URL/env/session option default |

No default changes to public components/forms, `src/data/cms-snapshot.json`,
`package.json`/lock, Supabase migrations, existing SQL/auth contracts/env.
Shared helper must be imported only by admin entrypoints; preserve public bundle
parity. Proposed filenames are implementation options, not files already created.

## 13. Timing protocol dan request budgets yang dapat diuji

Instrument browser with `performance.now()` and injected synthetic transport;
server factory optional timing callback only if useful, disabled by default,
request-scoped state. No public debug endpoint/secret header. Owner UI shows user
messages, bukan raw timing/API URLs/internal config. Baseline request sequence
captured before refactor; before/after use same synthetic values and delay schedule.

Safe aggregate artifact schema example (numbers replaced by actual measured values):

```json
{
  "module": "recruitment",
  "scenario": "initial-warm",
  "environment": "local-mock",
  "width": 390,
  "sampleCount": 20,
  "privateReadCount": 2,
  "feedbackMs": { "p50": 0, "p95": 0, "max": 0 },
  "firstUsableDataMs": { "p50": 0, "p95": 0, "max": 0 },
  "fullySettledMs": { "p50": 0, "p95": 0, "max": 0 },
  "pageErrors": 0,
  "proofKind": "synthetic-only"
}
```

Zeros di atas placeholders, jangan disalin sebagai hasil. Percentile:
sort samples lalu nearest rank `ceil(p*n)-1`; report n, median/p95/max dengan
rumus sama. Sebut20sample cukup untuk trend lokal, bukan p95 produksi terpercaya.
Ukur browser event→feedback DOM ready→data interactable, bukan network duration
saja. Bytes aggregate boleh; body/filters/receipt tidak masuk artifact.

| Scenario                 | Request budget default                                                | Assert                                                           |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Recruitment initial      | 1applications → 1stats; public intake status1 terpisah                | No initial stats duplicate; valid list as_of reused              |
| Recruitment filter/reset | 1applications → 1stats per committed filter                           | No hidden extra bootstrap; stale response ignored                |
| Recruitment page         | 1applications → 1stats                                                | Same as_of; no stat cache based only on unchanged filter         |
| Detail open              | 1detail → 1notes + 1history parallel                                  | Detail ready before both secondary panels settle                 |
| Notes/history page       | 1selected panel request                                               | No detail/list reload                                            |
| Confirmed note/status    | 1mutation; at most1detail,1notes,1history,1list,1stats reconciliation | No duplicate write; ack visible before secondary requests finish |
| Projects/Team initial    | 1module GET each                                                      | No login POST if existing sealed session valid                   |
| Projects/Team mutation   | 1POST and existing server publication behavior                        | No browser resubmit as publication retry                         |
| Manual retry panel       | 1failed-panel read per click                                          | No whole-page reload or unrelated panels                         |

Request budgets are browser API calls, not number of internal Auth/RPC/audit
trips. Cold start diagnosis requires provider start-type/duration evidence;
first mock request or slow request is not proof of real cold start.
No automatic prefetch private pages: extra reads/audits/permissions cost must be
measured before any optional prefetch design.

## 14. Recruitment algorithm dan concurrency constraints

### Initial / list / filter

`bootstrap` starts **GET applications** with current session generation; show anonymous neutral
shell until trusted response. Valid list response establishes permitted workspace,
captures as_of/counters/page data, paints table first. Start filtered stats with
exact applied filters+list.as_of. Stats failure becomes stats-panel partial error,
not table disappearance/global logout unless server actually returns401/403.
Empty message only after valid list0; initial network/server error not empty state.

Critical method dependency: current `loadList` uses protected POST; `csrf` initially
undefined before restored-session bootstrap. The old initial GET stats provided
CSRF, so removing it requires replacing that role with GET list, not deleting it
and invoking unchanged POST list. GET list response supplies validated CSRF;
filter/pagination POSTs can then retain existing policy. Logged-in startup from
login response already has CSRF, but choose one tested GET-first startup path.
Do not read HttpOnly cookie in browser or add an unprotected CSRF endpoint.
Lock regression: valid restored sealed session + no browser CSRF → GET list200,
then protected stats/list POST passes; anonymous first GET401, no private data.

Filter commit captures immutable copy of values. Increment list generation and
cancel superseded read; list/stat responses carry originating generation locally.
Only current generation updates counters/pagination/status. Reset/page changes
respect existing dirty-detail confirmation; canceling confirm sends no new read.
`as_of` retained for same filter pagination, reset on new filters/confirmed write.
50records/page, notes/history20/page and WIB retained, no full-table client slice.
`as_of` is existing intake cutoff/filter consistency, not proof that all mutable
review states are frozen. Another reviewer can change statuses during pagination;
don't cache stats solely by filters/as_of or promise a transaction snapshot across
separate HTTP requests. Keep existing semantics; stronger snapshot is separate SQL
design, not a silent frontend assumption.

### Detail and independent panels

Increment detail generation when opening/changing receipt. Clear previous detail
before new receipt, not show another applicant under a new title. Render detail
upon valid response; current receipt/version establish action controls. Start notes
and history concurrently after detail success. Each panel has independent page
offset/generation/busy/error; older receipt callbacks cannot render into new detail.
One failed panel does not erase successful detail or other panel. NOT_FOUND clears
detail and explains absence; no blind reopen/retry mutation.

### Successful mutation / partial revalidation

Split `writePending`, `revisionPending`, per-panel `readPending`, `unconfirmedIntent`.
After validated success show immediate authoritative action acknowledgement and
clear only submitted draft, then reconcile. Do not wait for list/stats/history to
report success. Keep write controls disabled while correct fresh revision is
unknown; read/navigation remains scoped and draft-aware. Unknown/malformed success
schema is **unknown result**, not definite success; reconciliation required.

Use response metadata only if existing contract contains validated authoritative
version/status; otherwise fresh detail must supply them. Parallelize reads only
where independent: detail and fresh list may be independent; stats waits list.as_of,
notes/history may remain after detail. Schedule/await ownership ensures no
unhandled rejection and no race with later write. Event ledger UI rebuilt from
authoritative reads, not fabricated local events/actor labels.

When switching receipt/filter after confirmed write, old callbacks can finish
but must not clear new draft/update new UI. Mutation lifecycle is not aborted by
ordinary read cancellation. Page navigation with unknown write result warns about
unconfirmed changes; no automatic second POST. Invalidate background data on401/403
and never let a later successful stale callback unhide private workspace.

### Conflict / replay / uncertain network

409CONFLICT preserves current draft, reloads authoritative detail, explains change,
requires owner review before building new UUID/expected_version.409ID_CONFLICT
means same UUID was bound to a different payload; no auto new intent/write.
For timeout/5xx after dispatch, retain exact original `{request_id,payload}`
in current memory while session valid. Manual retry uses same UUID/body; no
new reason/status/version attached to original intent. Retry/replay one effect
verified by ephemeral DB. Logout clears drafts/intents; never persist them to disk.

## 15. Projects/Team busy scopes dan publication limits

Replace one global busy switch with explicit scopes: bootstrapRead, formRead,
mutation, upload, publicationRetry, logout. Scope matrix:

| Pending operation             | Controls disabled                                                   | Controls available                          |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Initial module read           | Mutations until valid state/revision                                | Login/menu according to auth state          |
| Background statistics/history | Related pager/retry duplicate                                       | Other settled areas                         |
| Upload                        | Upload duplicate + dependent save/delete/record switching if unsafe | Unrelated navigation with draft guard       |
| Save/delete                   | Conflicting write and dependent form operations                     | Read-only UI; menu guarded if dirty/unknown |
| Publication retry             | Retry duplicate and overlapping publication-affecting operations    | Read-only content                           |
| Logout request                | Login/mutation/duplicate logout                                     | Clear indication; no false logout success   |

Keep dirty/read-reload confirm: ordinary reload must not silently discard draft.
Failed read may retain settled same-view data marked stale, but no write on unknown
revision. Partial backend success must not be rendered as total failure.

Important current backend fact: save/add/delete response comes after Management
write and publication hook(s). Browser cannot learn earlier DB commit from a pending
request. Default A–D leaves this backend contract intact. Slow copy says saving+
requesting publication; first actual response can confirm saved and hook acceptance.
Do not emit optimistic “tersimpan” just because request sent. No fire-and-forget
publication/no new queue or provider. Earlier server acknowledgement is optional
separate backend design, requiring explicit delivery/retry proof and contract review.

CMS write/network/malformed success uncertainty: preserve draft/read state,
offer reconcile by load GET. For add, do not blindly regenerate another record;
for delete, compare confirmed existence/revision. A match can inform owner but
is not proof that this client request alone caused it if another session changed
state. Offer explicit owner decision after fresh read; no automatic save/resubmit.
Upload timeout may leave an orphan object; do not auto cleanup or retry/create
extra objects. Live cleanup outside scope without exact target approval.

## 16. Shared transport contract dan session lifecycle

Small helper if adopted must support existing GET query, JSON POST and FormData
upload. FormData Content-Type left to browser boundary, Origin same-origin browser
behavior preserved, X-CSRF-Token required for protected POST. Login has distinct
existing pre-session policy; don't require a session CSRF before login works.
Keep `credentials:same-origin`, `cache:no-store`, existing sealed HttpOnly cookie.

Transport classifications: success(valid schema), rejected(domain4xx), forbidden,
unauthorized, rate_limited429, not_found404, conflict409, server5xx, malformed,
network, timeout, cancelled/superseded. Record no raw body or sensitive URL. Preserve
current caller contracts (`http`/`ok`/`error`) via adapters rather than silently
changing all consumers. Cancellation due to superseded read produces no red error
banner; timers/listeners removed in finally. New generation cannot reuse old
in-flight request/CSRF; dedupe limited to exact same logical read operation.
If multiple consumers share a request, define ownership; one cancelled consumer
must not abort another still-current consumer. Avoid general cross-panel dedupe
unless this lifecycle is tested; preventing duplicate call at source is preferable.

Timeout proposed defaults: slow threshold3s, browser reads15s; mutations bounded
only after measuring existing upstream ceiling. Browser deadline does not cancel
SQL commit/hook. Do not choose5s mutation timeout to meet a speed target. Upstream
auth RPC15s and recruitment RPC/Management30s per call are existing bounds;
total serial request can exceed one bound. Instrument before selecting total
deadline; never change server timeout/infra without evidence.

Refresh same-document single-flight, csrf/session epoch synchronized. Cross-tab
cookie rotation checked with mocks; do not invent shared process Auth client state.
Login password clear in finally on success/HTTP error/network/parse failure;
never emit/store form payload in instrumentation. Pending bootstrap401 from old
generation must not end a later successful login. Starting login cancels old
startup reads and advances generation; only current session can update state.

Any actual401/403 triggers fail-closed private state clearing; revoked permission
cannot remain editable using a memory cache. Browser network failure without
HTTP401/403 does not automatically logout.403FORBIDDEN message is permission;
403UNAUTHORIZED from Origin/CSRF validation is invalid session/request, not falsely
“akun tidak diizinkan”. No auto replay rejected POST to guess CSRF; secure refresh
or login path as required by tested existing contract.429 uses safe Retry-After
when present, no fixed claim of when permission/login will succeed.

Known backend limit: `authorizeSession` upstream error currently can become401.
UI cannot distinguish that from actual expired session; obey returned401. Changing
that to503 is a separate explicit backend error-contract decision with tests
proving no data granted on upstream failure. Do not weaken auth to keep screen fast.

Logout acknowledged: increment session epoch, abort reads, drop CSRF/in-flight
state/revisions/drafts/intents/list/detail/notes/history/media objectURLs/password;
all stale callbacks ignored. Logout failure: clear indication but no claim that
cookie/server session ended. Idle session remains bounded by existing contract.

## 17. Detailed UI inventory dan copy rules per section

This is an admin custom pass, no new Figma node/assets/fonts. Reuse currently
measured max1280/padding32desktop16mobile; verify each actual admin stylesheet
before altering. Do not change geometry assertions to hide a bug. Skeleton shapes
follow existing visible card/list/form row heights; placeholders have no names or
PII, aria-hidden, high-level region labelled loading and `aria-busy=true`.

| Section               | Loading/partial/error surface                            | Completion criteria                                                 |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| Shared nav/login      | Login submit pending label, inline login error           | Password blank all paths;3module active nav preserved               |
| Module toolbar        | Reload button busy, nearby persistent action feedback    | No button jumps; duplicate reload ignored                           |
| Projects list/form    | List placeholder, form disabled until selection/revision | Selection stable; long names wrap/ellipsis existing                 |
| Team list/groups/form | Group list placeholder and upload preview state          | Group policy1–8 preserved; fit foto5c56f0d retained                 |
| Recruitment table     | Table skeleton, empty/filter/error distinct              | 50/page and pager state correct                                     |
| Recruitment stats     | Independent skeleton/error+retry                         | Same filter/as_of; correct counts                                   |
| Recruitment detail    | Detail placeholder, revision readiness                   | Existing safe38answers formatting, no XSS                           |
| Notes/activity        | Panel-local skeleton/error/retry/pagination              | 20/page and append-only history retained                            |
| Upload/save/delete    | Adjacent progress/result/unknown/conflict                | Draft protection and duplicate prevention                           |
| Publication/logout    | Persistent acknowledgement/error                         | Hook accepted not equated deployment READY; logout no false success |

Use plain Indonesian, lowercase sentence case, direct next action. No raw error
codes/stack traces/project IDs/API URLs or “konfigurasi server” details for owner
unless meaningful. Empty count is information, success notice not alarming green
banner by default; error persistent and actionable. No toast-only important state.
After3s slow message must not replace confirmed-save success with generic loading;
per-panel status precedence preserves most important unconfirmed/conflict state.

Keyboard: no focus jump on background refresh; inline validation focuses first
invalid field, explicit owner retry may focus panel heading/error.401/403 after
private clear returns focus to login/permission explanation. `aria-live` polite
for loading/success, assertive only critical errors; dedupe announcements so every
statistics poll does not spam screen reader. Reduced-motion skeleton static;
no infinite shimmer required. Check contrast/visibility in existing palette.

## 18. Work packages, dependencies dan definition of done

| Package                      | Depends                                | Work                                                     | DoD/artifact                                               |
| ---------------------------- | -------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| A0 orientation               | Owner local implementation instruction | Read§11, verify git/Node, preserve foreign changes       | safe repo-state, baseline SHA/version recorded             |
| A1 baseline                  | A0                                     | Capture snapshot19public HTML+admin fixtures; measure§13 | baseline.json/request-count.json, source-verdict           |
| B1 recruitment startup       | A1                                     | list-first; stats as_of; abort/generation                | 3→2private reads; delayed stats doesn't delay list         |
| B2 recruitment detail/save   | B1                                     | separate panel lifecycle and write acknowledgement       | notes/history partial,409/replay/unknown tested            |
| C1 shared transport/feedback | A1/B1 findings                         | Small helpers if useful, cancellation/deadline/copy      | tested classification/session clear, no dependencies       |
| C2 Team UI                   | C1                                     | scoped busy, upload/revision/publication messages        | mock CRUD/upload/reconcile all4widths;0live writes         |
| C3 Projects UI               | C1                                     | same state conventions, preserve CRUD/delete             | native mock and snapshot content unchanged                 |
| D1 cross-module/session      | B2/C2/C3                               | draft navigation guards, auth/password/global clear      | delayed old responses afterlogout/login cannot leak        |
| D2 release QA                | D1                                     | full suites/gates/parity/performance summary             | PASS/SKIP counts+limits actual, no fictitious latency      |
| E optional backend           | A1 profile+D2 unmet target             | propose precise protected RPC/query change locally       | isolated DB/ACL proof and exactSQL proposal; no live apply |
| F local handoff              | D2/E if selected                       | docs+commit+reviewable diff/report                       | local SHA, applied/deployed/accepted distinctions clear    |

Integrate shared helper sequentially per module; don't concurrently mutate same
dist/snapshot or race fixture builds. No subagents unless owner/applicable instruction
explicitly requests them. Commit meaningful completed package, not every cosmetic
line. Preserve original baseline proof as immutable; separate after-results files.

Do not stop at skeleton alone: require fewer duplicate reads + confirmed timely
acknowledgement + recovery + security regressions + numeric before/after report.
If real latency cannot be measured without owner login, complete local work and
report pending live timing honestly; never treat mocks as production speed proof.

## 19. Reproducible local QA commands dan fixture ownership

Initial read-only commands, no fetch/push mutation of remote refs required:

```sh
git status --short
git log -5 --oneline
git for-each-ref --format='%(refname:short) %(objectname)' refs/heads/main refs/remotes/origin/main refs/remotes/production/main
git remote -v
node --version
```

Select verified Node22 bin directory into task variable `ADMIN_NODE_BIN` and prepend
to PATH. If installed22 already default use its directory. Not an env/infra provider
change. Never repurpose HOME/CODEX_HOME. Following commands intentionally run with
clean env: no `--env-file`, dotenv import or automatic credential inheritance.

```sh
ADMIN_NODE_BIN=/tmp/ds-cms-node22/node_modules/node-linux-x64/bin
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run test:cms
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run test:recruitment
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 CMS_DATA_SOURCE=local npm run build
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run verify:cms-native-admin
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run verify:cms-team-admin
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run verify:recruitment-review
```

`test:cms` includes direct Supabase Team writes when server env exists; expected
10SKIP without env. Validate skip count/reason from actual output; changed test
count may vary, don't claim historical94/42 as new result. No tests against live
CMS Team/projects RPC. Extend existing browser mocks or add proposed performance
runner§12; command only exists after implementation, do not claim it already exists.

For ephemeral DB: discover `initdb`, `pg_ctl`, `psql` actual PATH (existing local
PostgreSQL toolchain); ensure non-root runner supported. Scripts create temporary
cluster and synthetic fixture, no external URL option. Keep only required tool PATH
in clean env. Run required regression once after final relevant code change:

```sh
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run verify:recruitment-db
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run verify:recruitment-review-db
```

If binaries missing, investigate existing ephemeral toolchain from prior docs;
do not substitute production Supabase or mutate system packages/provider silently.
Exact PostgreSQL version reported, prior18.6 local versus17.11production not equated.

Start owned static preview after build (example4331; choose free port, do not kill
another listener). Use same preview URL for dependent browser gates:

```sh
python3 -m http.server 4331 --bind 127.0.0.1 --directory dist
```

Separate terminal / owned session:

```sh
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 PREVIEW_URL=http://127.0.0.1:4331 node scripts/verify.mjs
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 PREVIEW_URL=http://127.0.0.1:4331 node scripts/navbar-audit.mjs
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 PREVIEW_URL=http://127.0.0.1:4331 node scripts/verify-vt.mjs
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 PREVIEW_URL=http://127.0.0.1:4331 node scripts/responsive-audit.mjs
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run audit:spacing
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run format:check
env -i PATH="$ADMIN_NODE_BIN:$PATH" LANG=C.UTF-8 npm run seo:audit
git diff --check
```

Run independent checks batched where memory permits; avoid too many Chromium
processes on low RAM. Snapshot-mutating renderer/growth scripts must run alone,
restore only their owned fixture in finally, rebuild baseline before other gates.
Default performance pass does not need Team growth renderer after admin-only change;
photo fit baseline already local and must not be lost.

Baseline integrity: record snapshotSHA256 and19public routes HTML hashes before
edit using local snapshot/build inputs; after compare same inputs. Admin-only
shared import can move hashes into public bundles: fix module boundaries rather
than loosening public parity. Current foto fix is baseline in both comparison
builds; comparison against deployed14 may legitimately include that pending fix.
No production content read/export needed to create synthetic baseline.

Dist/diff secrets scan can privately compare known credentials in process memory,
output count only; never print matches, env listing or credential-bearing body.
Safe artifacts ignored `artifacts/admin-performance/` with baseline/after/qa-summary,
mock screenshots only; real applicant screenshots/HAR/full HTML dumps forbidden.
Owner page uses actual identities held memory only if future live login authorized.

## 20. Acceptance matrix wajib sebelum local-complete

Each3module at320/390/768/1440: normal load, slow read, network timeout, partial
error, empty, valid load afterretry, invalid input, save success, unknown save,
conflict, 401/403, logout success/failure, navigation guard. Recruitment additionally
list/stats as_of, pagination50, notes/history20, snapshot fresh afterwrite,
replay same effect, race guard/version, XSS note and38answers/hash invariant.

Named race cases to lock:

1. Filter A slow→filter B fast; only B visible/counts/as_of.
2. Receipt A slow→B fast; no A fields/history under B.
3. Initial auth/read401 slow→new login200; old result cannot clear new session.
4. Read200 slow→logout200; private UI remains cleared.
5. Current auth403 while another panel200; forbidden state wins, no rehydration.
6. Concurrent duplicate current read intent; one network operation if dedupe used.
7. Note/status successful response then slow/failed history/stats; confirmed-save
   message remains, write readiness depends on authoritative revision.
8. Workflow server commits but response lost; exact retry same UUID effect1.
9. CMS server commits but response lost; zero automatic resubmit/hook retry.
10. Publication hook rejected after committed save; saved+publication warning.
11. Double click save/upload/retry/logout; duplicate effects prevented as contract
    permits, no new persistent cache or optimistic destructive side effects.
12. Two tabs and refresh rotation/revoke; per-request permissions still enforced.

Also lock restored-session/no-CSRF startup GET-first and GET/filter encoding with
Vercel `...route` metadata normalization. This dependency is mandatory even though
the12 named race cases focus on asynchronous responses.

Performance evidence:3→2startup request improvement, data-first ordering,
acknowledgement latency before slow secondary reads settle; UI feedback budgets
tested with mock schedule, real API budgets pending actual authenticated measures.
Capture sample counts/status distribution, compare identical fixtures, don't hide
timeouts from p95 report. All7gates+SEO/current browser suites PASS; Team10liveSKIP
expected, secrets0/snapshot unchanged/public19parity. Report any unmet target as
limitation, not silently mark speed accepted because functionality passed.

## 21. Release, rollback dan independent live gates

Default execution authorization, when owner later asks, is local A–D and QA; no
production mutation. E optional SQL remains proposal until selected. Release:

1. Review final diff+QA+exact new HEAD SHA; keep foto fix local inclusion explicit.
2. Push needs new approval for that exact SHA; one origin push, no testing recreation.
3. SQL if later required: separate exact SQL hash/objects/project+backup/locks
   approval. Already-applied workflow migration untouched.
4. After authorized deployment READY+primaryalias exactSHA, read-only public/anon/
   OPEN checks and separately authorized secure owner read timing.
5. Synthetic save/status/note/upload/hook/conflict/retry/cleanup live needs new
   concrete targets/counts/ledger/cleanup guard. Prior12POST permission consumed.
6. No auto deploy hook/env/provider/region/upgrade; errors not permission to redeploy.

Rollback local code with reviewed inverse patch/commit; preserve owner/foreign
changes. Never reset/stash or overwrite snapshot to erase drift. Runtime release
rollback requires concrete owner-approved target SHA/provider action; no DB drop,
reverse grant or delete applicant data. If E SQL selected, additive rollback/data
retention plan prepared before approval; don't invent destructive undo on failure.

## 22. Handoff format dan finish line

Update `AGENTS.md` and `docs/ai-handoff.md` top checkpoint plus this plan execution
ledger; update SOP/assets/fullscreen provenance only for actual UI scope changes.
Keep plan proposal distinct from local implementation, migration applied (only if
approved), deployed exactSHA and owner live accepted status. Commit docs+code;
no auto push. Safe tracked report includes:

- current local SHA versus deployed14e62af; code files changed and why;
- before/after request budgets and p50/p95/max/sample count/environment;
- UX state/copy matrix delivered and major race/recovery evidence;
- tests PASS/SKIP/FAIL actual,7gate+SEO/snapshot/public/secrets proof;
- untouched auth/ACL/38answers/OPEN/content boundaries and live proof limits;
- pending gates exact approval if deployment or live mutation later requested.

Complete A–D local+QA before presenting reviewable result; don't stop after plan
when a future owner explicitly authorizes execution. If blocked by real credentials
for live acceptance, still finish independent local implementation and tests.
Do not ask redundant general confirmation for local work already authorized;
only live-specific gate requires concrete approval when not already granted.

Planning execution ledger (this pass): §1–22 and kickoff prepared, source audit
verified, docs-only formatting/links/diff check. Performance implementation not
started; no baseline timing claimed, no live reads/writes/deployment/push/SQL/env.

## 23. Execution ledger — A–D LOKAL (8 Oct 2026)

Owner menyalin kickoff authorize A–D lokal. Implementasi+QA lokal selesai;
**local only, belum commit/push/deploy** pada saat ledger ditulis.

Local SHA baseline: `b377e1c` (di atas `5c56f0d` foto Team & plan docs);
deployed terakhir tetap `14e62af`. File berubah: `src/scripts/admin-request.js`
(baru), `src/scripts/recruitment-admin.js`, `src/scripts/cms-team-editor.js`,
`src/scripts/cms-admin-editor.js`, `scripts/verify-recruitment-review.mjs`.

Delivered:

- **C1 transport**: `createTransport` bounded same-origin fetch, klasifikasi
  success/rejected/unauthorized/not_found/conflict/server/malformed/network/
  timeout/cancelled, read deadline15s, slow-notice3s, abort per generation;
  caller contract lama (`ok`/`http`/`error`) dipertahankan.
- **B1 Pendaftar startup**: bootstrap GET `applications` (validasi sealed session
  - CSRF dari response) → 1 filtered `stats` dengan `as_of` list; stats bootstrap
    duplikat dihapus. Request budget lokal: **3→2 private read**. Tabel dirender
    sebelum stats.
- **B2 detail/save**: detail ready sebelum notes/history; panel notes/history
  independen dengan error partial + retry via Muat detail terbaru; mutation ack
  authoritative tampil segera, `revisionPending` menahan write control sampai
  reconcile background (list/stats/detail) selesai; 409/unknown/retry-same-UUID
  dipertahankan.
- **C2/C3**: Team & Projects `setBusy` global → scopes
  read/mutation/upload/publication/logout; nav guard draft; add/delete/retry
  hanya terkunci pada scope relevan.
- **D1**: 401/403 tetap fail-closed clear (UNAUTHORIZED code existing); nav guard
  draft ditambahkan ke Team/Projects.
- Skeletons/`aria-busy` untuk tabel & stats Pendaftar; placeholder tanpa PII.

QA (Node22.23.0, `CMS_DATA_SOURCE=local`, clean env): `test:cms` 104 run
(94 PASS + 10 Team live SKIP, 0 FAIL); `test:recruitment` 42 PASS; browser mock
`verify:recruitment-review` (GET-first + 2-read assertion + ack-before-secondary)
/`verify:cms-native-admin`/`verify:cms-team-admin` 320/390/768/1440 PASS;
`verify.mjs`, `navbar-audit`, `responsive-audit` 468/468, `audit:spacing`,
`seo:audit`, `format:check` PASS; snapshot `4345f1abe445aa2a400c31413ccc0587
07a77105a7e388dc8d1074e78da94857` tetap; 20 HTML non-admin byte-identik pre/post
(hanya 3 HTML admin berubah); dist48textfiles secrets0.

Limitations (jujur):

- `verify-vt` exit non-zero karena pageerror `Transition was skipped.
skipTransition() called` pada history back/forward; dibuktikan **juga muncul
  pada baseline HEAD** (`b377e1c`, `git stash` build) → environmental, bukan
  regresi A–D. Public HTML/JS bytes identik.
- Target 100ms feedback / 1–2s data **belum diukur live**; mock menuntukkan
  sequencing & request-count, bukan latency Supabase nyata. `scripts/verify-
admin-performance.mjs` (runner p50/p95) belum dibuat.
- E backend/SQL/region/combined-RPC tetap proposal; tidak ada perubahan server,
  RPC, ACL, audit, migration, env atau dependency.

Live gates tetap: push butuh izin exact HEAD SHA baru (izin14e62af consumed);
owner read-only timing & fixture/cleanup mutation perlu approval konkret baru.

### 23.1 Deploy (8 Oct 2026)

Faiz (`pyush`) menyetujui push exact HEAD `a9da4ffceb0e10fa180b218bd6c3e96a
6218beb3`. Satu `git push origin main` ke community-web; refs main/origin/main/
production/main sinkron `a9da4ff`. Production Current+primaryalias READY
`dpl_8VToJboQvughDxU7mpreWREmzptx`, alias `data-sorcerers-community-sigma.
vercel.app`; provider READY **08 Oct 2026 14:31:49.984 UTC / 21:31:49.984 WIB**
(workspace clock terpisah). Read-only live: `/`,`/recruitment/`,`/admin/`,
`/admin/team/`,`/admin/recruitment/` 200; `/api/admin/{projects,team,recruitment/
stats,recruitment/applications}` anonymous 401; `/api/recruitment/application`
`{ok:true,accepting:true}`. Izin `pyush` consumed; tidak ada SQL/env/provider/
content/hook mutation. Deployed `a9da4ff`; checkpoint docs sesudah ini lokal saja.

### 23.2 Fix upload foto admin (Team & Projects) — 8 Oct 2026

Owner lapor upload foto Team gagal (“Foto belum berhasil diupload…”). Audit:
`server/cms-media.mjs` tak berubah sejak `2a22d8a` (bukan regresi perf); bucket
`cms-media/team` berisi 2 object (12:53/12:57 UTC) → upload pernah sukses. Server
sengaja ketat: ≤2 MB input, ≤16 MP decode, raster only, WebP ≤256 KiB; pesan
klien generik menutupi penyebab (400 normalisasi vs 502 Storage). Fix lokal→LIVE
`bd9a424eee0029a6748ac229d0175077324d9bf4`: helper browser
`src/scripts/admin-image.js` mengecilkan/kompres foto >16 MP atau >2 MB sebelum
upload (Team + Projects), pesan error spesifik, fallback resize tambahan
800×600/640×480/480×360, dan Storage `x-upsert: true`. Batas keamanan server
tetap. QA: build0err/23pages; `test:cms` 94 PASS + 10 SKIP/0 FAIL; mock Team+
Projects 320/390/768/1440 PASS termasuk 20 MP→berhasil; snapshot tetap; publik
byte-identik; secrets 0. **Owner live upload foto Team belum diuji ulang** pasca
fix; minta acceptance/screenshot baru. Detail [SOP §8](cms-sop.md), [Team
setup](cms-team-setup.md), [Projects media plan](cms-projects-media-plan.md).
