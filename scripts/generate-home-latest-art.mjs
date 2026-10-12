// Owner-approved Home artwork; preserve native detail without enlargement.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const source = 'assets/background/terbaru.png';
const { width } = await sharp(source).metadata();
if (width !== 1586)
  throw new Error('Review srcset before changing artwork dimensions');
await mkdir('public/images/hero', { recursive: true });
for (const size of [1440, 1586]) {
  await sharp(source)
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 96, effort: 6 })
    .toFile(`public/images/hero/latest-${size}.webp`);
}
