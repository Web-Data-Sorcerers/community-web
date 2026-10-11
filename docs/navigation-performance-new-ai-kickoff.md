# Handoff AI baru — eksekusi lokal navigation performance

## Next AI — PLAN ONLY requested after P1 (11 Oct 2026)

Owner is moving to a new AI and explicitly requests a detailed plan FIRST.
[Active PLAN ONLY kickoff + first prompt](navigation-performance-next-ai-plan-kickoff.md) and
[Detailed remaining-work plan](navigation-performance-next-phase-plan.md) supersede historical implementation
prompts for the next turn. Read all27 listed documents; review existing dirty
P2/P3, do not restart Pages & Sections or P1. No new source changes/build/fixture
mutation/commit/push/deploy/live writes. Read-only preflight and docs allowed.
Latest recheck14:56:10 UTC: HEAD/remote45cc864, Current/alias READY
dpl_7bredDjDLDsY18nxTqGHymQgsVnS, Node22/12functions/deployed sin1,
revision716138bd-f7b2-4ae9-ba05-e6be5158d801, HomeON/projectsOFF/AboutHoFOFF.
Owner removed local top progress bar; do not restore it from older8px proposal.
Keep all existing dirty/untracked work. Future P2 rollback candidate is accepted
P1sin1/45cc864, separately authorized; P1 approval is not a new release permit.


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


## Navigation performance — LOCAL QA, production read-only (11 Oct 2026)

Owner submitted the local-execution prompt; all22 read-order entries read fully.
[Local implementation, evidence and release scopes](navigation-performance-local.md):
region sin1 candidate, immediate navigation feedback/warm navbar/explicit
prefetch, reproduced admin bounded prewarm completed locally. Node22 build
and isolated packed boot/Auth/freshness PASS including region-only HEAD archive;
11 root API +1SSR expected12. Tests150 PASS/10 SKIP; public28, Pages UI47,
admin12+races3, existing three CMS panels4 widths each, Navbar20 and VT PASS.
Production remains9ffce5e/Current dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C, READY,
actual Node22/12 functions/compute iad1. Last read13:52:57 UTC retained revision
716138bd-f7b2-4ae9-ba05-e6be5158d801: HomeON,home.projects=false,About/HoFOFF.
No production write, provider change, deploy/hook, SQL, commit/push or rollback.
Region effective/production performance and owner positive Auth/save pending.
Owner loopback preview http://127.0.0.1:4356/admin/#pages uses explicit local
review fixture; save affects only /tmp. Existing dirty docs preserved.
P1 region/P2 UX/P3 admin source scopes are separately reviewable; new exact
“commit dan push” instruction required before release. Old PLAN ONLY below
is historical; it does not revoke the owner's current local authorization.

Dibuat 11 Oktober 2026. Permintaan owner pada sesi pembuat dokumen ini hanya
menyiapkan konteks dan prompt untuk AI baru. **Sesi ini tetap dokumentasi saja.**
Blok prompt di bawah menjadi izin implementasi lokal hanya ketika owner
menempelkannya sebagai instruksi kepada AI berikutnya.

## Yang perlu dibawa

Pilihan utama: buka AI baru pada workspace yang sama
`/home/faiz/ds/ds5opencode`. Working tree, source existing, dokumen untracked dan
dirty, serta ignored artifacts akan tetap tersedia jika workspace dipertahankan.
Tidak perlu menempel seluruh riwayat chat.

Jika pindah mesin/workspace, bawa checkout source lengkap pada commit yang benar
beserta perubahan lokal terbaru. Clone origin/main saja tidak membawa dokumen
dirty/untracked, artifacts atau helper `/tmp`. Paket dokumentasi
`artifacts/navigation-performance-handoff-20261011.tar.gz` hanya pelengkap repo,
bukan pengganti source checkout atau runtime dependencies.

Bundle memuat seluruh dokumen yang disebut pada read order di bawah dan empat
JSON bukti navigasi yang telah ditinjau. Manifest menyebut SHA256 file per file.
Tidak memuat `.env`, token, cookie, export pendaftar, node_modules, cache browser
atau ignored artifacts lain. Ekstraksi ke staging dahulu dan review sebelum
menggabungkan dengan workspace yang punya pekerjaan baru.

