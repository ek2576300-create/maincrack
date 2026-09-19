/**
 * Лента YouTube-канала «Хроники Кракена» / Kraken Chronicles YouTube feed.
 *
 * Сайт не хранит выдуманных видео: список берётся из публичного RSS канала
 * (последние 15 роликов) и объединяется с файлом public/data/site/videos.json,
 * который наполняется скриптом scripts/import-youtube.mjs (полный список).
 * Сеть не обязательна — без неё отдаётся то, что лежит в файле, а последний
 * удачный ответ YouTube кэшируется на диск и переживает перезапуск сервера.
 *
 * Внешних зависимостей нет: fetch и парсер RSS — на голом Node 22.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const STATIC_FILE = path.join(ROOT, 'public', 'data', 'site', 'videos.json');
const DATA_DIR = process.env.KC_DATA_DIR
  ? path.resolve(ROOT, process.env.KC_DATA_DIR)
  : path.join(ROOT, 'server', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'youtube-cache.json');

export const CHANNEL_URL = process.env.KC_YT_CHANNEL_URL || 'https://www.youtube.com/@Kraken_Chronicles';
export const CHANNEL_HANDLE = '@' + (CHANNEL_URL.match(/@([\w.-]+)/)?.[1] || 'Kraken_Chronicles');

const TTL_MS = Math.max(1, Number(process.env.KC_YT_TTL_MINUTES || 60)) * 60_000;
const TIMEOUT_MS = Math.max(1000, Number(process.env.KC_YT_TIMEOUT_MS || 8000));
const FEED_URL = (channelId) => `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

/* ------------------------------------------------------------------ utils */
const decodeEntities = (s) => String(s ?? '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
  .replace(/&amp;/g, '&');

const tagText = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim();
};

const attr = (xml, tag, name) => {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${name}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : '';
};

const iso = (v) => {
  const d = new Date(v);
  return Number.isNaN(+d) ? null : d.toISOString();
};

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // Без человекообразного UA YouTube отдаёт урезанный consent-заглушку.
        'User-Agent': 'Mozilla/5.0 (compatible; KrakenChronicles/1.0; +https://github.com/)',
        'Accept-Language': 'ru,en;q=0.8',
      },
    });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------------------------------------- parsing */

/** Разобрать RSS-ленту канала в массив видео в формате сайта. */
export function parseFeed(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map((e) => {
    const id = tagText(e, 'yt:videoId');
    if (!id) return null;
    const rawViews = attr(e, 'media:statistics', 'views');   // может отсутствовать — тогда не 0, а «нет данных»
    const views = rawViews === '' ? null : Number(rawViews);
    return {
      id,
      title: tagText(e, 'title'),
      description: tagText(e, 'media:description'),
      published: iso(tagText(e, 'published')),
      updated: iso(tagText(e, 'updated')),
      thumbnail: attr(e, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      views: Number.isFinite(views) ? views : null,
      duration: null,
      tags: [],
      playlist: null,
    };
  }).filter(Boolean);
}

/** Достать channelId (UC…) со страницы канала — RSS работает только по нему. */
export async function resolveChannelId(channelUrl = CHANNEL_URL) {
  if (process.env.KC_YT_CHANNEL_ID) return process.env.KC_YT_CHANNEL_ID;
  const direct = channelUrl.match(/\/channel\/(UC[\w-]{20,})/);
  if (direct) return direct[1];
  const html = await fetchText(channelUrl);
  const m = html.match(/"(?:channelId|externalId)":"(UC[\w-]{20,})"/)
    || html.match(/channel_id=(UC[\w-]{20,})/)
    || html.match(/\/channel\/(UC[\w-]{20,})/);
  if (!m) throw new Error('channel_id_not_found');
  return m[1];
}

/* ----------------------------------------------------------------- state */
const readJsonSafe = (file, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};

const emptyDoc = () => ({
  channel: { handle: CHANNEL_HANDLE, url: CHANNEL_URL, id: null, title: {}, description: {} },
  playlists: [], items: [], updatedAt: null, source: 'manual',
});

/**
 * Слить курируемый файл и живую ленту.
 * Файл — источник правды по ручным полям (titleI18n, tags, playlist, pinned,
 * hidden); лента — по свежести, просмотрам и новым роликам.
 */
export function mergeItems(staticItems = [], liveItems = []) {
  const byId = new Map();
  for (const it of staticItems) if (it?.id) byId.set(it.id, { ...it });
  for (const live of liveItems) {
    const prev = byId.get(live.id);
    if (!prev) { byId.set(live.id, live); continue; }
    byId.set(live.id, {
      ...prev,
      title: prev.titleLocked ? prev.title : (live.title || prev.title),
      description: prev.description || live.description,
      published: prev.published || live.published,
      updated: live.updated || prev.updated,
      thumbnail: prev.thumbnail || live.thumbnail,
      views: live.views ?? prev.views ?? null,
    });
  }
  return [...byId.values()]
    .filter((it) => !it.hidden)
    .sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (new Date(b.published).getTime() || 0) - (new Date(a.published).getTime() || 0);
    });
}

let memo = { at: 0, payload: null, fileAt: 0 };

/** mtime курируемого файла — правка videos.json должна быть видна сразу. */
const staticMtime = () => { try { return fs.statSync(STATIC_FILE).mtimeMs; } catch { return 0; } };

/**
 * Полная лента канала для сайта.
 * Никогда не бросает исключение: при недоступной сети отдаёт последний
 * кэш/файл и кладёт причину в поле `error`, чтобы страница честно её показала.
 */
export async function getVideos({ force = false } = {}) {
  const fileAt = staticMtime();
  if (!force && memo.payload && memo.fileAt === fileAt && Date.now() - memo.at < TTL_MS) return memo.payload;

  const doc = readJsonSafe(STATIC_FILE, emptyDoc()) || emptyDoc();
  const cache = readJsonSafe(CACHE_FILE, null);

  let live = [];
  let channelId = doc.channel?.id || null;
  let error = null;
  let source = 'static';

  try {
    channelId = await resolveChannelId();
    live = parseFeed(await fetchText(FEED_URL(channelId)));
    source = 'youtube';
  } catch (e) {
    error = String(e?.message || e);
    // Сеть недоступна — берём последний удачный ответ с диска.
    if (cache?.items?.length) { live = cache.items; channelId = cache.channelId || channelId; source = 'cache'; }
  }

  if (source === 'youtube') {
    try {
      await fsp.mkdir(DATA_DIR, { recursive: true });
      await fsp.writeFile(CACHE_FILE, JSON.stringify({ channelId, fetchedAt: new Date().toISOString(), items: live }, null, 2));
    } catch { /* кэш — необязательная оптимизация, ошибка записи не критична */ }
  }

  const items = mergeItems(doc.items || [], live);
  const payload = {
    channel: {
      ...(doc.channel || {}),
      id: channelId,
      handle: doc.channel?.handle || CHANNEL_HANDLE,
      url: doc.channel?.url || CHANNEL_URL,
    },
    playlists: doc.playlists || [],
    items,
    count: items.length,
    source,
    error,
    fileUpdatedAt: doc.updatedAt || null,
    fetchedAt: new Date().toISOString(),
  };

  memo = { at: Date.now(), payload, fileAt };
  return payload;
}
