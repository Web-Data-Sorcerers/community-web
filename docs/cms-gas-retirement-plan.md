# CMS Supabase-only build dan pensiun GAS — Master Work Plan

## GAS retirement F1 — audit dan backup parsial (8 Oct 2026)

Faiz mengaktifkan next retirement (`gassssss broooo`). Read-only actual inventory
selesai: Production READY eaa61c4/primaryalias exact; testing404;7READY retained,
15env records dan6legacy candidate env (exact IDs/scopes di inventory plan).
Keenam key tidak dibaca active server/build;3unreachable gas calls masih retained.
Focused no-server-env tests30PASS/0FAIL/0SKIP. Recruitment tetap OPEN; CMS/pendaftar
anonymous401; tidak kembali ke kontrak isolated/closed historis.

Backup encrypted di luar repo:20tracked source files83817bytes, current6RPC,
fresh GAS export21085bytes, testing-hook exact dan local GAS config candidates.
AES256GCM round-trip + source20byte-exact + ciphertext tamper denial PASS;
folder700/files600/key600 terpisah. Local disk saja; bukan full DB/offsite backup.
Full Sheet/Drive/deployed source/Properties/shared ownership belum verified;
3Google secret values tidak tersedia, local export config belum matched Production.
Owner memilih login Google browser pengujian; tab5sign-in siap, **belum logged-in**
latest check. Google Drive plugin ditemukan namun belum connected; pilihan browser
owner berlaku. Jangan meminta password/token di chat atau memperkirakan resourceID.

Tidak ada env mutation/redeploy/hook/fixture/SQL/grant/provider/content write,
resource deletion/code cleanup atau push. Observasi/publication cycle belum
selected/accepted. NEXT login owner Google → exact resources/ownership dan full
secure backup → pilihan observasi → approval exact env/resource+rebuild. Jangan
menggunakan izin push lama atau general gas untuk delete target belum ditinjau.
Master concrete result: [GAS F1 inventory](cms-gas-retirement-inventory.md).
Checkpoint lokal saja. Proof ignored artifacts/cms-gas-retirement/f1/{inventory,
backup-proof,restore-proof,env-backup-verification,usage-audit,no-gas-tests}.json.

## Supabase-only build deployed72c36bd — owner acceptance pending (8 Oct 2026)

Faiz (`gasss`) approved exact72c36bd18f98705706b2fa4b50c183679a4674c1;
tepat satu push origin main ke community-web selesai, izin consumed. Production
READY exactSHA+primaryalias dpl_2mHnXoNYJo7WpGLUxbnL1sEnFQCn; provider READY
8Oct2026 **01:51:02.209UTC /08:51:02.209WIB**. Origin/main dan production/main
fresh72c36bd; checkpoint sesudah push ini lokal saja, SHA cekgitlog.

FlagProduction supabase verified; actual build log prebuild+remote snapshot+
23pages PASS. Public19/19HTML exact; browser38pages/42tab checks/24entry-back
cases390/1440 PASS,0pageerrors. Anonymous CMS401, recruitment closed;
Projects4/Team25/grant1active/allowlist1/apps0/media0 dan fingerprints unchanged.
Testing404; kini4READY: Current72 +retaineda042/645/7e17. GAS/env/code retained.

**Owner session/read/refresh/logout + actual recruitment isolation pending**:
credential tidak tersedia di sesi baru; tab/admin/ siap untuk owner login manual.
Tidak mengklaim full cutover accepted atau positive cold-media live baru.
Auth/server/SQL/schema/dependencies unchanged; tidak ulang migration/expiry/revoke.
NEXT owner read-only acceptance§11; fixture/3hooks/cleanup atau resource retirement
butuh izin baru. Proof/checkpoint: [GAS plan](cms-gas-retirement-plan.md) §19.

## Production source flag approved — push pending (8 Oct 2026)

Faiz (`gasss`) mengizinkan tepat add `CMS_DATA_SOURCE=supabase` type plain,
target **Production only**, projectprj_3KbX29t6DYN1RMTy88lKHXd0IUVE.
API add + read-back PASS; envIDF4kxmkHW29dFwUX6, existing env IDs/names/scopes/types
unchanged. GAS/Google/Supabase/hook env tetap retained. Tidak redeploy/hook/push.
Current tetap a042b07/dpl_EGG8a3RDz3mxB2BFsgL8hdNMTr2f READY; recruitment closed,
Projects/Team/media anonymous401 fresh. Feature lokal4d5f8d5 sudah QA117CMSPASS+
10Team liveSKIP, recruitment24PASS dan gates/parity/secrets PASS.

NEXT: **izin exact HEAD SHA baru** (termasuk checkpoint config ini) → satu push
origin main/community-web → READY+primary alias exact SHA → read-only acceptance.
Izin flag consumed; bukan izin push, fixture/hook atau retirement resource.
Detail terbaru: [GAS retirement plan](cms-gas-retirement-plan.md) §18; proof ignored config-source-set.json.

## 0. Status, tujuan, dan batas izin

Disusun 8 Oct 2026 atas permintaan Faiz: **PLAN ONLY sesi ini**, eksekusi oleh
AI berikutnya. Tidak ada perubahan runtime, dependency, SQL, provider, env,
password, hook, push atau penghapusan GAS dalam sesi penyusunan. Commit docs
lokal boleh; push SHA baru selalu butuh izin exact SHA. User menunda penggantian
password; jangan menjadikannya prasyarat planning atau meminta password di chat.
Credential tidak dicatat ke dokumen, artifacts, log, source atau commit.

Tujuan tahap pertama: build production dan admin CMS berjalan tanpa panggilan
GAS/Sheets/Drive/Google OAuth, dengan data serta UI existing tetap utuh. Tahap
kedua: arsipkan lalu pensiunkan resource dan kode legacy setelah acceptance dan
observasi disetujui. **Cutover build tidak sama dengan izin menghapus resource.**

Plan ini mengalahkan work order auth lama, prompt dua domain, dan larangan
historis mengubah dependency GAS **hanya setelah user mengaktifkan eksekusi
cutover ini**. Saat ini GAS tetap dipertahankan. Auth A–E sudah diterima;
jangan memulai ulang migrasi atau acceptance auth dari nol.

## 1. Baseline actual untuk AI berikutnya

| Item                    | Checkpoint terakhir; wajib dicek ulang sebelum tindakan                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| Workspace               | `/home/faiz/ds/ds5opencode`, main; tanpa reset/stash perubahan asing                                            |
| HEAD sebelum planning   | `e9079e354889d5f807c71628d3c81fde5b44b96a` docs lokal; planning berikutnya cek log                              |
| Runtime production      | `a042b071e438a5fec59a644c938144158a007602`                                                                      |
| Refs remote terakhir    | origin/main dan production/main a042b07; docs lokal belum push                                                  |
| Origin                  | fetch + **tepat satu** push URL `https://github.com/Web-Data-Sorcerers/community-web.git`                       |
| Vercel                  | `data-sorcerers-community`, `prj_3KbX29t6DYN1RMTy88lKHXd0IUVE`                                                  |
| Primary domain          | `https://data-sorcerers-community-sigma.vercel.app`                                                             |
| Current deployment      | `dpl_EGG8a3RDz3mxB2BFsgL8hdNMTr2f`, READY exact a042b07 + alias                                                 |
| Rollback deployments    | `dpl_Ar1BpZdR6U3pQjJgExtoWD6NfQdQ` (645ec06), `dpl_5dAJ9HewxnwZKD3yroqCajnAuFiA` (7e17fc0)                      |
| Testing                 | project `web-testing` / `prj_E5226JcOUGOMQtWT3rDTojwbZ2sB` sudah absent404; jangan recreate atau deploy testing |
| Supabase                | existing `web-community`, ref `yejrdckcmlxrkklgtrwy`; bukan project baru                                        |
| Node                    | 22.x; last verified22.23.0 di `/tmp/ds-cms-node22/node_modules/node-linux-x64/bin/node`; cek keberadaan         |
| Snapshot repo           | SHA256 `4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`                                       |
| Auth                    | password Supabase, SDK server-only, CMS permission terpisah; accepted645ec06                                    |
| Database/media terakhir | Projects4, Team25, CMS grant1active, recruitment allowlist1, applications0, cms-media objects0                  |
| Recruitment             | runtime `accepting:false`; cookie/allowlist/PII terpisah                                                        |

