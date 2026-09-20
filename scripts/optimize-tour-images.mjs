/**
 * Tour media pipeline.
 * Reads raw assets from tour-source/ (gitignored, never committed to public/)
 * and writes optimized files into public/tour/<tour>/.
 *
 * Usage:  npm run tour:images            (defaults to the elite-3bhk tour)
 *         node scripts/optimize-tour-images.mjs <tourDirName>
 *
 * Sources (all optional except photos):
 *   tour-source/photos/<scene>.<ext>              -> <scene>.webp + <scene>-thumb.webp
 *   tour-source/variants/<sceneId>.<variantId>.<ext> -> <sceneId>.<variantId>.webp
 *     (aspect ratio must match the base scene image within 1% — mismatches
 *      are skipped with a loud warning)
 *   tour-source/floor-views/floor-<n>.<ext>       -> floor-<n>.webp + floor-<n>-thumb.webp
 *   tour-source/audio/<lang>/<sceneId>.mp3        -> audio/<lang>/<sceneId>.mp3
 *     (validated: <= 300 KB; best-effort mono / ~64 kbps header check —
 *      ffmpeg is not required but re-encode first if the checks warn:
 *      ffmpeg -i in.mp3 -ac 1 -b:a 64k out.mp3)
 *
 * Image rules (per project spec): WebP, <= 1 MB each, long side <= 2048px
 * (never upscaled), plus a 400px thumbnail per photo.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TOUR = process.argv[2] || 'elite-3bhk';
const ROOT = path.resolve('tour-source');
const SRC = path.join(ROOT, 'photos');
const OUT = path.resolve('public/tour', TOUR);

const MAX_SIDE = 2048;
const THUMB_SIDE = 400;
const FULL_Q = 82;
const THUMB_Q = 70;
const MAX_BYTES = 1024 * 1024;
const MAX_AUDIO_BYTES = 300 * 1024;
const IMG_RE = /\.(png|jpe?g|webp|avif)$/i;

const imgFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => IMG_RE.test(f)) : [];

async function writeWebp(input, outFile, { thumb = false } = {}) {
  const meta = await sharp(input).metadata();
  const longSide = Math.max(meta.width ?? 0, meta.height ?? 0);
  const scale = Math.min(1, MAX_SIDE / longSide); // never upscale
  const w = Math.round((meta.width ?? 0) * scale);
  const h = Math.round((meta.height ?? 0) * scale);
  await sharp(input)
    .resize({ width: w, height: h, withoutEnlargement: true })
    .webp({ quality: FULL_Q })
    .toFile(outFile);
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  return { meta, w, h, kb, over: fs.statSync(outFile).size > MAX_BYTES };
}

async function writeThumb(input, outFile) {
  await sharp(input)
    .resize({ width: THUMB_SIDE, height: THUMB_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_Q })
    .toFile(outFile);
  return Math.round(fs.statSync(outFile).size / 1024);
}

fs.mkdirSync(OUT, { recursive: true });
let emitted = 0;
let warnings = 0;
const warn = (msg) => {
  warnings++;
  console.log(`  !! ${msg}`);
};

/* ============================ 1. scene photos ============================ */
const photos = imgFiles(SRC);
if (!photos.length) {
  console.log(`No source photos in ${SRC} — skipping photo pass.`);
}
for (const file of photos) {
  const name = file.replace(/\.[^.]+$/, '');
  const input = path.join(SRC, file);
  const full = await writeWebp(input, path.join(OUT, `${name}.webp`));
  const thumbKb = await writeThumb(input, path.join(OUT, `${name}-thumb.webp`));
  emitted += 2;
  console.log(
    `photo ${name}: ${full.meta.width}x${full.meta.height} -> ${full.w}x${full.h}  ${full.kb} KB  (thumb ${thumbKb} KB)`
  );
  if (full.over) warn(`${name}.webp is over 1 MB — lower the source resolution or quality`);
}

