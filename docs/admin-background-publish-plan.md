# Admin save — background publish (waitUntil) — master plan A2b

**STATUS: implementasi lokal + QA PASS; belum push/deploy. Butuh izin exact HEAD
SHA baru untuk push.**

8 Oct 2026. Owner memilih **A2b**: response save Team/Projects balik cepat tanpa
menunggu `callDeployHooks` (yang kini di-`await` sampai 30s), rebuild tetap jalan
di belakang pakai `waitUntil()` dari `@vercel/functions`. Plan ini awalnya **PLAN
ONLY**; kini sudah diimplementasi lokal (lihat §11 hasil).

Dasar keputusan: [checkpoint AGENTS](../AGENTS.md) + temuan sesi (upload foto
Team/bagus → save publish dirasa lama oleh owner). Masalah foto upload (bagian B)
**ditunda** oleh owner; plan ini hanya bagian A2b.

## 1. Masalah dan tujuan

Saat owner klik **Simpan dan terbitkan** (Team/Projects), alur server sekarang:

```
POST /api/admin/team
  → auth.authorize (getUser + cms_verify_admin)
  → queryWrite(management API /database/query)   ~0.5–1s
  → await callDeployHooks()                       ≤30s (timeout) + request ke Vercel
  → return { data, publication: [...] }
```

`callDeployHooks` memanggil deploy hook Vercel production lalu **menunggu
response**. Hook menerima request dengan `res.ok`, tapi **rebuild Astro statis
Vercel 1–2 menit** jalan terpisah. Response save **tidak** menunggu build, tapi
masih menunggu hook HTTP round-trip (bisa lambat jika Vercel deploy API lambat).

**Tujuan A2b:**

- Response `save`/`add`/`delete`/`retry` balik **tanpa menunggu** `callDeployHooks`.
- Hook tetap **dijamin jalan** di serverless (bukan fire-and-forget yang bisa
  di-kill) → pakai `waitUntil()`.
- Tidak mengubah kontrak data save (revision, affectedId, dsb). `publication`
  hasil hook **tidak lagi** tersedia sinkron di response save; UI menyesuaikan.

**Bukan tujuan:** mempercepat rebuild Vercel (1–2 menit itu normal untuk static
site). Tidak mengubah arsitektur ke SSR/ISR. Tidak mengubah batas media/auth.

## 2. Bukti source (read-only, sesi ini)

- `server/cms-admin.mjs`:
  - Team: baris 326-345 — `save/add/delete` → `queryWrite` lalu
    `await callDeployHooks()`; `retry` → `await callDeployHooks()` (347-350).
  - Projects: baris 426-450 — pola identik.
  - `callDeployHooks` Team (299-320) & Projects (399-420): loop 1 hook
    (`production`), `fetchImpl` POST, `AbortSignal.timeout(30000)`,
    `results.push({ target, accepted: res.ok })`.
- `api/admin/team.js` — `export default { fetch: (request) => handle(request,'team') }`.
- `vercel.json` — `functions["api/admin/**/*.js"].maxDuration = 90`. **waitUntil
  punya budget 90s**, hook timeout 30s → aman.
- Dependency saat ini (`package.json`): `@supabase/supabase-js`, `astro`, `gsap`,
  `sharp`. **Belum ada** `@vercel/functions`.
- `src/scripts/cms-team-editor.js`: `mutate()` (248-277) setScope mutation,
  `await rpc(operation, {...})`, lalu `publication(result.data.publication)`.
  `publication()` (195-204) baca `results.every(p=>p.accepted)`.
- `src/scripts/cms-admin-editor.js` — pola Projects (perlu dikonfirmasi saat
  implementasi).

## 3. Referensi API `waitUntil`

Dari dokumentasi resmi (`@vercel/functions`, dikonfirmasi Context7):

```js
import { waitUntil } from '@vercel/functions';

export function GET(request) {
  waitUntil(fetch('https://vercel.com')); // background, tidak blok response
  return new Response('OK');
}
```

- `waitUntil(promise)` memperpanjang lifetime handler sampai promise selesai.
- Node runtime meng-`await` semua waitUntil saat shutdown, dibatasi
  **`maxDuration`** (di sini 90s). Jika lewat → warning + proses tetap shutdown.
- Mirror dari `ExtendableEvent.waitUntil`.

## 4. Perubahan konkret

### 4.1 Dependency baru (butuh izin owner)

- Tambah `@vercel/functions` ke `dependencies` (`package.json` + lockfile).
- Ini **satu-satunya dependency baru**; tidak ada lain. Bundle server-only,
  tidak masuk bundle publik.

### 4.2 `server/cms-admin.mjs`

