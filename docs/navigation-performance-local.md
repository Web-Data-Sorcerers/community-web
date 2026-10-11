# Navigation performance — implementasi dan QA lokal

## Navigation performance P1 — RELEASED, read-only acceptance PASS (11 Oct 2026)

Owner explicitly authorized P1 commit/push + connected main deployment.
[Exact release scope, timing and acceptance](navigation-performance-p1-release.md): SHA45cc86466b573fa067f0c98281e391afff502e75,
Current/alias READY dpl_7bredDjDLDsY18nxTqGHymQgsVnS, actual Node22/12functions,
deployment sin1 corroborated by26 dynamic response reads. Final14:33:17 UTC:
19public/6admin forms/private401/revision/content/media/intake PASS. Visibility
and public CMS hash/media unchanged:716138bd-f7b2-4ae9-ba05-e6be5158d801,
HomeON/home.projects=false/AboutHoFOFF,19/21. Runtime sample50 rows zero5xx,
native errors/crashes. Serial Chromium80before/80after observed median
1072.9→280.6ms; host/network/cold-state limits recorded, not a universal promise.
One five-file P1 commit/push; P2 UX/P3 admin remain local, not released. Owner
review removed local top progress line; status feedback retained. Post-deploy
acceptance docs remain dirty, no second commit/push. No SQL/provider/dashboard/
env/live save/toggle/restore/upload/submit/deploy hook or rollback. Old9ff/iad1
checkpoints below are historical. Further releases need new explicit scoped
“commit dan push”; rollback9ff candidate needs separate approval.


11 Oktober 2026. Owner mengotorisasi implementasi lokal + QA melalui prompt
handoff. Seluruh 22 entri read order dibaca penuh. Pekerjaan N0–N6 lokal selesai;
N7 menghasilkan kandidat review, belum release. Production hanya dibaca.
[Master](navigation-performance-plan.md) tetap kontrak perilaku; checkpoint
PLAN ONLY lama adalah riwayat, bukan pembatalan izin lokal terbaru.

## Status dan preservation

