import { h, getJSON, empty, dateTime, setMeta } from '../util.js';

export async function render(mount, { t, i18n, params, link }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/news.json');
  const post = (data.items || []).find((n) => n.slug === params.slug && n.published);

  mount.append(h('div', { class: 'kc-breadcrumb' },
    h('a', { href: '/' }, t('common.home')), ' / ',
    h('a', { href: '/news', onclick: link('/news') }, t('news.title')), ' / ',
    post ? (post.title?.[lang] || post.slug) : t('news.notFoundTitle')));

  if (!post) {
    mount.append(h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
      empty(t('news.notFoundTitle')),
      h('div', { style: { textAlign: 'center', marginTop: '10px' } },
        h('a', { class: 'kc-btn', href: '/news', onclick: link('/news') }, '← ' + t('news.back'))))));
    return;
  }

  setMeta({
    title: `${post.title?.[lang] || ''} — ${t('news.title')}`,
    description: post.excerpt?.[lang] || undefined,
  });

  mount.append(
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' } },
          post.category && h('span', { class: 'kc-badge is-gold' }, t('news.category.' + post.category, post.category)),
          h('small', { style: { color: 'var(--muted)' } }, dateTime(post.date, lang))),
        h('h1', { style: { margin: '0 0 14px', font: '800 24px Georgia, serif', color: 'var(--gold-soft)' } }, post.title?.[lang] || ''),
        post.image && h('img', {
          src: post.image, alt: '', loading: 'lazy',
          style: { width: '100%', borderRadius: '12px', marginBottom: '16px' },
        }),
        h('div', { class: 'kc-prose', style: { color: 'var(--text-dim)', whiteSpace: 'pre-wrap' } }, post.body?.[lang] || post.excerpt?.[lang] || ''),
        h('div', { style: { marginTop: '20px' } },
          h('a', { class: 'kc-btn', href: '/news', onclick: link('/news') }, '← ' + t('news.back'))))));
}
