import { h, clear, dataTable, sortBy, num, compact, loading } from '../util.js';
import { manifest, serverPlayers, serverAlliances, serverSelect, nameCell, METRICS, ALLIANCE_METRICS } from './stats-common.js';

export async function render(mount, { t, i18n, navigate }) {
  const lang = i18n.lang;
  const m = await manifest();

  let mode = 'players';
  let metric = 'power';
  let players = [];
  let alliances = [];

  const tableHost = h('div', {});
  const chipsHost = h('div', { class: 'kc-chips' });

  const modeSel = h('select', {
    class: 'kc-select',
    onchange: (e) => { mode = e.target.value; metric = mode === 'players' ? 'power' : 'power'; drawChips(); draw(); },
  },
    h('option', { value: 'players' }, t('stats.players')),
    h('option', { value: 'alliances' }, t('stats.alliances')));

  const picker = serverSelect(m.servers, (id) => load(id), t);

  async function load(serverId) {
    clear(tableHost);
    tableHost.append(loading(t('common.loading')));
    const [p, a] = await Promise.all([serverPlayers(serverId), serverAlliances(serverId)]);
    players = p.items;
    alliances = a.items;
    drawChips();
    draw();
  }

  function drawChips() {
    clear(chipsHost);
    const list = mode === 'players' ? METRICS : ALLIANCE_METRICS;
    for (const mt of list) {
      chipsHost.append(h('button', {
        class: 'kc-chip' + (mt.key === metric ? ' is-active' : ''), type: 'button',
        onclick: () => { metric = mt.key; drawChips(); draw(); },
      }, t(mt.labelKey)));
    }
  }

  function draw() {
    const isPlayers = mode === 'players';
    const source = isPlayers ? players : alliances;
    const rows = sortBy(source, metric, -1, (r) => Number(r[metric]) || 0).slice(0, 100);

    const columns = [
      { key: '__i', label: t('common.rank'), sortable: false, width: '54px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
      {
        key: 'name', label: t('common.name'), sortable: false,
        render: (r) => isPlayers
          ? nameCell(r.playerName, r.allianceName || t('stats.noAlliance'), `/stats/player/${r.playerId}`)
          : nameCell(`[${r.allianceAbbr || '—'}] ${r.allianceName}`, `${t('stats.leader')}: ${r.ownerName || '—'}`, `/stats/alliance/${r.allianceId}`),
      },
      {
        key: metric, label: t((isPlayers ? METRICS : ALLIANCE_METRICS).find((x) => x.key === metric).labelKey), num: true, sortable: false,
        render: (r) => h('span', { class: 'best', title: num(r[metric], lang) },
          Number(r[metric]) > 1e5 ? compact(r[metric], lang) : num(r[metric], lang)),
      },
      {
        key: '__bar', label: '', sortable: false,
        render: (r) => {
          const max = Number(rows[0][metric]) || 1;
          return h('div', { class: 'kc-bar', style: { minWidth: '90px' } },
            h('span', { style: { width: `${Math.max(2, (Number(r[metric]) / max) * 100)}%` } }));
        },
      },
    ];

    clear(tableHost);
    tableHost.append(dataTable(rows, columns, {
      lang, minWidth: '640px',
      onRow: (r) => navigate(isPlayers ? `/stats/player/${r.playerId}` : `/stats/alliance/${r.allianceId}`),
    }));
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.rankings.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.rankings.title')), h('p', {}, t('stats.rankings.desc'))),
        h('div', { class: 'kc-toolbar' }, picker.el, modeSel)),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '0' } },
        h('div', { class: 'kc-section-title' }, t('stats.rankings.metric')), chipsHost),
      tableHost,
      h('div', { class: 'kc-panel-foot' }, lang === 'ru' ? 'Показаны первые 100 позиций.' : 'Showing the top 100.')));

  await load(picker.value);
}
