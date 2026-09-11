import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const { leader = null, officers = [] } = await getJSON('/data/content/team.json');

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('team.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('team.title')), h('p', {}, t('team.desc')))),
      h('div', { class: 'kc-panel-body' },
        !leader && !officers.length
          ? empty(t('team.empty'), t('team.emptyHint'))
          : h('div', {},
            leader && h('div', { style: { marginBottom: officers.length ? '20px' : '0' } },
              h('div', { class: 'kc-section-title' }, t('team.leader')),
              leaderCard(leader, t, i18n)),
            officers.length && h('div', {},
              h('div', { class: 'kc-section-title' }, t('team.officers')),
              h('div', { class: 'kc-grid auto-lg' }, ...officers.map((o) => memberCard(o, t, i18n))))))));
}

function leaderCard(m, t, i18n) {
  return h('div', {
    class: 'kc-card',
    style: { maxWidth: '420px', borderColor: 'var(--gold)', boxShadow: '0 0 0 1px rgba(216,180,93,.25), 0 12px 30px rgba(0,0,0,.3)' },
  }, memberBody(m, t, i18n, true));
}

function memberCard(m, t, i18n) {
  return h('div', { class: 'kc-card' }, memberBody(m, t, i18n, false));
}

function memberBody(m, t, i18n, big) {
  return h('div', {},
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      h('img', {
        src: m.avatar || '/static/img/warpets/petCoin.png', alt: '', loading: 'lazy',
        style: {
          width: big ? '64px' : '48px', height: big ? '64px' : '48px', borderRadius: '50%',
          border: '1px solid rgba(216,180,93,.35)', objectFit: 'cover', background: '#06151a', flexShrink: '0',
        },
      }),
      h('div', { style: { minWidth: '0' } },
        h('strong', { style: { color: 'var(--gold-soft)', fontSize: big ? '17px' : '14px', display: 'block' } }, m.nick),
        h('div', { class: 'kc-note', style: { color: 'var(--teal-dim)', fontWeight: '700', marginTop: '2px' } }, i18n.pick(m.role)))),
    m.area && h('p', { class: 'kc-note', style: { margin: '10px 0 0', color: 'var(--text-dim)' } }, i18n.pick(m.area)),
    m.contact?.url && h('div', { style: { marginTop: '11px' } },
      h('a', { class: 'kc-btn sm is-teal', href: m.contact.url, target: '_blank', rel: 'noopener' },
        '✉️ ' + (m.contact.label || t('team.contact')))));
}