Delapan deployment lama sudah dihapus dengan izin `okk`, bukan pekerjaan yang
harus diulang. Storage dashboard setelah cleanup belum diverifikasi; jangan
mengklaim GB freed. Waktu READY memakai provider, checkedAt memakai workspace;
jam berbeda, jangan dicampur untuk urutan event.

Fingerprint terakhir (fresh audit wajib, bukan target reseed): Projects
`8a7d4624d896842800dfd191892df7a8`, Team `b867f2890c939b410e3e428259082883`,
recruitment allowlist `2a36dbfe696b9406baabd0cd4de9fb6f`.
Jika konten owner berubah, pakai fresh captured inputs yang sama pre/post;
jangan overwrite DB atau snapshot repo untuk memaksa fingerprint lama.

## 2. Urutan baca dan prioritas

1. `docs/cms-migration-kickoff.md` **seluruhnya**, termasuk §6 prompt aktif.
2. `AGENTS.md`, lalu checkpoint aktif `docs/ai-handoff.md`.
3. Dokumen ini seluruhnya, termasuk gate izin, rollback, checklist dan prompt.
4. `docs/cms-migration-todo.md`, `docs/cms-supabase-migration-plan.md` §5–§9.
5. `docs/cms-auth-supabase-plan.md` §11 + checkpoint acceptance terakhir,
   `docs/cms-auth-design.md`, `docs/cms-auth-execution-plan.md` acceptance akhir.
6. `docs/cms-sop.md`, actual client/server/routes/schema/tests/package/vercel.
7. Sebelum UI: pixel SOP, asset provenance dan fullscreen plan existing.
   Pass ini tidak membutuhkan perubahan visual atau editor.

Checkpoint terbaru dan actual code menang atas arsip “PLAN ONLY auth”, OAuth,
925d577/dua push URLs/dua domain. **PLAN ONLY yang aktif adalah GAS retirement
ini**, bukan membatalkan auth yang sudah LIVE accepted.

## 3. Inventory kode actual dan masalah yang harus diselesaikan

| Area                                     | Fakta kode saat audit planning                                                                                         | Pekerjaan tahap cutover                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `scripts/cms-client.mjs:syncCmsSnapshot` | Env CMS_API_URL/TOKEN memilih remote; fetch dan validate full GAS dahulu                                               | Pilih sumber tanpa GAS; bangun envelope langsung dari enam RPC                                   |
| Enam RPC                                 | Semua collection sudah override Supabase                                                                               | Pertahankan mapping, schema/order/nested slots dan public anon read                              |
| `cacheProjectMedia`                      | Setelah cache miss, wajib env GAS **sebelum** branch Storage; seluruh MEDIA_PATH saat ini Projects/Team                | Lepas gate env GAS; private Storage service key untuk cache miss                                 |
| GAS media fallback                       | Cabang akhir memakai action=media GAS                                                                                  | Buktikan unreachable untuk contract aktif; jangan fallback otomatis                              |
| `scripts/fetch-cms.mjs`                  | Prebuild/cms:validate memanggil sync; DNS ipv4first berkomentar Google                                                 | Perbarui komentar/failure logging yang relevan, jangan ubah jaringan tanpa alasan                |
| `server/cms-admin.mjs`                   | `gas()`, SCOPES, RPC/TEAM_RPC legacy masih ada; route/collection membatasi Projects/Team sehingga fallback unreachable | Audit call graph; jangan hapus di commit cutover jika tidak perlu; tandai untuk cleanup terpisah |
| Auth routes                              | Password login/refresh/logout aktif; callback retired internal303                                                      | Tetap; bukan izin OAuth baru atau hapus callback route                                           |
| `cms/gas/**`                             | Export/media/admin source dan HtmlService legacy                                                                       | Simpan untuk rollback/arsip dahulu; remove code tahap terpisah                                   |
| Generators + package scripts             | cms:gas/cms:admin/recruitment:gas legacy tersedia                                                                      | Tidak dijalankan; cleanup setelah backup/approval                                                |
| Tests                                    | Hybrid tests mengharuskan GAS valid termasuk kasus gas-invalid                                                         | Ubah test **sync** sesuai sumber baru; test standalone legacy export tetap sampai cleanup        |
| Mock browser                             | Native Projects, native Team dan legacy GAS mock4widths                                                                | Ketiganya tetap dijalankan selama legacy masih di repo; bukan real auth proof                    |
| Env                                      | CMS_API_* dan CMS_ADMIN_GOOGLE_* legacy masih retained                                                                 | Jangan delete saat cutover; audit nama/scope, nilai jangan print                                 |
| Publication                              | Projects/Team hanya hook production                                                                                    | Pertahankan satu target; tidak boleh hidupkan hook testing                                       |

Audit menyeluruh memakai `rg` pada tracked files, bukan membaca/menampilkan
`.env.local`. Periksa juga imports/callers di scripts/tests, docs setup, manifests
GAS, `.gitignore`, generated outputs dan asset/media references. Inventori nama
resource/env dan usage, bukan menyalin credential atau URL export yang bertoken.

## 4. Desain target build — keputusan konkret

### 4.1 Mode source

Usulan default untuk implementasi: env server/build **`CMS_DATA_SOURCE`** dengan
nilai `supabase` atau `local`. Tidak menambah mode GAS pada active build.

- `supabase`: wajib SUPABASE_URL + SUPABASE_ANON_KEY. Semua enam RPC wajib sukses;
  env GAS hadir, hilang, invalid atau parsial tidak mempengaruhi build.
- `local`: snapshot repo valid, tanpa network content fetch; untuk QA/offline.
  Cache miss/corrupt CMS media gagal bila tidak tersedia local verified bytes;
  jangan diam-diam mengakses Storage atau GAS dalam mode offline.
- Flag absent: bila pasangan Supabase lengkap → supabase; bila pasangan parsial
  → configuration error; bila tanpa Supabase dan bukan deploy Vercel → local.
- Deploy Vercel production/preview: require explicit `CMS_DATA_SOURCE=supabase`
  dan key lengkap; `local`, invalid flag atau config hilang → build gagal.
  Jangan hanya memakai NODE_ENV=production untuk mendeteksi deploy karena build
  QA lokal Astro juga dapat memakai NODE_ENV production.
- Local explicit `local` boleh saat process QA berisi key incidental, tetapi
  deployment guard tetap menolaknya. Tests wajib membedakan konteks ini.
- Retain return labels `local`/`remote` jika callers/tests mengandalkannya;
  jelaskan remote kini Supabase-only. Jangan ubah consumer tanpa audit.

Flag ini desain lokal, **belum env yang sudah terpasang**. Set flag production
memerlukan izin konkret sebelum live change (§9). Flag dapat dipasang sebelum
push karena versi a042b07 mengabaikannya; env GAS tetap mendukung rollback lama.
Scope Preview/local dinilai saat audit, tidak otomatis ubah semua scopes/project.

### 4.2 Envelope dan RPC

Bangun object baru dengan **hanya tujuh top-level keys**:

```js
{
  schemaVersion: 1,
  projects: projectsRpc.projects,
  team: rebuildTeamSnapshot(teamRpc),
  roles: rolesRpc.roles,
  domains: domainsRpc.domains,
  hods: hodsRpc.hods,
  partners: partnersRpc.partners,
}
```

Urutan request dapat mempertahankan existing Projects → Team → Roles → Domains
→ Hods → Partners; tidak perlu concurrency baru. Tidak spread seluruh RPC
response ke snapshot: revision/affectedId/min-max/group metadata admin bukan
schema snapshot. Metadata SQL existing yang valid tidak boleh menyebabkan
false rejection; nested content keys tetap strict melalui Zod.