Credential/connector existing tersedia melalui environment lokal yang aman jika
memang dibutuhkan. Jangan kirim `.env.local`, password atau token melalui chat
atau bundle. Jika akses production tidak tersedia, AI tetap mengerjakan lokal
dan memberi status pending untuk bukti production yang belum bisa dibaca.

## Ringkasan untuk owner

- Source release existing sudah bekerja: HEAD/remote
  `9ffce5ea859a87cd44f4126e9e7c6c60240cb857` pada pemeriksaan terakhir.
- Working deployment terakhir verified `dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C`;
  primary alias `data-sorcerers-community-sigma.vercel.app`; Node22,12 functions.
- Masalah baru adalah latency navigasi/buttons. Plan belum diimplementasikan.
- Timing: 18 navigasi 672–2087 ms, median1482; first pass terpisah3513 ms;
  preparation→page-load30–102 ms. Kebanyakan wait terjadi sebelum HTML siap.
- Vercel computeiad1/Washington, Supabaseap-southeast-1/Singapore. Colocation
  kandidat utama; besar penghematan belum dibuktikan production.
- Navbar replay entrance; tidak ada pending indicator public; ClientRouter
  prefetchAll default membuat non-navbar link speculative fetch ketika viewport.
- Warm admin tanpa login14–30 ms dan tanpa request baru. Admin setelah login,
  first-load/save/upload masih membutuhkan reproduksi, bukan asumsi.
- Visibility re-read `2026-10-11T13:23:09.380Z`: revision
  `716138bd-f7b2-4ae9-ba05-e6be5158d801`, HomeON,home.projects=false,About/HoFOFF.
  Agen tidak save/restore state tersebut. Re-read dan jaga pilihan owner terbaru.
- P0–P6/UI refinement Pages & Sections bukan pekerjaan ulang; SQL sudah applied
  once. Runtime Rolldown dan routing sebelumnya sudah repaired. Jangan reintroduce
  bare compiler import atau memakai full workspace dependencies sebagai bukti
  packed-function sehat.
- Semua dokumen release/handoff pascarelease masih dirty; investigasi/plan/kickoff
  navigation baru untracked. Tidak ada commit/push baru dari sesi plan/handoff ini.

## Read order lengkap

Baca SELURUH file, jangan hanya headings atau hasil rg:

1. `docs/navigation-performance-new-ai-kickoff.md` — handoff/scope baru ini.
2. `docs/navigation-performance-investigation.md` — actual measurement dan limits.
3. `docs/navigation-performance-plan.md` — master N0–N7.
4. `AGENTS.md`.
5. `HANDOVER.md`.
6. `docs/ai-handoff.md`.
7. `docs/page-section-visibility-kickoff.md`.
8. `docs/page-section-visibility-plan.md`.
9. `docs/page-section-visibility-local.md`.
10. `docs/page-section-visibility-ui-refinement-plan.md`.
11. `docs/page-section-visibility-ui-refinement-local.md`.
12. `docs/page-section-visibility-release-checkpoint.md`.
13. `docs/page-section-visibility-production-release-plan.md`.
14. `docs/on-development-plan.md`.
15. `docs/pixel-precision-sop.md`.
16. `docs/page-section-visibility-r0-preflight.md`.
17. `docs/page-section-visibility-r2-production-db.md`.
18. `docs/page-section-visibility-r3-provider-preflight.md`.
19. `docs/page-section-visibility-r3-function-fix-local.md`.
20. `docs/page-section-visibility-r4-release.md`.
21. `docs/page-section-visibility-r7-runtime-repair.md`.
22. `docs/page-section-visibility-r7-header-release.md`.

Entri dengan status/revision lama adalah bukti historis. Copyable prompt Pages &
Sections lama adalah work order lama; gunakan prompt navigation di bawah untuk
task baru. Scope baru mengizinkan implementasi LOKAL, bukan production/release.
Status di dokumen adalah last verified; Git/backend/provider aktual wajib dicek
ulang tanpa mutation. Angka latency fixture bukan benchmark production.

