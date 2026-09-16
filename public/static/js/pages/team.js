import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/team.json');
  const leader = data.leader || null;
  const officers = data.officers || [];

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('team.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('team.title')), h('p', {}, t('team.desc')))),
      h('div', { class: 'kc-panel-body' },
        !leader && !officers.length
          ? empty(t('team.emptyTitle'), t('team.emptyHint'))
          : h('div', {},
            leader && h('div', { style: { marginBottom: '20px' } },
              h('div', { class: 'kc-section-title' }, t('team.leaderLabel')),
              teamCard(leader, lang, t, true)),
            officers.length > 0 && h('div', {},
              h('div', { class: 'kc-section-title' }, t('team.officersLabel')),
              h('div', { class: 'kc-grid auto-lg' }, ...officers.map((o) => teamCard(o, lang, t, false))))))));
}

export function avatarEl(person, size) {
  const dim = { width: size + 'px', height: size + 'px' };
  if (person.avatar) {
    return h('img', {
      src: person.avatar, alt: '', loading: 'lazy',
      style: { ...dim, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line-2)', flexShrink: '0' },
    });
  }
  const initial = (person.nick || '?').trim().charAt(0).toUpperCase();
  return h('div', {
    style: {
      ...dim, borderRadius: '50%', flexShrink: '0', display: 'grid', placeItems: 'center',
      border: '1px solid var(--line-2)', background: 'var(--surface-2)',
      color: 'var(--muted)', font: `600 ${Math.round(size * 0.4)}px var(--sans)`,
    },
  }, initial);
}

export function teamCard(person, lang, t, isLeader) {
  return h('div', { class: 'kc-card', style: isLeader ? { borderColor: 'var(--line-3)' } : undefined },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      avatarEl(person, isLeader ? 64 : 48),
      h('div', { style: { minWidth: '0' } },
        h('div', { style: { fontWeight: '600', fontSize: isLeader ? '16px' : '14px', color: 'var(--text)' } }, person.nick || ''),
        person.role?.[lang] && h('div', { class: 'kc-note', style: { marginTop: '2px' } }, person.role[lang]))),
    person.area?.[lang] && h('p', { class: 'kc-note', style: { margin: '10px 0 0' } }, person.area[lang]),
    person.contact?.url && h('div', { style: { marginTop: '10px' } },
      h('a', {
        class: 'kc-btn sm', href: person.contact.url, target: '_blank', rel: 'noopener', 'data-external': '1',
      }, person.contact.label?.[lang] || t('team.contact'))));
}
