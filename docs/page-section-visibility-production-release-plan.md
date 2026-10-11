# Pages & Sections — rencana release production

## R4 release diizinkan — 11 Oct 2026

Owner memberi instruksi eksplisit “commit dan push scope release tersebut,
termasuk deployment main”. Scope: commit fitur51ce198 + fix packaging visibility

- seluruh dokumen handoff/preflight terkait yang existing.
  [Execution record](page-section-visibility-r4-release.md) mencatat freeze/push/deployment/acceptance.
  Baseline sebelum push12:12 UTC: loader valid19/21 revision seed, Home/ProjectsON,
  About/HoFOFF; Current/alias READY144e681. Provider config dan live toggle/restore
  tetap tidak diizinkan. Checkpoint PLAN ONLY dan pending commit di bawah historis;
  izin release ini hanya untuk scope yang disebut, bukan future push umum.

## R3 fix packaging lokal — 11 Oct 2026

[Fix dan bukti rerun](page-section-visibility-r3-function-fix-local.md): owner menyetujui move visibility entry ke
server + update bridge import. Detector11 API +1 SSR expected12; Node22
check/build, 54 tests dan compiled shared Auth/routing synthetic PASS.
Production loader read-only tetap seed: Home/ProjectsON, About/HoFOFF,19/21.
Fix belum committed; HEAD51ce198 bukan final candidate. Tidak push/deploy,
provider/config mutation atau live toggle. R3 provider manifest/R5/R6 pending.
Checkpoint proposal R3 di bawah merupakan bukti sebelum fix ini.

## R3 provider preflight — 11 Oct 2026, 11:13–11:21 UTC

[Bukti R3 dan proposal fix minimal](page-section-visibility-r3-provider-preflight.md):
backend production/target content+revision identik; Node22 build/check/tests10
dan19 local SSR reads dengan real DB PASS; remote CMS prebuild/latest snapshot
build terisolasi PASS. Engines22 mengesampingkan provider24; artifact22 terbukti.
Release candidate51ce198 tertahan: CLI memilih12 standalone API +1 SSR expected13,
melebihi Hobby12. Belum provider rejection/deploy. Proposal belum diterapkan:
move visibility entry keluar root api/ dan update import bridge (expected12).
Perlu izin fix source lokal karena scope aktif preflight/docs; tidak mengubah
source/config/provider/SQL/save/toggle/commit/push dalam pass R3. R2 tetap PASS.

## Update Paket A / R2 — 11 Oct 2026, 11:06–11:07 UTC

[R2 production DB](page-section-visibility-r2-production-db.md) selesai setelah owner “gass”
dengan scope Paket A SQL exact + verifikasi yang diumumkan. Migration applied
sekali, loader200 valid tiga reads, catalog/defaults/ACL/RLS/denials PASS;
fingerprints existing identik. Cache reload tidak diperlukan. Home/Projects ON,
About/HoF OFF di config19/21; web Current144e681 masih lama, fitur belum live.
Status PLAN/R0 sebelum SQL di bawah adalah snapshot historis. Tidak
provider/deploy/save/toggle/restore/commit/push. R3 gates dan instruksi baru
“commit dan push” dengan scope release jelas tetap diperlukan; live toggle dan
restore izin terpisah. Existing dirty/source/hash terjaga.

Update R0 11 Oktober 2026 10:34–10:38 UTC:
[hasil aktual dan paket review](page-section-visibility-r0-preflight.md).
Catalog visibility absent, public exposed, loader404/PGRST202; R1 kini memilih
proposal apply exact migration. Current/alias deployment lama terverifikasi,
Node24; provider secret values dan release acceptance tetap pending. Tahap SQL,
release dan live toggle belum dijalankan; PLAN ONLY dan seluruh gate tetap.

Tanggal: 11 Oktober 2026. Status: PLAN ONLY atas permintaan owner “nah plan dulu”.
Turn ini hanya review sumber/dokumentasi dan penulisan plan. Tidak SQL apply,
provider/config mutation, push, deployment, live toggle atau commit tambahan.
Permintaan plan ini tidak menjadi persetujuan untuk menjalankan tahap production.
Update handoff owner: [kickoff aktif AI baru](page-section-visibility-kickoff.md).
Prompt tersebut mengizinkan pembacaan/preflight tanpa perubahan production dan
pembaruan dokumentasi; tidak memberi izin eksekusi R2/R4/R6 atau commit baru.

## 1. Posisi sekarang dan tujuan

