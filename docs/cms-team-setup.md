# B2 Team — update existing dan acceptance

> Arsip GAS: kode/generator legacy sudah dihapus dari working tree atas instruksi
> owner8Oct2026. Jangan jalankan setup/perintah GAS di bawah. Source historis ada
> di Git history/tag lokal backup/gas-code-before-cleanup-20261008. Backend aktif
> memakai Supabase; lihat AGENTS.md dan docs/cms-sop.md checkpoint terbaru.

Kode Team + QA lokal PASS (36 tests, admin/fixture, 7 gate+SEO). Feature2a22d8a sudah push; Vercel testing22:04:31 WIB/production22:05:50 WIB SUCCESS. GAS Team/live acceptance belum. Projects existing
sudah diterima live. Tidak membuat Sheet/folder/akun/OAuth/deployment awal baru,
tidak menjalankan setupCms/setupAdmin, tidak seed ulang.

1. Push situs sudah selesai dengan izin user dan kedua Vercel SUCCESS.
   Berikutnya update source/versi GAS existing sebelum memakai Team untuk mutation.
2. Generate `npm run cms:gas` dan `npm run cms:admin`. Owner mengganti Code.gs
   Export EXISTING dengan artifacts/cms-gas/Code.gs; buat versi baru pada
   deployment Export existing. Endpoint/properties/folder/token tetap.
3. Owner mengganti Code.gs Admin EXISTING dengan artifacts/cms-admin/Code.gs,
   Index.html dan manifest generated. Buat versi baru pada deployment API
   executable existing serta web app legacy existing. Tidak mengubah OAuth,
   env Vercel, deployment IDs atau sharing. Source repo tidak otomatis update GAS.
4. Masuk lewat /admin existing lalu pilih Kelola Team; /admin/team memakai sesi
   yang sama. Legacy Projects tetap tersedia; editor Team utama native website.
5. Owner uji edit satu nama/peran singkat, tambah satu anggota di grup preset,
   pindah posisi/grup, upload foto (PNG transparan boleh), preview lalu save.
   Minimal1/maks8 per grup. Memindah/menghapus anggota terakhir ditolak. Posisi
   sisip menggeser anggota lain, ID tetap sama. Preset title/tint/fade/card tidak
   bisa diedit. Foto upload slot302×442/top−42, crop cover/top center lokal.
6. Save berarti data tersimpan dan dua rebuild diminta. Verifikasi export serta
   kedua deployment terbaru/timestamp SUCCESS, lalu /about kedua situs pada
   390/1440: nama/peran, grup/urutan, decode foto, scroll kartu, Growth Join Now,
   tanpa overflow/errors. Jangan menyebut live dari pesan save saja.
7. Hapus anggota percobaan dengan aksi normal; pulihkan edit konten owner yang
   hanya dipakai untuk uji. Pastikan Team kembali baseline dan Projects tetap
   empat baseline, kedua rebuild SUCCESS serta konten/foto uji hilang.
   File upload Drive tidak otomatis dihapus (media lifecycle B4).
8. Catat bukti sanitized di artifacts/cms-team dan checkpoint docs. Browser
   mock tidak membuktikan Google auth. Penolakan non-owner yang sudah dilaporkan
   tetap punya batas: tahap Google/backend belum terisolasi. Username/password
   ditunda; seluruh CMS belum selesai. NEXT setelah acceptance Team: B3 satu
   collection/pass, kemudian B4.

Build media tetap hash/decode/cache lokal sebelum snapshot atomik; export hanya
melayani foto Team/Projects yang aktif. Media hilang/corrupt/fetch gagal harus
menggagalkan build, tidak memakai fallback stale. Penyebab redirect/fetch gagal
sebelumnya belum terbukti; safeguards/retry bounded dipertahankan.

Fix upload (`bd9a424`, lokal→live): foto >16 MP atau >2 MB dikecilkan/kompres di
browser (`src/scripts/admin-image.js`) sebelum POST, server `x-upsert: true`, dan
pesan error spesifik. Batas server tetap <=2 MB/masukan, <=16 MP, raster saja.
Owner live upload foto Team belum diuji ulang sesudah fix; minta acceptance baru.