| RPC               | Contract snapshot                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------- |
| cms_load_projects | projects array,1–8, IDs unik,2tags, local image path                                     |
| cms_load_team     | groups/members → leaderTeam + six hodsTeams; order/group mapping existing                |
| cms_load_roles    | six ordered IDs data/core/language/vision/product/growth; chips/requirements slots fixed |
| cms_load_domains  | six ordered IDs; nested3label rows + blank decorative slots fixed                        |
| cms_load_hods     | six ordered IDs,21tabs/55sections/8bullet items baseline; union strict                   |
| cms_load_partners | 3categories/local logo/4why pairs; bukan logo registry UI lokal                          |

Validasi final `cmsSnapshotSchema` **sebelum** media/network write snapshot.
Tidak mengendurkan Zod atau melakukan stringify/trim/sort baru yang mengubah
copy/order; Team conversion mempertahankan order existing. Test duplicate,
unknown/missing groups atau members orphan sesuai kontrak supaya data tidak
hilang diam-diam selama conversion. Jika memerlukan aturan baru yang menolak
live data previously valid, stop dan tunjukkan contoh sanitized dahulu.

Pertahankan timeout dan bounded response protections. Enforce JSON/byte budget
RPC dan aggregate envelope; batas existing CMS_MAX_BYTES1MiB menjadi starting
limit, ukur baseline sebelum menetapkan batas. Jangan menerima payload unbounded
atau mencetak raw upstream body/error/token/URL credential. Semua enam RPC
errors (HTTP/timeout/JSON/schema) gagal dengan pesan tetap yang menyebut nama RPC,
tanpa secret. Jangan fallback ke GAS, snapshot repo, cache content atau default
collection bila RPC gagal. Local mode explicit berbeda dari fallback.

### 4.3 Atomicity

Simpan seluruh content di memory, validasi, verifikasi media, lalu temp file
exclusive + rename snapshot sebagaimana existing. Bila salah satu RPC/media
fail: snapshot original byte-identik, temp snapshot bersih, exit nonzero.
Cache media valid yang sudah ditulis sebelum kegagalan lain boleh tetap ada
sebagai cache addressed-by-hash; itu bukan publikasi content. Tidak mengklaim
transaksi atomik DB enam read atau seluruh filesystem. Catat freeze owner untuk
capture parity bila read collections dapat berubah selama capture.

## 5. Media Supabase-only dan risiko cache

- MEDIA_PATH aktif Projects/Team hash64.webp; aset preset repo tidak diupload,
  marquee/partners icons/fonts/artwork tetap repo.
- Cache valid: verifyProjectMedia existing mengecek hash/MIME/signature/size,
  boleh reuse tanpa network. Cache miss/corrupt dalam remote: ambil private
  cms-media/projects/<hash>.webp atau team/<hash>.webp memakai
  SUPABASE_SERVICE_ROLE_KEY **server/build-only**.
- Public readRPC tetap SUPABASE_ANON_KEY; jangan memakai service key untuk
  public content RPC. Admin write tetap Management API existing.
- Key media missing + referenced cold media → fail closed; current zero media
  references bukan bukti key media boleh dihapus. Verifikasi presence env server.
- Offline cache miss tidak ditolong env GAS; corrupted cache + Storage404 atau
  mismatch harus gagal, bukan stale fallback. Bersihkan temp files dengan aman.
- Reject path traversal/collection mismatch/arbitrary host dan raw upstream
  response; jangan membuka bucket public atau menambah Storage policy.
- Audit all active paths via schema/captured inputs. Kalau ditemukan reference
  Drive/GAS-only yang belum ada di Storage: stop, buat rencana per exact hash +
  backup + izin migrasi; **jangan ubah path content atau mengosongkan foto**.

Current bucket terakhir kosong; local cold-cache tests memakai synthetic bytes
Projects **dan Team** tanpa env GAS. Ini wajib, karena E5 real fixture sebelumnya
hanya Projects; jangan menyebut live Team upload/write accepted dari test itu.

## 6. Scope file dan commit

### Commit cutover

1. scripts/cms-client.mjs: source config, envelope, RPC errors/bounds, cache gate.
2. scripts/fetch-cms.mjs: log/comment config; package.json hanya bila diperlukan.
3. tests/cms.test.mjs: sync source/mode/failure contract; legacy fetch tests tetap.
4. tests/cms-{roles,domains,hods,partners}-supabase.test.mjs: source fixtures tanpa
   GAS; gas-invalid menjadi proof GAS tidak dipanggil, RPC invalid tetap gagal.
5. tests/cms-media.test.mjs: no-GAS private Storage cold cache Projects/Team.
6. Tambah tests focused (mis. cms-supabase-build.test.mjs) bila pemisahan membantu;
   assert observed requests/data/atomic failures, bukan sekadar substring code.
7. Docs aktif: SOP, migration master/TODO, kickoff, AGENTS/handoff dan setup.

Tidak mengubah schema SQL, snapshot repo, public layout/styles/artwork/font,
editor/CRUD/min-max/revision/group presets/auth/session/provider/client keys.
Tidak perlu dependency baru, SDK client, Edge Function atau direct authenticated
writes. Tidak memasang Roles/Domains/Hods/Partners editor baru dalam pass ini.

### Commit cleanup legacy (sesudah live/observasi/approval)

