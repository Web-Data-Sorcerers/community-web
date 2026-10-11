# Kickoff for a new AI: Pages & Sections

Execution update, 11 Oct 2026: owner submitted the local implementation request.
P0–P6 execution and actual QA evidence are recorded in
[page-section-visibility-local.md](page-section-visibility-local.md).
Original planning/kickoff text below remains the specification/history; its
“documentation only” status no longer describes this authorized local pass.
Production actions and commit/push remain separately unauthorized.

Copy the following prompt to start LOCAL implementation when the owner is ready.
The prompt is not an authorization already given in the planning session.

```text
Implementasikan lokal kontrol Pages & Sections sesuai master plan.

Baca seluruh HANDOVER.md dan AGENTS.md, lalu
docs/page-section-visibility-plan.md,
docs/on-development-plan.md dan docs/pixel-precision-sop.md.
Periksa git status/diff; preserve perubahan existing dan jangan reset/stash.

Target: tab keempat admin untuk aktif/nonaktif page dan section. Halaman off
menampilkan Page Under Development dengan background ondp.png yang sudah
diimplementasikan; section off tidak dirender dan data tetap tersimpan.
Home selalu aktif. About Us dan Hall of Frames tetap under development secara
default. Section home.projects awalnya preserve baseline; siapkan kontrol untuk
owner menonaktifkannya. Jangan melakukan mutation production dari prompt ini.

Ikuti arsitektur rekomendasi runtime SSR selektif: sesudah save confirmed,
kunjungan berikutnya membaca status terbaru tanpa menunggu rebuild. Lakukan
spike Astro7/Vercel lokal dahulu, buktikan routing api/media tetap bekerja,
prefetch/ClientRouter tidak menyajikan state stale, lalu lanjut P2-P6.
Jangan mengklaim 0ms atau update otomatis tab pengunjung yang sudah terbuka.

Reuse shared CMS Auth/Origin/CSRF. Tambahkan registry/kontrak/SQL additive lokal,
API settings, panel admin, conditional render, link dependency dan QA.
Jangan menambah visibility ke schema snapshot CMS enam collection.
Jangan panggil deploy hook ketika menyimpan visibility.
Jangan mengubah RECRUITMENT_OPEN atau Auth user/grant/allowlist.

Halaman detail HoDS/roles/apply ikut registry dan aturan parent. Navbar/Footer
tetap mengizinkan membuka page under development; tombol rekomendasi hanya
menuju page aktif. CTA ke section hidden harus ikut hilang atau Back memakai
fallback parent page yang jelas. Restore original About/HoF compositions untuk
mode active tanpa merusak typography/geometri/component existing.

Kerjakan berurutan P0-P6 dan satu page/section per pass. Patuhi ZERO EMOTE,
STRICT 8-POINT SPACING dan Bluu Next + Manrope serta Button existing.
Lakukan QA meaningful contract/DB/auth/race/admin/public/SSR/no-JS/SEO.
Update handover dan laporkan bukti serta risiko runtime/performance.

Izin ini hanya implementasi lokal dan QA dengan fixture lokal/ephemeral.
SQL production, config/provider mutation, deployment atau live toggle/restore
memerlukan review konkret dan otorisasi owner setelah hasil siap ditinjau.
Dilarang git commit atau push sampai saya berkata 'commit dan push'.
Jangan bertanya ulang untuk pilihan rutin yang sudah tertulis dalam plan.
Jika spike menemukan blocker arsitektur, jelaskan bukti dan opsi sebelum
mengganti target instant menjadi static+rebuild.
```

Handoff success checklist:

- Required documents read and working tree mapped.
- Architecture spike proven before committing to broad SSR changes.
- Local implementation authorized by owner using the prompt above or equivalent.
- Live changes remain separate from local implementation.
- Master plan is the source of IDs, behaviors, API/DB contracts and QA gates.
