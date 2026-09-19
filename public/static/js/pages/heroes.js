import { h, clear, getJSON, empty, debounce, num, counted } from '../util.js';

const QUALITY_COLOR = { legendary: '#f0c96a', epic: '#b48ce0', rare: '#6fb4e8' };

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/heroes.json');
  const heroes = data.items;

  let q = '';
  let quality = '';
  let season = '';
  let flying = false;
  let openId = null;

  const listHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }),
  });
  const qualSel = h('select', { class: 'kc-select', onchange: (e) => { quality = e.target.value; draw(); } },
    h('option', { value: '' }, t('heroes.quality') + ': ' + t('common.all')),
    ...['legendary', 'epic', 'rare'].filter((x) => heroes.some((hh) => hh.quality === x))
      .map((x) => h('option', { value: x }, t('quality.' + x, x))));
  const seasonSel = h('select', { class: 'kc-select', onchange: (e) => { season = e.target.value; draw(); } },
    h('option', { value: '' }, t('heroes.season') + ': ' + t('common.all')),
    ...[...new Set(heroes.map((x) => x.season))].sort((a, b) => a - b)
      .map((s) => h('option', { value: String(s) }, t('heroes.season') + ' ' + s)));
  const flyChip = h('button', {
    class: 'kc-chip', type: 'button',
    onclick: () => { flying = !flying; flyChip.classList.toggle('is-active', flying); draw(); },
  }, t('heroes.onlyFlying'));

  function heroCard(hero) {
    const open = openId === hero.id;
    const color = QUALITY_COLOR[hero.quality] || 'var(--accent)';

    const head = h('div', {
      style: { display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' },
      onclick: () => { openId = open ? null : hero.id; draw(); },
    },
      h('div', {
        style: {
          width: '42px', height: '42px', flexShrink: '0', display: 'grid', placeItems: 'center',
          border: `1px solid ${color}55`, borderRadius: '10px',
          background: 'var(--surface-2)',
          color, font: '600 16px var(--sans)',
        },
      }, hero.name.slice(0, 2)),
      h('div', { style: { flex: '1', minWidth: '0' } },
        h('div', { style: { fontWeight: '600', color: 'var(--text)', fontSize: '15px' } }, hero.name),
        h('div', { class: 'kc-note', style: { marginTop: '2px' } }, hero.title)),
      h('span', { style: { fontSize: '12px', color: 'var(--muted)', flexShrink: '0' } }, open ? '▲' : '▼'));

    const tags = h('div', { class: 'kc-chips', style: { marginTop: '10px' } },
      h('span', { class: 'kc-badge', style: { borderColor: color + '66', color } }, t('quality.' + hero.quality, hero.quality)),
      h('span', { class: 'kc-badge' }, t('heroes.season') + ' ' + hero.season),
      hero.flying && h('span', { class: 'kc-badge is-gold' }, t('heroes.flying')),
      h('span', { class: 'kc-badge' }, hero.skills.length + ' ' + t('heroes.skills').toLowerCase()));

    const skills = open && h('div', { style: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px' } },
      ...hero.skills.map((s) => h('div', {
        style: {
          padding: '11px 13px', border: '1px solid var(--line)', borderRadius: '9px',
          background: 'rgba(4,24,28,.5)',
        },
      },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
          h('strong', { style: { color: 'var(--accent)', fontSize: '13px' } }, s.name),
          s.rage_cost != null && h('span', { class: 'kc-badge' }, t('heroes.rage') + ' ' + num(s.rage_cost, lang)),
          s.holistic && h('span', { class: 'kc-badge' }, t('heroes.holistic')),
          s.skill_enhanced && h('span', { class: 'kc-badge is-gold' }, t('heroes.enhanced'))),
        h('p', { class: 'kc-note', style: { margin: '6px 0 0', color: 'var(--text-dim)' } }, s.description),
        s.upgrade && h('p', { class: 'kc-note', style: { margin: '5px 0 0' } }, t('heroes.upgrade') + ': ' + s.upgrade))));

    return h('div', { class: 'kc-card' }, head, tags, skills || null);
  }

  function draw() {
    let rows = heroes;
    if (q) rows = rows.filter((x) => x.name.toLowerCase().includes(q) || String(x.title).toLowerCase().includes(q)
      || x.skills.some((s) => s.name.toLowerCase().includes(q)));
    if (quality) rows = rows.filter((x) => x.quality === quality);
    if (season) rows = rows.filter((x) => String(x.season) === season);
    if (flying) rows = rows.filter((x) => x.flying);

    clear(listHost);
    listHost.append(rows.length
      ? h('div', { class: 'kc-grid auto-lg' }, ...rows.map(heroCard))
      : empty(t('common.nothing'), t('common.nothingHint')));

    clear(foot);
    foot.append(counted(rows.length, heroes.length, t, lang) + '. ',
      lang === 'ru' ? 'Источник: api/heroes.json из зеркала coddb.app.' : 'Source: api/heroes.json from the coddb.app mirror.');
  }

  draw();

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('heroes.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('heroes.title')), h('p', {}, t('heroes.desc'))),
        h('div', { class: 'kc-toolbar' }, search, qualSel, seasonSel)),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-chips', style: { marginBottom: '14px' } }, flyChip),
        listHost),
      foot));
}
