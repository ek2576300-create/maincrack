import { h, clear, num, compact, dateTime, empty, loading, dataTable, sortBy } from '../util.js';
import { manifest, serverPlayers, playerAchievements, METRICS } from './stats-common.js';

export async function render(mount, { t, i18n, params, navigate }) {
  const lang = i18n.lang;
  const id = String(params.id || '');
  const host = h('div', {});
  mount.append(host);
  host.append(loading(t('common.loading')));

  const m = await manifest();

  // The player could live on any server, so scan the server chunks in order.
  let player = null;
  let serverId = null;
  for (const s of m.servers) {
    const data = await serverPlayers(s.serverId);
    const found = data.items.find((p) => String(p.playerId) === id);
    if (found) { player = found; serverId = s.serverId; break; }
  }

  clear(host);
  if (!player) {
    host.append(empty(t('common.nothing'), `${t('stats.player.title')}: ${id}`),
      h('div', { style: { textAlign: 'center' } }, h('a', { class: 'kc-btn', href: '/stats/players' }, t('stats.players'))));
    return;
  }

  const ranks = player.ranksByMetric || {};

  host.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/' }, t('common.home')), ' / ',
      h('a', { href: `/stats/players?server=${serverId}` }, t('stats.players')), ' / ', player.playerName),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h2', {}, player.playerName),
          h('p', {}, player.allianceName
            ? `[${player.allianceAbbr || '—'}] ${player.allianceName} · ${t('common.server')} ${serverId}`
            : `${t('stats.noAlliance')} · ${t('common.server')} ${serverId}`)),
        player.allianceId && player.allianceId !== '0'
          ? h('a', { class: 'kc-btn sm', href: `/stats/alliance/${player.allianceId}` }, t('stats.alliance.title'))
          : null),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c4' },
          tile(t('stats.power'), compact(player.power, lang), num(player.power, lang)),
          tile(t('stats.tc'), num(player.townCenterLvl, lang)),
          tile(t('stats.rss'), compact(player.resourcesGathered, lang), num(player.resourcesGathered, lang)),
          tile(t('stats.scenario'), num(player.scenarioPoints, lang)),
          tile(t('stats.immigration'), num(player.immigrationScore, lang)),
          tile(t('stats.merits'), num(player.merits, lang)),
          tile(t('stats.kills'), num(player.honorKills, lang)),
          tile(t('stats.player.castleHide'), player.castleHideTimeHuman || '—')),

        h('div', { class: 'kc-section-title' }, t('stats.player.ranks')),
        h('div', { class: 'kc-grid c4' },
          ...METRICS.filter((mt) => ranks[mt.key] != null).map((mt) =>
            tile(t(mt.labelKey), '#' + num(ranks[mt.key], lang)))),

        h('div', { class: 'kc-section-title' }, t('stats.capturedAt')),
        h('dl', { class: 'kc-kv' },
          h('dt', {}, t('stats.player.lastSeen')), h('dd', {}, dateTime(player.playerLogoutTimeUtc, lang)),
          h('dt', {}, t('stats.player.offlineFor')), h('dd', {}, player.playerOfflineFor || '—'),
          h('dt', {}, t('stats.capturedAt')), h('dd', {}, dateTime(player.capturedAt, lang)),
          h('dt', {}, 'ID'), h('dd', {}, player.playerId)))));

  /* ------------------------------------------------------- achievements */
  const achHost = h('section', { class: 'kc-panel' },
    h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('stats.player.achievements')))),
    h('div', { class: 'kc-panel-body' }, loading(t('common.loading'))));
  host.append(achHost);

  try {
    const ach = await playerAchievements(player.playerId);
    const items = ach.items || [];
    const rewarded = items.filter((a) => a.rewarded).length;
    const body = achHost.querySelector('.kc-panel-body');
    clear(body);

    if (!items.length) { body.append(empty(t('common.nothing'))); return; }

    let showAll = false;
    const listHost = h('div', {});

    const drawList = () => {
      const rows = sortBy(items, null, -1, (a) => (a.completeTimeUtc ? 1 : 0) * 1e13 + (Number(a.currentProgress) || 0))
        .slice(0, showAll ? items.length : 40);
      clear(listHost);
      listHost.append(dataTable(rows, [
        {
          key: 'achievementName', label: t('common.name'), sortable: false,
          render: (a) => h('div', {},
            h('div', { style: { fontWeight: '600' } }, a.achievementName),
            a.tierName && h('small', { style: { color: 'var(--muted)' } }, a.tierName)),
        },
        {
          key: 'rewarded', label: t('common.type'), sortable: false,
          render: (a) => (a.rewarded
            ? h('span', { class: 'kc-badge is-success' }, t('stats.player.completed'))
            : h('span', { class: 'kc-badge' }, t('stats.player.inProgress'))),
        },
        { key: 'currentProgress', label: t('stats.player.progress'), num: true, sortable: false, render: (a) => num(a.currentProgress, lang) },
        { key: 'completeTimeUtc', label: t('common.updated'), sortable: false, render: (a) => (a.completeTimeUtc ? dateTime(a.completeTimeUtc, lang) : '—') },
      ], { lang, minWidth: '620px' }));

      if (!showAll && items.length > 40) {
        listHost.append(h('div', { style: { padding: '12px', textAlign: 'center' } },
          h('button', { class: 'kc-btn sm', onclick: () => { showAll = true; drawList(); } },
            (lang === 'ru' ? 'Показать все ' : 'Show all ') + items.length)));
      }
    };

    body.append(
      h('div', { class: 'kc-grid c3', style: { marginBottom: '14px' } },
        tile(t('stats.player.achievementsCount'), num(items.length, lang)),
        tile(t('stats.player.completed'), num(rewarded, lang)),
        tile(t('stats.player.inProgress'), num(items.length - rewarded, lang))),
      listHost);
    drawList();
  } catch {
    const body = achHost.querySelector('.kc-panel-body');
    clear(body);
    body.append(empty(t('common.nothing'), lang === 'ru' ? 'Файл достижений для этого игрока не выгружен.' : 'No achievements file was exported for this player.'));
  }

  function tile(label, value, note) {
    return h('div', { class: 'kc-tile' },
      h('div', { class: 'kc-tile-label' }, label),
      h('div', { class: 'kc-tile-value' + (String(value).length > 11 ? ' sm' : '') }, value),
      note && h('small', { class: 'kc-tile-note' }, note));
  }
}
