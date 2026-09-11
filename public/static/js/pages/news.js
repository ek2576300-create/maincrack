import { h, getJSON, empty, dateOnly } from '../util.js';

export async function render(mount, { t, i18n, link }) {
  const { posts = [] } = await getJSON('/data/content/news.json');
  const published = posts.filter((p) => !p.draft).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('news.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('news.title')), h('p', {}, t('news.desc')))),
      h('div', { class: 'kc-panel-body' },
        published.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...published.map((p) => newsCard(p, t, i18n, link)))
          : empty(t('news.empty'), t('news.emptyHint')))));
}

export function newsCard(p, t, i18n, link) {
  const lang = i18n.lang;
  const href = `/news/${p.slug}`;
  return h('a', { class: 'kc-card', href, onclick: link(href) },
    p.image && h('img', {
      src: p.image, alt: '', loading: 'lazy',
      style: { width: '100%', borderRadius: '10px', marginBottom: '10px', aspectRatio: '16/9', objectFit: 'cover' },
    }),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
      p.category && h('span', { class: 'kc-badge' }, t(`news.category.${p.category}`, p.category)),
      h('small', { style: { color: 'var(--muted-2)' } }, dateOnly(p.date, lang))),
    h('h3', { style: { margin: '9px 0 6px' } }, i18n.pick(p.title)),
    h('p', { class: 'kc-note', style: { margin: 0, color: 'var(--text-dim)' } }, i18n.pick(p.excerpt)));
}
