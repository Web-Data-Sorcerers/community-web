# Pensiun web-testing setelah acceptance auth

Faiz menyetujui urutan: selesaikan acceptance auth dua domain, ubah publication
CMS menjadi production saja, tes, lalu project testing boleh dihapus. Project
Vercel testing tetap ada selama E5 dan worker expiry alami belum selesai.

## Perubahan konkret yang disiapkan lokal

- Projects/Team save/add/delete/retry hanya memanggil hook production. Hook
  production missing/gagal tetap accepted=false dan publicationPending=true;
  tidak pernah menganggap publication sukses karena target kosong.
- Sanitizer menerima tepat production saja atau dua target existing yang unik.
- Surface admin Projects: hanya status publication mengikuti target respons.
  Surface admin Team: lakukan status yang sama setelah Projects browser QA PASS.
  Dua editor custom tidak punya node Figma; jangan mengarang node/PNG. Logo,
  Bluu Next700/Manrope, warna, spacing8pt, layout, form/CRUD/media tetap.
- Tidak ada public section/CSS/font/artwork/reference/geometry assertion berubah.
  SOP pixel, asset provenance native admin dan fullscreen plan sudah dibaca.
- Uji hook production200/gagal/missing, tidak ada request hook testing, response
  publication satu target pada Projects dan Team, revision/write existing.
  Admin mock empat widths harus memeriksa teks production-only dan retry.
- QA CMS light + recruitment + tujuh gate/SEO + tiga admin mocks empat widths,
  snapshot/19 public HTML exact sebelum commit/push.

## Gate live dan penghapusan

1. Selesaikan E5 fixture+cleanup dua domain dan natural expiry worker actual.
2. Commit fix+checkpoint, minta izin exact SHA untuk push production saja.
3. Setelah approved, simpan mapping remote nonsecret lalu ubah origin fetch/push
   URL ke repo community-web saja; tidak menghapus repo GitHub atau remote lain.
4. Push sekali origin, verifikasi production READY exact SHA+alias dan read-only
   owner/anonymous/recruitment-closed/public regression. Testing tidak redeploy.
5. Hanya setelah proof itu, tampilkan project name/id/domain konkret untuk
   penghapusan project testing oleh owner atau izin delete terpisah. Jangan hapus
   project production, Supabase project/bucket/data atau GitHub repo. Jangan
   hapus env GAS/CMS_ADMIN_GOOGLE_*; GAS removal tetap pass terpisah.

Status: local preparation; belum mengubah routing push atau project Vercel.

## Local implementation proof

Projects/Team publication now only calls production; unused testing hook env is
retained. Sanitizer validates one production target or legacy two unique targets.
Projects status was tested before Team status. Each editor mock4widths PASS for
production-only success and partial failure/retry; legacy mock4widths PASS.
Backend tests verify both routes retry without writes, missing/failed hooks and
Projects save publicationPending (one write only, zero testing requests).

Node22.23.0: full CMS105PASS+10Team live SKIP, light87PASS+10SKIP, recruitment24PASS,
focused native11PASS. Build0errors/23pages, seven gates+SEO PASS; responsive468/468,
spacing39, SEO23, browserErrors[]. Snapshot unchanged and public19HTML exact;
47dist textfiles contain zero server secret values. Proof ignored retire-qa-summary,
retire-parity-secrets. Auth runtime remains645ec06; E5 rerun+cleanup accepted,
natural expiry worker PASS pada3703/3701detik kedua domain dan sesi cleanup selesai. Local work is not pushed; origin routing and
Vercel projects are unchanged. Exact SHA consent remains required for next push.
