import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const source = 'assets/on development/ondp.png';
const output = 'public/images/on-development';
await mkdir(output, { recursive: true });
const { width, height } = await sharp(source).metadata();
if (width !== 1672 || height !== 941) {
  throw new Error(
    'Background dimensions changed; review crop and srcset first.',
  );
}
for (const size of [1280, 1672]) {
  await sharp(source)
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(`${output}/chamber${size === 1672 ? '' : '-1280'}.webp`);
}
// Keep the castle and portal in a portrait crop, with space for readable copy.
for (const size of [640, 752]) {
  await sharp(source)
    .extract({ left: 792, top: 0, width: 752, height: 941 })
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(`${output}/chamber-mobile-${size}.webp`);
}
