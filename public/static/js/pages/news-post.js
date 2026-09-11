import { h, getJSON, empty, dateOnly, setMeta } from '../util.js';
import { newsCard } from './news.js';

export async function render(mount, { t, i18n, link, params }) {
  const lang = i18n.lang;
  const { posts = [] } = await getJSON('/data/content/news.json');
  const post = posts.find((p) => p.slug === params.slug && !p.draft);

  if (!post) {
    mount.append(
      h('div', { class: 'kc-breadcrumb' },
        h('a', { href: '/' }, t('common.home')), ' / ',
        h('a', { href: '/news', onclick: link('/news') }, t('news.title'))),
      h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
        empty(t('news.notFound'), t('news.notFoundHint')),
        h('div', { style: { textAlign: 'center' } },
          h('a', { class: 'kc-btn is-primary', href: '/news', onclick: link('/news') }, t('news.backToList'))))));
    return;
  }

  const title = i18n.pick(post.title);
  setMeta({ title: `${title} — ${t('news.title')}`, description: i18n.pick(post.excerpt) });

  const related = posts.filter((p) => !p.draft && p.slug !== post.slug).slice(0, 3);

  mount.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/' }, t('common.home')), ' / ',
      h('a', { href: '/news', onclick: link('/news') }, t('news.title')), ' / ', title),

    h('section', { class: 'kc-panel' },
      post.image && h('img', {
        src: post.image, alt: '', loading: 'lazy',
        style: { width: '100%', display: 'block', maxHeight: '360px', objectFit: 'cover' },
      }),
      h('div', { class: 'kc-panel-body' },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' } },
          post.category && h('span', { class: 'kc-badge' }, t(`news.category.${post.category}`, post.category)),
          h('small', { style: { color: 'var(--muted-2)' } }, dateOnly(post.date, lang))),
        h('h1', {}, title),
        h('div', { class: 'kc-prose', style: { color: 'var(--text-dim)', whiteSpace: 'pre-wrap', lineHeight: '1.7' } },
          i18n.pick(post.body) || i18n.pick(post.excerpt)))),

    related.length && h('div', {},
      h('div', { class: 'kc-section-title' }, t('news.viewAll')),
      h('div', { class: 'kc-grid auto-lg' }, ...related.map((p) => newsCard(p, t, i18n, link)))));
}
