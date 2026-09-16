import { h, getJSON, empty } from '../util.js';
import { avatarEl } from './team.js';

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/hall-of-fame.json');
  const items = data.items || [];

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('hof.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('hof.title')), h('p', {}, t('hof.desc')))),
      h('div', { class: 'kc-panel-body' },
        items.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((p) => hofCard(p, lang, t)))
          : empty(t('hof.emptyTitle'), t('hof.emptyHint')))));
}

export function hofCard(person, lang, t) {
  return h('div', { class: 'kc-card' },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      avatarEl(person, 48),
      h('div', { style: { minWidth: '0' } },
        h('div', { style: { fontWeight: '600', fontSize: '14px', color: 'var(--text)' } }, person.nick || ''),
        person.period && h('small', { style: { color: 'var(--muted)' } }, `${t('hof.period')}: ${person.period}`))),
    person.contribution?.[lang] && h('p', { class: 'kc-note', style: { margin: '10px 0 0' } }, person.contribution[lang]));
}
