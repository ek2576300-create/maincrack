import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const { members = [] } = await getJSON('/data/content/hall-of-fame.json');

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('hof.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('hof.title')), h('p', {}, t('hof.desc')))),
      h('div', { class: 'kc-panel-body' },
        members.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...members.map((mm) => memberCard(mm, t, i18n)))
          : empty(t('hof.empty'), t('hof.emptyHint')))));
}

export function memberCard(m, t, i18n) {
  return h('div', { class: 'kc-card' },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      h('img', {
        src: m.avatar || '/static/img/warpets/petCoin.png', alt: '', loading: 'lazy',
        style: {
          width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(216,180,93,.35)',
          objectFit: 'cover', background: '#06151a', flexShrink: '0',
        },
      }),
      h('div', { style: { minWidth: '0' } },
        h('strong', { style: { color: 'var(--gold-soft)', fontSize: '14px', display: 'block' } }, m.nick),
        m.period && h('div', { class: 'kc-note', style: { marginTop: '2px' } }, t('hof.period') + ': ' + m.period))),
    m.text && h('p', { class: 'kc-note', style: { margin: '10px 0 0', color: 'var(--text-dim)' } }, i18n.pick(m.text)));
}
