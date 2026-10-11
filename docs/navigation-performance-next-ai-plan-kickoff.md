# Handoff AI baru — PLAN ONLY setelah P1 sin1

11 Oktober 2026. Ini **kickoff aktif terbaru** untuk owner yang pindah AI dan
meminta plan detail/rinci dahulu. Read-only preflight dan dokumentasi diizinkan;
source implementation, build/fixture mutation dan release belum diizinkan.
[Plan tahap berikutnya](navigation-performance-next-phase-plan.md) tersedia agar
AI meninjau kandidat existing, bukan memulai ulang seluruh N0–N7.

## Yang dibawa owner

**Workspace sama paling mudah:** buka AI baru pada
`/home/faiz/ds/ds5opencode`. Bawa seluruh working tree existing termasuk dirty/
untracked docs dan source P2/P3. Tidak perlu menempel seluruh chat. Prompt pertama
ada di bawah. Jangan menghapus diff untuk membuat repo tampak bersih.

**Jika pindah mesin/workspace:** butuh checkout repository pada exact HEAD
`45cc86466b573fa067f0c98281e391afff502e75`, ditambah dirty worktree overlay,
untracked navigation docs/verifiers dan evidence. Clone main saja kehilangan
P2/P3 dan konteks planning lokal. Bundle terbaru:
`artifacts/navigation-performance-next-ai-plan-handoff-20261011.tar.gz`.
Bundle dokumentasi lama sebelum P1 bukan baseline terbaru.

Bundle baru berisi read-order docs lengkap, snapshot lima source dirty P2/P3,
untracked navigation verifiers, dirty tracked patch, selected public/synthetic
navigation evidence, fixture config lokal19/21, manifest SHA256 dan README.
Bukan repo lengkap: tidak berisi .git, dependencies/node_modules, .vercel/dist,
aset repo atau runtime binaries. Clone exact HEAD tetap dibutuhkan. Ekstrak ke
staging dahulu; review manifest dan `git apply --check` atas baseline benar sebelum
menggabungkan patch/overlay. Jangan apply patch lalu copy file yang sama dua kali.
Merging/starting build bukan bagian turn PLAN ONLY AI baru.

Credentials/connector existing tetap melalui environment yang aman. Bundle tidak
berisi .env, token, cookies, password, owner-session, export pendaftar atau private
CMS data. Jangan mengirim credentials melalui chat. Helper `/tmp`, preview server
process, sesi browser dan port tidak portable; jangan diasumsikan masih hidup.
Jika akses tidak tersedia, beri status PENDING dan lanjut plan/review independen.

## Snapshot aktual, bukan izin release baru

Recheck read-only14:56:10 UTC: HEAD/remote main
`45cc86466b573fa067f0c98281e391afff502e75`, Current/primary alias READY
`dpl_7bredDjDLDsY18nxTqGHymQgsVnS`; actual Node22,12functions, deployed sin1.
Primary: https://data-sorcerers-community-sigma.vercel.app/.
Release: https://data-sorcerers-community-b97e1ro9m-faizs-projects-6e23e5b2.vercel.app/.
Project default24/iad1 tetap unchanged; deployed region sin1 mengoverride default.
Supabaseyejrdckcmlxrkklgtrwy ap-southeast-1/Singapore ACTIVE_HEALTHY.

Visibility revision716138bd-f7b2-4ae9-ba05-e6be5158d801, HomeON,
home.projects=false,About/HoFOFF,19pages/21sections. Re-read pilihan owner terbaru,
jangan reseed atau restore defaultProjectsON. Public19/admin6/private401/
revision/content/media/intake/unknown404 PASS. P1 logs50rows zero5xx/native errors/
crashes; sample bukan audit semua request. Positive owner Auth/live-write PENDING.

P1 sudah satu commit/push, exactfivefiles: vercel.json, tiga verifier
package/readiness/performance dan P1 release doc. Postdeploy acceptance docs
masih dirty lokal; tidak ada secondpush. Dokumen checkpoint9ff/iad1/belumregion
adalah sejarah. P1 release approval telah digunakan, bukan izin P2/P3/rollback.

P1 measured80before/80after,40per motion,Chromium1440×900/agent host/serial/network
included/coldwarm uncontrolled: median1072.9→280.6ms, p95 1598.8→575.2ms;
after range213.5–1620.8ms. Jangan menjanjikan angka tersebut untuk semua perangkat.
Untuk P2 pakai sin1 baseline terbaru, bukan beforeiad1 sebagai bukti UX.

