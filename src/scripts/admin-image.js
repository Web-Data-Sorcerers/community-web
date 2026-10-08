// Shared browser prep for admin media uploads. Keeps server security bounds
// (<=2 MB, <=16 MP, raster only) while making normal camera/screenshot photos
// upload cleanly by downscaling in the browser first.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_PIXELS = 16 * 1000 * 1000;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function drawToCanvas(bitmap, scale) {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function encode(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImageForUpload(file) {
  if (!file || !ACCEPTED_TYPES.includes(file.type)) return { error: 'type' };
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: 'decode' };
  }
  const pixels = bitmap.width * bitmap.height;
  if (file.size <= MAX_UPLOAD_BYTES && pixels <= MAX_UPLOAD_PIXELS) {
    bitmap.close?.();
    return { blob: file, type: file.type, converted: false };
  }
  const scale =
    pixels > MAX_UPLOAD_PIXELS
      ? Math.sqrt(MAX_UPLOAD_PIXELS / pixels)
      : Math.min(1, 3200 / Math.max(bitmap.width, bitmap.height));
  const canvas = drawToCanvas(bitmap, scale);
  bitmap.close?.();
  for (const [type, quality] of [
    ['image/webp', 0.86],
    ['image/webp', 0.74],
    ['image/webp', 0.6],
    ['image/jpeg', 0.8],
    ['image/jpeg', 0.62],
  ]) {
    const blob = await encode(canvas, type, quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES)
      return { blob, type, converted: true };
  }
  return { error: 'size' };
}