- Import: `import { waitUntil } from '@vercel/functions';` (top-level).
- **Team** (`save/add/delete`): ganti
  ```js
  const publication = await callDeployHooks();
  result.publication = publication; result.publicationPending = ...;
  return sanitize({ ok:true, data:result });
  ```
  menjadi:
  ```js
  waitUntil(callDeployHooks()); // background, dijamin jalan
  result.publicationPending = true; // indikatif: build dimulai
  delete result.publication; // tidak ada hasil sinkron
  return sanitize({ ok: true, data: result });
  ```
  (Field final ditentukan saat implementasi; `sanitize` tetap strip field
  upstream. Contract data save tidak menambah field baru sensitif.)
- **Projects**: pola identik.
- **`retry`**: `waitUntil(callDeployHooks()); return sanitize({ ok:true,
data:{ publication: [] , publicationPending:true } })` — atau bentuk ekuivalen
  yang tidak mengklaim hasil hook.
- **Penting:** `waitUntil` hanya menerima Promise; `callDeployHooks()` sudah
  mengembalikan Promise. Pastikan tidak ada `await` sebelum `waitUntil` yang
  membuat promise jalan dua kali.
- **Nilai `accepted` hilang dari response save** — UI tidak boleh lagi
  mengandalkan `publication[i].accepted`. Konsekuensi: bila hook gagal, user
  **tidak tahu** langsung dari response; recovery lewat tombol **Coba terbitkan
  lagi** yang tetap memakai `retry`.

### 4.3 `src/scripts/cms-team-editor.js` + `cms-admin-editor.js`

- `mutate()` sukses: pesan **"Perubahan tersimpan. Penerbitan dimulai di
  belakang layar."** (bukan "Penerbitan dimulai untuk production" yang mengklaim
  `accepted`).
- `publication(results)` disesuaikan: karena response save tidak lagi membawa
  `results.accepted` sinkron, fungsi membaca `publicationPending` (indikatif)
  atau di-render sebagai "build dimulai". Tombol **Coba terbitkan lagi** tetap
  tampil sampai `retry` sukses.
- `retry` tetap bisa dipakai bila user merasa build tidak jalan; `retry` juga
  pakai waitUntil (background) — feedback "Penerbitan diminta lagi."
- Tidak ada perubahan pada draft-guard, scoped busy, atau alur upload.

## 5. Kontrak response (sebelum vs sesudah)

| Field                     | Sebelum                       | Sesudah (A2b)              |
| ------------------------- | ----------------------------- | -------------------------- |
| `data.revision`           | ada                           | ada (tidak berubah)        |
| `data.affectedId`         | ada                           | ada                        |
| `data.publication`        | `[{target,accepted}]`         | **tidak ada** (background) |
| `data.publicationPending` | `publication.some(!accepted)` | **`true`** (build dimulai) |

Kontrak publik save menyusut (field `publication` hilang) — ini **breaking untuk
UI lama**, jadi UI baru + server harus rilis bersama dalam satu deploy.

## 6. QA (lokal, sebelum push)

- `npm ci` (dengan `@vercel/functions`), `npm run build` → 0 error.
- `npm run test:cms` — sesuaikan test `server/cms-admin` mock: save tidak lagi
  mengembalikan `publication` sinkron; pastikan `callDeployHooks` **dipanggil**
  (spy) meski response balik cepat. Tambah/ubah assertion.
- Mock Team + Projects 320/390/768/1440: save → pesan "Penerbitan dimulai",
  tidak ada klaim `accepted`.
- Ukur lokal: waktu response save mock (harus jauh < waktu hook, bukan nunggu
  30s).
- Snapshot `4345f1…4857` tetap; 19–20 HTML publik byte-identik.
- 7 gate + SEO PASS.

**Batasan bukti:** mock **tidak bisa** membuktikan `waitUntil` benar-benar
menahan function di Vercel production. Hanya deploy live + klik Simpan + cek
Vercel deployment list (apakah rebuild muncul) yang membuktikan. Ini acceptance
terpisah setelah deploy.

## 7. Risiko

| Risiko                                             | Mitigasi                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `waitUntil` tidak didukung di runtime yang dipakai | Verifikasi Node runtime Vercel ≥ yang mensupport `@vercel/functions`; cek di live setelah deploy |
| Hook gagal → user tidak tahu                       | Tombol Coba terbitkan lagi tetap ada; copy jujur "penerbitan dimulai" bukan "selesai"            |
| maxDuration 90s dilewati → hook di-kill            | Hook timeout 30s < 90s; aman. Jika hook >30s → gagal dan di-log Vercel                           |
| New dependency ditolak policy                      | Owner **sudah approve A2b** di sesi ini (dependency `@vercel/functions` disetujui)               |
| Breaking contract bila deploy parsial              | Server + UI satu commit/PR, satu push                                                            |

## 8. Release / rollback