Kode fitur/UI serta perubahan existing yang dipertahankan sudah berada di commit
lokal `51ce1984112283ad533e018dbebcb6b3730a138a`. Belum dipush. Remote main terakhir
terverifikasi pada `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`; posisi remote harus
dicek ulang sebelum eksekusi. Origin/production menunjuk repo community-web yang
sama; hanya satu push origin diperlukan, bukan dua target historis.

QA lokal P0–P6 dan refinement selesai. Lihat
[hasil lokal](page-section-visibility-local.md),
[hasil UI](page-section-visibility-ui-refinement-local.md), dan
[checkpoint release](page-section-visibility-release-checkpoint.md).
Tidak menyamakan hasil fixture/ephemeral dengan acceptance production.

Target release: dashboard production mempunyai tab Pages & Sections, 19 page
preferences dan 21 section preferences, serta publik membaca status pada request
berikutnya setelah save sukses. About/HoF default Under Development, Home selalu
aktif. Home Projects tetap aktif sampai owner mengizinkan perubahan terpisah.

Hasil read-only 11 Oktober 2026 sebelumnya: loader RPC lewat Supabase API
HTTP 404/PGRST202. Ini bukti API belum siap, bukan bukti lengkap bahwa seluruh
objek database tidak ada. Perlu pemeriksaan catalog/ACL/schema cache sebelum
memutuskan apply; jangan apply ulang semata-mata karena API 404.