Audit exports/callers lalu remove unreachable server GAS branches/SCOPES/RPC maps,
legacy exporter helpers dari active client (atau modul archive terpisah),
cms/gas sources, generators/package scripts, legacy tests/mock dan generated
outputs yang confirmed-owned. Pilih archive/delete exact paths sesuai izin;
**jangan hapus test Supabase/media/auth yang kebetulan memakai GAS harness lama**
tanpa mengganti coverage. Jangan rm seluruh tests/cms* atau scripts/*.
Callback retired tetap aman; bukan GAS resource yang wajib dibuang.
Commit terpisah supaya review/rollback jelas. Jangan menghapus history Git.

## 7. Tahap A — audit dan baseline read-only

- [ ] Status/log/refs/remotes Node22; cek tree foreign changes, jangan reset/stash.
- [ ] Fresh project/alias READY exact deployed SHA; testing absent404, production
      only; daftar retained rollback sebelum env changes, jangan delete lagi.
- [ ] Baca urutan §2 dan susun tracked-file call graph/inventory env/resource.
- [ ] Read-only catalog/ACL verify migrations sudah ada; jangan reapply/drop/reseed.
      Auth pass7 dan patch delete masing-masing applied sekali; owner grant tetap1.
- [ ] Capture enam RPC dalam memory/ignored sanitized proof; count/shape/hash.
- [ ] Full GAS export satu capture read-only sebagai baseline lama apabila
      endpoint available; jangan mutate Sheet/Drive atau reseed. Jika GAS down,
      inspect cause dan build baseline dari previously captured valid input; laporkan
      batas bukti, jangan claim fresh GAS parity atau fabricate content.
- [ ] Baseline hybrid = validated GAS envelope + enam current RPC overrides.
      Compare future Supabase-only envelope memakai **same captured RPC inputs**;
      envelope schemaVersion1, semua key data sudah dari Supabase.
- [ ] Local repo snapshot hash + 19 HTML baseline; fresh live19HTML hashes.
- [ ] Read-only counts/fingerprints Projects/Team/grants/recruitment, Storage refs;
      no recruitment application PII. Jika apps bukan0, jangan delete applications.
- [ ] Inventory env **names/scope/presence only**, terutama retained secrets/hook.
- [ ] Owner freeze content selama comparison window; freeze hanya instruksi
      koordinasi, bukan mutation flag baru pada DB atau recruitment.

Outputs: inventory.json, captured-input-parity.json, baseline-local.json,
baseline-live.json, config-presence.json, db-before.json (ignored). Tracked
summary harus cukup bila artifacts hilang. Jangan simpan Auth credentials/session.

## 8. Tahap B — implementasi lokal dan tests

- [ ] Pastikan user sudah mengaktifkan **eksekusi cutover**; planning request ini
      sendiri belum izin implementasi runtime.
- [ ] Implementasi §4–§5 dalam diff kecil; retain env/resource/code legacy dahulu.
- [ ] Mode matrix: explicit local, implicit offline, explicit supabase, implied complete
      pair, partial pair, invalid mode, production missing/invalid/local config.
- [ ] No-GAS network proof dengan GAS env missing, invalid, parsial dan present;
      fetch mock melempar bila host Google/GAS dipanggil.
- [ ] Six successfulRPC assemble exact; each RPC HTTP/timeout/bad JSON/null/missing
      row/wrongshape invalid nested data fails; no writes/no stale fallback.
- [ ] Snapshot atomic original + temp cleanup per failure; schema strictness/order
      /blank slots/Unicode existing preserved; no metadata leakage into snapshot.
- [ ] Projects+Team cold/warm/corrupt media matrix, wronghash/MIME/bytes/404/missing
      server key; service key used only Storage, anon key only publicRPC.
- [ ] Sanitized errors never expose syntheticsecret/url/body from adversarialmock.
- [ ] Legacy standalone tests still pass while archive remains. Jangan sekadar
      hapus gas-invalid assertions tanpa new behavior proof.

## 9. Tahap C — QA lengkap dan gate live prerequisites

### 9.1 QA environment

Full tests **tanpa env server** agar10Team live mutation SKIP. Jangan source
.env.local secara global. Gunakan process terisolasi dengan allowlisted QA env;
scrub CMS_DATA_SOURCE, CMS_API__, SUPABASE__, CMS_ADMIN_*, deploy hooks serta
VERCEL_ENV/VERCEL bila inherited. Retain PATH/CHROMIUM_PATH yang diperlukan.
Jangan print environment list berisi nilai. Set mode local khusus build QA;
process live capture terpisah pakai in-memory keys.

Commands actual (Node22 PATH dulu, periksa script options/ports):

```sh
npm run test:cms
npm run test:recruitment
npm run build
npm run verify:visual
npm run audit:navbar
npm run verify:vt
node scripts/responsive-audit.mjs
npm run audit:spacing
npm run format:check
npm run seo:audit
npm run verify:cms-native-admin
npm run verify:cms-team-admin
npm run verify:cms-admin
```

Visual/navbar/VT/responsive scripts butuh preview static existing; verifikasi
server command/port, gunakan proses sendiri, jangan kill preview asing.
FullCMS baseline105PASS+10SKIP, recruitment24PASS; test baru bisa mengubah count,
semua expected tests harus dieksekusi. Full real-PG Hods dapat~7menit, jangan
mengklaim timeout sebagai PASS; catat executable/exit/summary/log sanitized.
LightCMS fokus dapat dijalankan sebelum full, bukan menggantikannya. Jika perlu
lihat script fulltest untuk list light; jangan mengarang npm alias belum ada.

Native/legacy/Team mocks each320/390/768/1440; mock bukan owner acceptance.
Retain legacy mock sampai cleanup commit. Seven gates+SEO: build0errors/23pages,
visual browserErrors[], navbar/VT, responsive468/468, spacing39, format,
SEO23 baseline; jumlah aktual dicatat jika authoritative suite berubah.
Snapshot original byte-identik dan **19/19 public HTML exact** dengan sameinputs.
Scan dist textfiles terhadap actual server secret values in-memory → hanya
jumlah findings, no matches/content/value output. Pastikan no PUBLIC_ serverkey.
Tidak restore snapshot dari Git lewat reset saat ada foreign edits; gunakan
isolated temp capture/build proof, jangan menjalankan remote sync ke tracked
snapshot utama lalu lupa restore.

### 9.2 Live config approval sebelum push

Tunjukkan diff lokal+QA+mode proof kepada Faiz. Minta izin konkret hanya untuk
set/add `CMS_DATA_SOURCE=supabase` di **Production** project production; tunjukkan
projectID dan existing scope. Tidak delete/replace GAS env atau Supabase keys.
Verify presence server SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY/ACCESS_TOKEN,
CMS_ADMIN_ORIGIN/CMS_ADMIN_SESSION_SECRET, CMS_DEPLOY_HOOK_PRODUCTION; no values printed.
Recruitment closed via runtime `accepting:false`; encrypted env presence bukan
bukti nilai decrypted. Tidak ada migration/liveSQL diperlukan dalam desain ini.
Jika ternyata diperlukan SQL/data migration, stop untuk diff+proof+izin baru.

Set flag sebelum deploy ketika owner approves, snapshot config nonsecret;
versi lama masih jalan. Config mutation exact harus tercatat sanitized.
Jangan buat testing project/push URL atau ubah Google/Supabase provider config.

## 10. Tahap D — commit, push production, READY exact SHA

- [ ] Review diff/status, snapshot remains byte-identik, QA complete; commit fitur
      dan docs lokal. Simpan per-file intent, tests dan risk yang relevan.
- [ ] Minta izin **exact HEAD SHA** sebelum satu `git push origin main`. Jelaskan
      semua docs lokal e9079e3/255d190 + plan berikutnya ikut ancestry push.
- [ ] Recheck origin tepat satu production push URL + clean/nonforeign tree; approved SHA
      masih HEAD. Jika berubah, minta izin SHA baru; jangan memakai izin a042 consumed.
- [ ] Push sekali; read-only fetch production main untuk refs tanpa push kedua.
- [ ] Vercel latest deploy READY exact SHA, primary alias assigned same ID/project;
      bukan hanya logs/status GitHub atau hostname200. Capture provider readyAt.
- [ ] Jika build fail, inspect state/log sanitized dahulu; jangan hook retry
      berulang, apply ulang SQL tanpa inspect atau mengubah konten agar build lewat.

Rollback retained645/7e/a042 penting; jangan delete rollback atau env GAS sebelum
observasi. Push otomatis deploy satu situs; **dua READY/domain bukan gate**.

## 11. Tahap E — acceptance production dan bukti Supabase-only

### E1 — read-only wajib dulu

- [ ] Public 19 routes HTTP200/HTML exact terhadap fresh baseline. Bila berbeda,
      inspect copy/field/same inputs; jangan mengabaikan hash atau overwrite konten.
- [ ] Home/About/Recruitment/Partners/HoF/Contact, enam Roles dan enam Hods pada
      390/1440. Seluruh 21 tabs Hods: click/keyboard/wrap/focus/aria; entry/back/VT
      dalam konteks Home dan Recruitment. Artwork decode; tanpa overflow/pageerror;
      typography/geometry/assertions tetap.
- [ ] Owner login200; Projects4/Team25 **atau fresh counts**200; editor390/1440
      menunjukkan urutan/pilihan/workspace; refresh200, CSRF stabil, read sesudah200.
- [ ] Anonymous Projects/Team/media401; invalid collection/path/CSRF tetap denied.
- [ ] Recruitment closed. CMS-only → recruitment401; recruitment-only → CMS401;
      mixed CMS logout → CMS401 sementara recruitment stats/refresh200; recruitment
      own logout → stats401. Read stats menjalankan audit existing, tanpa mengambil
      application PII atau mengubah application content.
- [ ] Fresh content/grant/allowlist/Storage fingerprints dan counts sama pre/post;
      perubahan rate-limit/audit/session existing dicatat terpisah.
- [ ] Login otomatis hanya bila izin dan credential secure tersedia di sesi baru.
      Jangan menyalin password dari konteks chat ke file handoff. Jika AI baru tidak
      punya credential/browser access, owner login sendiri; catat pending proof.
      Faiz menunda password rotation; jangan memaksakannya sebagai prasyarat.
- [ ] Semua sesi uji logout; tidak ada cookie/token tersimpan di artifacts.

Tidak perlu otomatis mengulang natural expiry satu jam atau fixture revocation
jika auth handlers/SQL/SDK/cookies tidak berubah. Cite actual acceptance645ec06
beserta diff/parity proof yang relevan. Bila auth ikut berubah, scope meluas dan
acceptance auth baru harus direncanakan; jangan menganggap mock cukup.

### E2 — bukti build tanpa GAS

- [ ] Local isolated remote build memakai **enam live readRPC**; CMS_API_* dan
      CMS_ADMIN_GOOGLE_* absent; Google hosts diblokir; snapshot equivalent dengan
      captured inputs. Tulis temp snapshot/build di lingkungan terisolasi, jangan
      commit generated live content atau merusak snapshot repo utama.
- [ ] Mock pipeline dengan env GAS adversarial menghasilkan **0 GAS requests**.
- [ ] Flag deploy supabase, deployed code/call graph tidak memakai GAS, READY
      exact SHA/config. Browser request trace bukan bukti build network karena build
      terjadi sebelumnya di server; gunakan kombinasi source proof + local pipeline
      network proof + config + actual deployment.
- [ ] Dist secret scan0; media memakai cache build lokal. Bucket tetap private;
      tidak ada policy baru. Gambar preset repo bukan bukti cold private media.

### E3 — fixture konkret tambahan, membutuhkan izin baru

Current media objects0 berarti bukti positif cold cache live baru memerlukan
fixture. E5 Projects sebelumnya membuktikan private backend pada645ec06, tetapi
source gate berubah pada pass ini. Rekomendasi: satu Projects fixture apabila
owner menyetujui rencana berikut setelah read-only PASS.

1. Upload PNG sintetis32×32; tambah tepat satu Projects
   `Uji CMS Supabase Only <runID>` dengan tagsQA/Temporary. Capture baseline dan
   revision dahulu; gunakan exact UID/hash dari respons, jangan mencari via title.
2. Add melalui API existing → satu hook production. Tunggu READY+alias; owner
   private media200, anonymous401, public local image decode pada390/1440;
   proof build tidak memanggil GAS.
3. Edit hanya description fixture → satu hook production → READY/public exact.
4. Delete hanya exact UID fixture dengan revision guard → satu hook production →
   READY; fingerprint Projects baseline kembali exact.
5. Hapus hanya exact Storage hash sesudah refs Projects/Team0; bucket tetap;
   verify object absent, Team/grant/allowlist unchanged, tidak ada PII output.
   Logout semua sesi.

Approval menyebut fixture/upload sintetis/**tiga production hooks**/cleanup UID
dan hash. Izin E5 lama sudah consumed; jangan reuse. Tidak ada arbitrary Team write.
Team cold cache **local synthetic tests wajib**; live Team fixture hanya jika
user mengizinkan fixture, constraints dan cleanup terpisah. Jangan mengklaim
Team upload/CRUD live baru sudah accepted berdasarkan fixture Projects.

