import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const about = await getJSON('/data/site/about.json');
  const milestones = about.history?.milestones || [];

  mount.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/' }, t('common.home')), ' / ',
      h('a', { href: '/about', onclick: link('/about') }, t('about.title')), ' / ', t('history.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('history.title')), h('p', {}, t('history.desc')))),
      h('div', { class: 'kc-panel-body' },
        milestones.length
          ? h('div', { class: 'kc-prose' }, ...milestones.map((m) => h('div', { style: { marginBottom: '22px' } },
            h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' } },
              h('span', { class: 'kc-badge is-gold' }, m.date || ''),
              h('h3', { style: { margin: '0' } }, m.title?.[lang] || '')),
            m.image && h('img', {
              src: m.image, alt: '', loading: 'lazy',
              style: { width: '100%', maxWidth: '520px', borderRadius: '12px', margin: '10px 0', display: 'block' },
            }),
            h('p', { class: 'kc-note', style: { color: 'var(--text-dim)', lineHeight: '1.6' } }, m.body?.[lang] || ''))))
          : empty(t('history.emptyTitle'), t('history.emptyHint')))));
}
