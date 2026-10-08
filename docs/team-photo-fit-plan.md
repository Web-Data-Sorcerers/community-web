# Team photo fit — per-section plan (8 Oct 2026)

Owner meminta foto upload otomatis menyesuaikan kartu pada screenshot. Scope
lokal: rendering foto Team, tanpa CMS content/media write, migration atau push.

Section existing Our Team, About Us: Figma file `JYUzJK1hFqaEwL6DpdDvjp`,
[node 1688:2933](https://www.figma.com/design/JYUzJK1hFqaEwL6DpdDvjp/?node-id=1688-2933),
component set1594:5145. Reference existing
`assets/about-us/team/OurTeam-New-1x.png`1440×1562. User screenshot adalah bukti
bug foto biasa; bukan node Figma baru atau reference seluruh section.

Satu section dalam pass ini: Our Team. Kartu302×400/radius10, gap24;
section padding80, header→groups48, groups gap80, carousel gap72.
Existing heading Bluu Next Bold700/56/67, body Manrope; nama700/22/33,
role400/16/24. Artwork frame295×277@(3,13), fade302×153@(0,247),
info217wide@(42,284), ring/fade/domain colors tetap existing.

Penyebab: uploaded photo mewarisi top-42/height442 milik potret transparan,
sedangkan OurTeam membuka overflow untuk portrait bleed. Foto opaque ikut
keluar dari kartu. Perbaikan hanya selector uploaded: top0,width100%,height100%,
object-fit cover, object-position center, border-radius inherit. Gambar mengisi
kartu tanpa stretch; crop simetris mengikuti rasio input. Ini bukan deteksi wajah
atau background removal; wajah di tepi foto masih bisa terpotong oleh cover.
Preset baked transparent tetap memakai geometri Figma/bleed yang diterima.

Verifikasi: browser actual built CSS pada320/390/768/1440 dengan synthetic
portrait/landscape/square di leader dan HoDS; image box sama dengan card,
radius/crop proporsional, nama/role/fade tetap terbaca, tanpa page error atau
document overflow. Baseline geometry/reference assertions tetap; compare
section screenshot sebelum/sesudah, snapshot unchanged. Run7gates+SEO.
Proof synthetic ignored, tidak membaca/menulis foto owner dari live Storage.

Status: implementasi lokal selesai; Node22.23.0 build0errors/23pages,7gates+SEO
PASS/responsive468/468/spacing39. Synthetic24cases leader+HoDS,3rasio×4widths
PASS/image bounds exact/cover center/radius10/pageerrors0; baseline Team section
pixels byte exact dan snapshot unchanged. Actual owner photo/media upload/live
acceptance tidak diulang. Proof ignored artifacts/team-photo-fit/.
Production tetap14e62af;
perubahan ini belum deployed. Push memerlukan izin exact SHA baru.
