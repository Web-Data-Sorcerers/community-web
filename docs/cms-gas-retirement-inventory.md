# GAS retirement — inventory dan backup F1

Status8Oct2026: Faiz mengaktifkan tahap berikutnya (`gassssss broooo`) setelah
unified admin/recruitment OPEN accepted dan push checkpoint. Audit read-only,
backup lokal dan rencana konkret sudah disiapkan. **Belum delete/disable resource,
env mutation, hook, redeploy, push, SQL/grant/provider atau content write.**
Owner memilih login Google melalui browser pengujian; tab5 Sign in Google siap.
Pilihan cara login bukan proof sudah authenticated; latest check masih sign-in.

## 1. Baseline actual

HEAD awal488e3940bf1a3a516ca0b9571a14db1dc272f5d9; origin satu fetch/push URL
community-web. Production Current+primaryalias READY exact
`eaa61c4d6dafe2b69763e681d27d32fdaeb9ad50`,
`dpl_EB7uxc3WAV7ehDjvbazLaRmGM8wS`; provider readyAt1791437226454.
Testing project404. Ada7READY deployments; semuanya retained, tidak dibersihkan.
Production memiliki15env records. Recruitment GET200/accepting:true;
anonymous Projects/Team/media/recruitment stats/list401. Backend aktif tetap
Supabase dan shared Auth accepted; password tidak dicatat/diubah.

CMS fresh counts Projects4/Team25/grant1active/allowlist1/applications0/objects0.
Enam current publicRPC captured terpisah dari GAS. Tidak mengambil application
PII; backup ini bukan full Supabase database/grants/Auth backup.

## 2. Kandidat env exact — belum diizinkan untuk dihapus

Project seluruh rows: `prj_3KbX29t6DYN1RMTy88lKHXd0IUVE`.
Inventory semua scopes actual; tidak ada branch/customEnvironment override.

| Key                            | Env ID           | Scope                | Type      | Backup/restore status                                                                   |
| ------------------------------ | ---------------- | -------------------- | --------- | --------------------------------------------------------------------------------------- |
| CMS_API_URL                    | nHTOfGLPyHuBwopp | Production           | sensitive | Local candidate encrypted; endpoint works, exact Production equality unverified         |
| CMS_API_TOKEN                  | 5VSmUM5t8VLt1MTw | Production           | sensitive | Local candidate encrypted; fresh export validated, exact Production equality unverified |
| CMS_ADMIN_GOOGLE_CLIENT_ID     | HMKtCBAOnUBeBwgI | Production           | sensitive | Value unavailable; secure Google-owner backup pending                                   |
| CMS_ADMIN_GOOGLE_CLIENT_SECRET | gbGYOz2qf4jPA7rr | Production           | sensitive | Value unavailable; secure Google-owner backup pending                                   |
| CMS_ADMIN_API_DEPLOYMENT_ID    | gaDzpADIK5tpMjEe | Production           | sensitive | Value unavailable; exact GAS deployment inventory pending                               |
| CMS_DEPLOY_HOOK_TESTING        | pWaXX9bea2FbuPdw | Production + Preview | encrypted | Exact Vercel value backed up; valid hook URL + local equality PASS; never invoked       |

Audit tracked server/api/src/scripts menemukan0active readers untuk keenam key.
Legacy helper fetchCmsSnapshot masih tersedia, namun syncCmsSnapshot tidak
memanggilnya. Server memiliki3call gas retained, unreachable karena route hanya
Projects/Team/media dan collection hanya Projects/Team; kedua jalur memakai
Supabase. SCOPES/RPC/TEAM_RPC, legacy source/generators/tests belum dihapus.
QA helper bisa men-delete legacy vars dari process fixture, bukan live config.

**Pertahankan:** CMS_DATA_SOURCE, CMS_ADMIN_ORIGIN, CMS_ADMIN_SESSION_SECRET,
CMS_DEPLOY_HOOK_PRODUCTION, seluruh SUPABASE_* dan RECRUITMENT_*.
Production hook existing1 (`CMS Save`, main) tetap; tidak menghapus hook sebagai
bagian rencana testing-env. Tidak mengubah Preview source flag otomatis.

