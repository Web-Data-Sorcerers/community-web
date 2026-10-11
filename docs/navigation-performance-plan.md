# Plan perbaikan navigasi, tombol dan tab admin

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

Tanggal: 11 Oktober 2026. Status: **PLAN ONLY**. Owner meminta plan rinci setelah
[investigasi production](navigation-performance-investigation.md).
Dokumen ini bukan izin implementasi, konfigurasi provider, deployment, live save,
rollback, commit atau push. Semua pekerjaan existing dipertahankan.

## 1. Hasil yang dituju

Navigasi antarhalaman memerlukan lebih sedikit waktu menunggu server; klik segera
mendapat feedback yang jelas; navbar tidak mengulang entrance panjang setiap
pindah halaman. Tombol anchor dan tab admin yang sudah siap tetap responsif,
sementara operasi jaringan menampilkan status sampai hasilnya benar-benar diterima.

Freshness tetap: setelah save confirmed, kunjungan baru membaca revision terbaru
tanpa rebuild. Tidak menjanjikan 0 ms, polling atau pembaruan otomatis tab terbuka.
Kecepatan visual tidak boleh didapat dengan menampilkan config visibility lama.

Urutan release yang direkomendasikan: **region dahulu → UX navigasi dan prefetch →
fix admin hanya jika reproduksi menunjukkan masalah**. Paket dipisahkan supaya
perubahan latency region dapat diukur tanpa tercampur perubahan UI.

## 2. Baseline aktual dan batas bukti

Verifikasi ulang read-only `2026-10-11T13:16:31.311Z`:

- HEAD dan remote main sama: `9ffce5ea859a87cd44f4126e9e7c6c60240cb857`.
- Working deployment terakhir terverifikasi:
  `dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C` pada primary Vercel alias.
- Actual runtime release Node 22, total 12 functions. Nilai project Node 24
  sebelumnya bukan alasan mengganti runtime yang sudah bekerja.
- Vercel function default `iad1`; database Supabase `ap-southeast-1` dan healthy
  pada pemeriksaan investigasi. Target provider project
  `prj_3KbX29t6DYN1RMTy88lKHXd0IUVE`, team `team_r2F97SVy81OD2LcBIbqM6p8x`;
  Supabase `yejrdckcmlxrkklgtrwy`.
- Visibility revision `716138bd-f7b2-4ae9-ba05-e6be5158d801`: Home ON,
  `home.projects=false`, About/HoF OFF. Projects OFF adalah state existing yang
  teramati setelah release, bukan perubahan oleh agen pada investigasi/plan ini.
  Re-read sebelum setiap release; jangan menimpa pilihan owner dengan seed.
- Migration SHA256 tetap
  `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`.
  Tidak ada kebutuhan SQL untuk kandidat optimasi ini.
- Dokumen handoff/release masih dirty dan dua dokumen investigasi/plan baru
  untracked; scope commit dokumen kelak harus ditinjau eksplisit.

| Bukti                                                            | Hasil                                         | Arti untuk plan                                              |
| ---------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| 18 navigasi production, normal/reduced motion, viewport 390/1440 | Click → page-load 672–2087 ms; median 1482 ms | Baseline eksplorasi, bukan SLA atau hasil perangkat owner    |
| First pass terpisah                                              | Satu sampel About 3513 ms                     | Outlier tercatat; tidak dibuang untuk mempercantik hasil     |
| Preparation → page-load                                          | 30–102 ms, median 59 ms                       | Menunggu HTML/preparation dominan dibanding swap/init        |
| Stylesheet tujuan baru                                           | 37–249 ms                                     | Asset waterfall sekunder; uji setelah region                 |
| Home Join Us                                                     | 1572 ms pada rerun                            | Tombol pindah halaman memakai jalur navigasi yang sama       |
| Recruitment Apply Now                                            | Anchor berubah tanpa fetch HTML Recruitment   | Bedakan scroll lokal dari navigasi jaringan                  |
| Enam warm admin switches, tanpa login                            | 14–30 ms; tidak ada request baru              | Bukti shell; kesiapan data owner setelah login masih pending |
| Navbar                                                           | Entrance 600 ms, stagger, CTA delay 500 ms    | Warm navigation perlu mempertahankan navbar settled          |
| Viewport prefetch                                                | Role detail di-fetch ketika masuk viewport    | ClientRouter default prefetchAll perlu diatur eksplisit      |

