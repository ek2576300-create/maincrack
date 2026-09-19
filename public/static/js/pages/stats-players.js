import { h, clear, dataTable, sortBy, num, compact, empty, debounce, loading, counted } from '../util.js';
import { manifest, serverPlayers, serverSelect, nameCell } from './stats-common.js';

const PAGE = 100;

export async function render(mount, { t, i18n, navigate }) {
  const lang = i18n.lang;
  const m = await manifest();

  let sort = 'power';
  let dir = -1;
  let q = '';
  let alliance = '';
  let limit = PAGE;
  let players = [];

  const tableHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });
  const allianceSel = h('select', { class: 'kc-select', onchange: (e) => { alliance = e.target.value; limit = PAGE; draw(); } });

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    value: new URLSearchParams(location.search).get('q') || '',
    oninput: debounce((e) => { q = e.target.value.trim().toLowerCase(); limit = PAGE; draw(); }),
  });
  q = search.value.trim().toLowerCase();

  const picker = serverSelect(m.servers, (id) => load(id), t);

  async function load(serverId) {
    clear(tableHost);
    tableHost.append(loading(t('common.loading')));
    const data = await serverPlayers(serverId);
    players = data.items;

    const alliances = [...new Set(players.map((p) => p.allianceName).filter(Boolean))].sort();
    clear(allianceSel);
    allianceSel.append(h('option', { value: '' }, t('stats.alliance') + ': ' + t('common.all')),
      ...alliances.map((a) => h('option', { value: a }, a)));
    limit = PAGE;
    draw();
  }

  function draw() {
    let rows = players;
    if (q) rows = rows.filter((p) => p.playerName.toLowerCase().includes(q) || String(p.playerId).includes(q));
    if (alliance) rows = rows.filter((p) => p.allianceName === alliance);
    const total = rows.length;
    rows = sortBy(rows, sort, dir, (p) => (sort === 'playerName' ? p.playerName : Number(p[sort]) || 0)).slice(0, limit);

    const columns = [
      { key: '__i', label: t('common.rank'), sortable: false, width: '54px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
      {
        key: 'playerName', label: t('common.name'),
        render: (p) => nameCell(p.playerName, p.allianceName ? `[${p.allianceAbbr || '—'}] ${p.allianceName}` : t('stats.noAlliance'), `/stats/player/${p.playerId}`),
      },
      { key: 'power', label: t('stats.power'), num: true, render: (p) => h('span', { class: 'best', title: num(p.power, lang) }, compact(p.power, lang)) },
      { key: 'townCenterLvl', label: t('stats.tc'), num: true },
      { key: 'resourcesGathered', label: t('stats.rss'), num: true, render: (p) => h('span', { title: num(p.resourcesGathered, lang) }, compact(p.resourcesGathered, lang)) },
      { key: 'scenarioPoints', label: t('stats.scenario'), num: true },
      { key: 'immigrationScore', label: t('stats.immigration'), num: true },
      { key: 'honorKills', label: t('stats.kills'), num: true },
    ];

    clear(tableHost);
    tableHost.append(rows.length
      ? dataTable(rows, columns, {
        sort, dir, lang, minWidth: '900px',
        onSort: (k) => { if (sort === k) dir = -dir; else { sort = k; dir = k === 'playerName' ? 1 : -1; } draw(); },
        onRow: (p) => navigate(`/stats/player/${p.playerId}`),
      })
      : empty(t('common.nothing'), t('common.nothingHint')));

    clear(foot);
    foot.append(counted(rows.length, total, t, lang) + '. ');
    if (rows.length < total) {
      foot.append(h('button', {
        class: 'kc-btn sm', style: { marginLeft: '8px' },
        onclick: () => { limit += PAGE * 4; draw(); },
      }, lang === 'ru' ? 'Показать ещё' : 'Show more'));
    }
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.players.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.players.title')), h('p', {}, t('stats.players.desc'))),
        h('div', { class: 'kc-toolbar' }, picker.el, allianceSel, search)),
      tableHost, foot));

  await load(picker.value);
}
