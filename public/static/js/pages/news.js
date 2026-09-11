import { h, getJSON, empty, dateTime, sortBy } from '../util.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/news.json');
  const items = sortBy((data.items || []).filter((n) => n.published), 'date', -1, (n) => new Date(n.date).getTime() || 0);

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('news.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('news.title')), h('p', {}, t('news.desc')))),
      h('div', { class: 'kc-panel-body' },
        items.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((n) => newsCard(n, lang, t, link)))
          : empty(t('news.emptyTitle'), t('news.emptyHint')))));
}

export function newsCard(n, lang, t, link) {
  const href = `/news/${n.slug}`;
  return h('a', { class: 'kc-card', href, onclick: link(href) },
    n.image && h('img', {
      src: n.image, alt: '', loading: 'lazy',
      style: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' },
    }),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' } },
      n.category && h('span', { class: 'kc-badge' }, t('news.category.' + n.category, n.category)),
      h('small', { style: { color: 'var(--muted)' } }, dateTime(n.date, lang))),
    h('h3', { style: { margin: '0 0 6px' } }, n.title?.[lang] || ''),
    h('p', { class: 'kc-note', style: { margin: '0' } }, n.excerpt?.[lang] || ''),
    h('div', { style: { marginTop: '10px', color: 'var(--gold-soft)', fontWeight: '700', fontSize: '12px' } }, t('news.readMore') + ' →'));
}