Vercel mendukung auto-deploy dari push ke production branch; hubungan project,
branch dan alias yang sesungguhnya harus diverifikasi read-only, bukan diambil
semata-mata dari sejarah handover. [Dokumentasi Git Vercel](https://vercel.com/docs/git).
Kode ini memakai selective on-demand rendering dengan adapter existing.
[Dokumentasi Astro](https://docs.astro.build/en/guides/on-demand-rendering/).

## 2. Paket perubahan SQL yang dapat disetujui

Tepat satu file migration:
[`20261011160000_site_visibility.sql`](../supabase/migrations/20261011160000_site_visibility.sql).
SHA256: `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`.
Jika file/hash berubah, hasil yang diusulkan dan QA harus ditinjau ulang.

| Objek                                               | Fungsi                                                          |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `private.site_visibility_state`                     | Satu konfigurasi beserta revision dan waktu update              |
| `private.site_visibility_events`                    | Riwayat perubahan flag yang benar-benar berubah                 |
| `private.site_visibility_requests`                  | Receipt permintaan untuk retry/idempotency                      |
| `private.site_visibility_valid(jsonb)`              | Validasi 19 halaman/21 section dan Home protected               |
| `public.site_visibility_load()`                     | Loader config server-side                                       |
| `public.site_visibility_save(uuid,uuid,uuid,jsonb)` | Save atomic, cek existing CMS grant, revision, replay dan audit |

RLS/direct-access denial dan EXECUTE service_role hanya untuk objek visibility
baru. Migration tidak mengubah CMS admin grants, akun, allowlist, enam collection
CMS, storage/media, data tim/proyek, atau RECRUITMENT_OPEN.

Seed dimasukkan hanya ketika state belum ada; ON CONFLICT DO NOTHING menjaga
konfigurasi yang sudah tersimpan. Seed memiliki Home aktif, About/HoF nonaktif,
16 halaman lainnya aktif dan 21 section preference aktif. Section tetap tidak
render jika halaman/parent efektif nonaktif. Jika state sudah ada, verifikasi
terhadap preferensi existing; jangan memaksakan seed menimpa pilihan owner.

Migration sudah lulus 29 pemeriksaan pada PostgreSQL ephemeral. Angka tersebut
bukan jaminan akses/API/environment production sudah cocok.

## 3. Tahap R0 — preflight read-only dan baseline

Sebelum perubahan production apa pun:

- Catat HEAD lokal, dirty diff terbaru, remote main, URL push, dan SHA migration.
  Plan/dokumen yang belum committed jangan ikut dipush secara tidak sengaja.
- Verifikasi Vercel project yang terhubung ke community-web, production branch,
  deployment Current, exact Git SHA, domain/primary alias, status READY.
  Git HEAD remote tidak otomatis sama dengan deployment yang sedang melayani.
- Periksa actual Node/runtime: adapter lokal mengeluarkan Node 24 function;
  package engines masih 22.x dan QA lokal memakai Node 26.10. Catat actual provider
  setting dan compatibility; perubahan setting harus diusulkan konkret terpisah.
- Periksa environment Production: presence/scope SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN dan konfigurasi shared CMS Auth
  existing. Jangan mencetak value. Visibility source harus remote/default,
  bukan local; fixture file/review flag tidak menjadi konfigurasi production.
- Cocokkan backend project untuk reads/writes: write transport saat ini memakai
  project tetap `yejrdckcmlxrkklgtrwy`; loader memakai SUPABASE_URL. Keduanya harus
  menunjuk backend yang sama. Jika berbeda, stop; jangan menerapkan ke project
  yang sekadar punya kredensial tersedia.
- Periksa build source CMS existing: prebuild menyusun snapshot dari source yang
  dikonfigurasi. Jangan mengubah mode atau reseed konten agar build lolos.
- Ambil baseline 19 URL publik, tiga admin entry routes, content/media/recruitment
  read endpoints, robots/canonical/sitemap, header dan desktop/mobile screenshot.
  Tidak mengambil daftar pendaftar atau mencetak PII untuk baseline routing.
- Ambil catalog/fingerprint fungsi, table definition, constraint, owner/ACL/RLS
  yang terkait. Simpan snapshot kecil state visibility jika sudah ada. Catat
  fingerprint koleksi CMS/intake/access definitions sebagai before/after proof.
  Backup metadata ini bukan klaim full database backup/PITR.
- Semua bukti sensitif masuk ignored artifacts; token, cookie dan export privat
  tidak masuk Git atau respons chat. Tidak menciptakan akun/grant baru untuk QA.

Gate: target provider/backend dan runtime jelas, baseline tercatat, objek existing
teridentifikasi, serta tidak ada prerequisite config yang belum disetujui.
Jika API/kredensial read-only tidak tersedia, laporkan mana yang belum terbukti.

## 4. Tahap R1 — keputusan catalog dan persetujuan SQL

| Temuan                           | Tindakan yang direncanakan                                         |
| -------------------------------- | ------------------------------------------------------------------ |
| Objek visibility belum ada       | Ajukan apply file exact di atas                                    |
| Objek sudah ada dan sesuai       | Jangan apply ulang; verifikasi state, ACL dan akses API            |
| Objek ada tetapi berbeda/partial | Stop; sajikan diff dan tindakan repair konkret untuk approval baru |
| Katalog cocok tetapi RPC API 404 | Periksa exposure/ACL/schema cache; jangan reseed                   |

Objek existing yang berlainan tidak boleh diam-diam ditimpa CREATE OR REPLACE.
Sebelum apply, owner menyetujui target project, file/hash, default flags dan
scope tambahan cache reload bila diperlukan.

Cache reload bersyarat yang diusulkan: jika SQL/catalog dan ACL sudah benar
namun PostgREST belum mengenali RPC, jalankan tepat
`NOTIFY pgrst, 'reload schema';` hanya bila termasuk approval SQL. Ini bukan
perubahan flag/konten. [Panduan resmi Supabase](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema).
Jika masih gagal, stop untuk diagnosis; tidak mengubah exposed schemas atau
provider config tanpa hasil konkret dan izin terpisah.

Gate: approval SQL production diberikan secara eksplisit. Persetujuan push
sebelumnya tidak dipakai sebagai persetujuan SQL atau cache reload.

## 5. Tahap R2 — apply transaksional dan verifikasi database

- Jalankan hanya file approved melalui transport SQL existing. File punya BEGIN/
  COMMIT. Jangan menjalankan seluruh folder migration atau supabase db push.
- Catat project, file hash, waktu mulai/selesai, acknowledgment dan fingerprint
  setelah apply; tidak mengklaim history migration provider otomatis terisi.
- Jika error transaksional, database rollback transaksi. Jika koneksi hilang,
  hasil bisa sudah committed; inspeksi catalog sebelum retry, jangan reapply buta.
- Verifikasi tiga tabel, validator dan dua RPC: signature, owner, search_path,
  SECURITY DEFINER pada wrappers, RLS/direct table ACL serta execute ACL sesuai.
- Verifikasi singleton tepat satu, schemaVersion 1, UUID revision valid, 19 halaman
  dan 21 section, Home protected, serta state seed/preferensi existing terjaga.
- Panggil loader melalui jalur server/service-role yang sama dengan runtime;
  validate contract seluruh config, bukan sekadar HTTP 200. Lakukan pembacaan
  ulang berbatas untuk memastikan RPC API benar-benar tersedia.
- Anon/authenticated tidak dapat mengeksekusi privileged RPC atau membaca tabel;
  service-role tidak mendapat akses langsung ke tabel. Tidak memanggil save RPC
  sebagai probe yang menulis receipt/no-op di production.
- Fingerprint enam collection CMS, intake, akun/grant/allowlist definitions tetap
  sama. Tidak menjalankan toggle publik dalam tahap ini.

Gate: DB dan API loader siap, config valid, akses tepat, tidak ada perubahan
existing di luar scope. Situs masih menggunakan deployment existing; belum push.

## 6. Tahap R3 — freeze release dan kesiapan provider

- Cocokkan ulang config/backend/runtime/env read-only setelah R2.
- Konfirmasi route artifact: 19 public SSR, tiga admin static entry, private API
  bridges, public content API dan CMS media rewrite; no stale static public HTML
  yang menutupi hasil SSR. Periksa timeout/function configuration aktual.
- Review scope commit: fitur dan refinement, approved On Development, official
  contact/social links, Navbar contrast, Team verifier dan dokumentasi. Jangan
  menggambarkan commit 88 files ini hanya perubahan satu tombol.
- QA lokal existing tetap bukti utama. Rerun targeted checks jika source/runtime
  berubah; jangan menurunkan assertion untuk mengatasi failure release.
- Plan baru ini/dokumen checkpoint masih perubahan lokal. Jika hendak ikut
  release, perlu commit dokumentasi tambahan yang diotorisasi; exact release SHA
  akan berbeda dari `51ce198` dan harus dicatat sebelum push.
- Jika remote maju, fetch dan review divergence; jangan force-push/reset/stash
  atau otomatis menimpa commit orang lain. Freeze exact final SHA yang ditinjau.

Gate: owner memberi approval push/deployment untuk SHA final setelah prerequisite
lulus. Perubahan provider/env, jika ternyata dibutuhkan, memiliki approval khusus.
Tidak mengubah setting agar build lolos tanpa menjelaskan perubahan konkret.

## 7. Tahap R4 — satu push dan observasi deployment

- Push satu kali exact reviewed release ke origin/main, tanpa force, setelah R3.
  Verifikasi remote main menunjuk SHA tersebut. Jangan push ulang lewat remote
  production yang menunjuk repository sama.
- Monitor deployment yang Git SHA-nya cocok. Periksa logs: prebuild CMS source,
  build/typecheck, artifact/routing dan runtime. Tidak mencetak secret build log.
- READY saja belum cukup: cocokkan primary alias/domain dan deployment Current
  ke SHA release, lalu periksa respons actual domain.
- Tidak memanggil deploy hook tambahan, mengubah provider, atau retry redeploy
  otomatis ketika failure belum dipahami. Laporkan failure/unknown status.

Gate: release exact SHA READY dan alias yang dituju benar. Jika gagal, jangan
menyatakan fitur live; jalankan keputusan gagal pada R7.

## 8. Tahap R5 — acceptance live tanpa mutation

- GET 19 public routes: expected enabled/default Under Development, HTTP 200,
  canonical/robots benar, no-store pada browser/CDN dan revision konsisten.
  Unknown detail ID tetap404; runtime tidak jatuh ke fixture/default local.
- Default Home/Projects aktif; About/HoF Under Development. CTA empat tujuan pada
  chamber disaring menurut config. Hero/nav protected; data existing terjaga.
- Tiga admin routes memuat tab baru, noindex/no-store; anonymous private endpoints
  tetap 401, tanpa kebocoran config, cookie atau informasi pendaftar.
- Owner membuka dashboard dengan shared login existing untuk GET config; tidak
  membuat reviewer account atau meminta password di chat. Jika owner session
  belum tersedia, label positive owner acceptance pending.
- Verifikasi content API dan satu known public media, routing Recruitment/Apply
  dan indikator status intake tanpa submit form/upload/write CMS.
- Cek 320/390/768/1440px, keyboard, Astro navigation/Back dan console errors.
- Ambil sampel read kecil untuk latency real (misalnya 20 request), catat kondisi
  cold/warm dan resource/network. Bukan load test atau janji 0ms.

Gate: deployed + read-only accepted. Acceptance authenticated save-to-public
belum dianggap selesai sebelum R6 disetujui.

## 9. Tahap R6 — live toggle hanya dengan scope baru

Proposed first mutation tetap `home.projects=false`; tahap ini tidak termasuk
approval SQL/push/deploy. Owner menentukan apakah ingin mematikan Projects secara
permanen atau melakukan toggle-off lalu restore untuk pengujian.

Sebelum menulis, catat revision, nilai awal dan expected final state. Mutasi harus
melalui shared CMS Auth/Origin/CSRF dan dashboard/API existing, bukan SQL bypass.
Jika konfigurasi berubah dari expected revision, stop untuk review konflik.

Setelah save sukses, cek public raw HTML/revision pada fresh request, Projects
absent dan Explore absent, serta new Astro navigation tanpa rebuild. Pastikan
save tidak memicu deploy hook/deployment baru. Ukur acknowledgment-to-next-read
secara faktual. Request yang sudah dimulai sebelum commit mungkin memakai
revision lama; tab yang sudah terbuka tidak otomatis berubah.

Jika scope mengharuskan restore, simpan hanya flag yang diuji dengan current
revision. Jangan memulihkan seluruh config snapshot yang bisa menimpa edit lain.
Jika retry tidak jelas, gunakan UUID/payload yang sama; jangan membuat mutation
kedua sebelum hasil diketahui. Log final config/revision dan audit receipt.

Gate: live accepted hanya setelah save/freshness/no-hook dan final state terbukti.
Tidak mengaktifkan About/HoF atau mengubah intake untuk menguji visibility.

## 10. Tahap R7 — gagal dan pemulihan

| Situasi                            | Langkah                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| R0/R1 belum siap                   | Tidak apply/push; release existing tetap menjadi target serving                 |
| SQL error                          | Verifikasi rollback; jangan melanjutkan push                                    |
| SQL acknowledgment hilang          | Inspeksi state/catalog sebelum retry; tidak drop/reseed                         |
| RPC belum dapat dibaca             | Periksa ACL/cache/backend; tahan push sampai gate hijau                         |
| Build gagal                        | Periksa actual Current/alias; jangan berasumsi deployment baru sedang melayani  |
| Deployment READY tetapi public 503 | Inspeksi backend/env/RPC serta affected routes; siapkan repair/rollback konkret |
| Flag salah setelah live toggle     | Restore hanya target approved, revision-guarded, setelah hasil save jelas       |

Sebelum R4, siapkan kandidat rollback: exact deployment Current+alias dari baseline
R0, bukan menebak dari remote Git HEAD. Rollback provider/code merupakan mutation
production; paket izin release harus menyebut apakah rollback ke kandidat ini
juga diizinkan. Jika belum, minta approval konkret sebelum mengeksekusi.

Pertahankan tabel/config/events/receipts visibility. Tidak DROP/down migration
otomatis. Runtime lama yang statis tidak membaca config baru: rollback bisa
memunculkan kembali halaman/section yang ingin disembunyikan. Cocokkan baseline
konten dengan preferensi terbaru sebelum menawarkan rollback; tidak menjanjikan
runtime lama menghormati flag baru. Untuk loader gagal, runtime baru sengaja 503,
bukan fallback yang membuka seluruh halaman.

## 11. Paket persetujuan dan bukti selesai

| Paket              | Yang disetujui nanti                                                                                                            | Bukan bagian paket                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A: SQL visibility  | Exact project/file/hash/defaults, apply transaction dan cache reload bersyarat jika disebut                                     | CMS content, akun/grant admin, allowlist, intake, push/deploy   |
| B: release         | Exact final SHA, satu origin/main push, connected production deploy, read-only acceptance; optional exact rollback jika disebut | Provider/env mutation yang belum dijabarkan, live toggle        |
| C: live acceptance | Exact target, expected revision, off/on dan final state, restore scope                                                          | Toggle halaman lain, About/HoF activation, intake/content write |

Jika ditemukan provider/config prerequisite, proposal perubahan spesifiknya
menjadi paket tambahan tersendiri. Tidak menganggap “lanjut” mengotorisasi semua
paket yang belum ditentukan. Planning ini tidak meminta approval execution dulu;
owner dapat meninjau rencana dan memilih urutan persetujuan sesudahnya.

Output tiap tahap: status proposed/applied/deployed/accepted, exact SHA/hash,
config revision/final flags, route/ACL results, actual deployment/alias, latency
samples dan outstanding items. Bukti privat tetap ignored; dokumentasi ringkas
lokal diperbarui tanpa commit/push tambahan otomatis.

## 12. Kontrak handoff dan hasil turn pertama AI baru

Read order wajib ada dalam [kickoff aktif](page-section-visibility-kickoff.md).
Baca seluruh file, termasuk bagian historis; gunakan checkpoint terbaru untuk
status/izin dan master untuk perilaku. Jangan menyamakan arsip prompt lokal
P0–P6 dengan izin menjalankan SQL production atau deployment.

Turn pertama AI baru menyelesaikan R0 yang tersedia, lalu menghasilkan:

1. Peta working tree: HEAD, branch, tracked/untracked planning, source diff,
   remote terbaru dan migration hash. Tidak menghilangkan pekerjaan existing.
2. Readiness matrix dengan kolom pemeriksaan, expected, observed, waktu/bukti,
   verified/pending/failed, dan tindakan berikutnya. Minimal Git, backend target,
   catalog/ACL/RPC, provider project/branch/Current/alias, env presence/scope,
   Node compatibility, API/media/routing, baseline flags dan QA provenance.
3. Keputusan R1 berdasarkan catalog; bukan asumsi dari HTTP 404 yang lama.
4. Paket A/B/C yang konkret. Field belum diketahui harus ditulis pending;
   jangan menyebut paket siap dieksekusi bila project/SHA/defaults belum pasti.
5. Cara owner memeriksa preview lokal dan penjelasan freshness yang akurat.
   Ringkas apa yang selesai lokal, belum deployed, dan belum accepted live.

Prompt handoff mengizinkan review/preflight dan dokumentasi; AI tidak perlu
menanyakan arahan umum sebelum melakukannya. Jika akses read-only tidak tersedia,
lanjutkan pemeriksaan independen lalu laporkan bagian pending. Jangan meminta
password, membangun akun baru atau mengubah permission untuk memperoleh akses.

Dokumen planning saat handoff masih dirty/untracked sesudah commit fitur.
Jika owner nanti mengizinkan commit dokumen, review seluruh diff dan catat SHA
baru sebelum meminta/menjalankan release exact SHA tersebut. Commit `51ce198`
berisi 88 file termasuk existing work; bukan patch satu toggle. Jangan amend
commit tersebut atau mengubah source hanya agar SHA/docs terlihat sinkron.

## 13. Perilaku existing yang harus dipertahankan

Source of truth IDs: `src/data/site-visibility-registry.mjs`. Count bukan asumsi
UI: 19 page preferences, 21 section preferences. Home page preference protected.

| Halaman / grup    | Jumlah halaman | Section flags                                                                    | Parent / komposisi                           |
| ----------------- | -------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| Home              | 1              | philosophy, what-we-do, domains, projects, recruitment-cta                       | Home selalu aktif; hero/navigation protected |
| About Us          | 1              | vision-mission, philosophy, ecosystem, team                                      | Default off; original content tetap ada      |
| Hall of Frames    | 1              | featured, projects, milestones                                                   | Default off; original content tetap ada      |
| Recruitment       | 1              | who-should-join, what-you-will-do, available-roles, timeline, faq, snippets, cta | Parent untuk enam Role dan Apply             |
| Partners          | 1              | partners, why-partners                                                           | Hero protected                               |
| Contact           | 1              | Tidak ada toggle internal v1                                                     | Komposisi protected                          |
| HoDS detail       | 6              | Tidak ada toggle internal v1                                                     | Parent Home                                  |
| Recruitment Role  | 6              | Tidak ada toggle internal v1                                                     | Parent Recruitment                           |
| Recruitment Apply | 1              | Tidak ada toggle internal v1                                                     | Parent Recruitment                           |

Enam detail ID pada dua grup: data, core, language, vision, product, growth.
HoDS URL `/hods/{id}/`; Role `/recruitment/roles/{id}/`; Apply
`/recruitment/apply/`. Enam halaman utama sesuai registry, bukan URL buatan baru.

- Preference halaman dan section tersimpan independen. Page/parent off membuat
  section/child efektif off tanpa mengubah pilihan tersimpannya.
- `home.domains=false` tidak mematikan HoDS URL. Recruitment Available Roles off
  tidak mematikan Role URL. Jika semua Role efektif off, Available Roles tidak
  dirender walaupun preferensinya true. Satu Role aktif menampilkan hanya Role itu.
- Known page efektif off memakai approved Page Under Development, status 200,
  `noindex, follow`; unknown detail tetap 404. Navbar tetap dapat mengarah ke
  halaman Under Development. CTA konten/chamber disaring menurut tujuan efektif.
- Section off tidak ada dalam SSR HTML; data CMS tidak dihapus/disembunyikan
  dengan CSS saja. Tombol anchor section off dihilangkan atau Back memakai
  fallback parent sesuai kontrak. Home Projects off juga menghilangkan Explore.
- Seed 19 halaman/21 section mempertahankan About/HoF off, Home/Projects on.
  Proposed first live mutation Projects off belum dijalankan dan bukan release
  prerequisite. Existing config tidak ditimpa seed.
- Satu request membaca satu validated config. HTML browser/CDN/Vercel CDN memakai
  no-store; public revision endpoint hanya mengungkap revision, bukan config.
  Timeout/load failure menghasilkan 503, tidak membuka konten melalui fallback.
- Setelah server mengonfirmasi save, request baru membaca revision baru tanpa
  rebuild. In-flight request sebelum commit bisa masih memakai revision lama.
  Tidak ada polling/update otomatis tab terbuka. Persisted pageshow memeriksa
  revision dan reload bila berubah; native bfcache eligibility bergantung browser.

UI refinement sudah implemented: picker grup/search, disclosure mobile, satu
page toggle di detail, switch jelas, saved/draft/effective state, impact summary,
dirty navigation guard dan toolbar simpan saat ada draft/busy. Conflict dibanding
per target; uncertain result di-retry dengan request UUID/payload identik.
Late read/write tidak boleh membuka kembali sesi setelah logout. Tidak redesign
lagi dalam pass planning; jika fix diizinkan, satu page/section per pass dan QA.

## 14. Source map untuk review AI baru

| File / area                                                               | Tanggung jawab dan hal yang diperiksa                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/data/site-visibility-registry.mjs`                                   | IDs, parent, protected pages, section/CTA effective state                       |
| `src/data/site-visibility-snapshot.json`                                  | Fixture seed visibility, bukan CMS content snapshot                             |
| `server/site-visibility-contract.mjs`                                     | Strict payload/config validation, duplicate keys, route targets, Home guard     |
| `server/site-visibility.mjs`                                              | Loader remote RPC no-store/deadline/body limit; local hanya explicit non-Vercel |
| `server/site-visibility-admin.mjs`                                        | Shared CMS Auth/Origin/CSRF, revision/UUID retry, backend write transport       |
| `server/site-visibility-api.mjs`                                          | Admin server entrypoint                                                         |
| `supabase/migrations/20261011160000_site_visibility.sql`                  | Additive schema, validator, atomic save, ACL, audit, replay, preserve seed      |
| `src/middleware.ts` dan 19 public routes                                  | Selective SSR, request config, headers, conditional HTML                        |
| `src/layouts/BaseLayout.astro`                                            | Canonical/robots/revision integration                                           |
| `src/pages/api/[...route].ts`                                             | Whitelisted bridge existing CMS/recruitment/private API                         |
| `src/pages/api/cms/content.ts` dan `server/cms-public.mjs`                | Preserve existing public content contract dan bundled fallback snapshot         |
| `src/pages/images/cms/[collection]/[hash].webp.ts`                        | Media bridge; existing immutable media contract preserved                       |
| `src/pages/api/site-visibility/revision.ts`                               | Public revision probe                                                           |
| `src/components/admin/AdminPagesPanel.astro`                              | New tab UI, style existing dan accessible controls                              |
| `src/scripts/site-visibility-editor.js`                                   | Draft/save/conflict/retry/search/generation/logout lifecycle                    |
| `src/scripts/admin-shell.js` dan existing admin panels                    | Fourth tab tiga entrypoints, prewarm/keepalive dan shared logout clearing       |
| `scripts/serve-site-visibility.mjs`                                       | Loopback harness actual generated Vercel function                               |
| `scripts/site-visibility-review-fixture.mjs`                              | Opt-in synthetic QA transport; bukan production Auth                            |
| `scripts/verify-site-visibility-*.mjs`, `tests/site-visibility*.test.mjs` | Bukti lokal per area; baca safety/config script sebelum rerun                   |
| `docs/on-development-plan.md`, `scripts/verify-on-development.mjs`        | Approved custom composition dan targeted QA                                     |

Konfirmasi path terhadap checkout aktual sebelum mengubahnya. SQL baru memeriksa
existing `private.cms_admin_permissions`, tidak membuat grant admin baru. Tiga
tabel baru direct-access denied; execute wrappers hanya service role. UUID replay
mendahului conflict check, payload berbeda pada UUID sama ditolak, expected
revision menjaga stale write, batch tervalidasi sebelum mutation. No-op tidak
mengubah revision/audit tetapi menulis receipt: tetap live write, bukan probe.
Receipt limit 10.000 sukses per actor tidak mempunyai auto-cleanup; jangan
menambahkan retention/job production dalam release ini tanpa scope baru.

## 15. Preview dan QA lokal yang dapat direproduksi

Preview terakhir `http://127.0.0.1:4348/admin/#pages` memakai explicit review
fixture. Server/process dan `/tmp` file tidak dijamin hidup di workspace baru.
Periksa port/proses milik sesi sendiri. Jangan memakai real credentials pada
synthetic login, mengikat fixture ke public network, atau membunuh proses asing.

Contoh reproduksi, terminal pertama; pilih port kosong milik task:

```sh
review_dir=$(mktemp -d /tmp/ds-visibility-review.XXXXXX)
cp src/data/site-visibility-snapshot.json "$review_dir/config.json"
export CMS_DATA_SOURCE=local
export SITE_VISIBILITY_SOURCE=local
export SITE_VISIBILITY_FILE="$review_dir/config.json"
npm run build
SITE_VISIBILITY_REVIEW_FIXTURE=1 PORT=4348 node scripts/serve-site-visibility.mjs
```

Catat path `review_dir` untuk terminal QA. Harness menjalankan function hasil
adapter `.vercel/output`; jangan menganggap `astro preview` ekuivalen deployment
SSR Vercel. Build baru memerlukan restart harness yang sesuai. Fixture hanya
aktif ketika review flag + local source + explicit file + non-Vercel terpenuhi.
Banner dan `X-Local-Review-Fixture` membedakannya dari shared Auth production.
Fixture file terisolasi; save menguji config lokal, tidak SQL/API production.

Untuk memeriksa sendiri: buka Pages & Sections; pilih tiap grup, lihat status
halaman/section/draft, ubah satu section lalu Simpan, buka fresh public route,
restore hanya flag lokal itu. About/HoF off tidak menghapus preferensi section;
aktifkan sementara di fixture untuk melihat section-nya. Home page toggle
protected. Sebelum selesai, kembalikan fixture ke default; jangan menyimpulkan
production telah berubah dari preview ini.

QA targeted bila diperlukan, terminal kedua dengan path fixture yang sama:

```sh
node --test tests/site-visibility*.test.mjs
PREVIEW_URL=http://127.0.0.1:4348 SITE_VISIBILITY_FILE=/tmp/REPLACE/config.json node scripts/verify-site-visibility-ui.mjs
PREVIEW_URL=http://127.0.0.1:4348 SITE_VISIBILITY_FILE=/tmp/REPLACE/config.json node scripts/verify-site-visibility-public.mjs
```

Ganti `/tmp/REPLACE/config.json` dengan path aktual. Baca script dulu: verifier
fixture bisa menulis file config dan append execution record. Jalankan verifier
yang memutasi fixture secara serial, catat revision/restore/final-state dan
review dirty docs sesudahnya. Ephemeral DB verifier bukan production command.
Tidak perlu mengulang seluruh suite untuk edit dokumentasi saja; rerun relevan
jika source, runtime atau kondisi bukti berubah.

Bukti terdahulu terdapat di ignored `artifacts/site-visibility/`, termasuk
`spike-proof.json`, `db-proof.json`, `admin-proof.json`, `race-proof.json`,
`public-proof.json`, `parity-proof.json`, `release-proof.json`,
`ui-refinement-proof.json` dan screenshots. Artefak ignored tidak ikut commit
atau dijamin tersedia pada AI/workspace baru; hasil rinci Git ada di local/UI
execution docs. Bedakan recorded, rerun, dan actual production acceptance.

QA tercatat: 10 visibility tests, 29 ephemeral DB checks, 19/19 default composition
parity, 28 public cases, 12 admin combinations, tiga races, refinement 19 page +
21 section passes + tujuh layouts, CMS 98 PASS/10 SKIP, Recruitment 42 PASS,
public responsive 468 combinations, Navbar 20 widths, On Development 14 layouts,
check/build/format/spacing/SEO PASS. Typecheck 0 errors/0 warnings dengan 36 hints
existing. CSS zoom 200% bukan klaim universal native browser zoom. Node adapter
warning/runtime compatibility tetap perlu verifikasi provider.

P1 cold/warm latency lokal pernah 28,34 / 6,08 / 5,09 ms: hanya sampel harness,
bukan benchmark/garansi production. Tidak menggunakan angka itu sebagai SLA.
CMS content snapshot tetap SHA256
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.

## 16. Batas selesai dan checklist handoff

Planning selesai ketika seluruh dokumentasi sinkron, source/preflight tersedia
direview, bukti pending ditandai dan paket izin konkret siap disusun berdasarkan
R0. Fitur LIVE selesai hanya ketika DB/API ready, exact approved SHA deployed ke
alias benar, read-only acceptance lulus, dan save/freshness live acceptance yang
diizinkan terpisah terbukti. Jika R6 belum diizinkan, tulis “deployed/read-only
accepted; live save acceptance pending”, bukan “semua selesai live”.

- [ ] AI baru membaca semua dokumen wajib dan memetakan Git/diff terbaru.
- [ ] R0 hasil actual verified/pending/failed, backend/provider target cocok.
- [ ] Paket SQL exact siap direview; tidak apply hanya karena HTTP 404 lama.
- [ ] Tidak ada produksi/commit/push dijalankan dari prompt planning ini.
- [ ] Gate DB sebelum main push, connected deploy dan rollback scope eksplisit.
- [ ] Projects tetap ON sampai exact owner mutation diizinkan.
- [ ] Secret/PII/private backup tetap ignored; data existing dipertahankan.
- [ ] Hasil lokal vs produksi, sejarah vs work order aktif dibedakan jelas.