- Satu commit (server + UI + test + `package.json`/lock).
- Push `origin main` (satu URL community-web) setelah izin **exact HEAD SHA**.
- Setelah READY: klik Simpan di `/admin/team/` pada production, cek deployment
  Vercel muncul (rebuild triggered) meski response cepat.
- Rollback: `git revert` commit → deploy ulang; tidak ada perubahan SQL/env/
  schema, jadi rollback murni kode.

## 9. Yang TIDAK dilakukan

- Tidak mengubah batas media (≤2MB, ≤16MP, raster), auth, ACL, audit.
- Tidak mengubah SQL/RPC/grant/allowlist/env/provider/Storage/hook URL.
- Tidak mengubah public HTML, snapshot, intake form.
- Tidak menyentuh bagian B (foto upload fit) — owner tunda.
- Tidak mempercepat rebuild Vercel (di luar scope; build static 1–2 menit normal).

## 10. Definisi selesai (DoD)

1. Plan disetujui owner (dokumen ini).
2. Dependency `@vercel/functions` ditambah + lockfile.
3. Server save/add/delete/retry pakai `waitUntil`; response tidak menunggu hook.
4. UI copy + `publication()` disesuaikan; tombol retry tetap berfungsi.
5. Test mock disesuaikan + PASS.
6. Locak QA: build 0 error, test:cms PASS, snapshot+public HTML exact, 7 gate+SEO.
7. Izin exact HEAD SHA → satu push → READY.
8. Live acceptance: save cepat + rebuild Vercel tetap jalan (bukti deployment).
9. Checkpoint AGENTS/handoff + docs diperbarui.

## 11. Hasil implementasi lokal + QA (8 Oct 2026)

Owner approve A2b (`gasss`). Dependency `@vercel/functions@^3.9.11` terpasang
(`package.json` + lockfile). Perubahan kode:

- `server/cms-admin.mjs`: import `waitUntil` + helper `runInBackground` (fallback
  no-op tanpa konteks Vercel, aman di Node lokal/test). Team + Projects
  `save/add/delete/retry` kini panggil `runInBackground(callDeployHooks())`,
  hapus `result.publication`, set `result.publicationPending = true`, return
  sebelum hook resolve. `sanitize` menerima response yang hanya membawa
  `publicationPending` (tanpa `projects/members/image/media`) dan men-set
  `out.publicationPending`.
- `src/scripts/cms-admin-editor.js`: `publicationMessage(saved)` tidak lagi baca
  `accepted`; pesan `"Perubahan tersimpan. Penerbitan dimulai di belakang
layar..."`; tombol retry tetap tampil sebagai recovery.
- `src/scripts/cms-team-editor.js`: `publication()` tanpa argumen, pesan sama;
  retry tetap.
- `tests/cms-native-admin.test.mjs`: test publikasi jadi
  `CMS publication fires in background; save returns before the hook resolves`
  — assert `publication === undefined`, `publicationPending === true`, hook tetap
  dipanggil sekali (settle microtask), production-only, no `/database/query` di
  retry.
- `scripts/verify-cms-native-admin.mjs` + `scripts/verify-cms-team-admin.mjs`:
  mock balikin `publicationPending: true` (bukan `publication`), assertion pesan
  baru; `partial` dihapus.

QA Node22.23.0 `CMS_DATA_SOURCE=local`:

- `node --test tests/cms*.test.mjs` → **94 PASS + 10 SKIP / 0 FAIL** (setara
  baseline).
- `npm run build` → **0 error / 23 pages**.
- Parity: baseline HEAD vs working tree → hanya **2 HTML admin** berubah; 21 HTML
  publik + semua aset byte-identik; snapshot `4345f1…4857` tetap.
- `verify:cms-native-admin` + `verify:cms-team-admin` → **PASS 4 widths**
  (320/390/768/1440) termasuk save/retry/conflict/upload.
- `verify:visual` exit 0 `browserErrors: []`; `audit:navbar` ALL PASS;
  `verify:vt` PASS pageerrors none; `seo:audit` PASS 23 pages; `audit:spacing`
  PASS 39 komponen; `git diff --check` bersih; dist tidak memuat secret.
- Format `prettier` bersih untuk semua file yang diubah.

**Batasan bukti (penting):** mock lokal **tidak** membuktikan `waitUntil`
benar-benar menahan function Vercel production. Live acceptance (klik Simpan di
`/admin/team/` production → cek daftar deployment Vercel tetap menambah rebuild
meski response cepat) **wajib** setelah deploy. `accepted` hilang dari response
save, jadi kegagalan hook tidak lagi terlihat langsung — recovery via tombol
**Coba terbitkan lagi** (retry).

Belum push/deploy. Production saat ini `6fc5085`. Push perlu izin **exact HEAD
SHA baru**.