Jika owner menolak fixture baru, catat read-only accepted dan batas proof media;
jangan klaim cold cache live pass ini PASS. Tidak perlu Auth fixture baru bila
auth tidak berubah; jangan membuka recruitment atau mengirim submission.

## 12. Tahap F — observasi, backup, pensiun resource, cleanup kode

**Belum diizinkan; jangan gabungkan dengan deployment cutover.**

### F1 — backup dan inventory akhir

- [ ] Inventory actual export/admin GAS projects dan deployment IDs, Sheet/tabs,
      Drive folders, Script Properties, Google Cloud OAuth clients/API access dan
      hooks. Identifier sensitive disimpan privat; tracked summary cukup kelas/count.
- [ ] Backup source/manifests, full Sheet, Drive uploads dan Properties yang
      diperlukan untuk restore. Properties/env secrets hanya secure backup di luar
      repo; catat checksum/count/restore method tanpa nilai secret. Jika tool tidak
      bisa membuat backup aman, owner mengerjakannya di dashboard; jangan dump PII.
- [ ] Verifikasi shared ownership/reuse oleh teammate atau fitur lain sebelum
      retire resource. Unknown ownership → pending, bukan dianggap exclusive CMS.
- [ ] GAS tidak sinkron otomatis dengan Supabase; final GAS archive bukan backup
      authoritative CMS terbaru. Backup current Supabase content terpisah bila
      dibutuhkan, tanpa otomatis dump recruitment PII.
- [ ] Observasi sedikitnya satu publication cycle normal yang disetujui owner
      dan durasi tertulis (usulan24–48jam). Waktu lewat bukan approval. Jika owner
      meminta retirement langsung, jelaskan batas rollback dan minta keputusan
      override konkret; jangan menambahkan delay paksa.

### F2 — hapus env lama secara terkontrol

Usulan allowlist sesudah proven unused: CMS_API_URL, CMS_API_TOKEN,
CMS_ADMIN_GOOGLE_CLIENT_ID, CMS_ADMIN_GOOGLE_CLIENT_SECRET, serta nama legacy
lain **yang benar-benar ditemukan audit**. Jangan wildcard delete prefix.
CMS_DEPLOY_HOOK_TESTING yang unused bisa dipensiunkan dengan izin tersendiri.
Audit Production/Preview/Development dan env lokal secara terpisah.

**Pertahankan:** CMS_ADMIN_ORIGIN, CMS_ADMIN_SESSION_SECRET,
CMS_DEPLOY_HOOK_PRODUCTION, SUPABASE_* dan RECRUITMENT_*.
Auth aktif tetap memakai nama CMS_ADMIN non-Google.

Sebelum delete: tampilkan exact names/scopes/env IDs, status secure backup,
acceptance runtime baru, restore path dan minta approval. Env deletion perlu
rebuild agar bukti live **tanpa env GAS** berlaku; satu rebuild/hook juga harus
masuk izin konkret. Sesudahnya READY exact SHA+alias dan regression fresh.
Jangan mengklaim delete env langsung mengubah immutable deployment lama.

### F3 — nonaktifkan deployment GAS dulu, hapus data terakhir

Dengan approval per exact resource, retire akses/deployment GAS export/admin
atau credential exclusively CMS; verifikasi retired tanpa mencetak export URL
bertoken. Jangan mengubah Supabase Google provider, uri_allow_list, OAuth client
unrelated atau menghapus seluruh GCP project.

Sheet/Drive archive disimpan dahulu. Delete data hanya sesudah backup siap
restore, observasi hijau, dan approval terpisah. Jika archive dipertahankan,
statusnya **“runtime GAS-free; archives retained”**, bukan seluruh resource sudah
dihapus. Jangan memasang GAS intake recruitment.

### F4 — cleanup repo dan QA ulang

Sebelum cleanup, pertahankan local backup branch/tag pada source terakhir
yang memuat legacy; jangan push refs baru tanpa izin. Commit terpisah untuk
exact legacy paths/callers/tests/package/docs (§6).
Focused Supabase tests + fullCMS tanpa Team live writes + recruitment + tujuh
gate/SEO + native/Team mocks4widths + parity + dist secret scan wajib.
Legacy mock boleh dihapus hanya jika HtmlService target memang dihapus dalam
cleanup yang approved; catat perubahan coverage. Jangan menyebut tiga mocks
PASS jika legacy mock sudah tidak ada.

Minta izin exact SHA baru → satu push production → READY+read-only regression.
Checkpoint SOP/TODO/AGENTS/handoff menyebut resource archived/disabled/deleted
sesuai keadaan aktual. Supabase migration history dan Git history tidak perlu
dihapus untuk membuat runtime GAS-free.

## 13. Rollback, stop conditions, dan izin

### Rollback aman

- Selama cutover, retain env/resource GAS agar old hybrid build masih dapat
  memvalidasi export. Content tetap Supabase; jangan pindahkan kembali ke GAS.
  Utamakan forward fix.
- Bila rollback Vercel diperlukan, pilih retained deployment dengan izin dan
  verify alias/owner/public. Aksi live rollback alias membutuhkan approval.
  Static output lama dapat stale sesudah owner write; rencanakan rebuild dari
  current Supabase inputs bila perlu, bukan reseed/overwrite konten.
- Setelah env/deployment GAS retired, build lama tidak otomatis rebuildable.
  Restore/re-enable exact config membutuhkan secure backup dan izin. Static
  rollback bukan restore data atau bukti latest publication.
- Tidak ada switch authoritative content ke GAS atau reverse migration otomatis.
  Recruitment tetap closed/Supabase; data baru tidak boleh hilang.

### Stop dan inspect

| Kondisi                                   | Tindakan                                                         |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Catalog/migration sudah ada               | Inspect, jangan apply ulang/drop/reseed                          |
| RPC error/partial/invalid                 | Build fail; tidak fallback atau kosongkan collection             |
| Legacy-only media/shared resource unknown | Inventory dan rencana/approval per target                        |
| UI atau19HTML beda                        | Inspect same captured inputs; jangan longgarkan assertion        |
| Konten berubah oleh owner                 | Fresh baseline, jangan force fingerprint lama                    |
| Secret/config hilang                      | Presence check, jangan print secret atau mengganti sembarang key |
| SHA/alias deployment salah                | Acceptance pending, inspect state                                |
| Foreign changes                           | Preserve, jangan reset/stash                                     |
| Fixture gagal                             | Inspect exact UID/hash/DB state sebelum retry/cleanup            |

