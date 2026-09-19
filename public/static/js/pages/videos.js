/**
 * Лента видео канала «Хроники Кракена».
 * Данные — /api/v1/youtube/videos (RSS канала + curated videos.json).
 * Если API недоступен (статический хостинг), берём файл напрямую.
 */
import { h, clear, getJSON, api, num, compact, dateTime, empty, debounce } from '../util.js';

const CHANNEL_URL = 'https://www.youtube.com/@Kraken_Chronicles';
const PAGE = 24;

let cached = null;

/** Единый источник ленты для главной и для /videos. Никогда не бросает. */
export async function loadVideos({ force = false } = {}) {
  if (cached && !force) return cached;
  let data;
  try {
    data = await api('/youtube/videos');
  } catch {
    try {
      const doc = await getJSON('/data/site/videos.json');
      data = { ...doc, items: (doc.items || []).filter((v) => !v.hidden), source: 'static', error: 'api_unavailable' };
    } catch {
      data = { channel: { url: CHANNEL_URL }, items: [], source: 'none', error: 'unavailable' };
    }
  }
  data.items = [...(data.items || [])].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return (new Date(b.published).getTime() || 0) - (new Date(a.published).getTime() || 0);
  });
  cached = data;
  return data;
}

export const watchUrl = (v) => `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
export const thumbUrl = (v) => v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
const titleOf = (v, lang) => v.titleI18n?.[lang] || v.title || v.id;

export function durationLabel(sec) {
  const s = Number(sec);
  if (!Number.isFinite(s) || s <= 0) return null;
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return (hh ? `${hh}:${String(mm).padStart(2, '0')}` : String(mm)) + ':' + String(ss).padStart(2, '0');
}

/**
 * Карточка видео. Клик по обложке подменяет её встроенным плеером
 * (youtube-nocookie), поэтому до клика страница ничего не грузит с YouTube,
 * кроме обложки.
 */
export function videoCard(v, lang, t, { compactCard = false } = {}) {
  const dur = durationLabel(v.duration);
  const media = h('div', { class: 'kc-video-media' });

  const play = () => {
    clear(media);
    media.append(h('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&rel=0`,
      title: titleOf(v, lang), loading: 'lazy', allowfullscreen: true,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      frameborder: '0',
    }));
  };

  media.append(
    h('button', {
      class: 'kc-video-thumb', type: 'button', onclick: play,
      'aria-label': t('videos.play') + ': ' + titleOf(v, lang),
    },
    h('img', { src: thumbUrl(v), alt: '', loading: 'lazy', decoding: 'async' }),
    h('span', { class: 'kc-video-play' }, '▶'),
    dur && h('span', { class: 'kc-video-dur' }, dur),
    v.pinned && h('span', { class: 'kc-video-pin' }, '★')));

  return h('article', { class: 'kc-video' + (compactCard ? ' is-compact' : '') },
    media,
    h('div', { class: 'kc-video-body' },
      h('h3', { class: 'kc-video-title' },
        h('a', { href: watchUrl(v), target: '_blank', rel: 'noopener', 'data-external': '1' }, titleOf(v, lang))),
      h('div', { class: 'kc-video-meta' },
        v.published && h('span', {}, dateTime(v.published, lang)),
        v.views != null && h('span', {}, '👁 ' + compact(v.views, lang)),
        v.likes != null && h('span', {}, '👍 ' + compact(v.likes, lang))),
      !compactCard && (v.note?.[lang] || v.description)
        && h('p', { class: 'kc-video-desc' }, v.note?.[lang] || String(v.description).split('\n').filter(Boolean).slice(0, 2).join(' ')),
      !compactCard && !!(v.tags || []).length
        && h('div', { class: 'kc-chips', style: { marginTop: '8px' } },
          ...v.tags.slice(0, 4).map((tag) => h('span', { class: 'kc-chip' }, tag)))));
}