P2 sudah lokal: feedback status tanpa garis atas, warm navbar dan explicit
prefetchAll:false. Exactsource: astro.config.mjs,BaseLayout.astro,Navbar.astro,
site-visibility-navigation.js. P3 lokal: admin-shell.js bounded prewarm.
User menolak garis progress atas; sudah dihapus dan15UX cases/build/check PASS.
Status kecil tetap. Jangan reintroduce garis8px dari master historis.

ExistingQA:150PASS/10SKIP Node tests; public28; Pages19+21+7layouts; admin12+
races3; Projects/Team/Pendaftar4widths; Navbar20; VT/spacing/SEO/format/package PASS.
Local160timings/feedback13ms berasal dari kandidat sebelum bar removal, tidak
mengganti freshfreeze setelah owner review. Admin competing reads reproduced
synthetically1800ms; positive authenticated production diagnosis masih PENDING.

Preview last checked200:
http://127.0.0.1:4356/ dan http://127.0.0.1:4356/admin/#pages.
Explicit local fixture `/tmp/ds-navigation-local/config.json`; saves hanya file
lokal. Turn PLAN ONLY boleh membaca existing preview, tidak membuat draft/save,
restart/build atau menjalankan mutating verifier. Credentials production tidak
boleh dipakai di fixture. Node22 helper pernah di
`/tmp/ds-node22-r3/node-v22.23.3-linux-x64/bin/node`; cek availability, jangan
mengubah provider. Canonical harness/verifier ada di scripts/, bukan helper/tmp.

## Read order lengkap — 27 dokumen

Baca SELURUH file, bukan headings, potongan rg, atau hanya checkpoint terakhir.
Dokumen panjang dapat dibaca bertahap tanpa melewatkan isi.

1. `docs/navigation-performance-next-ai-plan-kickoff.md` — scope aktif ini.
2. `docs/navigation-performance-next-phase-plan.md` — plan rinci pekerjaan tersisa.
3. `docs/navigation-performance-p1-release.md` — release sebenarnya dan acceptance.
4. `docs/navigation-performance-local.md` — P2/P3 existing/local QA dan batas bukti.
5. `docs/navigation-performance-plan.md` — master N0–N7, historical proposal/targets.
6. `docs/navigation-performance-investigation.md` — original measurement/provenance.
7. `AGENTS.md`.
8. `HANDOVER.md`.
9. `docs/ai-handoff.md`.
10. `docs/navigation-performance-new-ai-kickoff.md` — historical local-execution prompt.
11. `docs/page-section-visibility-kickoff.md`.
12. `docs/page-section-visibility-plan.md`.
13. `docs/page-section-visibility-local.md`.
14. `docs/page-section-visibility-ui-refinement-plan.md`.
15. `docs/page-section-visibility-ui-refinement-local.md`.
16. `docs/page-section-visibility-release-checkpoint.md`.
17. `docs/page-section-visibility-production-release-plan.md`.
18. `docs/on-development-plan.md`.
19. `docs/pixel-precision-sop.md`.
20. `docs/assets.md`.
21. `docs/page-section-visibility-r0-preflight.md`.
22. `docs/page-section-visibility-r2-production-db.md`.
23. `docs/page-section-visibility-r3-provider-preflight.md`.
24. `docs/page-section-visibility-r3-function-fix-local.md`.
25. `docs/page-section-visibility-r4-release.md`.
26. `docs/page-section-visibility-r7-runtime-repair.md`.
27. `docs/page-section-visibility-r7-header-release.md`.

Jika dokumen berbeda statusnya: instruksi owner terbaru mengatur scope,
latest verified evidence mengatur baseline, old checkpoint/prompt adalah sejarah.
Tidak mengeksekusi copyable prompts lama yang meminta local implementation,
SQL atau release. Semua aturan kontrak yang tidak disupersede tetap berlaku.

## Prompt pertama — copy seluruh blok

