import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n, link }) {
  const project = await getJSON('/data/content/project.json');
  const history = project.history || {};
  const milestones = history.milestones || [];

  mount.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/' }, t('common.home')), ' / ',
      h('a', { href: '/about', onclick: link('/about') }, t('about.title')), ' / ',
      t('history.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('history.title')), h('p', {}, t('history.desc')))),
      h('div', { class: 'kc-panel-body' },
        milestones.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...milestones.map((mi) => h('div', { class: 'kc-card' },
            mi.image && h('img', {
              src: mi.image, alt: '', loading: 'lazy',
              style: { width: '100%', borderRadius: '10px', marginBottom: '10px', aspectRatio: '16/9', objectFit: 'cover' },
            }),
            h('span', { class: 'kc-badge is-gold' }, mi.date),
            h('h3', { style: { margin: '9px 0 4px' } }, i18n.pick(mi.title)),
            h('p', { class: 'kc-note', style: { margin: 0, color: 'var(--text-dim)', lineHeight: '1.6' } }, i18n.pick(mi.text)))))
          : empty(t('history.empty'), i18n.pick(history.note) || t('history.emptyHint')))));
}
