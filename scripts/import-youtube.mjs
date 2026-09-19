#!/usr/bin/env node
/**
 * Импорт списка видео канала «Хроники Кракена» в public/data/site/videos.json.
 *
 *   node scripts/import-youtube.mjs                # RSS: последние 15 роликов
 *   KC_YT_API_KEY=... node scripts/import-youtube.mjs   # YouTube Data API: весь канал
 *   node scripts/import-youtube.mjs --dry-run      # показать, ничего не писать
 *
 * Ручные поля существующих записей (titleI18n, note, tags, playlist, pinned,
 * hidden, titleLocked) сохраняются — скрипт обновляет только то, что пришло с
 * YouTube. Ничего не выдумывает: если канал недоступен, файл не трогается.
 *
 * Ключ Data API: console.cloud.google.com → включить «YouTube Data API v3» →
 * создать API key. Квота одного полного импорта — единицы запросов.
 */
import fs from 'node:fs/promises';
import { STATIC_FILE, CHANNEL_URL, CHANNEL_HANDLE, resolveChannelId, parseFeed, mergeItems } from '../server/youtube.mjs';

const DRY = process.argv.includes('--dry-run');
const API_KEY = process.env.KC_YT_API_KEY || '';

const die = (msg) => { console.error('✖ ' + msg); process.exit(1); };

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'KrakenChronicles/1.0' } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error?.message || `http_${r.status}`);
  return body;
}

/** ISO-8601 длительность (PT12M4S) → секунды. */
function parseDuration(v) {
  const m = String(v || '').match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, d, h, mi, s] = m.map((x) => (x == null ? 0 : Number(x)));
  return d * 86400 + h * 3600 + mi * 60 + s;
}

/** Весь канал через Data API v3 (uploads-плейлист + статистика пачками по 50). */
async function viaApi(channelId) {
  const ch = await getJson(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&id=${channelId}&key=${API_KEY}`);
  const info = ch.items?.[0];
  if (!info) throw new Error('channel_not_found');
  const uploads = info.contentDetails.relatedPlaylists.uploads;

  const ids = [];
  let pageToken = '';
  do {
    const page = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}&key=${API_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`);
    for (const it of page.items || []) ids.push(it.contentDetails.videoId);
    pageToken = page.nextPageToken || '';
  } while (pageToken);

  const items = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).join(',');
    const page = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk}&key=${API_KEY}`);
    for (const v of page.items || []) {
      items.push({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description || '',
        published: new Date(v.snippet.publishedAt).toISOString(),
        updated: null,
        thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        views: Number(v.statistics?.viewCount) || null,
        likes: Number(v.statistics?.likeCount) || null,
        duration: parseDuration(v.contentDetails?.duration),
        tags: v.snippet.tags || [],
        playlist: null,
      });
    }
  }

  return {
    items,
    channel: {
      title: info.snippet.title,
      description: info.snippet.description || '',
      subscribers: Number(info.statistics?.subscriberCount) || null,
      videoCount: Number(info.statistics?.videoCount) || null,
      viewCount: Number(info.statistics?.viewCount) || null,
      avatar: info.snippet.thumbnails?.high?.url || null,
    },
  };
}

/** Резерв без ключа: публичный RSS — последние 15 роликов. */
async function viaRss(channelId) {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KrakenChronicles/1.0)' },
  });
  if (!r.ok) throw new Error(`http_${r.status}`);
  return { items: parseFeed(await r.text()), channel: null };
}

/* ------------------------------------------------------------------- main */
const doc = JSON.parse(await fs.readFile(STATIC_FILE, 'utf8'));

let channelId;
try { channelId = await resolveChannelId(); }
catch (e) { die(`не удалось определить channelId для ${CHANNEL_URL}: ${e.message}. Задайте KC_YT_CHANNEL_ID=UC… вручную.`); }
console.log(`канал: ${CHANNEL_HANDLE}  (${channelId})`);

let fetched;
try { fetched = API_KEY ? await viaApi(channelId) : await viaRss(channelId); }
catch (e) { die(`YouTube недоступен (${e.message}). Файл не изменён.`); }

if (!fetched.items.length) die('YouTube вернул пустой список — файл не изменён.');

const merged = mergeItems(doc.items || [], fetched.items);
const added = merged.filter((m) => !(doc.items || []).some((o) => o.id === m.id)).length;

doc.channel = {
  ...(doc.channel || {}),
  handle: CHANNEL_HANDLE,
  url: CHANNEL_URL,
  id: channelId,
  ...(fetched.channel
    ? {
      name: fetched.channel.title,
      about: fetched.channel.description,
      subscribers: fetched.channel.subscribers,
      videoCount: fetched.channel.videoCount,
      viewCount: fetched.channel.viewCount,
      avatar: fetched.channel.avatar,
    }
    : {}),
};
doc.items = merged;
doc.updatedAt = new Date().toISOString();
doc.source = API_KEY ? 'youtube-data-api' : 'youtube-rss';

console.log(`получено: ${fetched.items.length}, в файле станет: ${merged.length} (новых: ${added})`);
if (DRY) { console.log('--dry-run: файл не записан'); process.exit(0); }

await fs.writeFile(STATIC_FILE, JSON.stringify(doc, null, 2) + '\n');
console.log(`✔ записано в ${STATIC_FILE}`);
if (!API_KEY) console.log('  (без KC_YT_API_KEY доступны только последние 15 роликов — для полного архива задайте ключ)');