```text
Saya pindah AI untuk melanjutkan Navigation Performance di repo
/home/faiz/ds/ds5opencode. PERTAMA BUAT PLAN DETAIL DAN RINCI DAHULU.
Scope turn ini PLAN ONLY + preflight read-only + sinkronisasi dokumentasi.
Jangan implementasi ulang/ubah source, build, mutasi fixture, commit/push,
deploy atau production writes pada turn ini.

Baca SELURUH docs/navigation-performance-next-ai-plan-kickoff.md, lalu
SELURUH27 dokumen pada read order-nya. Ikuti plan next-phase dan master
navigation-performance-plan.md. Baca checkpoint/prompt lama sebagai sejarah;
jangan menjalankan prompt implementasi lokal lama sebagai instruksi aktif.

Baseline terbaru:
- HEAD/remote main45cc86466b573fa067f0c98281e391afff502e75.
- P1 region sin1 SUDAH LIVE dan read-only acceptance PASS.
- Current/alias READY dpl_7bredDjDLDsY18nxTqGHymQgsVnS;
  actualNode22,12functions,deployed compute sin1, Supabase Singapore.
- Primary data-sorcerers-community-sigma.vercel.app.
- Provider default24/iad1 tidak diubah; jangan menyamakan default dengan
  effective region/runtime deployment.
- Last visibility revision716138bd-f7b2-4ae9-ba05-e6be5158d801:
  HomeON,home.projects=false,About/HoFOFF,19pages/21sections.
  Re-read dan jaga pilihan owner terbaru; jangan reseed/restore seed.
- P2 public UX/prefetch dan P3 bounded admin prewarm SUDAH LOKAL + QA,
  masih dirty/belum dirilis. Review diff, jangan mulai dari nol.
- Saya sudah menolak garis progress/loading di atas. Garis dihapus lokal;
  status kecil tetap. Jangan mengembalikan bar8px dari plan historis.
- Pages & Sections P0–P6, UI refinement, SQL applied once, repair runtime/
  routing existing selesai; jangan apply ulang atau mulai ulang.
- Semua dirty/untracked docs/source/artifacts harus dipertahankan.

Mulai preflight read-only: Git status/diff/staged/HEAD/remote/push target,
loader/current config, Current/alias/Node/functions/deployment regions,
migration hash dan existing loopback preview bila tersedia. Baca verifier
sebelum menjalankannya; pakai artifact directory baru. Jangan menjalankan
SQL, reset/stash/amend/force, fixture save/tests mutating, build/restart
server atau membunuh proses asing. Jika akses production/owner-session
hilang, tandai pending lalu lanjut review/plan independen; jangan minta
password/token/cookie atau export pendaftar.

Buat plan rinci untuk PEKERJAAN TERSISA:
1. Rekonsiliasi status live P1 vs existing lokal P2/P3 dan latest rules.
2. Review P2 empat source dan verifier: feedback tanpa garis atas, cleanup
   abort/race/error, navbar warm, explicit prefetch, freshness/no-store.
   Tentukan gaps, exact QA freeze, owner review dan scope release P2.
3. Metode timing before/after matched pada sin1: phases/request bytes,
   minimal40samples per condition/motion untuk p95, provenance/device/
   network/cold-state; pisahkan bukti lokal vs acceptance production.
4. Review P3 hanya bottleneck reproduced; synthetic proof dibedakan dari
   authenticated owner diagnosis yang masih pending. Shared Auth tidak
   diubah; tab/draft/keepalive/logout/late request/conflict/retry preserved.
5. QA matrix verified/pending/failed, dependency/urutan, file list per
   paket, evidence dan acceptance gates sebelum release berikutnya.
6. Concrete later authorization packages dan rollback candidates:
   P2 rollback memakai P1sin1 accepted, P3 memakai latest accepted P2
   jika sudah ada. Jangan rollback/promote/revert sekarang.

Reuse shared CMS Auth/Origin/CSRF; no schema6collections/intake/accounts/
grants/allowlist changes. Preserve19pages/21sections, protectedHome/heroes/
nav, SSRabsent sectionoff, disabledchamber200/noindexfollow, unknown404,
parent/CTA filtering, revision/freshconfig/no-store per request.
No deploy hook saat visibility save. No0ms promise/polling/automatic
update tab pengunjung terbuka. ZERO EMOTE, strict8point spacing, Bluu Next,
Manrope dan Button existing; no redesign/asset/font changes.

Tidak productionSQL/cache reload, provider/dashboard/env/plan/Node mutation,
live save/toggle/restore/upload/submit/no-op save, deploy hook/deployment
atau rollback. Izin P1 sebelumnya sudah dipakai; bukan izin P2/P3.
Commit/push berikutnya memerlukan instruksi baru eksplisit 'commit dan push'
dengan scope jelas dan deploymentmain; DB/API wajib siap sebelum main push.

Selesaikan plan yang konkret dan reviewable sekarang, bukan hanya mengakui
bisa. Boleh update docs untuk plan/evidence, tanpa source implementation.
Akhiri dengan actual status+timestamp, plan terurut P2 lalu P3, exactfiles,
QA/performance method, pending owner-session/device, preview aktual jika
tersedia, batas izin dan rollback. Owner meninjau plan dahulu sebelum
memberi work order implementasi/QA/release baru.
```

## Kelengkapan handoff

Format/diff checks,27doc links, actual source scope, HEAD/remote, production
readiness dan preview GET diperiksa pada pass dokumentasi ini. Bundle mempunyai
manifest dan scan exact sensitive environment values secara lokal tanpa mencetak
nilainya; secrets/session/PII tidak disertakan. No source change, build, commit,
push, provider/backend mutation, deploy atau rollback pada pass handoff ini.