Perbedaan region terbukti. Besarnya penghematan setelah colocate masih hipotesis
dan harus dibandingkan pada production yang disetujui. Timing agent → Supabase
tidak mewakili timing function Vercel → Supabase.

## 3. Scope tetap dan hal yang dilindungi

Reuse shared CMS Auth, Origin dan CSRF, Button existing, Bluu Next dan Manrope;
ZERO EMOTE, strict 8-point spacing. Pertahankan ClientRouter, audio lifecycle,
keyboard/focus, mobile menu, Back/Forward, reduced motion, splash sekali per sesi
dan entrance awal yang sudah disetujui.

Tetap mengontrol 19 halaman/21 section; Home, hero dan navigation protected.
Disabled section absent dari SSR; known disabled page chamber 200/noindex-follow;
unknown detail 404; parent inheritance dan filtered CTA tetap berlaku.

Pertahankan enam collection CMS, RECRUITMENT_OPEN, akun, existing grants,
allowlist, media contract, idempotent save/retry/conflict dan draft. Tidak ada
deploy hook saat save visibility. Tidak mengubah schema, cache reload, Node,
plan provider, env secret, domain, production branch atau strategi fail-open.

No-store HTML/revision dan satu fresh config per public request tetap. Tidak
menambah cache config di process, browser atau CDN. Tidak menggunakan service
role pada browser. Tidak menghapus efek visual global hanya untuk mengejar skor.

## 4. N0 — freeze baseline dan rancang pengukuran

N0 perencanaan sekarang selesai; pengukuran tambahan menjadi bagian implementasi
lokal/acceptance berikutnya sesuai izin.

1. Re-read Git, remote main, Current/alias, region efektif dan live revision sebelum
   bekerja. Jika ada divergence, review tanpa reset/stash/amend/force-push.
2. Buat verifier timing yang dapat diulang berdasarkan script investigasi. Catat
   actual click capture → before-preparation → HTML response → CSS ready →
   after-preparation → before/after-swap → page-load → frame pertama UI tujuan.
   Jangan memakai networkidle sebagai definisi selesai navigasi.
3. Bedakan network stall, asset download, main-thread task, visual settling dan
   data readiness. Rekam resource timing, request count, long tasks, page errors,
   pending state, layout shift dan revision; jangan menyimpan cookie/token/PII.
4. Ambil baseline berpasangan sebelum dan sesudah release menggunakan perangkat,
   jaringan, sequence, motion, viewport dan status sesi yang sama. Repeated route
   adalah warm-assets sample; browser context baru adalah cold-client-assets.
   Jangan menyebut function cold/warm tanpa telemetry yang membuktikannya.
5. Ambil sampel serial, tanpa load test atau parallel request flood. Baseline
   awal 18 sampel tidak cukup untuk klaim p95 production. Untuk tiap kondisi
   utama before/after, target 40 navigasi tersebar pada route utama dalam dua
   putaran; laporkan jumlah, median, tail dan variasi. Jika hanya sampel kecil
   tersedia, laporkan range/median dan p95 pending.
6. Minta owner mereproduksi satu jalur admin setelah login existing: tab asal,
   tab tujuan, tombol, perangkat, apakah panel sudah pernah dibuka, dan status
   loading yang terlihat. Owner login sendiri; jangan meminta password atau
   membuat akun/grant reviewer. Nilai timing boleh dicatat tanpa isi data privat.

Output: baseline JSON ignored, ringkasan reviewable, pending owner scenario,
target uji dan exact scope source candidate. Gate: bukti cukup membedakan latency
server dari UI dan database target terkonfirmasi sebelum release.

