import { h, getJSON } from '../util.js';

export async function render(mount, { t, i18n }) {
  const tournament = await getJSON('/data/content/tournament.json');
  const ready = tournament.status === 'ready';

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('tournament.title')),
    h('section', { class: 'kc-panel' },
      tournament.cover && h('img', {
        src: tournament.cover, alt: '', loading: 'lazy',
        style: { width: '100%', display: 'block', maxHeight: '320px', objectFit: 'cover' },
      }),
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, i18n.pick(tournament.name) || t('tournament.title')))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, i18n.pick(tournament.description)),
        !ready && h('div', { class: 'kc-toolbar', style: { marginTop: '10px' } },
          h('span', { class: 'kc-badge is-gold' }, '⏳ ' + t('tournament.preparing'))),
        !ready && h('p', { class: 'kc-note', style: { marginTop: '10px' } }, t('tournament.preparingHint')))));
}