## Prompt pertama — copy seluruh blok

```text
Lanjutkan pekerjaan Navigation Performance di repo ini.
Saya mengizinkan IMPLEMENTASI LOKAL + QA sesuai scope di bawah,
bukan hanya membuat plan ulang. Production tetap read-only.

Baca SELURUH docs/navigation-performance-new-ai-kickoff.md dan SELURUH
22 dokumen pada read order-nya, termasuk master navigation-performance-plan.md
dan investigasi. Ikuti kontrak Pages & Sections dan release R0–R7 existing;
entri lama dan prompt kickoff lama dibaca sebagai sejarah. Instruksi baru ini
mengizinkan local work yang dijabarkan, bukan izin release umum.

Repo/workspace: /home/faiz/ds/ds5opencode.
Baseline terakhir:
- HEAD/remote main 9ffce5ea859a87cd44f4126e9e7c6c60240cb857.
- Working deployment dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C;
  data-sorcerers-community-sigma.vercel.app; actual Node22,12functions.
- Supabase yejrdckcmlxrkklgtrwy, database Singapore/ap-southeast-1;
  Vercel function default iad1/Washington, Hobby, Fluid enabled.
- Visibility revision716138bd-f7b2-4ae9-ba05-e6be5158d801 pada read terakhir:
  HomeON,home.projects=false,About/HoFOFF. Re-read tanpa save; jangan reseed
  atau restore pilihan owner ke default ProjectsON.
- Dokumen dirty/untracked harus dipertahankan; clone Git saja tidak membawa
  plan/handoff terbaru. Source P0–P6/UI existing selesai, jangan mulai dari nol.

Lakukan preflight read-only dahulu: git status/diff/HEAD/remote/push target,
backend visibility loader/current revision, provider Current/alias/runtime/
function regions bila akses tersedia, serta migration hash.
Migration20261011160000_site_visibility.sql sudah applied once; SHA256
62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c.
Jangan apply ulang SQL atau cache reload dari error historis404/PGRST202.

Saya mengizinkan pekerjaan lokal berikut sampai siap direview:
1. N0: buat verifier timing yang repeatable, baseline serial read-only dan
   provenance jelas. Pisahkan server wait, CSS, swap/init, visual settling
   dan authenticated data readiness; jangan menyamakan networkidle dengan
   halaman selesai atau mengklaim p95 dari sampel kecil.
2. N1/L1: siapkan kandidat lokal vercel.json regions:[sin1], pertahankan
   rewrites/headers/runtime existing, verifikasi pengaruh root API+SSR dan
   expected12functions, Node22 build serta isolated packed-function verifier.
   Ini hanya perubahan file lokal; jangan ubah dashboard/deploy.
3. N2/N3/L2: implementasikan local navigation pending feedback, cleanup
   abort/race/error, skip navbar entrance pada warm navigation, serta
   explicit prefetch policy sesuai master. Target page tetap dibaca fresh.
   Asset hint hanya jika spike menunjukkan manfaat; jangan preload semua
   route atau memperluas HTML/config cache.
4. N4: lanjut diagnosis admin dengan local synthetic transport atau owner
   login existing untuk read-only. Fix lokal boleh hanya untuk bottleneck
   yang direproduksi, terdokumentasi dan dalam scope plan; jangan ubah Auth.
   Jika owner-session belum tersedia, tandai production admin pending dan
   teruskan pekerjaan lokal independen.
5. N5: targeted regression QA, dokumentasi/evidence, local preview loopback
   compiled function dengan fixture terisolasi. Pertahankan draft/save/retry,
   menu/mobile/keyboard/Back/Forward/sound/reduced motion.

Kerjakan N1 candidate dahulu; local N2/N3 boleh dilanjutkan tanpa menunggu
izin deployment. Jaga paket region dan UX bisa direview/release terpisah.
Jangan mencampur perubahan UI dengan klaim penghematan latency region.
Effectiveness region production dan postdeploy comparison tetap pending
sampai deployment disetujui dan terbukti.

Preserve existing work. Jangan reset/stash/amend/force-push atau auto-commit.
No production SQL/provider/dashboard/env/plan/Node changes, deploy, live
save/toggle/restore/upload/submit atau rollback. No deploy hook saat save.
Production config dan deployment memerlukan izin scope terpisah; jangan
commit/push tanpa instruksi baru eksplisit 'commit dan push' dengan scope
release jelas. Database/API harus siap sebelum main push; main auto-deploy.
No-op save pun live write, bukan read-only probe.

Reuse shared CMS Auth/Origin/CSRF. Jangan mengubah schema enam collection CMS,
RECRUITMENT_OPEN, akun, grants existing atau allowlist. Pertahankan19pages/
21sections, Home/heroes/navigation protected, SSR absent section-off,
known disabled chamber200/noindex-follow, unknown404, parent/CTA filtering.
No-store HTML/revision dan fresh per-request config tetap.
Fresh visit setelah save confirmed mendapat latest revision tanpa rebuild;
tidak ada janji0ms/polling/update otomatis tab terbuka.

ZERO EMOTE, strict8-point spacing, Bluu Next, Manrope dan Button existing.
Jangan meminta password/print secrets/cookies/PII; jangan memakai credential
production pada fixture. Build/QA memakai Node22 sesuai runtime; jangan
mengandalkan helper/tmp/port lama tanpa mengecek. Jangan bunuh proses asing.

Jangan berhenti setelah membaca atau mengusulkan plan. Selesaikan local work
yang sudah diizinkan sampai source diff, QA dan preview reviewable.
Jika satu akses terblokir, lanjut pekerjaan independen lalu jelaskan pending.

Hasil akhir:
- Status Git/backend/provider/runtime/routing aktual dan baseline flags.
- Daftar file/diff per paket region, UX/prefetch dan conditional admin.
- QA matrix verified/pending/failed beserta artefak, viewport dan batas bukti.
- Before/after LOCAL timing; production samples diberi label tersendiri.
- URL preview aktual, langkah owner mengecek, fixture state dan restore lokal.
- Paket approval production/release yang konkret setelah QA siap:
  exact scope/final SHA jika kelak diizinkan commit, region12functions/
  Node22/DB readiness, rollback candidate dan expected final state.
- Production region/performance dan owner Auth/live-write acceptance tetap
  pending jika belum dijalankan secara terpisah; jangan mengklaim live selesai.
```