Tidak ada blind retry mutation/apply. Jangan mark complete berdasarkan mock,
time/budget, atau deployment200 tanpa proof wajib.

### Matriks izin AI baru

| Tindakan                                     | Status saat handoff planning                              |
| -------------------------------------------- | --------------------------------------------------------- |
| Read-only audit, baseline, design/docs lokal | Persiapan plan diizinkan                                  |
| Implementasi lokal cutover                   | Mulai setelah user meminta eksekusi plan ini              |
| SQL/schema/grant/bucket/Auth mutation        | Tidak diperlukan; bukan izin otomatis                     |
| Set CMS_DATA_SOURCE Production               | Izin konkret setelah diff + local proof                   |
| Push SHA baru termasuk docs                  | Exact SHA approval; semua izin lama consumed              |
| Read-only live acceptance                    | Scope eksekusi sesudah deployment approved                |
| Retry hook/fixture/upload/delete             | Izin konkret baru; bukan reuse E5 lama                    |
| Delete env/GAS/Sheet/Drive/OAuth resource    | Exact inventory + backup + acceptance + approval terpisah |
| Password rotation                            | Owner nanti; jangan mutate/paksa atau simpan credential   |
| Testing/deployment cleanup lama              | Selesai, jangan ulang atau recreate                       |

## 14. Definition of Done dan artifacts

**Cutover accepted** jika enam RPC satu-satunya network content source,0 GAS
calls meski env lama present, mode/config fail closed teruji, strict Zod/order/
media hash/atomic write preserved, local cold cache Projects+Team PASS, fullQA
+19HTML parity, production READY exact approved SHA, real owner/anon/recruitment
regression PASS. Fixture media PASS atau batas proof tercatat, tidak ada fixture
tersisa, checkpoint aktual commit lokal. Bukan berarti seluruh collection punya
editor atau semua resource legacy sudah dihapus.

**Runtime GAS-free accepted** sesudah rebuild tanpa env GAS + fresh acceptance,
active call graph/build scan menunjukkan0 dependency GAS. Source archives/tests
boleh retained jika clearly inactive; cleanup code pending disebut terpisah.

**Retirement complete** hanya jika approved resource inventory sudah archived/
disabled/deleted sesuai keputusan owner, backup terverifikasi, observasi selesai,
cleanup kode + QA + exact SHA deployment accepted dan docs aktual diperbarui.
Archive retained tidak menghalangi runtime GAS-free tetapi harus disebutkan.

Proof usulan `artifacts/cms-gas-retirement/` ignored: inventory, baseline-local/
live, captured-input-parity, mode-matrix, cold-media, qa-summary, dist-secret-scan,
config-presence, deployments, owner-read, isolation, public-parity, db-before/
after, fixture-progress/cleanup, retirement-inventory. Tidak menyimpan password,
cookie, token, PII, raw Auth response/export URL atau secure backup secrets.
Tracked checkpoint mencatat exit/count/SHA/alias/proof limits/resource status;
AI berikutnya tidak boleh bergantung pada ignored artifacts yang mungkin hilang.

## 15. Prompt handoff siap salin

```text
Bro, lanjut EKSEKUSI docs/cms-gas-retirement-plan.md di
/home/faiz/ds/ds5opencode. Panggil gw bro, bahasa Indonesia.
Sesi sebelumnya hanya menyusun PLAN GAS retirement; auth CMS A–E SUDAH LIVE
accepted, bukan tugas mengulang auth/SQL/grant. Password gw ganti nanti;
jangan minta password di chat, set/rotate otomatis, atau simpan credential.

Periksa status/log/refs/remotes/Node22 dulu. Runtime production a042b07;
docs lokal e9079e3 + planning commit berikutnya cek log. Origin fetch/push
HANYA https://github.com/Web-Data-Sorcerers/community-web.git (satu push URL).
Testing project sudah absent404;8 deployment lama sudah dihapus, tersisa Current
+ rollback645ec06/7e17fc0. Jangan recreate testing/reset/stash foreign changes.

Baca kickoff SELURUHNYA termasuk §6 → AGENTS → ai-handoff →
docs/cms-gas-retirement-plan.md SELURUHNYA → TODO → master migration plan
§5–9 → auth plan§11/design/execution checkpoint → CMS SOP. Checkpoint terbaru+
plan GAS mengalahkan prompt auth/dua-domain/duaURL historis. UI terkunci.

Eksekusi tahap A–B lokal: read-only audit/captured same-input baseline, direct
schemaVersion1 envelope dari enam Supabase RPC; CMS_DATA_SOURCE mode fail closed,
remote bukan dipicu env GAS, local offline QA; lepas gate env GAS pada private
Storage cache. Strict Zod/order/blank slots/atomic write/revision/min-max/media/
UI tetap. Anon publicRPC, service key Storage build/server-only, admin write
Management API existing; no fallback GAS/stale snapshot; no SQL/grant/bucket/
provider/recruitment change. Jangan hapus kode/env/Sheet/Drive/deployment GAS
sebelum acceptance+backup+izin. Tidak perlu dependency baru.

Full test:cms TANPA env server supaya10 Team live mutation SKIP; focused no-GAS
mode/6RPC failures/Projects+Team cold media/secret redaction. Recruitment24
baseline, tujuh gate+SEO,3admin mocks4widths selama legacy retained, snapshot
SHA/19HTML exact, dist secrets0. Mock bukan owner proof. Jangan overwrite
snapshot repo dari live capture atau reseed Team untuk menghapus drift.

Sesudah diff+QA konkret, minta izin set CMS_DATA_SOURCE=supabase Production di
prj_3KbX29t6DYN1RMTy88lKHXd0IUVE; retained GAS env jangan delete. Commit lokal,
minta izin exact HEAD SHA sebelum satu push origin main. Izin lama consumed.
Production READY exact SHA+alias, real owner/read/media bila available/refresh/
logout390/1440, anon401, recruitment closed+isolation, public19parity dan DB
fingerprints. Hook/Projects fixture/upload/cleanup butuh izin konkret baru§11E3;
no arbitrary Team write. Auth unchanged tidak perlu ulang expiry satu jam/revoke
fixtures yang sudah accepted. Credential hanya secure session; jangan di docs.

Tahap F terpisah: exact resource/env inventory + secure backup + observasi
terpilih + approval delete env/retire GAS deployment dahulu. Shared Sheet/Drive/
GCP resources jangan delete generik. Cleanup code/tests commit terpisah + QA +
exact SHA push approval. Simpan checkpoint aktual/proof limits tanpa secrets/
PII; jangan klaim100%bebasGAS sebelum build/config/acceptance terverifikasi.
Lanjutkan pekerjaan yang sudah diizinkan; minta approval hanya untuk action
konkret yang belum diizinkan. Sesi ini meminta implementasi lokal plan tersebut,
bukan izin otomatis untuk push/env/live mutation atau delete resource.
```

## 16. Progress sesi planning (historis)

- [x] Fresh git/status/refs/Node22 dan actual client/schema/server/test inventory.
- [x] Plan A–F, mode/envelope/media/failure design, QA/live/backup/rollback/DoD.
- [x] Prompt AI baru dan pointer work order aktif.
- [x] User kemudian mengaktifkan implementasi lokal; status aktual di §17.
- [ ] Config/push/live acceptance/resource retirement masih gated terpisah.

## 17. Eksekusi lokal A–C selesai — live cutover pending (8 Oct 2026)

Faiz memberi instruksi `gass eksekusi` sesudah membaca handoff. Izin ini
mengaktifkan implementasi lokal; tidak mencakup live config, push, hook/fixture,
SQL/grant/bucket/provider/recruitment mutation atau pensiun resource. Seluruh
hasil lokal disiapkan sebelum meminta gate config §9.2. Password rotation owner
tetap ditunda; tidak ada login/password/session baru pada sesi lokal ini.