Secret Vercel write-only tidak diasumsikan dapat diambil kembali. Metadata
presence berbeda dari backup nilai. Acuan [Config/Secret environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

## 3. Backup yang benar-benar selesai

Folder privat di luar repo:
`/home/faiz/.local/share/ds-backups/gas-retirement-20261008-1791437742379/`.
Folder700, archive/private backup600; random AES256GCM key file600 pada direktori
privat terpisah `/home/faiz/.local/share/ds-backup-keys/`. Key tidak dicetak.
Semua ini local disk yang sama; bukan offsite disaster-recovery backup.

- `tracked-source.tar.gz`:20exact tracked paths (GAS source/manifests/generators,
  server/client/schema/snapshot/package dependencies),83817bytes;
  SHA2563f9fe8c4442eb0c4fd1b40dcf62904bc3c75c89935fa36c2f29c0d7c2bb0dbcd.
  Listing +20byte-exact file comparisons verified. Ini repo source, belum membuktikan source deployed Google sama.
- `private-cms-backup.aesgcm.json`: current6RPC, fresh validated GAS export,
  available legacy config candidates, metadata dan private export deployment
  candidate. AES256GCM encryption round-trip/decrypt+deep equality PASS; tidak
  menulis plaintext secret/Google identifiers ke repo/artifacts.
- Fresh GAS export21085bytes,
  SHA256648b91f142d1ae9c054ce7a97436211312b5dc6364b4affa696cdeb9aa83f06b.
  Export berisi schemaVersion1/enam collections; **bukan full Sheet** atau Drive.
- RPC bytes Projects1381/Team3311/Roles5783/Domains1402/Hods10147/Partners463.
  Capture current Supabase berbeda dari GAS archive lama yang tidak sinkron.
- Env testing-hook decrypted via official read-only GET env-by-ID; parsed HTTPS
  Vercel deploy-hook URL + equality terhadap local value PASS. Tidak dipanggil.

Restore dry-run berarti payload berhasil didekripsi dan dibandingkan, serta
source archive20files byte-exact dan tampered ciphertext rejected; **bukan** live restore/reseed/redeploy test. Actual restore
harus approved per target; extract source ke isolated directory, lalu compare
hashes. Recreate env perlu exact key/value/type/target dan rollback approval;
API dapat memberikan env ID baru. Jangan melakukan fallback content ke GAS.

## 4. Bagian Google dan observasi yang belum selesai

Dua logical projects historis: CMS Export read-only dan CMS Admin privat.
Belum verified actual scriptIDs, versions/deploymentIDs, owner/shared reuse,
Sheet ID/tabs/row counts, Drive folder/files, OAuth client/GCP project atau API
usage. Nama historis tidak cukup untuk delete target actual.

Backup pending: deployed GAS source/manifests, full Sheet termasuk reserved
Milestones/Settings, semua Drive uploads, Script Properties dan OAuth rollback
config. Expected Properties dari source mencakup SPREADSHEET_ID/DRIVE_FOLDER_ID/
OWNER_EMAIL/ADMIN_EMAILS/EXPORT_TOKEN/CMS_SCHEMA_VERSION + deploy hooks admin;
actual names/values masih perlu owner session. Simpan encrypted di luar repo;
tracked summary counts/hashes saja. Shared ownership unknown → retain resource.

Plugin Google Drive ditemukan namun belum installed/connected. Owner memilih
browser; jangan menganggap plugin sudah tersambung atau membuat akun baru.
Browser Google owner authenticated belum confirmed. Tidak meminta password di
chat atau mengambil credential lewat cara lain.

Observation duration belum dipilih; usulan24jam +1normal owner publication cycle
setelah perubahan normal yang approved. Waktu lewat atau docs-only deployment
bukan publication/observasi acceptance. Tidak memicu retry/hook atau membuat
Projects/Team fixture dari izin audit ini. Direct retirement override hanya bila
owner memilih secara konkret dengan batas rollback yang dijelaskan.

## 5. Urutan eksekusi berikutnya

1. Owner login Google tab5 → read-only exact resources/ownership inventory.
2. Backup full source/Sheet/Drive/Properties/rollback config ke encrypted storage,
   checksum/count dan restore dry-run; current CMS content tetap Supabase.
3. Pilih window observasi/publication atau explicit override; catat batas proof
   cold private media live baru (currentobjects0; local Projects+Team proof PASS).
4. Tampilkan exact env/resource list yang benar-benar siap, proof backup, rollback
   path; minta approval deletion/disable + tepat1Production rebuild. Izin umum
   `gas` tidak menggantikan exact resource approval§12.
5. Hapus approved exact env dulu; READY+alias+public parity+shared owner regression
   tanpa env GAS. Archive/deactivate actual GAS deployments sesuai approved target.
   Sheet/Drive/shared GCP jangan delete generik; boleh archives retained.
6. Baru cleanup exact legacy repo paths dalam commit terpisah, backup tag lokal,
   fullQA dan exactSHA push approval; jangan hapus coverage Supabase/Auth/media.

## 6. Proof dan verification

Fresh focused no-server-env suite **30PASS/0FAIL/0SKIP**:
CMS Supabase source matrix, native admin, private media, recruitment admin.
No network/Team live mutations; bukan fullQA rerun. Full117CMSPASS+10SKIP dan
recruitment28PASS sebelumnya tetap historical untuk feature00ac70a.

Proof ignored `artifacts/cms-gas-retirement/f1/`:
`inventory.json`, `backup-proof.json`, `env-backup-verification.json`,
`usage-audit.json`, `restore-proof.json`, `no-gas-tests.json` + sanitized test log.
Backup key/values tidak ada dalam artifacts. No resource/env mutation/push.
F1 **partial backup complete; Google access required**, bukan retirement complete.

## 7. Google browser fallback dan encrypted local collector

Owner menunjukkan dashboard pribadi berisi CMS Admin, CMS Export dan Untitled
project; indikator sharing pada Export terlihat, daftar collaborators/reuse belum
verified. Screenshot berikutnya membuktikan6nama Export Properties: ADMIN_EMAILS,
CMS_SCHEMA_VERSION, DRIVE_FOLDER_ID, EXPORT_TOKEN, OWNER_EMAIL, SPREADSHEET_ID.
Nilai tidak dikirim lewat chat. Untitled project unrelated tetap retained.

Login Google browser agent ditolak sebagai unsupported/unsafe browser. Jangan
mengulang login dengan spoofing/menurunkan keamanan/copy cookie. Sesi normal
owner terbuka; browser agent tetap tidak memiliki sesi itu. Google Drive connector
masih belum connected; tidak menganggap normal-browser login sebagai agent access.

Agent menyiapkan local-only collector http://127.0.0.1:4389, bind loopback. Owner
memasukkan6Properties di password-type form lokal; body hanya diproses memory dan
AES256GCM encrypted di folder backup luar repo/owner-google, unique IV per file.
Source code collector sendiri ignored artifacts/cms-gas-retirement/f1/collector.mjs;
bukan fitur CMS production, tidak dipush/deploy. Key existing disimpan terpisah.
Tidak menerima password Google, menyalin browser session, atau mutate GAS.

Origin+Host+HttpOnly SameSite session checks, fixed kind allowlist/body bound,
Properties shape/schemaVersion1, archive ZIP integrity/path checks, Excel worksheet
count, encrypt-decrypt equality dan file600 enforced. File uploads menerima full
Sheet XLSX, Drive ZIP, export/admin source/manifests; metadata/count/hash saja
pada response. UI clear form setelah successful backup. Endpoint tidak menampilkan
values. Semua backup local disk saja; offsite/complete ownership belum verified.

Focused collector QA **9checks PASS** menggunakan synthetic payload di isolated
temporary directory: page/cookie, wrong origin, missing cookie, unknown kind,
invalid Properties, invalid archive, failed requests create0files, encrypted values
exact/file600, response without secret values. Synthetic files sudah dibersihkan;
actual Google Properties belum diterima, archive/Sheet/Drive backup masih pending.

NEXT owner save6Properties via local form → agent inspect private proof counts
without values → exact Sheet/Drive identifiers dipakai hanya lewat normal Google
owner browser → backup all tabs/Drive files/source/Properties dan ownership audit.
Jangan screenshot form values; jangan delete/disable resource dari screenshot ini.
Collector proses harus dihentikan setelah backup owner selesai; jangan mematikan
preview/process lain. Restore/deletion live tetap approval exact target terpisah.