/* ------------------------- 1b. portrait fallbacks -------------------------
   Every scene should have a portrait (<scene>-portrait.webp) for tall
   viewports. Real shot: drop <scene>-portrait.<ext> in photos/ and it is
   handled by the pass above. Otherwise we derive a centre-crop at 3:4 —
   the same aspect as the phone-shot portraits — so no scene ships
   landscape-only. */
const basePhotos = photos.filter((f) => !/-portrait\.[^.]+$/i.test(f));
for (const file of basePhotos) {
  const name = file.replace(/\.[^.]+$/, '');
  const hasPortrait = photos.some((f) =>
    f.toLowerCase().startsWith(`${name.toLowerCase()}-portrait.`)
  );
  if (hasPortrait) continue;
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  const iw = meta.width ?? 0;
  const ih = meta.height ?? 0;
  if (!iw || !ih) continue;
  const targetAR = 3 / 4; // width / height
  let cw = iw;
  let ch = ih;
  if (iw / ih > targetAR) cw = Math.round(ih * targetAR); // too wide -> crop sides
  else ch = Math.round(iw / targetAR); // too tall -> crop top/bottom
  const outFile = path.join(OUT, `${name}-portrait.webp`);
  await sharp(input)
    .extract({ left: Math.floor((iw - cw) / 2), top: Math.floor((ih - ch) / 2), width: cw, height: ch })
    .webp({ quality: FULL_Q })
    .toFile(outFile);
  emitted++;
  console.log(`photo ${name}-portrait: derived centre-crop ${cw}x${ch}  ${Math.round(fs.statSync(outFile).size / 1024)} KB`);
}

/* ============================ 2. scene variants ============================ */
// tour-source/variants/<sceneId>.<variantId>.<ext>
const VAR_SRC = path.join(ROOT, 'variants');
const sceneDims = {};
const dimOf = async (sceneId) => {
  if (sceneDims[sceneId]) return sceneDims[sceneId];
  const base = imgFiles(SRC).find((f) => f.replace(/\.[^.]+$/, '') === sceneId);
  if (!base) return null;
  const m = await sharp(path.join(SRC, base)).metadata();
  sceneDims[sceneId] = { w: m.width ?? 0, h: m.height ?? 0 };
  return sceneDims[sceneId];
};

for (const file of imgFiles(VAR_SRC)) {
  const stem = file.replace(/\.[^.]+$/, '');
  const dot = stem.indexOf('.');
  if (dot <= 0) {
    warn(`variants/${file} — expected <sceneId>.<variantId>.<ext>, skipped`);
    continue;
  }
  const sceneId = stem.slice(0, dot);
  const input = path.join(VAR_SRC, file);
  const base = await dimOf(sceneId);
  if (!base) {
    warn(`variants/${file} — no base photo "${sceneId}" in tour-source/photos to compare against, skipped`);
    continue;
  }
  const meta = await sharp(input).metadata();
  const arIn = (meta.width ?? 1) / (meta.height ?? 1);
  const arBase = base.w / base.h;
  if (Math.abs(arIn - arBase) / arBase > 0.01) {
    warn(
      `variants/${file} — aspect ${meta.width}x${meta.height} does not match base ${base.w}x${base.h} (>1% off), skipped`
    );
    continue;
  }
  const full = await writeWebp(input, path.join(OUT, `${stem}.webp`));
  emitted++;
  console.log(`variant ${stem}: ${meta.width}x${meta.height} -> ${full.w}x${full.h}  ${full.kb} KB`);
  if (full.over) warn(`${stem}.webp is over 1 MB — lower the source resolution or quality`);
}

