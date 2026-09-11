import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/achievements.json');
  const items = data.items || [];

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('achievements.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('achievements.title')), h('p', {}, t('achievements.desc')))),
      h('div', { class: 'kc-panel-body' },
        items.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((a) => achievementCard(a, lang)))
          : empty(t('achievements.emptyTitle'), t('achievements.emptyHint')))));
}

export function achievementCard(a, lang) {
  return h('div', { class: 'kc-card' },
    a.image && h('img', {
      src: a.image, alt: '', loading: 'lazy',
      style: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' },
    }),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' } },
      a.season && h('span', { class: 'kc-badge is-gold' }, a.season)),
    h('h3', { style: { margin: '0 0 4px' } }, a.title?.[lang] || ''),
    a.result?.[lang] && h('div', { style: { color: 'var(--gold-soft)', fontWeight: '800', fontSize: '13px', marginBottom: '6px' } }, a.result[lang]),
    a.description?.[lang] && h('p', { class: 'kc-note', style: { margin: '0' } }, a.description[lang]));
}
