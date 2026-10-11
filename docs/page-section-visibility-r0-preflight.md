# Pages & Sections — R0 read-only dan paket review

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

11 Oktober 2026, pemeriksaan 10:34–10:38 UTC (17:34–17:38 WIB).
Scope owner: PLAN/PREFLIGHT ONLY. Kickoff aktif dan seluruh 12 dokumen wajib
dibaca; catatan historis tidak dipakai sebagai izin release baru. Acuan urutan
tetap [release R0–R7](page-section-visibility-production-release-plan.md).

## Kesimpulan dan keputusan R1

Release belum siap dipush. Catalog production membuktikan tiga tabel visibility
di `private` dan tiga fungsi visibility di `private/public` belum ada. Ini
melengkapi bukti loader HTTP 404/PGRST202, bukan menyimpulkan database kosong:
17 tabel private existing serta fungsi CMS/recruitment ditemukan.

R1 memilih **ajukan satu migration exact**, belum menjalankannya. Tidak ada
objek visibility partial yang ditemukan pada schema target. Tidak ada alasan
melakukan cache reload sekarang: fungsi memang belum ada. Reload boleh menjadi
scope bersyarat Paket A setelah apply dan pemeriksaan catalog/ACL berhasil,
jika loader masih PGRST202. Tidak reseed ulang atau mengubah exposed schemas.

P0–P6/refinement tetap selesai lokal. Fitur baru belum live; production masih
menampilkan komposisi About/HoF lama, bukan chamber default implementasi lokal.
Default yang direncanakan adalah Home/Projects ON, About/HoF Under Development,
21 section preferences ON. Kontrol tetap 19 halaman dan 21 section.

## Git dan scope yang dipertahankan

| Pemeriksaan                               | Hasil aktual                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| HEAD/main lokal                           | `51ce1984112283ad533e018dbebcb6b3730a138a`                                                                                                       |
| Remote main, dua pembacaan jaringan       | `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`                                                                                                       |
| Origin fetch/push                         | `https://github.com/Web-Data-Sorcerers/community-web.git`; satu push URL                                                                         |
| Remote production                         | Alias ke repository sama; bukan target push kedua                                                                                                |
| Divergence                                | Satu commit lokal belum dipush                                                                                                                   |
| Scope commit                              | 88 files, 6983 insertions/257 deletions; visibility/UI, preserved On Development assets, official contact/social, Navbar, Team verifier dan docs |
| Source dirty                              | Tidak ada perubahan tracked kode/config/migration/snapshot                                                                                       |
| Dirty awal                                | 13 dokumen modified dan dua dokumen untracked; seluruh diff relevan ditinjau dan dipertahankan                                                   |
| Migration SHA256                          | `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`                                                                               |
| CMS snapshot SHA256 sebelum/sesudah build | `4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`                                                                               |

13 modified awal: AGENTS, HANDOVER, ai-handoff, assets, on-development-plan,
page-fullscreen-migration-plan, kickoff, local, master plan, release-checkpoint,
UI refinement local/plan dan pixel-precision-sop. Dua untracked awal adalah
local-kickoff-archive dan production-release-plan. Pass ini menambahkan dokumen
R0 ini dan referensinya pada handoff/plan aktif; tidak otomatis commit dokumen.
Tidak reset, stash, amend, force-push, commit atau push.

## Readiness matrix

`verified` berarti diperiksa pada pass ini dalam batas yang disebut;
`pending` belum dapat dibuktikan atau belum diizinkan;
`failed` prerequisite/target behavior belum terpenuhi. Verified baseline lama
tidak sama dengan acceptance fitur production baru.

