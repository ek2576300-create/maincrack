#!/usr/bin/env node
/**
 * Сборка логотипов и фавикона из исходников в public/static/img/brand/src/.
 *
 *     npm i --no-save sharp && node scripts/build-brand.mjs
 *
 * Сервер остаётся без зависимостей — sharp нужен только здесь и только когда
 * исходную графику меняют. Готовые файлы лежат в репозитории, так что для
 * запуска сайта скрипт не нужен.
 *
 * Исходники:
 *   src/mark.jpg    круглая эмблема «Хроники Кракена» на белом фоне (160×160)
 *   src/banner.jpg  широкий баннер Kraken Chronicles (1707×282)
 *
 * Что получается:
 *   mark.png                круг с прозрачными углами — шапка сайта
 *   mark-<N>.png            то же под иконки вкладки (16…192)
 *   apple-touch-icon.png    180×180 на фоне --bg: iOS прозрачность не умеет
 *   banner.jpg / -1200 / -800   баннер под srcset
 *   og-cover.jpg            1200×630 для соцсетей и превью в мессенджерах
 *   /favicon.ico            16+32+48 в одном контейнере
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = path.join(ROOT, 'public', 'static', 'img', 'brand');
const SRC = path.join(BRAND, 'src');

const BG = '#0c0d0e';           // --bg из kraken.css
const MARK_SIZE = 160;          // исходник эмблемы — 160×160, крупнее взять неоткуда
const ICON_SIZES = [16, 32, 48, 64, 96, 192];
const ICO_SIZES = [16, 32, 48];

/* ------------------------------------------------------------------ mark */

/**
 * Эмблема нарисована кругом, вписанным в квадрат, а углы залиты белым.
 * Вырезаем круг по альфе, радиус на пиксель меньше — иначе по краю остаётся
 * светлая кайма от артефактов JPEG.
 */
async function roundMark(size) {
  const r = size / 2 - Math.max(1, Math.round(size / 160));
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#fff"/></svg>`,
  );
  // Эмблема фотографическая, и выше 48 пикселей полноцветный PNG раздувается
  // в сотни килобайт ради иконки вкладки. Палитра на 256 цветов даёт тот же
  // рисунок в разы меньше — на этих размерах разницу не видно.
  const png = size > 48
    ? { palette: true, quality: 92, effort: 10, compressionLevel: 9 }
    : { compressionLevel: 9 };
  return sharp(path.join(SRC, 'mark.jpg'))
    .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png(png)
    .toBuffer();
}

/* ------------------------------------------------------------------- ico */

/** Контейнер ICO с PNG внутри — так же устроен фавикон, лежавший тут раньше. */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);   // 0 означает 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);                        // палитра не используется
    e.writeUInt8(0, 3);                        // reserved
    e.writeUInt16LE(1, 4);                     // planes
    e.writeUInt16LE(32, 6);                    // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

/* ---------------------------------------------------------------- banner */

async function banners() {
  const src = path.join(SRC, 'banner.jpg');
  const { width } = await sharp(src).metadata();
  for (const w of [width, 1200, 800]) {
    const name = w === width ? 'banner.jpg' : `banner-${w}.jpg`;
    await sharp(src)
      .resize(w, null, { kernel: 'lanczos3', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true, progressive: true })
      .toFile(path.join(BRAND, name));
  }
}

/**
 * Баннер узкий (6:1), а соцсети ждут 1200×630. Кроп съел бы половину
 * картинки, поэтому фон — тот же баннер, растянутый и размытый, а поверх
 * него баннер целиком.
 */
async function ogCover() {
  const src = path.join(SRC, 'banner.jpg');
  const bg = await sharp(src)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .blur(26)
    .modulate({ brightness: 0.45 })
    .toBuffer();
  const fg = await sharp(src).resize(1200, null, { kernel: 'lanczos3' }).toBuffer();

  await sharp({ create: { width: 1200, height: 630, channels: 3, background: BG } })
    .composite([{ input: bg }, { input: fg, gravity: 'centre' }])
    .jpeg({ quality: 88, mozjpeg: true, progressive: true })
    .toFile(path.join(BRAND, 'og-cover.jpg'));
}

/* ------------------------------------------------------------------ run */

await fs.mkdir(BRAND, { recursive: true });

await fs.writeFile(path.join(BRAND, 'mark.png'), await roundMark(MARK_SIZE));
for (const size of ICON_SIZES) {
  await fs.writeFile(path.join(BRAND, `mark-${size}.png`), await roundMark(size));
}

// iOS обрезает иконку сам и игнорирует альфу, поэтому кладём круг на фон.
await sharp({ create: { width: 180, height: 180, channels: 3, background: BG } })
  .composite([{ input: await roundMark(164), gravity: 'centre' }])
  .png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 })
  .toFile(path.join(BRAND, 'apple-touch-icon.png'));

const ico = buildIco(await Promise.all(
  ICO_SIZES.map(async (size) => ({ size, data: await roundMark(size) })),
));
await fs.writeFile(path.join(ROOT, 'public', 'favicon.ico'), ico);

await banners();
await ogCover();

const made = (await fs.readdir(BRAND)).filter((f) => !f.startsWith('.') && f !== 'src').sort();
console.log(`public/static/img/brand/: ${made.join(', ')}`);
console.log(`public/favicon.ico: ${ICO_SIZES.join('+')} (${ico.length} Б)`);
