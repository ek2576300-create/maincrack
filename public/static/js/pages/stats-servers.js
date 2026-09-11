import { h, num, compact, dateTime } from '../util.js';
import { manifest } from './stats-common.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const m = await manifest();

  const cards = m.servers.map((s) => h('div', { class: 'kc-card' },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
      h('div', {
        style: {
          width: '48px', height: '48px', display: 'grid', placeItems: 'center', flexShrink: '0',
          border: '1px solid rgba(216,180,93,.35)', borderRadius: '12px',
          background: 'linear-gradient(180deg,#0e3d41,#04171c)',
          font: '800 17px Georgia, serif', color: 'var(--gold-soft)',
        },
      }, s.serverId),
      h('div', {},
        h('div', { style: { fontWeight: '800', fontSize: '16px', color: 'var(--text)' } }, t('common.server') + ' ' + s.serverId),
        h('small', { style: { color: 'var(--muted)' } }, dateTime(s.updatedAt, lang)))),

    h('div', { class: 'kc-grid c2', style: { marginTop: '12px', gap: '8px' } },
      mini(t('stats.players'), num(s.players, lang)),
      mini(t('stats.alliances'), num(s.alliances, lang)),
      mini(t('stats.immigrants'), num(s.immigrants, lang)),
      mini(t('stats.totalPower'), compact(s.totalPower, lang))),

    h('dl', { class: 'kc-kv', style: { marginTop: '12px' } },
      h('dt', {}, t('stats.topPlayer')), h('dd', {}, s.topPlayerName || '—'),
      h('dt', {}, t('stats.topAlliance')), h('dd', { style: { color: 'var(--gold-soft)' } }, s.topAllianceName || '—')),

    h('div', { class: 'kc-toolbar', style: { marginTop: '13px' } },
      h('a', { class: 'kc-btn sm', href: `/stats/players?server=${s.serverId}` }, t('stats.players')),
      h('a', { class: 'kc-btn sm', href: `/stats/alliances?server=${s.serverId}` }, t('stats.alliances')),
      h('a', { class: 'kc-btn sm', href: `/stats/rankings?server=${s.serverId}` }, t('stats.rankings.title')))));

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.servers.title')),

    h('div', { class: 'kc-grid c4', style: { marginBottom: '16px' } },
      tileOf(t('common.server'), num(m.totals.servers, lang)),
      tileOf(t('stats.players'), num(m.totals.players, lang)),
      tileOf(t('stats.alliances'), num(m.totals.alliances, lang)),
      tileOf(t('stats.totalPower'), compact(m.totals.totalPower, lang), num(m.totals.totalPower, lang))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.servers.title')), h('p', {}, t('stats.servers.desc')))),
      h('div', { class: 'kc-panel-body' }, h('div', { class: 'kc-grid auto-lg' }, ...cards)),
      h('div', { class: 'kc-panel-foot' }, `${t('stats.capturedAt')}: ${m.generatedAt} · ${t('stats.dataNote')}`)));

  function mini(label, value) {
    return h('div', { style: { padding: '9px 10px', border: '1px solid rgba(216,180,93,.16)', borderRadius: '10px', background: 'rgba(4,24,28,.45)' } },
      h('div', { style: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' } }, label),
      h('div', { style: { fontWeight: '800', fontSize: '16px', marginTop: '3px' } }, value));
  }
  function tileOf(label, value, note) {
    return h('div', { class: 'kc-tile' },
      h('div', { class: 'kc-tile-label' }, label),
      h('div', { class: 'kc-tile-value' }, value),
      note && h('small', { class: 'kc-tile-note' }, note));
  }
}