/* ============================ 3. floor views ============================ */
// tour-source/floor-views/floor-<n>.<ext>
const FLOOR_SRC = path.join(ROOT, 'floor-views');
for (const file of imgFiles(FLOOR_SRC)) {
  const stem = file.replace(/\.[^.]+$/, '');
  if (!/^floor-\d+$/.test(stem)) {
    warn(`floor-views/${file} — expected floor-<n>.<ext>, skipped`);
    continue;
  }
  const input = path.join(FLOOR_SRC, file);
  const full = await writeWebp(input, path.join(OUT, `${stem}.webp`));
  const thumbKb = await writeThumb(input, path.join(OUT, `${stem}-thumb.webp`));
  emitted += 2;
  console.log(
    `floor ${stem}: ${full.meta.width}x${full.meta.height} -> ${full.w}x${full.h}  ${full.kb} KB  (thumb ${thumbKb} KB)`
  );
  if (full.over) warn(`${stem}.webp is over 1 MB — lower the source resolution or quality`);
}

/* ============================ 4. narration audio ============================ */
// tour-source/audio/<lang>/<sceneId>.mp3 — mono, ~64 kbps, <= 300 KB.
// ffmpeg isn't assumed: files are validated and copied as-is.
const AUDIO_SRC = path.join(ROOT, 'audio');

/** best-effort MP3 frame header check: { mono, kbps } or null when unparseable */
function mp3Info(buf) {
  let i = 0;
  // skip ID3v2 tag
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    const size =
      ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    i = 10 + size;
  }
  while (i + 4 < buf.length && !(buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0)) i++;
  if (i + 4 >= buf.length) return null;
  const b1 = buf[i + 1];
  const b2 = buf[i + 2];
  const b3 = buf[i + 3];
  const versionBits = (b1 >> 3) & 0x3; // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
  const layerBits = (b1 >> 1) & 0x3; // 1 = Layer III
  const bitrateIdx = (b2 >> 4) & 0xf;
  const mono = ((b3 >> 6) & 0x3) === 3;
  if (layerBits !== 1 || bitrateIdx === 0 || bitrateIdx === 15) return { mono, kbps: null };
  const mpeg1 = versionBits === 3;
  const table = mpeg1
    ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  return { mono, kbps: table[bitrateIdx] ?? null };
}

if (fs.existsSync(AUDIO_SRC)) {
  for (const lang of fs.readdirSync(AUDIO_SRC)) {
    const langDir = path.join(AUDIO_SRC, lang);
    if (!fs.statSync(langDir).isDirectory()) continue;
    const outDir = path.join(OUT, 'audio', lang);
    for (const file of fs.readdirSync(langDir)) {
      if (!/\.mp3$/i.test(file)) {
        warn(`audio/${lang}/${file} — narration must be .mp3, skipped`);
        continue;
      }
      const input = path.join(langDir, file);
      const bytes = fs.statSync(input).size;
      if (bytes > MAX_AUDIO_BYTES) {
        warn(
          `audio/${lang}/${file} is ${Math.round(bytes / 1024)} KB — over the 300 KB cap, skipped. ` +
            `Re-encode: ffmpeg -i "${file}" -ac 1 -b:a 64k out.mp3`
        );
        continue;
      }
      const info = mp3Info(fs.readFileSync(input));
      if (!info) {
        warn(`audio/${lang}/${file} — could not parse MP3 headers; verify it is mono 64 kbps`);
      } else {
        if (!info.mono)
          warn(`audio/${lang}/${file} is not mono — re-encode with -ac 1 for consistent loudness`);
        if (info.kbps && (info.kbps < 48 || info.kbps > 96))
          warn(`audio/${lang}/${file} is ${info.kbps} kbps — target ~64 kbps`);
      }
      fs.mkdirSync(outDir, { recursive: true });
      fs.copyFileSync(input, path.join(outDir, file));
      emitted++;
      console.log(
        `audio ${lang}/${file}: ${Math.round(bytes / 1024)} KB${info?.kbps ? `, ~${info.kbps} kbps` : ''}${info ? (info.mono ? ', mono' : ', STEREO') : ''}`
      );
    }
  }
}

console.log(`\nDone. ${emitted} file(s) written to ${OUT}${warnings ? ` — ${warnings} warning(s) above` : ''}`);
