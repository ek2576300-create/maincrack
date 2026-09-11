import { h, clear, dataTable, sortBy, num, compact, empty, debounce, loading } from '../util.js';
import { manifest, serverImmigration, serverSelect, nameCell } from './stats-common.js';

export async function render(mount, { t, i18n, navigate }) {
  const lang = i18n.lang;
  const m = await manifest();

  let sort = 'immigrationScore';
  let dir = -1;
  let q = '';
  let items = [];

  const tableHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });
  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }),
  });

  const picker = serverSelect(m.servers, (id) => load(id), t);

  async function load(serverId) {
    clear(tableHost);
    tableHost.append(loading(t('common.loading')));
    try {
      const data = await serverImmigration(serverId);
      items = data.items || [];
    } catch { items = []; }
    draw();
  }

  function draw() {
    if (!items.length) {
      clear(tableHost);
      tableHost.append(empty(t('stats.immigration.none'), t('stats.immigration.desc')));
      clear(foot);
      return;
    }
    let rows = items;
    if (q) rows = rows.filter((p) => p.playerName.toLowerCase().includes(q));
    const total = rows.length;
    rows = sortBy(rows, sort, dir, (p) => (sort === 'playerName' ? p.playerName : Number(p[sort]) || 0)).slice(0, 300);

    const columns = [
      { key: '__i', label: t('common.rank'), sortable: false, width: '54px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
      { key: 'playerName', label: t('common.name'), render: (p) => nameCell(p.playerName, p.allianceName || t('stats.noAlliance'), `/stats/player/${p.playerId}`) },
      { key: 'immigrationScore', label: t('stats.immigration'), num: true, render: (p) => h('span', { class: 'best' }, num(p.immigrationScore, lang)) },
      { key: 'power', label: t('stats.power'), num: true, render: (p) => h('span', { title: num(p.power, lang) }, compact(p.power, lang)) },
      { key: 'townCenterLvl', label: t('stats.tc'), num: true },
      { key: 'resourcesGathered', label: t('stats.rss'), num: true, render: (p) => compact(p.resourcesGathered, lang) },
      { key: 'scenarioPoints', label: t('stats.scenario'), num: true },
    ];

    clear(tableHost);
    tableHost.append(dataTable(rows, columns, {
      sort, dir, lang, minWidth: '820px',
      onSort: (k) => { if (sort === k) dir = -dir; else { sort = k; dir = k === 'playerName' ? 1 : -1; } draw(); },
      onRow: (p) => navigate(`/stats/player/${p.playerId}`),
    }));
    clear(foot);
    foot.append(`${t('common.showing')} ${rows.length} ${t('common.of')} ${total}.`);
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.immigration.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.immigration.title')), h('p', {}, t('stats.immigration.desc'))),
        h('div', { class: 'kc-toolbar' }, picker.el, search)),
      tableHost, foot));

  await load(picker.value);
}
