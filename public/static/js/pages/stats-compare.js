import { h, clear, num, compact, loading, empty } from '../util.js';
import { manifest, serverPlayers, serverAlliances, serverSelect, METRICS, ALLIANCE_METRICS } from './stats-common.js';

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const m = await manifest();

  let mode = 'players';
  let players = [];
  let alliances = [];
  let leftId = '';
  let rightId = '';

  const selLeft = h('select', { class: 'kc-select', onchange: (e) => { leftId = e.target.value; draw(); } });
  const selRight = h('select', { class: 'kc-select', onchange: (e) => { rightId = e.target.value; draw(); } });
  const out = h('div', {});

  const modeSel = h('select', {
    class: 'kc-select',
    onchange: (e) => { mode = e.target.value; leftId = rightId = ''; fillOptions(); draw(); },
  },
    h('option', { value: 'players' }, t('stats.players')),
    h('option', { value: 'alliances' }, t('stats.alliances')));

  const picker = serverSelect(m.servers, (id) => load(id), t);

  async function load(serverId) {
    clear(out);
    out.append(loading(t('common.loading')));
    const [p, a] = await Promise.all([serverPlayers(serverId), serverAlliances(serverId)]);
    players = [...p.items].sort((x, y) => y.power - x.power);
    alliances = [...a.items].sort((x, y) => y.power - x.power);
    leftId = rightId = '';
    fillOptions();
    draw();
  }

  function fillOptions() {
    const isPlayers = mode === 'players';
    const list = isPlayers ? players : alliances;
    for (const [sel, current] of [[selLeft, leftId], [selRight, rightId]]) {
      clear(sel);
      sel.append(h('option', { value: '' }, t('stats.compare.pick')));
      for (const r of list) {
        const id = isPlayers ? r.playerId : r.allianceId;
        const label = isPlayers
          ? `${r.playerName} — ${compact(r.power, lang)}`
          : `[${r.allianceAbbr || '—'}] ${r.allianceName} — ${compact(r.power, lang)}`;
        sel.append(h('option', { value: id, selected: id === current }, label));
      }
    }
    // Sensible default: the two strongest.
    if (!leftId && list[0]) { leftId = mode === 'players' ? list[0].playerId : list[0].allianceId; selLeft.value = leftId; }
    if (!rightId && list[1]) { rightId = mode === 'players' ? list[1].playerId : list[1].allianceId; selRight.value = rightId; }
  }

  function find(id) {
    return mode === 'players'
      ? players.find((p) => p.playerId === id)
      : alliances.find((a) => a.allianceId === id);
  }

  function draw() {
    const a = find(leftId);
    const b = find(rightId);
    clear(out);
    if (!a || !b) { out.append(empty(t('stats.compare.pick'), t('stats.compare.desc'))); return; }

    const metrics = mode === 'players' ? METRICS : ALLIANCE_METRICS;
    const nameOf = (r) => (mode === 'players' ? r.playerName : `[${r.allianceAbbr || '—'}] ${r.allianceName}`);
    const subOf = (r) => (mode === 'players' ? (r.allianceName || t('stats.noAlliance')) : `${t('stats.leader')}: ${r.ownerName || '—'}`);

    const head = h('div', { class: 'kc-grid c3', style: { alignItems: 'center', marginBottom: '14px' } },
      side(nameOf(a), subOf(a), 'left'),
      h('div', { style: { textAlign: 'center', color: 'var(--muted)', font: '900 15px var(--sans)' } }, 'VS'),
      side(nameOf(b), subOf(b), 'right'));

    const rows = metrics.map((mt) => {
      const x = Number(a[mt.key]) || 0;
      const y = Number(b[mt.key]) || 0;
      const max = Math.max(x, y, 1);
      const fmt = (v) => (v > 1e5 ? compact(v, lang) : num(v, lang));
      const diff = x - y;
      return h('div', { style: { padding: '11px 0', borderBottom: '1px solid rgba(216,180,93,.11)' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' } },
          h('div', { style: { width: '90px', textAlign: 'right', fontWeight: '800', color: x >= y ? 'var(--gold-soft)' : 'var(--text-dim)' } }, fmt(x)),
          h('div', { style: { flex: '1', display: 'flex', gap: '4px', alignItems: 'center' } },
            h('div', { class: 'kc-bar', style: { flex: '1', transform: 'scaleX(-1)' } },
              h('span', { style: { width: `${(x / max) * 100}%` } })),
            h('div', { class: 'kc-bar', style: { flex: '1' } },
              h('span', { style: { width: `${(y / max) * 100}%` } }))),
          h('div', { style: { width: '90px', fontWeight: '800', color: y >= x ? 'var(--gold-soft)' : 'var(--text-dim)' } }, fmt(y))),
        h('div', { style: { textAlign: 'center', marginTop: '5px', fontSize: '11px', color: 'var(--muted)' } },
          t(mt.labelKey), diff !== 0 ? ` · ${t('stats.compare.diff')} ${diff > 0 ? '←' : '→'} ${fmt(Math.abs(diff))}` : ''));
    });

    out.append(head, ...rows);

    function side(name, sub, align) {
      return h('div', { style: { textAlign: align === 'left' ? 'left' : 'right' } },
        h('div', { style: { fontWeight: '800', fontSize: '15px', color: 'var(--gold-soft)' } }, name),
        h('small', { style: { color: 'var(--muted)' } }, sub));
    }
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('stats.compare.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('stats.compare.title')), h('p', {}, t('stats.compare.desc'))),
        h('div', { class: 'kc-toolbar' }, picker.el, modeSel)),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2', style: { marginBottom: '14px' } }, selLeft, selRight),
        out)));

  await load(picker.value);
}