| Area                                                | Status                      | Bukti dan batas                                                                                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git, remote, hash migration                         | verified                    | HEAD/ls-remote/hash di atas; diff existing disimpan sebelum tambahan docs                                                                                                                                                                         |
| Backend SQL target                                  | verified                    | Management API project `yejrdckcmlxrkklgtrwy`, read-only transactions HTTP 201; local SUPABASE_URL hostname cocok dengan write project constant                                                                                                   |
| Visibility catalog                                  | failed                      | Nol fungsi `site_visibility_%` pada public/private; nol dari tiga tabel target pada private                                                                                                                                                       |
| Visibility ACL/state/revision                       | pending                     | Objek belum ada, sehingga tidak ada ACL/state production untuk divalidasi; bukan klaim ACL PASS                                                                                                                                                   |
| Loader service-role                                 | failed                      | `2026-10-11T10:34:43.189Z`, HTTP 404/PGRST202 melalui URL/key existing; tidak memanggil save/no-op                                                                                                                                                |
| Exposure/schema cache                               | verified/pending            | GET PostgREST config HTTP 200: `public,graphql_public`, extra search path `public, extensions`; public exposed. Cache visibility belum dapat dibuktikan setelah objek dibuat                                                                      |
| Existing DB metadata                                | verified                    | Owner/ACL/RLS 17 tabel private; function signature/owner/SECURITY DEFINER/search_path/ACL/definition fingerprints; column/constraint/policy fingerprints termasuk auth.users definition                                                           |
| Preserved content/access baseline                   | verified                    | Enam CMS collection counts/content hashes; cms_admin_users dan permissions masing-masing satu row, hash saja; tidak mengekspor account/PII/applicant data. Ini metadata/fingerprint, bukan full backup/PITR                                       |
| Vercel project/Git branch                           | verified                    | `prj_3KbX29t6DYN1RMTy88lKHXd0IUVE`, data-sorcerers-community, community-web/main                                                                                                                                                                  |
| Current dan primary alias                           | verified                    | `dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o`, READY/PROMOTED, SHA remote `144e681…`; independent alias GET menunjuk deployment yang sama                                                                                                                    |
| Production env registration                         | verified                    | Production keys SUPABASE_URL/SERVICE_ROLE_KEY/ACCESS_TOKEN/ANON_KEY dan shared Auth registered; CMS_DATA_SOURCE=supabase; visibility source/file/review flag tidak registered sehingga source default remote                                      |
| Production secret value/backend match               | pending                     | Sensitive values tidak dikembalikan API list. Registration tidak membuktikan value benar atau SUPABASE_URL provider sama dengan write constant; tidak mengganti env atau meminta password                                                         |
| Shared CMS Auth positive acceptance                 | pending                     | Anonymous Projects/Team/Recruitment applications/stats ditolak 401; authenticated owner GET belum dilakukan. Reuse existing Auth/Origin/CSRF tetap sumber kode                                                                                    |
| Runtime provider/artifact                           | verified/pending            | Provider Node 24.x; regenerated adapter runtime nodejs24.x streaming. Package engines 22.x existing; Astro installed >=22.12.0; local Node 26.10 fallback24 warning. Build/function acceptance exact release di provider belum ada                |
| Generated routing lokal                             | verified                    | 19 public SSR registry; tiga admin static entry + dua lab; catch-all bridges Auth/CMS/recruitment/media, content/revision route dan image path; tidak ada static public HTML yang menutup SSR                                                     |
| Effective function timeout/routing provider release | pending                     | Current standalone admin/recruitment 90s, media/content30s. `_render` artifact tidak mengatur maxDuration; pattern api/*.js tidak membuktikan duration SSR bridge. Perlu inspeksi artifact provider exact release; tidak mengubah config otomatis |
| Existing production route baseline                  | verified                    | 19/19 HTTP200, canonical expected dan robots index/follow; unknown HoDS/role404; robots/sitemap200. Tiga admin200 noindex/nofollow, belum ada Pages & Sections                                                                                    |
| Production visibility behavior                      | failed                      | Belum ada X-Visibility-Revision/no-store SSR; revision/admin visibility endpoints404; About/HoF lama bukan chamber. Sesuai deployment lama, bukan regression local baru                                                                           |
| Content/media/intake baseline                       | verified                    | Content API200, media WebP200/46454 bytes; intake GET200 accepting=true; tidak submit/upload/toggle intake                                                                                                                                        |
| Existing header anomalies                           | pending                     | Admin HTML actual cache public/max-age0 tanpa X-Robots-Tag meski vercel.json mengatur no-store; rewrite media max-age0, direct media immutable365 hari. Catat untuk R5/new routing; bukan izin fix/provider mutation                              |
| Production browser baseline                         | verified                    | 44 screenshots: 19 public +3 admin ×390/1440; zero navigation failure/pageerror. Baseline, bukan full UX/keyboard atau R5 acceptance                                                                                                              |
| Rerun lokal pass ini                                | verified                    | Build/check 0 errors,0 warnings,36 hints; 10 visibility tests PASS; 19 local SSR200 consistent seed revision+3 no-store headers; Projects present, About/HoF chamber; admin390/1440 banner fixture/tab visible, pageErrors[]                      |
| QA P0–P6/refinement lain                            | verified (historical local) | Records linked below; 29 ephemeral SQL checks, public/admin/races/responsive etc tidak diklaim rerun atau production PASS                                                                                                                         |
| R2–R7 production acceptance                         | pending                     | SQL/cache reload/provider/release/toggle/restore belum dilakukan dan membutuhkan approval terpisah                                                                                                                                                |

SQL catalog memakai `BEGIN TRANSACTION READ ONLY` dan SELECT metadata/fingerprint,
lalu COMMIT; tidak menjalankan function write atau private intake/audit RPC.
Percobaan endpoint config `/config/postgrest` sebelumnya404 adalah URL diagnosis
yang salah; corrected GET `/postgrest`200 membuktikan exposure di atas. Endpoint
read-only ini sesuai [Management API resmi Supabase](https://supabase.com/docs/reference/api/v1-get-postgrest-service-config).
Demikian
pula `/api/admin/recruitment/list` bukan path aplikasi; path benar
`/api/admin/recruitment/applications` diperiksa anonymous tanpa membaca pendaftar.

## Paket A — SQL production, terpisah dari release

Approval yang konkret untuk ditinjau:

> Izinkan apply hanya `supabase/migrations/20261011160000_site_visibility.sql`
> pada project `yejrdckcmlxrkklgtrwy`, SHA256
> `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`,
> setelah catalog/hash diperiksa ulang. Scope tiga tabel, validator dan dua RPC
> visibility, RLS/ACL baru, singleton seed. Jika catalog/ACL setelah apply benar
> namun loader masih PGRST202, izinkan tepat `NOTIFY pgrst, 'reload schema';`.
> Lanjutkan verifikasi R2 read-only; berhenti jika hasil unknown atau mismatch.

Expected final state A: schemaVersion1, satu singleton, seed revision
`00000000-0000-4000-8000-000000000001`, 19 page prefs (Home+16 lainnya ON,
About/HoF OFF), semua21 section prefs ON; service-role loader200 contract valid,
privileged RPC anon/authenticated denied, direct table access denied termasuk
service_role. Seed hanya bila state belum ada; jika ada objek baru sejak R0,
stop dan klasifikasikan ulang R1, jangan timpa preferensi.

Fingerprints existing CMS/intake/access dibandingkan sebelum/sesudah; tidak
mengubah enam collection, RECRUITMENT_OPEN, akun, existing grants, allowlist,
content/storage. API save/no-op bukan readiness probe. Situs tetap Current lama.
Jika transaksi error rollback otomatis; jika transport terputus inspeksi catalog
sebelum retry. Setelah commit tidak DROP objek/data sebagai rollback default.

## Paket B — release/deployment dan kandidat rollback

Paket ini **belum executable**: Paket A/R2 loader masih failed dan nilai backend
provider/effective runtime routing belum lengkap. Kandidat exact SHA adalah
`51ce1984112283ad533e018dbebcb6b3730a138a`, termasuk seluruh scope 88 files.
Dokumen dirty tidak ikut kandidat SHA tersebut. Jika owner ingin docs masuk,
perlu commit docs yang explicitly approved, lalu freeze exact SHA baru.

> Setelah R2/R3 PASS, instruksi baru “commit dan push” harus menyebut kandidat
> SHA final dan scope release ke origin/main community-web; satu push tanpa
> force dan observasi connected production deployment project di atas.
> Verifikasi exact SHA READY, Current/primary alias dan R5 read-only acceptance.
> Tidak memanggil deploy hook atau melakukan provider/env mutation tambahan.

Expected final state B: deployment Current pada exact approved release SHA;
19 route mendapat validated revision terbaru per fresh request, tiga no-store
headers; Home/Projects ON, About/HoF200 chamber/noindex follow, unknowndetail404;
tiga admin tab baru/noindex/no-store, anonymous visibility401; authenticated
owner GET via login existing; CMS/media/intake tetap bekerja. Save belum diuji
live dalam paket ini. Fresh visit setelah confirmed save membaca revision baru
tanpa rebuild; tab terbuka tidak otomatis berubah dan tidak ada janji 0ms.

Candidate rollback yang **dibaca dari Current+alias**, bukan tebakan remoteHEAD:
`dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o`, SHA
`144e6812cda44c5f59b3152bffe6f0d027bc2e6b`, URL
`https://data-sorcerers-community-6gxelgvdz-faizs-projects-6e23e5b2.vercel.app`,
primary alias `https://data-sorcerers-community-sigma.vercel.app`.
Verifikasi ulang candidate masih available/healthy sebelum R4. Owner perlu
mengizinkan rollback provider ke deployment exact tersebut secara eksplisit
(dapat menjadi klausul B atau approval terpisah); tidak otomatis redeploy/hook.
Additive DB tetap dipertahankan. Expected rollback mengembalikan versi static
lama, termasuk About/HoF content lama dan absennya visibility tab; flags DB tidak
mengendalikan HTML static lama. Candidate bukan cara menjaga feature baru live.

Tidak ada perubahan provider yang diajukan sekarang. Jika gate env/duration
memerlukan perubahan, sajikan key/scope/value nonsecret atau target setting
exact, alasan dan verification terlebih dahulu untuk approval terpisah.
Current metadata mencatat 11 Node functions, sedangkan artifact lokal baru
memuat satu `_render.func`. Jumlah/effective mapping provider baru, termasuk
standalone API versus bridges dan limit plan Hobby, tetap harus diperiksa pada
manifest build release; tidak menjumlahkan keduanya sebagai failure yang belum
terbukti atau menganggap harness membuktikan fungsi provider.

## Paket C — live toggle, terpisah dari A/B

Target exact tetap section `home.projects`, payload change
`{"pageId":"home","sectionId":"projects","enabled":false}`. Revision
production belum tersedia: **pending, tidak mengarang UUID siap eksekusi**.
Seed revision di A hanya expected. Setelah R5 dan owner authenticated GET,
catat UUID actual serta nilai awal true; revalidate segera sebelum save. Stop
jika revision/nilai berubah; approval berdasarkan stale revision tidak dipakai.

Owner dapat mengizinkan salah satu scope final berikut:

| Paket  | Mutasi approved                                                                     | Expected final state                                                                                          |
| ------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| C-off  | Hanya home.projects=false dengan exact observed expectedRevision dan satu requestId | Home aktif; section Projects/Explore absent fresh SSR; flag false; halaman/section lainnya serta intake tetap |
| C-test | home.projects=false lalu restore hanya home.projects=true memakai current revision  | Home/Projects ON kembali; About/HoF OFF; seluruh preferensi lain tidak ditimpa                                |

Tulis melalui shared CMS Auth/Origin/CSRF existing; tidak SQL bypass. Catat
receipt/revision acknowledgment, verifikasi fresh raw HTML dan Astro navigation,
serta deployment tetap sama (no hook/rebuild). Unknown outcome retry exact
UUID/payload, bukan request kedua. Restore bukan izin implisit C-off; C-test
harus menyebut restore. Hasil save-to-public acceptance baru dinyatakan setelah
mutasi yang disetujui selesai dan final revision/state tercatat.

## Preview owner dan bukti lokal

Preview saat pass ini tersedia di
`http://127.0.0.1:4348/admin/#pages` pada loopback PID2751818, generated function
harness session80394; fixture `/tmp/ds-visibility-review-r0-twh5hP/config.json`.
Buka Home/About/HoF dari server sama. Ada banner **Preview lokal**; synthetic
session hanya review transport, bukan CMS Auth production. Tab admin lainnya
tidak memuat data asli. Simpan preview hanya mengubah file /tmp, tidak backend.
Pass ini tidak melakukan local toggle, sehingga fixture masih seed/ProjectsON.

Jika proses/artifact tidak tersedia, dari root repo gunakan terminal lokal
tanpa production env, setelah memastikan port4348 kosong:

```sh
CMS_DATA_SOURCE=local SITE_VISIBILITY_SOURCE=local npm run build
review_dir=$(mktemp -d /tmp/ds-visibility-review-XXXXXX)
cp src/data/site-visibility-snapshot.json "$review_dir/config.json"
CMS_DATA_SOURCE=local SITE_VISIBILITY_SOURCE=local \
  SITE_VISIBILITY_FILE="$review_dir/config.json" \
  SITE_VISIBILITY_REVIEW_FIXTURE=1 PORT=4348 \
  node scripts/serve-site-visibility.mjs
```

Jangan memakai astro preview untuk acceptance SSR generated Vercel routing.
Restart hanya harness yang dimiliki bila rebuild, jangan hentikan proses lain
4321/4322. Setelah eksperimen preview owner, restore file fixture dari snapshot
seed atau mulai fixture /tmp baru. Tidak memulihkan backend production.

Bukti pass ini berada pada ignored
`artifacts/site-visibility/r0-20261011-1034/`: before.diff, sanitized provider/
deployment/alias/env-presence, catalog/functions/definitions/schema-acl,
collection/access fingerprints, exposure/loader, public baseline+HTML/robots/
sitemap, 44 screenshot/browser metrics, additional endpoint checks, build log,
10-test log dan local-preview/admin screenshots. Tidak masuk Git.
Rerun local build/check bukan production Supabase-source build. Full legacy
CMS/recruitment/responsive/spacing/SEO suite tidak diulang untuk pass docs ini;
hasil sebelumnya tetap pada [local record](page-section-visibility-local.md)
dan [refinement record](page-section-visibility-ui-refinement-local.md).

Urutan berikutnya tetap R1 approval A → R2 DB/API → R3 freeze/env/runtime →
approval B/R4 deployment → R5 live reads → approval C/R6 toggle → R7 evidence
atau rollback yang diizinkan. R0 menghasilkan paket review; pending di matrix
tidak diam-diam dianggap PASS. Database/API siap sebelum push main.
