import { h, clear, getJSON, dataTable, sortBy, num, empty, debounce, counted } from '../util.js';

/**
 * Amber-priced skills are marked in the source data by a very small cost array
 * (the builder treats cost <= 12 as amber rather than pet coins, and always
 * runs those at Lv.4). We surface the same distinction here.
 */
const isAmber = (s) => Array.isArray(s.costs) && s.costs.every((c) => c > 0 && c <= 12);

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const [data, petData] = await Promise.all([getJSON('/data/pet-skills.json'), getJSON('/data/pets.json')]);
  const skills = data.items;

  let sort = 'name';
  let dir = 1;
  let q = '';
  let attr = '';
  let cat = '';
  let pet = '';
  let onlyTalents = false;
  let onlyAmber = false;

  const tableHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }),
  });
  const attrSel = h('select', { class: 'kc-select', onchange: (e) => { attr = e.target.value; draw(); } },
    h('option', { value: '' }, t('pets.skills.attribute') + ': ' + t('common.all')),
    ...[...new Set(skills.map((s) => s.attribute))].sort().map((a) => h('option', { value: a }, t('attr.' + a, a))));
  const catSel = h('select', { class: 'kc-select', onchange: (e) => { cat = e.target.value; draw(); } },
    h('option', { value: '' }, t('pets.skills.category') + ': ' + t('common.all')),
    ...[...new Set(skills.map((s) => s.category).filter(Boolean))].sort().map((c) => h('option', { value: c }, t('cat.' + c, c))));
  const petByName = new Map(petData.items.map((p) => [p.name, p]));
  const petLabel = (name) => (lang === 'ru' && petByName.get(name)?.name_ru) || name;

  const petSel = h('select', { class: 'kc-select', onchange: (e) => { pet = e.target.value; draw(); } },
    h('option', { value: '' }, t('pets.skills.exclusive') + ': ' + t('common.all')),
    ...petData.items.map((p) => h('option', { value: p.name }, petLabel(p.name))));

  const talentChip = h('button', { class: 'kc-chip', type: 'button', onclick: () => { onlyTalents = !onlyTalents; talentChip.classList.toggle('is-active', onlyTalents); draw(); } }, '⭐ ' + t('pets.skills.onlyTalents'));
  const amberChip = h('button', { class: 'kc-chip', type: 'button', onclick: () => { onlyAmber = !onlyAmber; amberChip.classList.toggle('is-active', onlyAmber); draw(); } }, '🟡 ' + t('pets.skills.onlyAmber'));

  function draw() {
    let rows = skills;
    if (q) rows = rows.filter((s) => s.name.toLowerCase().includes(q) || String(s.dependency || '').toLowerCase().includes(q));
    if (attr) rows = rows.filter((s) => s.attribute === attr);
    if (cat) rows = rows.filter((s) => s.category === cat);
    if (pet) rows = rows.filter((s) => s.petExclusive === pet);
    if (onlyTalents) rows = rows.filter((s) => s.talent);
    if (onlyAmber) rows = rows.filter(isAmber);
    rows = sortBy(rows, sort, dir, (s) => {
      if (sort === 'cost') return (s.costs || []).reduce((a, b) => a + b, 0);
      if (sort === 'value') return (s.values || [])[3] ?? 0;
      return s[sort];
    });

    const columns = [
      {
        key: 'name', label: t('common.name'),
        render: (s) => h('div', { class: 'kc-iconcell' },
          s.icon && h('img', { src: '/static/img/warpets/' + s.icon, alt: '', loading: 'lazy' }),
          h('div', {},
            h('div', { style: { fontWeight: '700' } }, s.name, s.talent ? ' ⭐' : ''),
            s.dependency && h('small', { style: { color: 'var(--muted)' } }, t('pets.skills.dependency') + ': ' + s.dependency))),
      },
      {
        key: 'attribute', label: t('pets.skills.attribute'),
        render: (s) => h('span', { class: 'kc-iconcell' },
          h('img', { src: `/static/img/warpets/attributes/${s.attribute}.png`, alt: '', loading: 'lazy', style: { width: '18px', height: '18px' } }),
          t('attr.' + s.attribute, s.attribute)),
      },
      { key: 'type', label: t('common.type'), value: (s) => t('dmg.' + s.type, s.type) },
      { key: 'category', label: t('pets.skills.category'), value: (s) => t('cat.' + s.category, s.category || '—') },
      {
        key: 'petExclusive', label: t('pets.skills.exclusive'),
        render: (s) => (s.petExclusive
          ? h('span', { class: 'kc-iconcell', style: { color: 'var(--info)' } },
            petByName.get(s.petExclusive) && h('img', {
              src: '/static/img/warpets/' + petByName.get(s.petExclusive).portrait, alt: '', loading: 'lazy',
              style: { width: '18px', height: '18px', borderRadius: '4px' },
            }),
            petLabel(s.petExclusive))
          : h('span', { style: { color: 'var(--muted-2)' } }, '—')),
      },
      {
        key: 'cost', label: t('pets.skills.cost'), num: true,
        render: (s) => h('span', { class: 'kc-iconcell', style: { justifyContent: 'flex-end' } },
          h('img', { src: isAmber(s) ? '/static/img/warpets/amber.png' : '/static/img/warpets/petCoin.png', alt: '', loading: 'lazy', style: { width: '15px', height: '15px' } }),
          h('span', { class: isAmber(s) ? 'best' : '' }, (s.costs || []).map((c) => num(c, lang)).join(' / '))),
      },
      {
        key: 'value', label: t('pets.skills.values'), num: true,
        render: (s) => h('span', { style: { color: 'var(--text-dim)' } },
          (s.values || []).map((v) => (Math.round(v * 100) / 100)).join(' / ')),
      },
    ];

    clear(tableHost);
    tableHost.append(rows.length
      ? dataTable(rows, columns, {
        sort, dir, lang, minWidth: '1080px',
        onSort: (k) => { if (sort === k) dir = -dir; else { sort = k; dir = k === 'name' ? 1 : -1; } draw(); },
      })
      : empty(t('common.nothing'), t('common.nothingHint')));

    clear(foot);
    foot.append(
      counted(rows.length, skills.length, t, lang) + '. ',
      lang === 'ru'
        ? 'Навыки со стоимостью до 12 оплачиваются янтарём — конструктор всегда ставит им 4 уровень и не тратит на них бюджет пет-коинов. Advanced/Intense навыки требуют базовый навык из колонки «Требует».'
        : 'Skills costing 12 or less are paid in amber — the builder always runs them at Lv.4 and they never consume the pet-coin budget. Advanced/Intense skills require the base skill shown in "Requires".');
  }

  draw();

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('pets.skills.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('pets.skills.title')), h('p', {}, t('pets.skills.desc'))),
        h('div', { class: 'kc-toolbar' }, search, attrSel, catSel, petSel)),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '0' } },
        h('div', { class: 'kc-chips' }, talentChip, amberChip)),
      tableHost,
      foot));
}
