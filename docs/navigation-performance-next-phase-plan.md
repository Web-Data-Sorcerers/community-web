# Navigation performance — plan rinci tahap berikutnya

11 Oktober 2026. Work order terbaru owner: pindah AI, sinkronkan seluruh aturan
serta konteks, dan **plan detail dahulu**. Tahap berikutnya PLAN ONLY:
read-only preflight, review kandidat existing, diagnosis read-only dan dokumen.
Belum ada izin implementasi tambahan, build ulang, fixture mutation, commit/push,
deployment, SQL, provider/dashboard/env changes atau live writes.

[Kickoff aktif dan prompt pertama](navigation-performance-next-ai-plan-kickoff.md).
[Master N0–N7](navigation-performance-plan.md) tetap kontrak teknis; plan ini
menentukan pekerjaan tersisa setelah P1, bukan memulai ulang pekerjaan selesai.

## 1. Tujuan dan posisi saat ini

P1 selesai: server functions dipindahkan lewat versioned `vercel.json` ke sin1.
HEAD/remote main `45cc86466b573fa067f0c98281e391afff502e75`, Current/alias READY
`dpl_7bredDjDLDsY18nxTqGHymQgsVnS`, actual Node22/12 functions. Database tetap
Supabase Singapore. Project default Node24/iad1 tetap; deployment config sin1
mengambil precedence. Jangan mengganti dashboard hanya untuk menyamakan label.

P1 production read-only acceptance PASS:19public,6admin forms,private401,
visibility/revision/content/media/intake dan unknown404. Visibility object dan
CMS object hash/media tidak berubah. Revision terakhir716138bd-f7b2-4ae9-ba05-e6be5158d801:
HomeON,home.projects=false,About/HoFOFF,19pages/21sections. Re-read konfigurasi
aktual; owner dapat berubah preferensi setelah checkpoint. Tidak reseed seed
ProjectsON dan tidak restore snapshot.

| Paket                                        | Status                                               | Pekerjaan tersisa                                                        |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| P1 region sin1                               | COMMITTED/PUSHED/READY; read-only acceptance PASS    | Recheck baseline sebagai dasar P2; tidak release ulang                   |
| P2 public UX/prefetch                        | IMPLEMENTED + QA lokal, dirty; belum production      | Review diff dan refinement owner, tentukan QA freeze dan paket release   |
| P3 admin bounded prewarm                     | IMPLEMENTED + synthetic reproduction/QA lokal, dirty | Review reproduksi dan lifecycle; positive owner-session masih pending    |
| Pages & Sections P0–P6/UI/SQL/runtime repair | Existing; production reads bekerja                   | Regression contract, bukan implementasi ulang atau migration baru        |
| Owner Auth/live-write acceptance             | PENDING, terpisah dari P1                            | Tidak menjalankan save/toggle/upload/submit/no-op save sebagai diagnosis |

Owner menolak garis progress ungu di atas saat pindah halaman. Garis sudah
DIHAPUS lokal; jangan mengembalikannya dari master/handoff historis. Status kecil
“Loading page…” tetap pada kandidat yang direview. Bluu Next, Manrope, Button,
ZERO EMOTE dan strict8-point spacing tetap. Tidak ada redesign atau Figma node baru.

## 2. Batas izin dan urutan

AI baru memulai dari PLAN ONLY meskipun prompt lama pernah mengizinkan implementasi
lokal. Izin P1 telah dipakai satu commit/push dan connected deployment; bukan izin
P2/P3 atau rollback. Tidak men-stage seluruh dirty docs secara otomatis.

Urutan yang diusulkan:

1. Read-only reconciliation Git/source/docs/provider/backend/preview.
2. Review dan plan freeze P2 existing tanpa mengubah source.
3. Sajikan exact scope, QA gates, evidence gaps dan rollback P2 kepada owner.
4. Setelah instruksi baru, jalankan hanya local QA/fix yang diizinkan.
5. Setelah explicit scoped **“commit dan push”**, release P2 terpisah.
6. P3 diagnosis/review dan release tersendiri setelah P2; tidak menggabungkan
   bounded prewarm admin ke release P2.

Tidak ada izin tersirat dari “oke”, screenshot, atau laporan preview cocok untuk
production action. Jika satu akses tidak tersedia, lanjut review dan plan yang
independen; tandai bukti terkait PENDING. Jangan meminta ulang izin untuk membaca
file atau melakukan preflight read-only yang sudah diberikan.

## 3. Fase A — reconciliation tanpa mutation