## Bukti pendukung dan runtime helper

Bundle evidence read-only:
`artifacts/navigation-performance-20261011/production-navigation.json`,
`production-navigation-first-pass.json`, `backend.json`, `buttons-admin.json`.
First-pass timeout berasal dari interaksi test driver membuka mobile menu sebelum
klik logo Home; bukan bukti tombol Home di situs timeout. Completed pass18cases
memperbaiki interaksi tersebut tanpa perubahan source.

Helper investigasi sesi ini berada di `/tmp/ds-nav-timing.mjs`,
`/tmp/ds-nav-backend.mjs`, `/tmp/ds-button-timing.mjs`; path tidak portable dan
tidak masuk bundle. AI membaca source actual lalu membuat verifier repo yang
reproducible saat implementation diizinkan. Node22 pernah tersedia di
`/tmp/ds-node22-r3/node-v22.23.3-linux-x64/bin/node`; recheck atau gunakan Node22
existing yang sesuai, tanpa mengubah provider setting.

Canonical isolated verifier: `scripts/verify-site-visibility-package.mjs`.
Compiled preview harness: `scripts/serve-site-visibility.mjs` dan explicit
review fixture script. Baca guards sebelum run. Browser screenshot release lama
dan synthetic SQL results bukan bukti production performance baru.

## Batas selesai handoff ini

Dokumen dan bundle tersedia lokal, formatter/diff checks PASS. Tidak ada source
implementation, SQL/provider/deployment/live write, commit atau push pada sesi
penyiapan handoff. AI baru hanya mulai implementasi setelah owner mengirim scope
lokal dalam prompt, dan meminta release approval setelah candidate reviewable.
