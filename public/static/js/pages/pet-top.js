import { h, clear, getJSON, dataTable, sortBy, num, panel, empty, debounce, counted } from '../util.js';

const ATTRS = ['Strength', 'Agility', 'Intelligence', 'Endurance', 'Spirit', 'Luck'];

export async function render(mount, { t, i18n, navigate }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/pets.json');
  const pets = data.items;

  let sort = 'Total';
  let dir = -1;
  let q = '';
  let unit = '';
  let dmg = '';

  const leaders = h('div', { class: 'kc-grid c6', style: { marginBottom: '14px' } });
  const tableHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }),
  });

  const unitSel = h('select', { class: 'kc-select', onchange: (e) => { unit = e.target.value; draw(); } },
    h('option', { value: '' }, t('pets.top.unit') + ': ' + t('common.all')),
    ...[...new Set(pets.map((p) => p.unit))].sort()
      .map((u) => h('option', { value: u }, t('unit.' + u, u))));

  const dmgSel = h('select', { class: 'kc-select', onchange: (e) => { dmg = e.target.value; draw(); } },
    h('option', { value: '' }, t('pets.top.damageType') + ': ' + t('common.all')),
    ...[...new Set(pets.map((p) => p.type))].sort()
      .map((u) => h('option', { value: u }, t('dmg.' + u, u))));

  function bestAttr(p) {
    let best = ATTRS[0];
    for (const a of ATTRS) if (p['max' + a] > p['max' + best]) best = a;
    return best;
  }

  const petName = (p) => (lang === 'ru' && p.name_ru) || p.name;

  function drawLeaders() {
    clear(leaders);
    for (const a of ATTRS) {
      const top = sortBy(pets, null, -1, (p) => p['max' + a])[0];
      leaders.append(h('div', { class: 'kc-tile' },
        h('div', { class: 'kc-tile-label' },
          h('img', { src: `/static/img/warpets/attributes/${a}.png`, alt: '', loading: 'lazy' }),
          t('attr.' + a)),
        h('div', { class: 'kc-tile-value' }, num(top['max' + a], lang)),
        h('small', { class: 'kc-tile-note' }, petName(top))));
    }
  }

  function draw() {
    let rows = pets;
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || (p.name_ru || '').toLowerCase().includes(q));
    if (unit) rows = rows.filter((p) => p.unit === unit);
    if (dmg) rows = rows.filter((p) => p.type === dmg);
    rows = sortBy(rows, sort, dir, (p) => (sort === 'Total' ? p.total : sort === 'name' ? petName(p) : p['max' + sort]));

    const columns = [
      { key: '__i', label: t('common.rank'), sortable: false, width: '52px', render: (_r, i) => h('span', { class: 'rank' }, String(i + 1)) },
      {
        key: 'name', label: t('common.name'),
        render: (p) => h('div', { class: 'kc-petcell' },
          h('img', { src: '/static/img/warpets/' + p.portrait, alt: petName(p), loading: 'lazy' }),
          h('div', {}, h('div', { style: { fontWeight: '700' } }, petName(p)),
            h('small', { style: { color: 'var(--muted)' } }, t('pets.top.best') + ': ' + t('attr.' + bestAttr(p))))),
      },
      { key: 'type', label: t('pets.top.damageType'), value: (p) => t('dmg.' + p.type, p.type) },
      {
        key: 'unit', label: t('pets.top.unit'),
        render: (p) => h('span', { class: 'kc-iconcell' },
          h('img', { src: `/static/img/icons/units/${p.unit}.png`, alt: '', loading: 'lazy', style: { width: '20px', height: '20px' } }),
          t('unit.' + p.unit, p.unit)),
      },
      ...ATTRS.map((a) => ({
        key: a, label: t('attr.' + a), num: true,
        render: (p) => h('span', { class: p['max' + a] >= 340 ? 'best' : p['max' + a] >= 300 ? 'high' : '' }, num(p['max' + a], lang)),
      })),
      { key: 'Total', label: t('pets.top.totalStats'), num: true, render: (p) => h('b', { style: { color: 'var(--accent)' } }, num(p.total, lang)) },
    ];

    clear(tableHost);
    tableHost.append(rows.length
      ? dataTable(rows, columns, {
        sort, dir, lang, minWidth: '1040px',
        onSort: (k) => { if (sort === k) dir = -dir; else { sort = k; dir = k === 'name' ? 1 : -1; } draw(); },
      })
      : empty(t('common.nothing'), t('common.nothingHint')));

    clear(foot);
    foot.append(counted(rows.length, pets.length, t, lang) + ` · ${t('pets.skills.title')}: `,
      h('a', { href: '/pets/skills' }, t('pets.skills.title')),
      ' · ', h('a', { href: '/pets/builder' }, t('pets.builder.title')));
  }

  drawLeaders();
  draw();

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('pets.top.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('pets.top.title')), h('p', {}, t('pets.top.desc'))),
        h('div', { class: 'kc-toolbar' }, search, unitSel, dmgSel)),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-section-title' }, t('pets.top.leaders')),
        leaders),
      tableHost,
      foot));
}
