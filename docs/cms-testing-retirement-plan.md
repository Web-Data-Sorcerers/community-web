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

Status: LIVE production-only a042b07; origin satu fetch/push production URL.
Project testing belum dihapus; gate live dan retry publication accepted.

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

## Production-only LIVE a042b07 — testing siap dipensiunkan

Dengan izin exact SHA Faiz (`oke gas`), origin fetch/push sekarang hanya
https://github.com/Web-Data-Sorcerers/community-web.git. Satu push origin main
mengirim a042b071e438a5fec59a644c938144158a007602 ke production saja; izin consumed.
Remote production, repo GitHub testing dan project Vercel testing tetap ada.
Main/origin/main/production/main sinkron a042b07 sebelum checkpoint lokal ini.
Push SHA berikutnya termasuk docs tetap perlu izin baru.

Production READY exact SHA + primary alias sesudah push, lalu tepat satu
Projects retry publication tanpa content write menghasilkan HTTP200 dengan
publication=[{target:production,accepted:true}]. Rebuild retry READY exact SHA,
alias assigned dpl_EGG8a3RDz3mxB2BFsgL8hdNMTr2f, provider timestamp
7 Oct 2026 18:38:42.353 UTC / 8 Oct 2026 01:38:42.353 WIB.
Testing latest deployment/alias tetap dpl_6eNiRecrpWyriead5kzmYARLUdyH,
SHA645ec06; tidak ada deployment testing baru dari push atau retry.

Real owner production login/read4Projects+25Team200, explicit refresh200,
CSRF stable/read200. Projects/Team editor390/1440 visible,4/25choices,
no overflow, password field empty. CMS-only recruitment401; recruitment login/
stats200; CMS logout200 → Projects/Team/media401, recruitment stats/refresh/
stats tetap200; recruitment own logout → stats401. Semua sesi uji logout.
Public19HTML exact kedua situs, anonymous CMS401, recruitment accepting:false.
Projects/Team/recruitment allowlist fingerprints identik pre/post retry;
Projects4, grant1active, applications0/media objects0. Tidak ada upload/content
write/Team write/SQL/grant mutation sesi cutover.

Project konkret yang siap dihapus owner: web-testing,
prj_E5226JcOUGOMQtWT3rDTojwbZ2sB, web-testing-azure.vercel.app.
Agent belum menghapus project; izin cutover/retry tidak mencakup delete project.
Production data-sorcerers-community, Supabase web-community/bucket/data dan
repo GitHub tetap. Full GAS export validation/legacy env tetap; GAS removal
pass terpisah. Owner mengganti password sementara sendiri di dashboard.
Auth A–E acceptance lengkap645ec06 tetap berlaku; production-only a042b07
memiliki regression nyata di atas. Checkpoint ini commit lokal saja.
Proof ignored artifacts/cms-auth/retire-{deployments-before,pushed,retry,
browser,public-after,state-before,state-after,state-final,remotes-before}.json.
