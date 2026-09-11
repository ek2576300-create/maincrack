import { h, clear, dataTable, sortBy, num, compact, empty, debounce, loading } from '../util.js';
import { manifest, serverAlliances, serverPlayers, serverSelect, nameCell } from './stats-common.js';

export async function render(mount, { t, i18n, navigate }) {
  const lang = i18n.lang;
  const m = await manifest();

  let sort = 'power';
  let dir = -1;
  let q = '';
  let alliances = [];
  let memberCount = new Map();

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
    const [a, p] = await Promise.all([serverAlliances(serverId), serverPlayers(serverId)]);
    alliances = a.items;
    memberCount = new Map();
    for (const pl of p.items) {
      if (!pl.allianceId || pl.allianceId === '0') continue;
      memberCount.set(pl.allianceId, (memberCount.get(pl.allianceId) || 0) + 1);
    }
    draw();
  }

  function draw() {
    let rows = alliances;
    if (q) rows = rows.filter((a) => a.allianceName.toLowerCase().includes(q)
      || String(a.allianceAbbr || '').toLowerCase().includes(q)
      || String(a.ownerName || '').toLowerCase().includes(q));
    const total = rows.length;
    rows = sortBy(rows, sort, dir, (a) => (sort === 'allianceName' ? a.allianceName
      : sort === 'members' ? (memberCount.get(a.allianceId) || 0) : Number(a[sort]) || 0));

    const columns = [
      { key: '__i', label: t('common.rank'), sortable: false, width: '54px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
      {
        key: 'allianceName', label: t('common.name'),
        render: (a) => nameCell(`[${a.allianceAbbr || '—'}] ${a.allianceName}`, `${t('stats.leader')}: ${a.ownerName || '—'}`, `/stats/alliance/${a.allianceId}`),
      },
      { key: 'power', label: t('stats.power'), num: true, render: (a) => h('span', { class: 'best', title: num(a.power, lang) }, compact(a.power, lang)) },
      { key: 'members', label: t('stats.members'), num: true, render: (a) => num(memberCount.get(a.allianceId) || 0, lang) },
      { key: 'merits', label: t('stats.merits'), num: true },
      { key: 'flags', label: t('stats.flags'), num: true },
      { key: 'armorySeasonPoints', label: t('stats.armory'), num: true },
      { key: 'kills', label: t('stats.kills'), num: true },
    ];

    clear(tableHost);
    tableHost.append(rows.length
      ? dataTable(rows, columns, {
        sort, dir, lang, minWidth: '900px',
        onSort: (k) => { if (sort === k) dir = -dir; else { sort = k; dir = k === 'allianceName' ? 1 : -1; } draw(); },
        onRow: (a) => navigate(`/stats/alliance/${a.allianceId}`),
      })
      : empty(t('common.nothing'), t('common.nothingHint')));

    clear(foot);
    foot.append(`${t('common.showing')} ${rows.length} ${t('common.of')} ${total}.`);
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.alliances.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.alliances.title')), h('p', {}, t('stats.alliances.desc'))),
        h('div', { class: 'kc-toolbar' }, picker.el, search)),
      tableHost, foot));

  await load(picker.value);
}