## 5. N1 — kandidat region Singapore

Kandidat perubahan yang diusulkan untuk approval lokal/provider release:

```diff
 {
   "$schema": "https://openapi.vercel.sh/vercel.json",
+  "regions": ["sin1"],
   "framework": "astro",
```

Gunakan konfigurasi versioned sebagai satu sumber perubahan, bukan sekaligus
mengedit dashboard. Tujuannya menjalankan compute dekat database existing di
Singapore. [Vercel merekomendasikan lokasi dekat data source dan Hobby satu region](https://vercel.com/docs/functions/configuring-functions/region).

Tahapan setelah izin implementasi lokal:

1. Review pengaruh global region terhadap 11 root API dan satu SSR, termasuk
   CMS Auth/Projects/Team/Pendaftar, content/media dan revision. Inventaris region
   override yang mungkin berasal dari adapter/generated output; jangan menganggap
   config top-level otomatis menang atas setiap override.
2. Build menggunakan Node 22 yang sesuai release. Periksa generated manifest,
   handler/Node/packaging, SSR routes, root API detector, header/rewrite dan
   expected total 12 functions. File yang dihasilkan lokal mungkin tidak
   menyatakan deployment region; bila begitu label effective region pending.
3. Jalankan isolated packed-function verifier existing. Pastikan boot tidak
   membutuhkan workspace node_modules, tidak mengimpor compiler runtime lagi,
   shared Auth/routing guards dan synthetic freshness tetap PASS.
4. Review exact diff. Expected source change untuk release region hanya
   `vercel.json`; verifier/evidence docs boleh termasuk jika scope ditinjau.
5. Sesudah provider/release approval: deploy exact reviewed SHA satu kali lewat
   main yang auto-deploy. Verifikasi region efektif dari deployment metadata/
   function invocation, bukan sekadar READY atau request edge Singapore.
6. Rerun read-only correctness dan timing before/after. Tidak mengubah visibility
   atau memanggil save sebagai probe. Region optimal dinyatakan accepted hanya
   setelah routing, Auth boundaries dan latency comparison lolos.

Jika provider menolak candidate, function count berubah atau region masih iad1,
stop acceptance untuk diagnosis. Jangan mengganti plan/Node, menambah region atau
retry deployment tanpa scope yang jelas. Backend/API ready wajib sebelum push.

## 6. N2 — feedback navigasi dan warm navbar

Scope source yang diperkirakan:
`src/scripts/site-visibility-navigation.js`, `src/layouts/BaseLayout.astro`,
`src/components/Navbar.astro`; CSS existing yang sesuai bila diperlukan.
Implementasi rinci ditetapkan sesudah diff lokal direview.

Perilaku yang direncanakan:

1. Pada `astro:before-preparation`, tandai link pemicu dan tampilkan pending cue
   pada frame berikutnya. Gunakan indikator dekoratif tetap berukuran 8 px dengan
   transform/opacity, tanpa menambah tinggi layout. Status teks memakai Manrope
   dan spacing existing; tidak memperkenalkan font atau komponen Button baru.
2. Indikator indeterminate, tidak mengklaim persentase network. Status assistive
   memberi tahu halaman sedang dibuka; `aria-busy` pada area yang sesuai dan
   `aria-current` hanya berubah saat tujuan sudah masuk. Tidak mencuri fokus.
3. Old page tetap usable saat request pending. Tidak men-disable semua tombol
   atau menambah minimum spinner duration/delay buatan sebelum swap.
4. Bersihkan pending pada page-load, abort/superseded navigation, error dan
   pageshow sesuai lifecycle. Request lama tidak boleh membersihkan indikator
   request baru: gunakan navigation generation/abort signal. Tidak memasang
   document listener berulang setiap swap.
5. Same-page anchor, external link, mailto, download dan open-new-tab tidak
   mendapat indikator pindah halaman. Anchor mengikuti scroll behavior existing.
6. Desktop dan mobile dapat memilih tujuan lain saat request pertama pending;
   newest navigation menang dan state tidak tersangkut. Jangan menunda fetch
   sampai animasi penutupan mobile menu selesai.
7. Warm navigation mempertahankan navbar/link/CTA settled: skip entrance
   `nav-in` untuk kelas `nav-warm`. Entrance awal, hover, focus, active state,
   Bluu Next/Manrope, spacing dan Button tetap existing. Hindari mengubah DOM
   persistence navbar tanpa kebutuhan karena current-page/menu state ikut berubah.
8. Reduced motion menampilkan status statis dan tanpa entrance/shimmer wajib.
   Sound engine dan cue klik tetap mengikuti consent/mute existing.

Acara lifecycle mengikuti [referensi Astro](https://docs.astro.build/en/reference/modules/astro-transitions/).
Acceptance memisahkan cue segera, actual page ready, serta visual settling;
cue cepat tidak boleh dilaporkan sebagai penghematan waktu respons server.

## 7. N3 — prefetch terkendali dan asset waterfall

Pilihan awal yang diuji lokal: konfigurasi Astro eksplisit
`prefetch: { prefetchAll: false, defaultStrategy: 'viewport' }`. Ini proposal,
belum diterapkan. Installed ClientRouter `init({prefetchAll:true})` memiliki
fallback yang harus diperiksa terhadap config compile-time; verifikasi behavior
browser, bukan hanya melihat nilai config.

1. Buat inventory Navbar, Button, cards/role links, footer dan admin. Catat mana
   yang memicu speculative HTML request tanpa klik. Keep Navbar opt-out existing.
2. Candidate menghentikan prefetch HTML otomatis untuk route public SSR dan private
   admin/API. Navigasi klik tetap satu fresh request dengan revision valid.
   Jangan menambah HTML opt-in untuk controlled route demi menyembunyikan latency.
3. Uji Role section viewport dan scrolling: speculative GET role berkurang menjadi
   nol untuk link yang tidak di-opt-in. Jangan mengganggu image lazy-load atau
   background CMS content sync existing; keduanya kontrak terpisah.
4. Bandingkan tanpa asset hint terlebih dahulu. Jika CSS waterfall masih material
   setelah region, lakukan spike lokal untuk preload CSS tujuan berdasarkan
   interaction intent, menggunakan hashed asset manifest dari build yang sama.
   Tidak hardcode `_astro` hash, mem-fetch HTML hanya untuk menemukan CSS,
   men-download CSS semua 19 halaman atau preload hero image seluruh situs.
5. Asset hint bersifat bounded/deduplicated dan tidak menghambat klik. Uji saveData,
   network lambat, reduced motion, first visit dan repeated visit. Terapkan hanya
   jika mengurangi critical path tanpa request/byte regression yang berarti.
6. Jika asset hint tidak menguntungkan, drop candidate itu. Font/Supabase public
   preconnect bukan default solusi: browser tidak berkomunikasi langsung dengan
   privileged visibility RPC dan font existing sudah dimuat.

[Astro prefetch documentation](https://docs.astro.build/en/guides/prefetch/) mendokumentasikan
interaksi ClientRouter/prefetchAll. Freshness dan request count harus dibuktikan
oleh network trace pada installed Astro 7.3.3.

## 8. N4 — admin dan tombol operasi, berdasarkan reproduksi

N4 diagnosis setelah owner-session tersedia; **fix admin bersifat bersyarat**.
Jangan mengubah shell/Auth hanya karena laporan navigasi publik lambat.

| Skenario                                   | Pengukuran dan perilaku yang harus dijaga                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Buka admin pertama kali                    | Pisahkan download JS, session check, mount panel dan content GET; status loading mencerminkan data readiness    |
| Tab pertama belum diprewarm                | Panel terpilih tampil segera; loading konten jelas; kebutuhan aktif diprioritaskan terhadap prewarm background  |
| Pindah ulang Projects/Team/Pendaftar/Pages | DOM panel keepalive, tidak refetch list yang masih sesuai tanpa alasan; draft/selection/scroll tetap            |
| Pendaftar list → detail → Back → detail    | Pertahankan existing in-memory detail cache dan local Back; reload eksplisit tetap mengambil data terbaru       |
| Search/select item                         | Pisahkan delay debounce dari fetch/render; jangan menambah loading toast untuk data yang sudah siap             |
| Save                                       | Busy segera, double submit terlindungi, hasil hanya confirmed setelah server; conflict/retry UUID identik tetap |
| Upload                                     | Status prepare/upload/image decode dibedakan; tidak melaporkan selesai sebelum response/image siap              |
| Logout/session expired                     | Seluruh panel/cache private dibersihkan; late GET/save tidak membuka data/sesi kembali                          |
| Draft lalu pindah tab                      | Dirty guard existing dan draft persistence terjaga; perubahan tab bukan submit/save                             |

Jika pengukuran menunjukkan prewarm menyaingi load aktif, proposal lokal berupa
penjadwalan bounded/prewarm setelah panel aktif siap, bukan menghapus Auth checks
atau membuat global cache CSRF/content. Jika shell switch tetap cepat tetapi GET
lambat, prioritaskan bukti endpoint/region sebelum mengubah DOM.

Source candidate hanya bila dibutuhkan: `src/scripts/admin-shell.js` dan modul
yang terbukti bermasalah (`cms-admin-editor.js`, `cms-team-editor.js`,
`recruitment-admin.js`, `site-visibility-editor.js`). Exact file/diff dan QA harus
dibuat reviewable sebelum meminta release scope tambahan.

Tidak login menggunakan credential owner yang dikirim di chat, meng-export daftar
pendaftar atau mengubah data production untuk diagnosis. Synthetic local Auth/data
dan owner read-only reproduction diberi label berbeda.

## 9. N5 — QA lokal dan regression matrix

Gunakan Node 22, build kandidat dan restart hanya harness milik task. Preview
compiled Vercel function, bukan menganggap `astro preview` ekuivalen production.
Review verifier sebelum menjalankan; fixture mutating tests serial dan file
terisolasi, seluruh outbound synthetic yang tidak dikenal diblokir.

| Area                     | Kasus acceptance                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Public route correctness | Seluruh 19 route, effective state menurut fixture/config, unknown detail 404, parent/CTA/chamber/robots/canonical/revision     |
| Section correctness      | Seluruh 21 section di fixture, HTML absent ketika disabled, Home/hero/nav protection, current production state tidak direseed  |
| Navigation               | Enam route utama dua arah, role/HoDS detail, Apply, Back/Forward, warm/cold-client-assets, hash target/fallback                |
| Race/error               | Klik dua tujuan cepat, double click, timeout/503, cancelled request, failed script/style load dan reload; cue tidak tertinggal |
| Header/runtime           | No-store HTML/revision, enam admin slash/no-slash forms no-store/noindex, private anonymous 401; Node22 packed boot/routing    |
| Responsive/keyboard      | 320/390/768/1440, normal/reduced motion, mobile menu, focus/current state, no overflow/layout shift baru                       |
| Performance              | Phase timings, request count/bytes, long tasks; compare matched conditions, bukan fixture milliseconds vs production           |
| Admin synthetic          | Empat tab cold/warm, draft switch, read late/logout, konflik/uncertain retry, list/detail Back; tidak menulis live data        |
| Existing workflows       | Projects/Team/Pendaftar UI targeted jika tersentuh, public content/media, Recruitment intake/application tanpa submit live     |
| Design                   | ZERO EMOTE, strict 8-point spacing, Bluu Next, Manrope, Button existing; entrance awal/sound/reduced motion sesuai             |

Checks sesuai perubahan: `npm run check`, `npm run build`, targeted Prettier,
`npm run audit:spacing`, isolated package verifier, relevant visibility/CMS/
Recruitment tests serta browser targeted. Tidak menjalankan SQL migration atau
ephemeral DB command pada production. Tidak mengulang full legacy visual suite
yang punya assertion historical About/HoF tanpa penyesuaian scope yang sah.

## 10. Target acceptance yang diusulkan

Angka berikut **target engineering**, bukan hasil yang sudah dicapai atau SLA.
Semua pengukuran harus menyebut perangkat/jaringan/sample count.

| Metric                    | Target review                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Feedback klik navigasi    | Terlihat pada frame berikutnya; target ≤100 ms pada perangkat uji tanpa throttle; tidak bergantung respons server                        |
| Warm navbar               | Tidak replay 600 ms/stagger/CTA delay setelah swap; active/hover/focus tetap benar                                                       |
| Warm shell admin          | Target panel switch ≤100 ms pada perangkat uji, tanpa GET baru yang tidak diperlukan; data readiness diukur terpisah                     |
| Region                    | Effective compute sin1 terbukti untuk SSR dan root API; database tetap existing Singapore                                                |
| Public navigation latency | Target median matched warm-assets turun ≥30% dibanding baseline baru N0; aspirasi median <1 s pada jaringan uji stabil                   |
| Tail latency              | Laporkan p95 dengan cukup sampel; target tidak lebih buruk >10% pada comparison matched. Sampel kecil → pending, bukan klaim PASS        |
| Prefetch                  | Nol automatic destination HTML GET untuk controlled SSR/private links yang tidak diklik; image/content sync tetap sesuai kontrak         |
| Freshness                 | Fresh request setelah confirmed save memakai new revision; local synthetic PASS wajib, production mutation hanya jika disetujui terpisah |
| Correctness               | Nol regression routing/Auth/visibility; error tidak membuka konten melalui stale fallback                                                |

Jika region benar tetapi target latency belum tercapai, laporkan functional
acceptance terpisah dari performance acceptance dan lanjut diagnosis. Jangan
menambah stale cache, timeout lebih panjang atau mengklaim sukses dari spinner.
Pertimbangkan server timing durasi RPC/render yang tidak mengungkap secret hanya
jika perlu untuk diagnosis berikutnya; instrumentation source/release scope baru
harus direview, tanpa tambahan DB request.

## 11. N6 — paket izin dan release

Paket saat ini masih **proposal**; exact future SHA/hash/diff belum ada karena
owner meminta plan. Tidak meminta approval produksi untuk kandidat yang belum QA.

| Paket                        | Izin yang dibutuhkan                                                                        | Scope konkret dan hasil sebelum izin berikutnya                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| L1 lokal                     | Implementasi lokal region candidate + verifier/QA                                           | Diff `regions:[sin1]`, runtime/count/routing/packaging proofs; tanpa deploy atau dashboard mutation                      |
| P1 provider + release region | Approval region config dan explicit `commit dan push` scope region termasuk deployment main | Exact final SHA, reviewed doc list, DB/API ready, satu push, connected deploy, metadata/alias/region/read-only QA/timing |
| L2 lokal                     | Feedback navigasi, warm navbar, explicit prefetch policy; asset hints hanya hasil spike     | Exact source diff, local fixture QA, owner visual preview, performance traces                                            |
| P2 release UX                | Explicit commit/push scope UX termasuk deployment main                                      | Exact SHA, source/doc scope, satu push, read-only production correctness/performance                                     |
| L3/P3 admin                  | Hanya setelah reproduksi dan fix lokal konkret                                              | Perubahan file endpoint/shell terbukti, shared Auth intact; commit/push/deploy approval tersendiri                       |
| V live write acceptance      | Target/expected revision/final state/save/restore yang disetujui terpisah                   | Optional; tidak diperlukan untuk timing region/read-only navigasi. No-op save pun tetap write                            |
| RB rollback                  | Exact rollback deployment dan provider setting jika ada                                     | Dapat disetujui sebagai bagian contingency release secara eksplisit atau diminta terpisah; bukan izin otomatis           |

Contoh scope review P1 kelak: `vercel.json` menambah hanya `regions:[sin1]`, plus
verifier/evidence docs yang disebut; project/team/repo existing; DB/API sudah
ready; satu main push dan deployment; tidak mengubah env, Node, plan atau live
flags. P2 kelak menyebut exact file UI/prefetch dan bukti yang sudah tersedia.
Persetujuan release terdahulu tidak berlaku umum untuk release baru.

Untuk setiap deployment: freeze actual reviewed SHA, periksa remote/main dan
Current baseline, satu push tanpa force, monitor SHA yang sama, READY + alias,
actual Node22/functions12/region, lalu read-only acceptance. Error deployment
atau acceptance diberi status failed/pending; tidak otomatis retry deploy hook.

## 12. N7 — rollback dan expected final state

Baseline kandidat rollback region saat plan:
`dpl_oioXmVjBR1efQZMCMTWvj87Tyy2C` / commit `9ffce5e`, existing effective iad1.
Revalidate availability/alias/known-good read response sebelum release berikutnya.
Rollback UX memakai deployment region yang kemudian sudah accepted, bukan
otomatis kembali ke baseline yang lebih lama. Catat actual candidate setiap paket.

Trigger rollback review: public 5xx berulang pada smoke routes, private endpoint
terbuka, freshness salah, routing/header regression, admin data lifecycle rusak
atau performance regression berulang pada matched samples. Satu spike network
tidak otomatis menjadi alasan rollback.

Setelah rollback diizinkan: promote exact known-good deployment via jalur existing,
verify Current/alias, routes/private boundaries/revision; bila dashboard pernah
diubah, restore exact recorded setting hanya jika tercakup izin. Jangan force-push,
reset, amend atau menghapus SQL. Perubahan versioned region perlu direvert dalam
commit scoped yang disetujui sebelum push berikutnya agar future deploy tidak
memasang kembali config yang ditolak. Tidak restore visibility ke seed.

Expected final state setelah paket yang disetujui accepted:

- Compute dekat database, measured navigation wait turun sesuai hasil nyata.
- Feedback klik jelas, warm navbar settled, prefetch terkontrol.
- Empat admin tab menjaga draft/data lifecycle; fix hanya untuk bottleneck terbukti.
- Sembilan belas page dan dua puluh satu section tetap memakai fresh server
  revision; CMS/Auth/Origin/CSRF/media/intake existing tetap benar.
- Live config mengikuti pilihan owner terbaru; Home protected, About/HoF mengikuti
  preference existing. Projects OFF yang diamati sekarang tidak di-restore oleh agen.
- No rebuild hook saat visibility save; open-tab behavior tetap existing.
- Read-only acceptance dan local synthetic save proof dibedakan dari owner login
  dan production live-write acceptance yang masih memerlukan scope terpisah.

## 13. Cara owner meninjau hasil lokal nanti

Plan ini belum mengubah preview. Saat L2 siap, berikan URL loopback/port aktual
milik task setelah compiled harness di-restart dengan fixture terisolasi. Banner
fixture wajib terlihat; login fixture tidak memakai credential production.

Review yang diminta: Home → Recruitment → Partners → Contact → Back; klik Join Us;
Apply Now sebagai anchor; buka/tutup menu mobile lalu pilih tujuan; klik dua tujuan
cepat; pastikan pending cue segera terlihat dan navbar tidak replay entrance.
Bandingkan normal/reduced motion dan keyboard. Di fixture admin, pindah empat tab
dan buat satu draft lalu kembali untuk memastikan draft tersimpan lokal.

Owner production read-only review terpisah memakai login existing pada domain asli;
tidak save/upload/submit sebagai bagian pengecekan latency tanpa izin write.
Presentasikan before/after timing, source diff, screenshot cue dan acceptance
matrix sebelum meminta release approval terakhir.