### A — actual audit dan frozen-input baseline

- Main awal27a158b, tree awal bersih. `git ls-remote origin refs/heads/main`
  fresh a042b071e438a5fec59a644c938144158a007602; origin fetch/push tepat satu
  community-web URL. Docs255d190/e9079e3/27a158b masih local ancestry belum push.
- Vercel Current dpl_EGG8a3RDz3mxB2BFsgL8hdNMTr2f READY exacta042b07,
  primary alias assigned; readyAt1791398322353/provider clock. Testing404 dan
  tiga retained deployment READY; tidak delete ulang atau recreate testing.
- Read-only catalog/ACL inventory private CMS tables/functions + private bucket,
  tanpa SQL apply. Server/auth/routes/migration/schema/dependencies tidak berubah.
- Enam live anon RPC dan full GAS export berhasil captured. Local anon key absent
  di .env.local, retrieved read-only lewat Management API **in-memory saja**.
  RPC JSON sizes: Projects1381, Team3311, Roles5783, Domains1402, Hods10147,
  Partners463bytes; budget1MiB per RPC + aggregate cukup untuk baseline.
- Replay hybrid dan source baru memakai exact captured sixRPC inputs;
  **deep-value identical**, bukan comparison dua capture yang dapat drift.
  Generated JSON top-level order mengikuti Zod schema pada jalur baru; hash file
  hybrid/supabase dapat berbeda karena serialization order, tanpa content change.
- Snapshot repo tidak ditulis/reseed dan SHA256 tetap
  4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857.
  Team drift existing dipertahankan. Fresh19 public routes200 baseline tercatat.
- Fresh counts Projects4/Team25, grant1active, allowlist1, applications0, objects0.
  Canonical Projects fingerprint8a7d4624d896842800dfd191892df7a8,
  Team b867f2890c939b410e3e428259082883 dan allowlist
  2a36dbfe696b9406baabd0cd4de9fb6f cocok checkpoint accepted.
  Inventory awal row-level Projects hash memakai projection berbeda; jangan
  membandingkannya dengan canonical `cms_load_projects()->projects` fingerprint.
- Production env names/scopes/presence verified; CMS_DATA_SOURCE **belum ada**.
  GAS/Google/hook testing env tetap present; tidak print/change/delete nilainya.
  Recruitment runtime accepting:false, anonymous Projects/Team/media401.

### B — implemented contract

- `scripts/cms-client.mjs`: source selection §4.1, direct seven-key envelope dari
  enam RPC, JSON/MIME/size/timeout bounded, errors fixed perRPC, final strict Zod
  dan aggregate budget1MiB sebelum media/snapshot writes. No GAS/stale fallback.
  Public content memakai anon, bukan service key. Return `local`/`remote` retained.
- Team conversion menolak unknown/missing/duplicate groups, orphan member,
  duplicate supplied IDs/slot order dan invalid content; urutan fixed groups dan
  sorted member order existing tetap. Valid top-level SQL metadata tidak masuk
  snapshot dan tidak menyebabkan false rejection.
- Private media Projects/Team cache tanpa gate env GAS. Storage menggunakan
  service key build-only, redirect forbidden, response bounded256KiB, MIME WebP,
  hash/decode/size existing. Warm verified cache dapat dipakai tanpa key;
  miss/corrupt offline gagal tanpa network. Temp+rename snapshot/cache preserved.
- Legacy `fetchCmsSnapshot`, exporter/admin GAS sources, generators, tests/mock
  dan env/resource tetap retained. Active sync tidak memanggil legacy fetch;
  server unreachable GAS fallbacks belum dihapus. Cleanup tahapF terpisah.
- Fixture renderer scripts memilih explicit `local` agar incidental Supabase env
  tidak menggantikan snapshot fixture. Deploy guard tetap menolak local di Vercel.
- Tidak ada perubahan UI/editor/auth/session, SQL, recruitment, schema snapshot,
  snapshot repo atau dependency. Tidak ada content/media/grant write/hook live.

### C — fresh QA Node22.23.0

Binary `/tmp/ds-cms-node22/node_modules/node-linux-x64/bin/node`; binary lama
hilang dan disiapkan ulang di /tmp, tanpa dependency repo baru. Full tests
memakai allowlisted environment tanpa server keys; .env.local tidak di-source.

| Check                                | Hasil                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full test:cms                        | 127 total: **117PASS +10Team liveSKIP /0FAIL**, actual PostgreSQL, duration476173ms                                                                         |
| Focused CMS source/legacy/media + PG | 75PASS/0FAIL; bukan pengganti full suite                                                                                                                    |
| New source matrix                    | 12 tests di full suite; sixRPC HTTP/network/JSON/null/shape/MIME/stream-budget/header-budget/header+body timeout, no fallback/atomic/no temporary snapshots |
| Media                                | Projects+Team synthetic32×32 no-GAS cold/warm/corrupt/missing-key/offline/404/MIME/hash/bytes/timeout PASS; service-key Storage/anon-key RPC assertions     |
| test:recruitment                     | 24PASS/0FAIL                                                                                                                                                |
| Build                                | 0errors,23pages                                                                                                                                             |
| Visual/navbar/VT                     | PASS; browserErrors[]                                                                                                                                       |
| Responsive/spacing                   | 468/468 combos,39components PASS                                                                                                                            |
| Format/SEO                           | PASS; SEO23pages                                                                                                                                            |
| Native/Team/legacy admin             | Each320/390/768/1440 PASS; mock only                                                                                                                        |
| Local snapshot/public output         | Repo SHA unchanged,19/19HTML exact against fresh local baseline                                                                                             |
| Same captured sixRPC inputs          | New/hybrid snapshots deep-value identical                                                                                                                   |
| Isolated full build                  | SixliveRPC, GAS/Google env absent, all non-Supabase fetch hosts blocked;19/19HTML exact against isolated hybrid-input build                                 |
| Dist server-secret scan              | 52textfiles,0findings in workspace and isolated builds; values in-memory only                                                                               |

Isolated build pertama memakai symlink node_modules dan Astro gagal compile
ClientRouter dependency metadata. Harness diganti salinan dependency terisolasi;
local/hybrid-input dan remote Supabase-only builds keduanya PASS. Ini tidak
memerlukan app/UI/dependency changes. Tidak menghitung attempt gagal sebagai PASS.

### Gate berikutnya dan batas proof

- Fitur+checkpoint commit **lokal saja**; SHA exact cek `git log`/HEAD. Push akan
  membawa tiga docs commits sebelum fitur juga. Semua izin SHA lama consumed.
- Minta izin add **CMS_DATA_SOURCE=supabase**, type plain/nonsecret, target
  **Production**, projectprj_3KbX29t6DYN1RMTy88lKHXd0IUVE. Tidak replace/delete env
  lain. Currenta042b07 mengabaikan flag, GAS env tetap menopang rollback lama.
- Preview build sengaja fail closed bila explicit flag belum configured;
  perubahan scope Preview bukan bagian izin Production. Local QA explicitlocal.
- Setelah config approved/verified: izin exact HEAD SHA sebelum satu push origin
  main; READY+primary alias exact SHA dan read-only real-owner/anon/recruitment/
  public regression production §11. Tidak mengulang auth migration/one-hour
  expiry/revoke fixtures accepted bila handler/SQL/session tetap byte-identical.
- Media refs/objects sekarang0: **belum ada positive cold-media live proof baru**.
  Synthetic tests Projects+Team PASS; Projects E5 accepted645ec06 menjadi proof
  historical, bukan live fixture pass ini. Fixture32×32 +exact UID/hash+3hooks+
  cleanup §11E3 butuh izin baru; Team live upload/write tidak diklaim.
- Belum ada config cutover/push/newdeployment/owner-session acceptance atau
  observation/backup/resource retirement. Production tetap hybrid dependencyGAS
  sampai approved deploy+acceptance. Jangan klaim runtime100%GAS-free sekarang.

Ignored proof `artifacts/cms-gas-retirement/`: inventory, captured-input-parity,
baseline-local/live, catalog-before, live-build-proof, isolated-build-proof,
local-final, db-after, full-cms/recruitment/gate/admin logs dan qa-summary.
Captures content publik hanya untuk parity; tidak ada password/token/cookie/
recruitment PII/secure backup secrets di artifacts. Tracked summary ini cukup
untuk handoff bila ignored proof/temp directories tidak tersedia.

