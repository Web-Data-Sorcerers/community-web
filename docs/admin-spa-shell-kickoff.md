# Kickoff promp — Admin SPA shell (Opsi 2 Varian A)

Copy prompt di bawah ke **sesi AI baru**. Dokumen ini sendiri **bukan izin
eksekusi**; prompt sudah memuat instruksi bertahap. Keputusan owner §7 plan
sudah FINAL (semua rekomendasi diterima).

Isi prompt (blok di bawah) sengaja mandiri supaya AI baru bisa mulai hanya dengan
membacanya + repo.

```text
Bro, lanjut kerja di /home/faiz/ds/ds5opencode. Bahasa Indonesia, panggil gw bro.
Kamu eksekutor untuk plan "Admin SPA shell (Opsi 2 Varian A)".

Baca urut dulu (jangan lompat, checkpoint terbaru = sumber state):
AGENTS.md (checkpoint paling atas) → docs/ai-handoff.md →
docs/admin-spa-shell-plan.md SELURUHNYA → docs/admin-performance-feedback-plan.md
§23 → docs/cms-sop.md §8 → docs/admin-unified-recruitment-plan.md (kontrak admin
bersama) → docs/admin-background-publish-plan.md (deploy hook waitUntil terbaru).

Prosedur wajib sebelum ngoding:
1) Cek git status/log/refs/remotes. Origin satu push URL community-web; testing
   absent jangan recreate. Jangan reset/stash perubahan asing. Head lokal cek
   git log (plan SPA = 36a0000, di atas checkpoint UI revamp LIVE 010cfcc).
2) Cek Node22 di /tmp/ds-cms-node22/node_modules/node-linux-x64/bin (cek dulu,
   /tmp nggak persist; reinstall kalau hilang). Semua QA pakai Node22.23.0.
3) Production terakhir cek read-only; recruitment OPEN; admin shared login.

=== FASE 1 (WAJIB, baca-only): refine + finalisasi plan ===
Sebelum nulis kode apa pun, baca source yang relevan dan VALIDASI/PERDALAM plan:
- src/pages/admin/{index,team,recruitment}.astro (markup + CSS + script tag)
- src/components/admin/AdminNavigation.astro
- src/scripts/{cms-admin-editor,cms-team-editor,recruitment-admin,admin-request,
  admin-image}.js (lifecycle, id DOM, dirty-guard, CSRF, logout)
- server/{cms-admin,cms-auth,recruitment-admin}.mjs (kontrak endpoint — TIDAK boleh
  berubah)
- scripts/verify-cms-native-admin.mjs, verify-cms-team-admin.mjs,
  verify-recruitment-review.mjs (mock browser yang harus tetap hijau setelah
  penyesuaian)

Hasilkan di akhir Fase 1 (laporan ke gw, bukan kode):
- Konfirmasi/perbaikan file change map §5 plan.
- Daftar konkret tabrakan id DOM antar panel (#status/#login/#logout/#workspace
  dsb) dan rencana scoping.
- Urutan mount/keep-alive + koordinasi CSRF/login/logout/401 lintas panel.
- Strategi URL (alias /admin/team/ & /admin/recruitment/ tanpa redirect,
  pushState + hash), termasuk apa yang terjadi saat reload/back pada route lama.
- Perubahan yang dibutuhkan di 3 mock verify + test:cms/test:recruitment.
Lalu STOP dan tunggu gw bilang "gas" sebelum Fase 2.

=== FASE 2 (setelah gw bilang "gas" di sesi ini): implementasi LOKAL + QA ===
Implementasi Varian A (satu route /admin/ + 3 panel keep-alive):
- admin-shell.js koordinator tab/panel/history/dirty-guard/logout.
- 3 komponen panel Astro (markup existing dipindah apa adanya).
- Wrap 3 modul existing jadi lifecycle { mount(root), show(), hide(), isDirty(),
  teardown() } TANPA rewrite logic inti; scope byId ke panel.
- Route lama tetap valid (alias, no redirect).

Keputusan owner §7 (FINAL, jangan tanya lagi):
1. URL deep-link = alias via pushState/hash, tanpa redirect; route lama tetap 200
   dan pilih panel benar.
2. Keep-alive = semua panel hidup selama dokumen; "Muat ulang" manual per panel.
3. Dirty-guard = konfirmasi saat draft belum disimpan lalu pindah panel;
   beforeunload tetap saat close/refresh.
4. PII Pendaftar = keep-alive HANYA memori dokumen; TIDAK ada
   localStorage/sessionStorage/IndexedDB; reset saat reload/close/logout/401.

ATURAN KERAS (repo law):
- No push tanpa izin exact HEAD SHA BARU. Fase 2 = lokal saja; push gate terpisah
  dan harus diminta ulang.
- No SQL/Auth/grant/allowlist/env/provider/region/hook/Google mutation.
- Jangan ubah batas media (<=2MB, <=16MP, raster), auth, ACL, audit, kontrak
  server/RPC/endpoint.
- Jangan rusak snapshot cms-snapshot.json (SHA 4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857)
  dan parity HTML publik (hanya HTML admin yang boleh berubah).
- Satu pass fokus; JANGAN gabung dengan plan B v2 (Team photo fit) atau fitur lain.
- Jangan commit/push tanpa izin; commit lokal bila diminta.

QA wajib sebelum lapor selesai (Node22, CMS_DATA_SOURCE=local):
- npm run build -> 0 error / 23 pages.
- test:cms (94 PASS + 10 Team SKIP / 0 FAIL) & test:recruitment (42 PASS).
- verify:cms-native-admin + verify:cms-team-admin + verify:recruitment-review
  PASS 4 widths (320/390/768/1440) setelah disesuaikan ke shell.
- QA matrix §6 plan: pindah tab tidak fetch ulang (hitung request), deep-link,
  Cmd+Click, dirty-guard, logout/401 reset, overflow 4 widths.
- verify:visual exit0 browserErrors[]; audit:navbar, verify:vt, seo:audit,
  audit:spacing, format:check PASS.
- Snapshot tetap; HTML publik byte-identik; dist secrets 0.
Setelah semua PASS: lapor ringkas + minta izin push exact SHA (jangan push
sendiri). Update AGENTS.md + docs/ai-handoff.md + plan sebelum handoff.

Kalau ada ambiguitas di luar §7 atau konflik dengan source, STOP dan tanya gw;
jangan mengarang kebijakan. Kalau /tmp Node22 hilang, reinstall dulu.
```

Catatan untuk owner: prompt di atas adalah **teks untuk disalin**. Ganti kalimat
"gas" pada Fase 2 dengan izinmu saat siap. Push tetap butuh approval SHA
terpisah, walau Fase 2 diotorisasi.