HEAD/remote main tetap `9ffce5ea859a87cd44f4126e9e7c6c60240cb857`.
Read-only terakhir 13:52:57 UTC: Current READY
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C`, primary alias cocok, actual Node22,
12 Node functions. Project default24 tetap. Compute `iad1`, database Singapore
`ap-southeast-1`, ACTIVE_HEALTHY. Loader service-role valid; revision tetap
`716138bd-f7b2-4ae9-ba05-e6be5158d801`, Home ON, home.projects=false,
About/Hall of Frames OFF; 19 halaman/21 section. Tidak reseed/restore production.
Public Home/About/HoF200/no-store/revision, enam bentuk header admin diperiksa
routing lokal; tiga admin slash production200/no-store/noindex. Visibility
anonymous401, revision/content/intake200. Tidak membaca pendaftar privat.

Existing dirty docs dipertahankan; baseline diff/status disimpan di ignored
`artifacts/navigation-performance-local/before.diff` dan `before-status.txt`.
Initial nine-file dirty content preservation verified byte-for-byte after
removing only added checkpoints (`preservation.json`). Tidak reset/stash/amend, commit/push, SQL production, provider/dashboard/env
mutation, deploy/hook, submit/upload, live save/toggle/restore atau rollback.
Migration SHA256 tetap
`62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`;
CMS snapshot tetap
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.
Shared Auth/Origin/CSRF, enam collection, intake, grants dan allowlist utuh.

## Kandidat yang dapat dirilis terpisah

| Paket        | Source diff                                                                                                                    | Hasil lokal                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 region    | `vercel.json`: hanya tambah `regions: ["sin1"]`                                                                                | Node22 build atas archive HEAD + region saja, isolated packed boot/Auth/fresh SSR PASS; detector11 root API +1SSR=12; routing/header valid; tidak ada override region di root API/SSR config |
| P2 public UX | `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/components/Navbar.astro`, `src/scripts/site-visibility-navigation.js` | Feedback, warm navbar, explicit prefetch policy dan regression browser PASS                                                                                                                  |
| P3 admin     | `src/scripts/admin-shell.js`                                                                                                   | Prewarm sesudah panel aktif siap, satu panel per giliran; synthetic reproduction dan regression empat panel PASS                                                                             |

Frozen source-only patches (SHA256, bukan commit SHA) tersedia di ignored
artifacts/navigation-performance-local; source hashes tersimpan di
source-hashes.json:

- P1-region.patch: `9d8b0c1d810dcdb39b9bfebcb2f724a4cbecb8b32d395381dd9dd19447ce344c`.
- P2-ux.patch: `8dc8a092a15189b3cb10617f7b6e7d53fd2fbbfe1b83f559833e8595a969f03c`.
- P3-admin.patch: `4493d6eef8eec62def8abfc839011b3a6434c5cba69212643b1cc4966ab1d51c`.

P1 isolated checkout berada di path dalam
`artifacts/navigation-performance-local/region-work-path.txt`. Hanya source
region berbeda dari HEAD di checkout itu; verifier tambahan adalah tooling.
QA workspace juga memeriksa kombinasi ketiga paket. Adapter `.vc-config.json`
menyatakan nodejs22.x/streaming, tidak menyatakan region deployment. Region
`sin1` efektif dan dampaknya pada semua12 functions **PENDING approved release**.
Tidak menganggap edge Singapore membuktikan compute Singapore.

Owner refinement: garis progress atas dihapus sesuai feedback review.
Node22 build/check (0 errors/0 warnings), format/diff check dan15 browser UX
cases PASS setelah perubahan; semua8 width/motion pending cases memastikan
elemen garis tidak ada. Bukti: build-no-top-line.log, ux-no-top-line.log dan
ux-proof.json. Bukti sebelum perubahan disimpan di before-top-line-removal/.
Timing di bawah berasal dari kandidat sebelum penghapusan garis.
Public cue: status Manrope dengan
role=status/aria-live, padding8/16 dan offset24px + safe area. Link pemicu ditandai;
main aria-busy selama preparation. Current link berubah melalui DOM tujuan.
Cleanup memakai generation/signal pada abort/supersede, loader error/cancel,
page-load tujuan, pageshow dan watchdog20 detik. Watchdog membersihkan cue,
bukan mengonfirmasi keberhasilan atau membatalkan server request. Tidak
memaksa minimum spinner, menahan fetch/swap atau men-disable link lama.
Hash/external/mailto/download/modifier/new-tab mengikuti perilaku existing.
Warm navbar melewati nav-in; entrance awal dan hover/focus/current tetap.
Reduced motion memakai indikator statis. Sound/context tetap existing.
Tidak ada font, Button, artwork, spacing exception atau Figma node baru.

Prefetch eksplisit `prefetchAll:false`, defaultStrategy viewport. Installed
Astro7.3.3 memakai nullish fallback untuk ClientRouter init(prefetchAll:true);
false compile-time bertahan. Inventory dan network trace memeriksa link navbar,
Button, cards/roles dan footer. Tidak menambah HTML opt-in/asset hint. CSS hint
ditunda sampai perbandingan region; tidak hardcode hash atau prefetch HTML untuk
mencari CSS. Lazy images dan CMS content sync tetap berjalan.

Admin reproduction: GET Pages aktif ditunda1800ms secara sintetis. Sebelum fix,
empat read tab tersembunyi mulai sebelum respons aktif. Sesudah fix, nol read
tersebut mendahului respons aktif. Workspace atau prompt login menandai bootstrap
selesai; queue idle mount satu tab, menunggu readiness sebelum tab berikutnya.
Tab yang diklik owner langsung mount, tidak menunggu queue. Keepalive/draft dan
logout generations tetap. Gagal bootstrap menahan prewarm sampai readiness atau
retry; tidak mengarang cache Auth. Owner authenticated production scenario
**PENDING**; hasil sintetis tidak membuktikan latency data owner sebenarnya.

## Timing dan provenance

| Pengukuran                                    | Sampel | Median    | Range          |
| --------------------------------------------- | ------ | --------- | -------------- |
| Production baseline klik → frame tujuan       | 40     | 1302,95ms | 656,1–1897,9ms |
| Local HEAD sebelum UX, klik → frame tujuan    | 160    | 149,5ms   | 86,7–282,6ms   |
| Local candidate klik → frame tujuan           | 160    | 139,1ms   | 87,2–227ms     |
| Local candidate klik → frame feedback pending | 160    | 13ms      | 2,5–79,5ms     |

Chromium pada host agen; GET/HEAD serial; splash sudah seen, sound muted;
request network termasuk. Local harness compiled Node22 + explicit file fixture,
home.projects=false. Empat lebar320/390/768/1440 × dua motion × dua putaran,
20 navigasi per kombinasi. Production hanya1440 × dua motion × dua putaran.
Cold/warm function tidak dikontrol; context baru berarti cold client assets.
Timing memakai candidate sebelum offset safe-area terakhir; inset Chromium0
sehingga posisi tetap identik. Local baseline sempat overlap singkat dengan satu diagnosis admin; candidate
serial tanpa suite browser lain. Angka lokal adalah observed comparison, bukan
benchmark provider atau bukti perbaikan server. P95 dan production after pending;
target40 per kondisi/motion pada release comparison belum terpenuhi.

Candidate160/160 klik memiliki satu fresh HTML fetch/revision dan cleanup cue.
HTML responseEnd median22,4ms, CSS terakhir responseEnd35,9ms dari click pada
harness. Semua80 navigasi normal baseline masih memiliki animasi navbar pada
frame tujuan; candidate0/160, remaining navbar settling0ms. Ini bukti entrance
berulang dihapus, terpisah dari HTML response timing.

Production role viewport/focus/hover + footer scroll:11 speculative HTML requests
(enam role + lima tujuan footer). Local candidate:0, gambar tetap termuat.
Chromium melabeli prefetch sebagai resourceType=other; verifier mencocokkan
controlled route paths pada seluruh resource types, bukan hanya fetch.

Enam HTML recruitment GET read-only dari host agen:845–2604ms. Loader RPC host
agen60–689ms; keduanya jalur berbeda, tidak dikurangkan untuk mengklaim waktu
Vercel→DB. Backend berada di Singapore, runtime tetapiad1.

Synthetic admin sesudah fix: klik aktual → dua frame panel19,2–62,4ms pada enam
warm tab switches, nol GET baru. Data Pages siap2059,6ms termasuk delay1800ms.
Playwright action duration dicatat terpisah, bukan dilaporkan sebagai UI latency.
Tidak membandingkan angka ini dengan warmed shell lama14–30ms sebagai speedup.

## QA verified/pending

| Pemeriksaan                                          | Status                                                                                                                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node22 build/check workspace dan region-only archive | VERIFIED:0 errors,0 warnings,36 existing hints; nodejs22.x                                                                                                                                    |
| Isolated packed function workspace + region-only     | VERIFIED: boot tanpa ancestor dependencies; shared synthetic Auth/Origin/CSRF/permission guards;19 public routes; fresh save OFF/read/restore ON; unknown outbound0                           |
| Node tests visibility/CMS/recruitment                | VERIFIED:150 PASS,10 SKIP,0 FAIL; PostgreSQL tests ephemeral lokal                                                                                                                            |
| Public visibility regression                         | VERIFIED:28 cases;503 fail-closed/recovery, chamber200/noindex, parent/CTA/unknown404/no-store; harness tanpa review transport                                                                |
| Pages UI/refinement                                  | VERIFIED:19 pages +21 sections +7 layouts, fixture restore; separate loopback review harness                                                                                                  |
| Admin visibility/races                               | VERIFIED:12 route/width combinations +3 races; draft/conflict/exact retry/logout preserved                                                                                                    |
| Existing Projects/Team/Pendaftar browser             | VERIFIED: masing-masing4 widths, synthetic workflows/read/write/upload mocks                                                                                                                  |
| UX delayed navigation/race/failures                  | VERIFIED:4 widths ×2 motions, hash, request abort/503, CSS/script failure (injected incoming local test asset); synthetic lifecycle cancellation/error/old-abort/new-pending/watchdog cleanup |
| Timing candidate                                     | VERIFIED:160 serial navigations; no pending leak/overflow/pageerror; no blocked outbound                                                                                                      |
| Navbar/View Transitions                              | VERIFIED:20 breakpoints; keyboard/modifier/hash/Back/Forward/reload/context/sound cues                                                                                                        |
| Spacing/SEO/format/diff                              | VERIFIED:40 components strict8pt;24 documents SEO; scoped Prettier and git diff check                                                                                                         |
| Owner device / authenticated production admin        | PENDING: existing owner session/scenario unavailable in isolated QA browsers                                                                                                                  |
| Production sin1 / UX / admin candidate acceptance    | PENDING: no deployment or production write authorized                                                                                                                                         |
| CSS hint after region                                | PENDING measurement; no candidate introduced                                                                                                                                                  |

Some first verifier attempts failed because of selectors/test-driver timing or
transport mismatch: public verifier expects unavailable real Auth503, whereas
review fixture intentionally returns200. Final public pass used its expected
non-review harness. Race/viewport fixtures now use separate owned files/servers.
Assertions on visibility/Auth/freshness remained intact. Compiled secret audit:0 findings. Screenshots/JSON/logs
are ignored under `artifacts/navigation-performance-local/` and existing
site-visibility/CMS/recruitment artifact folders. Full legacy About/HoF original
composition pixel suite was not rerun; geometry/content were not redesigned.

## Preview dan reproduksi

Owner preview: **http://127.0.0.1:4356/** dan
**http://127.0.0.1:4356/admin/#pages**. Explicit review fixture banner; Pages save
hanya menulis `/tmp/ds-navigation-local/config.json`, tanpa login atau DB nyata.
Preview state menyalin preferensi terakhir owner: Home ON/projects OFF,
About/HoF OFF. Tab lain tidak menyediakan data owner asli. Boleh review satu
section lokal, Simpan, buka fresh public route, lalu kembalikan flag lokal itu.
Revision fixture dapat berubah saat review; bukan revision production berubah.

Server task4356 memakai generated function Node22 dan hanya bind loopback.
Jika proses hilang, gunakan terminal dari repository:

```sh
# Bash/zsh: Node22 >=22.12; binary yang diverifikasi pada pass ini22.23.3.
export PATH=/tmp/ds-node22-r3/node-v22.23.3-linux-x64/bin:$PATH
export CMS_DATA_SOURCE=local SITE_VISIBILITY_SOURCE=local
export SITE_VISIBILITY_FILE=/tmp/ds-navigation-local/config.json
npm run build
SITE_VISIBILITY_REVIEW_FIXTURE=1 PORT=4356 node scripts/serve-site-visibility.mjs
```

Bila file /tmp hilang, buat file task baru dari snapshot kemudian ubah hanya
local home.projects=false sesuai baseline; jangan reseed backend. Periksa port
milik task; jangan membunuh server asing. Restart owned harness setelah rebuild.
Node env file production tidak diperlukan untuk preview/build fixture.

Repeatable verifiers:

```sh
node scripts/verify-navigation-performance.mjs
node scripts/verify-navigation-ux.mjs
node scripts/verify-navigation-prefetch.mjs
EXPECT_BOUNDED=1 node scripts/verify-navigation-admin.mjs
node scripts/verify-navigation-package.mjs
node scripts/verify-site-visibility-package.mjs
```

Timing supports PREVIEW_URL/NAV_WIDTHS/NAV_ROUNDS/NAV_ARTIFACT_DIR. Defaults
loopback4356; production origin dibatasi ke primary alias dan semua writes
browser diblok. Package discovery memakai installed Vercel CLI52.0.0; tidak
memanggil deploy/link/pull. Readiness verifier memakai token existing in-memory:
`node --env-file=.env.local scripts/verify-navigation-readiness.mjs` hanya GET
provider/public dan read loader RPC, tanpa SQL/save. Jangan mencetak env values.

## Paket approval release konkret dan rollback

Belum ada release SHA baru karena tidak commit. Masing-masing paket dapat
direview/commit terpisah; freeze exact SHA sesudah instruksi baru **“commit dan
push”** dengan scope dan connected main deployment jelas. Usulan urutan:

1. **P1:** hanya vercel.json region sin1 + selected verifier/evidence docs yang
   ditinjau. Satu main push, verifikasi12 functions/actual Node22/effective sin1,
   Current+alias, loader/config terbaru,19 public/6admin forms/private401/
   content/media/intake dan paired timing read-only. Tidak dashboard/env edit.
2. **P2:** empat source UX di tabel + selected UX/prefetch/timing verifiers/docs.
   Setelah P1 accepted, satu release terpisah; fresh visibility/read headers,
   feedback/nav/current/menu/race/error/sound/prefetch/correctness/timing ulang.
3. **P3:** hanya admin-shell bounded prewarm + admin verifier/evidence yang
   direview. Conditional fix sudah direproduksi sintetis; owner scenario tetap
   acceptance tersendiri. Tidak mengubah Auth/data transport/cache/save contract.

Jangan staging seluruh dirty docs otomatis: old9-file diff dan tiga planning
files existing dipertahankan, release documentation scope harus eksplisit.
Database/API wajib re-read siap sebelum setiap main push. Live saves/toggles/
upload/submit tetap izin terpisah. Region/read-only release acceptance tidak
menjadi izin mengetes no-op save atau membuat owner account.

Rollback candidate working/current, verified read-only:
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C` / SHA
`9ffce5ea859a87cd44f4126e9e7c6c60240cb857`, URL
`https://data-sorcerers-community-gwpwr42g2-faizs-projects-6e23e5b2.vercel.app`.
Rollback promotion memerlukan scope baru eksplisit, tidak dijalankan. Runtime
ini sudah membaca flags fresh: pertahankan preferensi terbaru termasuk
home.projects=false; jangan restore config snapshot/drop SQL. Baca ulang
candidate/alias/flags sebelum release. Failed032fdf9 bukan rollback candidate.

Confirmed save tetap memengaruhi request baru berikutnya tanpa rebuild/hook;
in-flight request bisa memakai revision sebelumnya. Tidak ada janji0ms atau
update/polling otomatis tab pengunjung terbuka. Production performance candidate
belum accepted dan owner positive Auth/live-write acceptance tetap pending.