## 18. Approved config C2 selesai — exact SHA push approval pending

User `gasss` menjawab pertanyaan spesifik add CMS_DATA_SOURCE Production setelah
feature4d5f8d5978b7d97a81d9566835311338299f8f61 dan seluruh local QA siap.
Ini **bukan izin push** atau mutation lain. HEAD/tree/origin single push URL,
production Current READY exacta042b07 dan required env presence diperiksa sebelum
satu POST config. Source flag sebelumnya absent; tidak menimpa scope existing.

Hasil: `CMS_DATA_SOURCE=supabase`, typeplain/nonsecret, target[production],
envIDF4kxmkHW29dFwUX6 pada projectprj_3KbX29t6DYN1RMTy88lKHXd0IUVE. Read-back value,
type dan exact scope PASS; nama/ID/scope/type seluruh env lain identik pre/post.
Tidak print nilai env lain atau mengganti Supabase/auth/GAS/Google/hook env.
Preview/Development tidak diubah. Tidak ada redeploy/hook/push/content write,
SQL/grant/bucket/provider/recruitment mutation atau delete resource.

Current sebelum/sesudah tetapdpl_EGG8a3RDz3mxB2BFsgL8hdNMTr2f, READY exact
a042b071e438a5fec59a644c938144158a007602; versi lama mengabaikan source flag.
Runtime recruitment accepting:false dan GETProjects/Team/media anonymous401.
Config approval consumed; push izin exact HEAD SHA baru wajib. Checkpoint docs
config ini commit lokal; SHA lihatgitlog. Source/tests tidak berubah setelah
QA§17; format check fresh setelah docs update, tanpa mengulang fullCMS/PG.

Satu approved push akan membawa docs255d190/e9079e3/27a158b, feature4d5f8d5 dan
checkpoint config ini ke community-web saja. Recheck approved SHA=HEAD, satu
origin push URL, lalu `git push origin main` **sekali**. Fresh READY+primaryalias
exactSHA, read-only owner/anon/recruitment/public acceptance §11 masih pending.
Fixture upload/UID/hash/3hooks/cleanup memerlukan izin baru; GAS/env/resource
retirement tetap tahapF terpisah. Tidak klaim deployed runtime bebasGAS dari
config presence saja.

Proof ignored `artifacts/cms-gas-retirement/config-source-set.json`; checkedAt
workspace 2026-10-08T01:45:38.808Z, bukan provider deployment timestamp.

## 19. Exact SHA push + READY + public read-only accepted — owner pending

Faiz `gasss` approved exact72c36bd18f98705706b2fa4b50c183679a4674c1 setelah
checkpoint config siap. Prepush: HEAD exact approved, tree clean, origin satu
production push URL, flag value/scope verified. Tepat satu `git push origin main`
berhasil a042b07→72c36bd. Read-only fetchproductionmain menyamakan refs kedua
remote pada72c36bd; tidak push kedua. Approval consumed; docs checkpoint lokal
sesudah ini perlu izin exact SHA baru bila hendak push.

### Deployment dan actual build proof

- Currentdpl_2mHnXoNYJo7WpGLUxbnL1sEnFQCn READY exact72c36bd pada production
  prj_3KbX29t6DYN1RMTy88lKHXd0IUVE; primary alias `data-sorcerers-community-sigma.vercel.app` assigned same ID,
  fresh API proof.
- Provider READY8Oct2026 **01:51:02.209UTC /08:51:02.209WIB**, readyAt1791424262209.
  Workspace checkedAt clock berbeda; jangan menyimpulkan chronology dari campuran.
- Actual deployment logs HTTP200: scripts/fetch-cms.mjs prebuild executed,
  Snapshot validated(remote mode), Astro build,23pages built. Raw log tidak
  disimpan/ditampilkan; proof hanya sanitized booleans dan Node version diagnostic.
- Project setting24.x; **actual log menyatakan engines22.x dipakai sebagai override**.
  Tidak mutate setting Node. Local QA22.23.0 tetap valid baseline actual.
- Source/config/READY + actual prebuild success + isolated sixliveRPC network proof
  §17 mendukung Supabase-only build; browsertrace sendirian bukan build proof.
  Source active sync/cache tidak mempunyai call ke GAS; retained env diabaikan.
- Fresh flagCMS_DATA_SOURCE=supabase Production only; other scopes tidak diubah.
  Testingproject404. Inventory4READY: Current72c36bd, olda042b07 dan rollback
  645ec06/7e17fc0. Tidak delete deployment/env/resource; tidak klaim GB freed.

### E1 public read-only proof

- Fresh public19routes200, **19/19HTML SHA256 exact** against prepush live baseline.
- Live browser390/1440:38page cases,42tab checks (=21tabs×2widths),24entry/back
  cases (6Hods×Home/Recruitment×2widths),0pageerrors/0failures. H1, all img decode,
  overflow, click/select/ARIA/single panel/focus/keyboard-right+left/wrap PASS;
  keyboard back/link context and AstroVT JS token persistence PASS. Home/HoF
  screenshots kedua widths tersedia ignored; tidak mengubah UI/source.
- Actual anonymous Projects/Team/media401; anonymous admin Projects/Team shells
  390/1440: keyboard-open password form, labels, empty password field, workspace
  hidden dan no overflow/pageerrors PASS. **Shell bukan real owner read proof.**
- Recruitment GET accepting:false. Tidak submission/PII reads atau loginfixture.
- Fresh canonical DB fingerprints Projects8a7d4624d896842800dfd191892df7a8,
  Team b867f2890c939b410e3e428259082883, recruitment allowlist
  2a36dbfe696b9406baabd0cd4de9fb6f unchanged pre/post. Projects4/Team25,
  grant1active/allowlist1, applications0/mediaobjects0; no content writes/hooks.
- `git diff a042b07 72c36bd -- server api supabase src/data/cms-schema.mjs
src/data/cms-snapshot.json package.json package-lock.json` kosong; auth/session/
  SDK/SQL/grants tidak dikerjakan ulang. Prior auth accepted proof tetap historical.

### Required pending dan batas klaim

Credential login tidak tersedia di secure environment sesi baru. Browser connected
awalnya about:blank; dibuat isolated production/admin/ tab untuk owner sendiri,
login form terbuka. User diminta login CMS sendiri melalui async question, tanpa
password di chat/files. Latest probe sesi itu anonymous401: belum owner proof.

**Pending:** real owner login/readProjects+Team/editor390/1440/refresh-CSRF stable/
read-after/logout, CMS-only→recruitment401 lalu recruitment login/mixed logout
isolation dan recruitment-only→CMS401/own logout sesuai§11E1. Semua dependent
proof tetap pending hingga secure/manual login tersedia; jangan menebak credential,
mint bypass token atau memakai service readRPC sebagai owner login proof.
No content writes, uploads, hooks, SQL/grant/provider changes dilakukan.
Anonymous public/browser contexts ditutup; prepared owner tab belum authenticated.

Positive cold-media live pass baru belum dilakukan: currentrefs0/objects0. Synthetic
Projects+Team local cold-media proof PASS; E5 accepted645ec06 hanya historical.
Jika user memilih fixture baru, minta izin exact fixturePNG32×32+UID/hash+3hooks+
cleanup§11E3. Team arbitrary/live writes tetap tidak diizinkan.

Status **“Supabase-only build deployed; public regression PASS; full cutover
acceptance pending owner”**. Bukan retirement complete/fully accepted100%GAS-free.
GAS/env/Sheet/Drive/source tetap retained; backup/observation/resource retirement
§12 belum dimulai. Checkpoint ini lokal; tidak memakai izin push72c36bd lagi.

Proof ignored: prepush, deployments-current, build-log-proof,node-version-proof,
public-after-push,live-browser,admin-anonymous-shells,state-after-push,
postpush-inventory,postpush-summary JSON; live-browser/admin-shell logs dan4screenshots.
Tidak ada password/cookie/token/PII/raw upstream logs di proof.