/* ------------------------------------------------------------------- page */
export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const data = await loadVideos({ force: true });
  const all = data.items || [];

  const state = {
    q: '',
    tag: '',
    sort: 'new',
    shown: PAGE,
  };

  const tags = [...new Set(all.flatMap((v) => v.tags || []).map((s) => String(s).trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, lang === 'ru' ? 'ru' : 'en'));

  const totalViews = all.reduce((s, v) => s + (Number(v.views) || 0), 0);
  const ch = data.channel || {};

  const listEl = h('div', { class: 'kc-grid auto-lg' });
  const countEl = h('div', { class: 'kc-note' });
  const moreWrap = h('div', { style: { marginTop: '14px', textAlign: 'center' } });

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let rows = all.filter((v) => {
      if (state.tag && !(v.tags || []).includes(state.tag)) return false;
      if (!q) return true;
      return [titleOf(v, lang), v.title, v.description, (v.tags || []).join(' ')]
        .some((s) => String(s || '').toLowerCase().includes(q));
    });
    if (state.sort === 'old') rows = [...rows].sort((a, b) => (new Date(a.published) - new Date(b.published)) || 0);
    else if (state.sort === 'views') rows = [...rows].sort((a, b) => (b.views || 0) - (a.views || 0));
    return rows;
  }

  function draw() {
    const rows = filtered();
    clear(listEl); clear(moreWrap);
    if (!rows.length) {
      listEl.append(all.length
        ? empty(t('common.nothing'), t('common.nothingHint'))
        : empty(t('videos.emptyTitle'), t('videos.emptyHint')));
      countEl.textContent = '';
      return;
    }
    const page = rows.slice(0, state.shown);
    listEl.append(...page.map((v) => videoCard(v, lang, t)));
    countEl.textContent = `${t('common.showing')} ${num(page.length, lang)} ${t('common.of')} ${num(rows.length, lang)}`;
    if (page.length < rows.length) {
      moreWrap.append(h('button', {
        class: 'kc-btn', type: 'button',
        onclick: () => { state.shown += PAGE; draw(); },
      }, t('videos.more')));
    }
  }

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('videos.searchPlaceholder'), value: state.q,
    oninput: debounce((e) => { state.q = e.target.value; state.shown = PAGE; draw(); }, 200),
  });

  const sort = h('select', {
    class: 'kc-select',
    onchange: (e) => { state.sort = e.target.value; state.shown = PAGE; draw(); },
  },
  h('option', { value: 'new' }, t('videos.sort.new')),
  h('option', { value: 'old' }, t('videos.sort.old')),
  h('option', { value: 'views' }, t('videos.sort.views')));

  const chips = tags.length
    ? h('div', { class: 'kc-chips', style: { marginTop: '10px' } },
      ...[{ id: '', label: t('common.all') }, ...tags.map((x) => ({ id: x, label: x }))].map((opt) =>
        h('button', {
          type: 'button', class: 'kc-chip' + (state.tag === opt.id ? ' is-active' : ''),
          onclick: (e) => {
            state.tag = opt.id; state.shown = PAGE;
            [...e.target.parentNode.children].forEach((c) => c.classList.remove('is-active'));
            e.target.classList.add('is-active');
            draw();
          },
        }, opt.label)))
    : null;

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/', onclick: link('/') }, t('common.home')), ' / ', t('videos.title')),
    // Баннер собран здесь, а не через util.banner(), чтобы заголовок страницы
    // был настоящим <h1> — это единственная H1 на /videos.
    h('div', { class: 'kc-banner is-compact' },
      h('div', { class: 'kc-banner-inner' },
        h('div', { class: 'kc-banner-kicker' }, 'YOUTUBE · ' + (ch.handle || '@Kraken_Chronicles')),
        h('h1', { class: 'kc-banner-title' }, t('videos.title')),
        h('div', { class: 'kc-banner-sub' }, t('videos.sub'))),
      h('div', { class: 'kc-banner-lights' })),

    h('section', { class: 'kc-panel', style: { marginTop: '14px' } },
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h2', {}, t('videos.channelTitle')),
          h('p', {}, t('videos.channelDesc'))),
        h('a', {
          class: 'kc-btn is-primary', href: ch.url || CHANNEL_URL,
          target: '_blank', rel: 'noopener', 'data-external': '1',
        }, '▶ ' + t('videos.subscribe'))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c4' },
          statTile(t('videos.stat.videos'), num(ch.videoCount || all.length, lang)),
          statTile(t('videos.stat.views'), totalViews ? compact(ch.viewCount || totalViews, lang) : '—'),
          statTile(t('videos.stat.subs'), ch.subscribers != null ? compact(ch.subscribers, lang) : '—'),
          statTile(t('videos.stat.latest'), all[0]?.published ? dateTime(all[0].published, lang) : '—')),
        h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } }, search, sort),
        chips,
        h('div', { style: { marginTop: '12px' } }, countEl))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' }, listEl, moreWrap),
      h('div', { class: 'kc-panel-foot' }, sourceNote(data, t, lang))));

  draw();
}

function statTile(label, value) {
  return h('div', { class: 'kc-tile' },
    h('div', { class: 'kc-tile-label' }, label),
    h('div', { class: 'kc-tile-value' + (String(value).length > 12 ? ' sm' : '') }, value));
}

/** Честная подпись: откуда взялся список и почему он может быть неполным. */
export function sourceNote(data, t, lang) {
  const parts = [];
  if (data.source === 'youtube') parts.push(t('videos.sourceLive'));
  else if (data.source === 'cache') parts.push(t('videos.sourceCache'));
  else parts.push(t('videos.sourceStatic'));
  if (data.error) parts.push(t('videos.sourceError') + ': ' + data.error);
  if (data.fetchedAt) parts.push(t('common.updated') + ': ' + dateTime(data.fetchedAt, lang));
  return parts.join(' · ');
}