| Pemeriksaan       | Bukti yang dicatat                                                   | Jika tidak sesuai                                                              |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Git               | status/diff/staged diff, branch, actual HEAD, remote main, push URLs | Jelaskan divergence; jangan reset/stash/amend/force/checkout menimpa pekerjaan |
| Source separation | P2 empat file, P3 satu file; vercel.json sudah committed sin1        | Pisahkan overlap nyata; jangan release ulang P1                                |
| Dirty docs        | historical docs, tiga planning awal, local/P1 acceptance notes       | Pertahankan byte existing; tambahkan status yang jelas, tidak auto-commit      |
| Backend           | read loader/current revision19/21, effective pages/sections          | Pertahankan preferensi aktual; historical404 bukan izin apply ulang SQL        |
| Provider          | Current/alias SHA/READY, actual Node22/functions12/deployment sin1   | Bukti metadata dan dynamic compute; edge sin1 saja tidak cukup                 |
| Preview           | task-owned loopback4356, compiled candidate, fixture banner/state    | URL sementara; jangan kill server asing atau rebuild dalam PLAN ONLY           |
| Access            | owner-session/token/backend available atau tidak                     | Tidak meminta password/cookies/token lewat chat; hasil terkait PENDING         |

Migration20261011160000_site_visibility.sql telah applied once, SHA256
62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c.
Existing CMS snapshot SHA2564345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857.
Periksa hash file sebagai integrity evidence; jangan menjalankan SQL atau cache reload.

Readiness verifier di main menggunakan provider/Supabase project GET, loader RPC
READ dan public/anonymous GET. Baca source dahulu. `NAV_ARTIFACT_DIR` harus task
baru supaya tidak menimpa bukti P1/local. Tidak login positive owner, mengambil
private applicant data, save atau no-op save.

## 4. Fase B — review P2 existing, tanpa membuat ulang

Exact kandidat source:

| File                                      | Perubahan existing                                                        | Yang harus direview                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| astro.config.mjs                          | prefetchAll:false, defaultStrategy viewport                               | Installed Astro7.3.3 compile-time config mengalahkan ClientRouter default; fresh HTML tetap |
| src/components/Navbar.astro               | nav-in hanya html:not(.nav-warm)                                          | Cold entrance tetap, warm tidak replay, current/menu/hover/focus benar                      |
| src/layouts/BaseLayout.astro              | status role/status aria-live, Manrope, padding8/16, offset24+safe area    | Garis atas absent; status tidak mengubah geometry, empty hidden, reduced motion statis      |
| src/scripts/site-visibility-navigation.js | generation/signal pending, loader cleanup, warm class, page-load/pageshow | Existing revision/bfcache/hash logic utuh; abort/error lama tidak membersihkan request baru |

Review concurrency dan lifecycle secara eksplisit:

- Sebelum response, halaman lama tetap usable; aria-current tidak berpindah prematur.
- Klik dua tujuan: newest wins, sumber pending dan aria-busy tidak tersangkut.
- Matching page-load, abort, error, cancellation, pageshow dan watchdog membersihkan
  status. Watchdog20s membersihkan cue, tidak menyatakan server berhasil/gagal
  dan tidak membatalkan request. Tidak menambah delay buatan atau minimum spinner.
- Same-page hash, mailto, external, download, modifier/new-tab tetap normal.
- Hanya satu listener set; document swaps tidak memasang listeners berulang.
- Bfcache revision check/reload jika berubah tetap ada. Tidak menambah polling.
- Prefetch viewport/focus/hover/footer tidak mengambil HTML controlled routes/private
  API sebelum klik. Browser memberi resourceType=other untuk prefetch; cek semua
  resource types. Image lazy-load dan CMS sync tetap berjalan.

CSS/asset hint belum ada dan bukan kebutuhan release P2 awal. Jangan hardcode
_astro hash, fetch HTML untuk menemukan CSS, preload semua19halaman/hero atau
mengubah HTML/config cache. Jika dianggap perlu, usulkan spike terpisah berdasarkan
waterfall setelah sin1; jangan mengimplementasikannya dalam fase plan.

## 5. Fase C — QA freeze P2 yang diusulkan setelah izin baru

Existing local evidence:160 navigasi4widths×2motion×2rounds, prefetch0 vs baseline11,
Navbar20 breakpoints, VT/visibility/public/admin regressions. Setelah owner meminta
hapus garis: Node22 build/check0errors0warnings, format/diff dan15 UX cases PASS.
Timing lokal139.1ms/feedback13ms berasal dari kandidat sebelum penghapusan garis;
bukan benchmark production atau freeze baru setelah review.

Usulkan QA terarah atas exact candidate yang hendak dirilis, setelah otorisasi:

| Gate              | Kasus                                                                                               | Bukti lulus                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Runtime/package   | Node22 build/check, SSR packed tanpa ancestor node_modules, 11API+1SSR, rewrites/headers            | Boot/shared Auth/freshness PASS; compiler bare import tidak kembali;12functions        |
| UX                | 320/390/768/1440 × normal/reduced, pending/delayed request                                          | Garis atas0; status visible saat pending; zero overflow/error/layout regression        |
| Race/failure      | Two destinations, supersede, request abort/503, CSS/script failure, watchdog/cancel                 | Correct destination; pending/source/busy bersih, old abort tidak menghapus new pending |
| Navbar/navigation | Cold entrance, warm0nav-in, menu/focus/current, Back/Forward/hash, keyboard/modifier, sound consent | Geometry/fonts/Button existing; request fresh/revision valid; no listener accumulation |
| Prefetch          | Navbar/Button/role/card/footer viewport/focus/hover/scroll                                          | Unclicked controlled HTML/private requests0; assets/CMS behavior sesuai                |
| Visibility        | 19pages/21sections, parent/CTA/chamber/robots/no-store/unknown404                                   | Existing correctness preserved; fixture terisolasi, production tidak di-save           |
| Secrets/design    | Compiled secret audit, spacing, scoped formatter/diff; asset provenance                             | Zero secret findings, strict8pt, ZERO EMOTE, no invented Figma claims                  |
| Owner review      | Live local URL dengan explicit banner; desktop/mobile + loading                                     | Owner melihat status tanpa garis; production credentials tidak dipakai di fixture      |

Verifiers yang sudah ada harus dipakai dan direview, bukan diganti dengan tests
yang hanya mencerminkan implementasi. Relevant tests sesuai perubahan; tidak
mengulang full historical About/HoF pixel assertions yang menguji komposisi lama.
Tidak rerun fixture mutation atau start/rebuild server pada fase PLAN ONLY.

## 6. Fase D — measurement dan acceptance P2

Baseline P1 production observed:80samples(40normal/40reduce),1440×900,
agent-host Chromium, serial, splash seen/sound off, network included, cold/warm
functions uncontrolled. Median280.6ms/p95 575.2ms aggregate; normal297.8/809.9ms,
reduce274.05/341.1ms; range213.5–1620.8ms. P1 before1072.9ms adalah iad1 baseline,
bukan before P2. Re-measure sin1 sebelum P2 jika release terjadi belakangan.

Rancangan comparison:

1. Same host/browser/viewport/motion/cache/network policy dan route sequence.
2. Minimum40 navigasi per condition/motion untuk laporan p95; script rounds4
   menghasilkan40 per motion pada satu width. Catat actual n, timestamp, SHA,
   revision dan requests/bytes; jangan gabungkan widths tanpa condition breakdown.
3. Local before/after dan production before/after terpisah. Cold client context
   tidak membuktikan cold function; tidak mengendalikan warm server tanpa bukti.
4. Ukur click→pending feedback frame, HTML response end, CSS latest response end,
   prep/swap/page-load, two-RAF destination frame, navbar animation remaining,
   longtasks/shifts/request count. Jangan memakai networkidle sebagai readiness.
5. P2 acceptance utama: feedback next frame(target≤100ms perangkat uji), warm
   nav-in0, correct fresh revision, prefetch0, no pending leak/overflow/error.
   Median/p95 actual dilaporkan; feedback cepat tidak disebut server speedup.
6. Setelah rollout yang baru diizinkan, rerun paired80samples primary alias.
   Owner-device/session acceptance dilabel PENDING bila tidak tersedia.
   Regression latency harus dianalisis; tidak otomatis menambah cache stale.

## 7. Fase E — P3 review/diagnosis bersyarat

Source existing hanya `src/scripts/admin-shell.js`; verifier lokal
`scripts/verify-navigation-admin.mjs`. Reproduksi sintetis: active Pages GET
1800ms, sebelumnya empat background reads bersaing; kandidat nol background
reads sebelum active response. Shell warm six switches19.2–62.4ms/zero newGET.
DataReady2059.6ms termasuk1800ms delay; driver action duration bukan UI latency.
Tidak mengklaim performance owner authenticated membaik dari hasil anonymous mocks.

Review sequence:

1. Panel aktif mount segera; prewarm dimulai sesudah workspace/login prompt siap.
2. Prewarm satu panel per giliran, menunggu readiness sebelumnya; owner click
   langsung mount tujuan tanpa menunggu idle queue. Failed bootstrap tidak
   mengizinkan competing prewarm sampai retry/readiness.
3. Readiness Projects/Team dapat berupa #login button, bukan hanya #login-form.
   Observer harus disconnect ketika selesai/root detached.
