/**
 * Tour image pipeline.
 * Reads raw photos from tour-source/photos/ (gitignored, never committed to public/)
 * and writes optimized WebP into public/tour/<tour>/.
 *
 * Usage:  npm run tour:images            (defaults to the elite-3bhk tour)
 *         node scripts/optimize-tour-images.mjs <tourDirName>
 *
 * Rules (per project spec): WebP, <= 1 MB each, long side <= 2048px
 * (never upscaled), plus a 400px thumbnail per scene.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TOUR = process.argv[2] || 'elite-3bhk';
const SRC = path.resolve('tour-source/photos');
const OUT = path.resolve('public/tour', TOUR);

const MAX_SIDE = 2048;
const THUMB_SIDE = 400;
const FULL_Q = 82;
const THUMB_Q = 70;
const MAX_BYTES = 1024 * 1024;

const files = fs
  .readdirSync(SRC)
  .filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f));

if (!files.length) {
  console.error(`No source photos found in ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

for (const file of files) {
  const name = file.replace(/\.[^.]+$/, '');
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  const longSide = Math.max(meta.width ?? 0, meta.height ?? 0);
  const scale = Math.min(1, MAX_SIDE / longSide); // never upscale

  const fullOut = path.join(OUT, `${name}.webp`);
  await sharp(input)
    .resize({
      width: Math.round((meta.width ?? 0) * scale),
      height: Math.round((meta.height ?? 0) * scale),
      withoutEnlargement: true,
    })
    .webp({ quality: FULL_Q })
    .toFile(fullOut);

  const thumbOut = path.join(OUT, `${name}-thumb.webp`);
  await sharp(input)
    .resize({ width: THUMB_SIDE, height: THUMB_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_Q })
    .toFile(thumbOut);

  const fullKb = Math.round(fs.statSync(fullOut).size / 1024);
  const thumbKb = Math.round(fs.statSync(thumbOut).size / 1024);
  const flag = fullKb * 1024 > MAX_BYTES ? '  <-- OVER 1 MB, re-check quality' : '';
  console.log(
    `${name}: ${meta.width}x${meta.height} -> ${Math.round(meta.width * scale)}x${Math.round(meta.height * scale)}  ${fullKb} KB  (thumb ${thumbKb} KB)${flag}`
  );
}

console.log(`\nDone. Output in ${OUT}`);
