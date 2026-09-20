/**
 * Каталог аккаунтов сервера 888.
 *
 * В списке только профили, которые владелец сам открыл: в API это флаг
 * listed, по умолчанию он выключен. E-mail и другие данные аккаунта на сайте
 * сюда не попадают — наружу уходит только то, что человек заполнил про игру.
 */
import { h, clear, api, num, empty, loading, debounce, counted } from '../util.js';
import {
  loadCatalogs, avatarEl, displayNick, unitIcon, unitLabel, bigNumber, UNITS,
} from './roster-common.js';

const PAGE = 24;
const SORTS = ['power', 'kills', 'merits', 'name', 'new', 'updated'];

export async function render(mount, { t, i18n, store, link, navigate }) {
  const lang = i18n.lang;
  const catalogs = await loadCatalogs();

  const state = {
    q: new URLSearchParams(location.search).get('q') || '',
    server: '',
    unit: '',
    sort: 'power',
    // Сколько карточек уже на странице. Именно это, а не «номер страницы ×
    // PAGE», идёт в offset: сервер вправе вернуть меньше, чем мы просили,
    // и тогда счёт по своей константе начнёт пропускать записи.
    loaded: 0,
  };

  const listEl = h('div', { class: 'kc-grid auto-lg' });
  const countEl = h('div', { class: 'kc-note' });
  const moreWrap = h('div', { style: { marginTop: '16px', textAlign: 'center' } });
  const filtersEl = h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } });

  let facetsDrawn = false;
  let total = 0;

  const search = h('input', {
    class: 'kc-input grow', type: 'search', value: state.q,
    placeholder: t('roster.searchPlaceholder'),
    oninput: debounce((e) => { state.q = e.target.value; reload(); }, 220),
  });

  const sortSel = h('select', {
    class: 'kc-select',
    onchange: (e) => { state.sort = e.target.value; reload(); },
  }, ...SORTS.map((s) => h('option', { value: s, selected: s === state.sort }, t('roster.sort.' + s))));

  /** Фильтры собираем из facets: показываем только реально занятые значения. */
  function drawFilters(facets) {
    if (facetsDrawn) return;
    facetsDrawn = true;
    clear(filtersEl);

    if (facets.servers.length > 1) {
      filtersEl.append(h('select', {
        class: 'kc-select',
        onchange: (e) => { state.server = e.target.value; reload(); },
      },
      h('option', { value: '' }, t('common.server') + ': ' + t('common.all')),
      ...facets.servers.map((s) => h('option', { value: s.id }, `${t('common.server')} ${s.id} · ${s.c}`))));
    }

    if (facets.units.length > 1) {
      filtersEl.append(h('select', {
        class: 'kc-select',
        onchange: (e) => { state.unit = e.target.value; reload(); },
      },
      h('option', { value: '' }, t('roster.unit') + ': ' + t('common.all')),
      ...facets.units
        .filter((u) => UNITS.includes(u.id))
        .map((u) => h('option', { value: u.id }, `${unitLabel(u.id, t)} · ${u.c}`))));
    }
  }

  async function load({ append = false } = {}) {
    const params = new URLSearchParams({
      q: state.q.trim(), server: state.server, unit: state.unit,
      sort: state.sort, limit: String(PAGE), offset: String(state.loaded),
    });
    const data = await api('/roster?' + params.toString());
    total = data.total;
    if (data.facets) drawFilters(data.facets);

    if (!append) clear(listEl);
    clear(moreWrap);

    if (!data.items.length && !append) {
      const anyProfiles = data.facets ? data.facets.total : total;
      listEl.append(anyProfiles
        ? empty(t('common.nothing'), t('common.nothingHint'))
        : empty(t('roster.emptyTitle'), t('roster.emptyHint')));
      countEl.textContent = '';
      return;
    }

    listEl.append(...data.items.map((row) => accountCard(row, catalogs, lang, t, link)));
    state.loaded += data.items.length;
    countEl.textContent = counted(state.loaded, total, t, lang);

    // Кнопку прячем и когда страница вернулась пустой: иначе на ней можно
    // залипнуть, если total разошёлся с тем, что реально отдаёт выборка.
    if (state.loaded < total && data.items.length) {
      moreWrap.append(h('button', {
        class: 'kc-btn', type: 'button',
        onclick: (e) => {
          e.target.disabled = true;
          load({ append: true }).finally(() => { e.target.disabled = false; });
        },
      }, t('roster.more')));
    }
  }

  function reload() {
    state.loaded = 0;
    clear(listEl);
    listEl.append(loading(t('common.loading')));
    load().catch(showError);
  }

  function showError(err) {
    clear(listEl);
    listEl.append(h('div', { class: 'kc-error' }, t('common.error') + ' — ' + err.message));
  }

  // Кнопка ведёт в профиль: заполнять данные можно только у себя.
  const cta = h('a', {
    class: 'kc-btn sm is-primary',
    href: store.user ? '/profile?tab=game' : '/login',
    onclick: (e) => { e.preventDefault(); navigate(store.user ? '/profile?tab=game' : '/login'); },
  }, store.user ? t('roster.mine') : t('roster.join'));

  mount.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/', onclick: link('/') }, t('common.home')), ' / ', t('roster.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h1', {}, t('roster.title')), h('p', {}, t('roster.desc'))),
        cta),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-toolbar' }, search, sortSel),
        filtersEl,
        h('div', { style: { marginTop: '12px' } }, countEl))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' }, listEl, moreWrap),
      h('div', { class: 'kc-panel-foot' }, t('roster.joinHint'))));

  reload();
}

/** Карточка аккаунта в списке: аватар, ник, альянс и ключевые цифры. */
function accountCard(row, catalogs, lang, t, link) {
  const href = `/accounts/${row.id}`;
  const alliance = [row.alliance_tag && `[${row.alliance_tag}]`, row.alliance_name]
    .filter(Boolean).join(' ');
  const counts = [
    row.pets && `${t('gp.items.pet')}: ${row.pets}`,
    row.heroes && `${t('gp.items.hero')}: ${row.heroes}`,
    row.artifacts && `${t('gp.items.artifact')}: ${row.artifacts}`,
  ].filter(Boolean).join(' · ');

  return h('a', { class: 'kc-card', href, onclick: link(href) },
    h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
      avatarEl(row, catalogs, 48),
      h('div', { style: { minWidth: '0', flex: '1' } },
        h('div', { style: { fontWeight: '600', color: 'var(--text)' } }, displayNick(row)),
        h('div', { class: 'kc-note', style: { marginTop: '2px' } },
          alliance || (row.game_server ? `${t('common.server')} ${row.game_server}` : '—')))),

    h('div', { class: 'kc-statrow is-3 is-compact', style: { marginTop: '14px' } },
      cell(bigNumber(row.power, lang), t('gp.power')),
      cell(row.tc_level ? num(row.tc_level, lang) : '—', t('gp.tcLevel')),
      cell(bigNumber(row.kills, lang), t('gp.kills'))),

    h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' } },
      row.main_unit
        ? h('span', { class: 'kc-iconcell' }, unitIcon(row.main_unit), unitLabel(row.main_unit, t))
        : null,
      row.play_style ? h('span', { class: 'kc-badge' }, t('gp.style.' + row.play_style, row.play_style)) : null),

    counts ? h('div', { class: 'kc-note', style: { marginTop: '10px' } }, counts) : null);
}

const cell = (value, label) => h('div', {},
  h('div', { class: 'v' }, value),
  h('div', { class: 'k' }, label));
