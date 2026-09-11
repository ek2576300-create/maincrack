import { h, clear, num, compact, dateTime, empty, loading, dataTable, sortBy } from '../util.js';
import { manifest, serverAlliances, serverPlayers, nameCell, ALLIANCE_METRICS } from './stats-common.js';

export async function render(mount, { t, i18n, params, navigate }) {
  const lang = i18n.lang;
  const id = String(params.id || '');
  const host = h('div', {});
  mount.append(host);
  host.append(loading(t('common.loading')));

  const m = await manifest();

  let alliance = null;
  let serverId = null;
  let members = [];
  for (const s of m.servers) {
    const data = await serverAlliances(s.serverId);
    const found = data.items.find((a) => String(a.allianceId) === id);
    if (found) {
      alliance = found;
      serverId = s.serverId;
      members = (await serverPlayers(s.serverId)).items.filter((p) => String(p.allianceId) === id);
      break;
    }
  }

  clear(host);
  if (!alliance) {
    host.append(empty(t('common.nothing'), `${t('stats.alliance.title')}: ${id}`),
      h('div', { style: { textAlign: 'center' } }, h('a', { class: 'kc-btn', href: '/stats/alliances' }, t('stats.alliances'))));
    return;
  }

  const memberPower = members.reduce((s, p) => s + (Number(p.power) || 0), 0);
  const ranks = alliance.ranksByMetric || {};

  host.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/' }, t('common.home')), ' / ',
      h('a', { href: `/stats/alliances?server=${serverId}` }, t('stats.alliances')), ' / ', alliance.allianceName),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h2', {}, `[${alliance.allianceAbbr || '—'}] ${alliance.allianceName}`),
          h('p', {}, `${t('stats.leader')}: ${alliance.ownerName || '—'} · ${t('common.server')} ${serverId}`))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c4' },
          tile(t('stats.power'), compact(alliance.power, lang), num(alliance.power, lang)),
          tile(t('stats.members'), num(members.length, lang)),
          tile(lang === 'ru' ? 'Сила состава' : 'Roster power', compact(memberPower, lang), num(memberPower, lang)),
          tile(t('stats.merits'), num(alliance.merits, lang)),
          tile(t('stats.flags'), num(alliance.flags, lang)),
          tile(t('stats.armory'), num(alliance.armorySeasonPoints, lang)),
          tile(t('stats.kills'), num(alliance.kills, lang)),
          tile(t('stats.capturedAt'), dateTime(alliance.capturedAt, lang))),

        Object.keys(ranks).length ? h('div', { class: 'kc-section-title' }, t('stats.player.ranks')) : null,
        Object.keys(ranks).length
          ? h('div', { class: 'kc-grid c4' },
            ...ALLIANCE_METRICS.filter((mt) => ranks[mt.key] != null)
              .map((mt) => tile(t(mt.labelKey), '#' + num(ranks[mt.key], lang))))
          : null)),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.alliance.roster')), h('p', {}, `${members.length} ${t('stats.members').toLowerCase()}`))),
      members.length
        ? dataTable(sortBy(members, 'power', -1), [
          { key: '__i', label: t('common.rank'), sortable: false, width: '54px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
          { key: 'playerName', label: t('common.name'), sortable: false, render: (p) => nameCell(p.playerName, 'ID ' + p.playerId, `/stats/player/${p.playerId}`) },
          { key: 'power', label: t('stats.power'), num: true, sortable: false, render: (p) => h('span', { class: 'best', title: num(p.power, lang) }, compact(p.power, lang)) },
          { key: 'townCenterLvl', label: t('stats.tc'), num: true, sortable: false },
          { key: 'resourcesGathered', label: t('stats.rss'), num: true, sortable: false, render: (p) => compact(p.resourcesGathered, lang) },
          { key: 'scenarioPoints', label: t('stats.scenario'), num: true, sortable: false },
        ], { lang, minWidth: '760px', onRow: (p) => navigate(`/stats/player/${p.playerId}`) })
        : h('div', { class: 'kc-panel-body' }, empty(t('common.nothing')))));

  function tile(label, value, note) {
    return h('div', { class: 'kc-tile' },
      h('div', { class: 'kc-tile-label' }, label),
      h('div', { class: 'kc-tile-value' + (String(value).length > 11 ? ' sm' : '') }, value),
      note && h('small', { class: 'kc-tile-note' }, note));
  }
}
