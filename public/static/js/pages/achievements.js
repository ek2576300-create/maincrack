import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const { items = [] } = await getJSON('/data/content/achievements.json');

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('achievements.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('achievements.title')), h('p', {}, t('achievements.desc')))),
      h('div', { class: 'kc-panel-body' },
        items.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((a) => achievementCard(a, i18n)))
          : empty(t('achievements.empty'), t('achievements.emptyHint')))));
}

export function achievementCard(a, i18n) {
  return h('div', { class: 'kc-card' },
    a.image && h('img', {
      src: a.image, alt: '', loading: 'lazy',
      style: { width: '100%', borderRadius: '10px', marginBottom: '10px', aspectRatio: '16/9', objectFit: 'cover' },
    }),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
      a.when && h('span', { class: 'kc-badge' }, a.when),
      a.result && h('span', { class: 'kc-badge is-gold' }, i18n.pick(a.result))),
    h('h3', { style: { margin: '9px 0 6px' } }, i18n.pick(a.title)),
    a.text && h('p', { class: 'kc-note', style: { margin: 0, color: 'var(--text-dim)' } }, i18n.pick(a.text)));
}