4. Keepalive/draft/selection/scroll, logout/session expired generations, late GET,
   conflict/per-target comparison dan exact request-ID uncertain retry tetap.
5. Synthetic regression Projects/Team/Pendaftar/Pages pada3entryroutes×4widths,
   races, loading/error/retry dan auth-boundary. No real writes.
6. Bila owner login existing tersedia, read-only first load/tab switch/detail/Back
   boleh diukur setelah scope tersedia; tidak save/upload/submit/export pendaftar.
   Pisahkan shell frame, auth/bootstrap, data GET, render dan image decode.
7. Bila real bottleneck berbeda, sajikan diagnosis baru; jangan mengubah shared
   Auth/Origin/CSRF, schema/permissions atau endpoint tanpa scope lokal tambahan.

P3 tidak wajib dicampur ke P2 demi menyelesaikan semuanya sekaligus. Exact diff
P3 dan acceptance owner yang pending harus terlihat dalam paket approval sendiri.

## 8. Fase F — paket release konkret yang diusulkan

Belum ada approval P2/P3. Jangan commit untuk membuat SHA candidate sebelum owner
mengotorisasi. Gunakan file list dan patch SHA256 untuk review; setelah explicit
commit/push, freeze actual commit SHA. Database/API ready wajib sebelum main push.

| Paket | Source                 | Tooling/evidence yang mungkin ikut                                                                                | Production verification                                                                                                                       |
| ----- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P2    | Empat source di Fase B | UX/prefetch verifiers dan selected evidence docs; readiness/timing sudah di main kecuali diff baru terbukti perlu | ExactSHA/READY/alias, Node22/12/sin1,19public/6admin/private401/no-store/revision/content/media/intake, paired timing/no speculative requests |
| P3    | admin-shell.js saja    | Admin verifier dan selected evidence docs                                                                         | ExactSHA/runtime/read boundaries, owner read-only scenario bila session ada, no live writes                                                   |

Dokumen existing dirty tidak otomatis masuk salah satu paket. Tentukan reviewed
file list yang tidak membawa P3 ke P2 atau menyamarkan unrelated content changes.
Satu push per scope yang disetujui; tidak amend, force, retry deploy/hook atau
second docs push implisit. Acceptance setelah deploy dapat tetap dirty lokal.

## 9. Rollback dan preservasi final state

Untuk future P2, kandidat rollback terbaru adalah **P1 sin1 yang sudah accepted**:
SHA45cc86466b573fa067f0c98281e391afff502e75,
dpl_7bredDjDLDsY18nxTqGHymQgsVnS,
https://data-sorcerers-community-b97e1ro9m-faizs-projects-6e23e5b2.vercel.app/.
Pre-P1 rollback9ffce5e/dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C tetap sejarah recovery
P1, bukan default rollback UX. Untuk P3, pilih latest accepted P2 kalau sudah ada.

Rollback promotion/revert memerlukan izin exactdeployment/scope baru atau explicit
contingency release. Trigger review: repeated5xx, wrong freshness/private access,
routing/header regression, lifecycle rusak atau repeated matched performance
regression. Satu spike tidak otomatis rollback. Tidak restore flags ke seed,
drop/apply ulang SQL, force-push atau mengubah env/provider sebagai recovery.

Expected state: sin1/Node22/12; latest owner visibility;19/21/fresh SSR/no-store;
CMS/Auth/Origin/CSRF/intake/data tetap; approved status cue tanpa garis atas;
warm navbar/prefetch dan admin scheduling sesuai paket yang benar-benar dirilis.
Confirmed save memengaruhi next fresh request tanpa rebuild/hook; tidak ada polling,
0ms promise atau automatic open-tab update.

## 10. Deliverable AI baru pada turn pertama

Akhiri dengan plan terperinci yang menyebut:

- Status verified/pending/failed saat preflight beserta timestamp dan provenance.
- Mana selesai/live, mana existing lokal, dan mana belum dibuktikan owner-session.
- P2/P3 exact file/diff review, prioritas dan dependency tanpa memulai ulang.
- QA matrix, sampling/performance method, evidence gaps dan acceptance gates.
- Preview aktual jika tersedia; local fixture dan production jelas dibedakan.
- Concrete later authorization scopes dan rollback candidate per release.
- Pilihan rutin yang bisa ditetapkan dari bukti; hanya tanyakan informasi yang
  memang hilang, bukan mengulang izin read-only/planning.

Tidak menutup fase ini dengan implementasi/build/save/commit/push/deploy. Owner
meninjau plan terlebih dahulu sebelum memberikan work order berikutnya.
