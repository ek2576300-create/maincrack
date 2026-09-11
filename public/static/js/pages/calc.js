/**
 * Calculators.
 *
 * IMPORTANT — a real logic difference between the merged sites:
 * coddb.app's own calculators live in per-page Next.js chunks
 * (pages/calculators/{training,healing,speedup,resources,heroes}-*.js) and the
 * mirror captured every one of them as a 0-byte file. Nothing of the original
 * maths survived, so these are reimplementations from the published game
 * formulas, with every coefficient exposed as an editable input.
 */
import { h, clear, num, duration, getJSON } from '../util.js';

/* Base per-unit training cost and time by tier (T1…T5), editable in the UI. */
const TROOPS = {
  1: { food: 50, wood: 50, ore: 0, gold: 0, seconds: 6 },
  2: { food: 100, wood: 100, ore: 20, gold: 0, seconds: 14 },
  3: { food: 200, wood: 200, ore: 60, gold: 0, seconds: 32 },
  4: { food: 400, wood: 400, ore: 160, gold: 20, seconds: 74 },
  5: { food: 800, wood: 800, ore: 400, gold: 80, seconds: 170 },
};

const SPEEDUPS = [1, 5, 10, 15, 30, 60, 180, 480, 1440, 4320]; // minutes

/* Cumulative hero medal cost per star, and XP per level band. */
const HERO_STARS = [0, 10, 30, 70, 150, 310, 630];       // stars 1..6 (cumulative medals)
const HERO_XP_PER_LEVEL = (lvl) => Math.round(120 * Math.pow(lvl, 1.42));

export async function render(mount, ctx) {
  const { t, i18n } = ctx;
  const kind = location.pathname.split('/').pop();
  const lang = i18n.lang;

  const body = h('div', { class: 'kc-panel-body' });
  const titles = {
    training: ['calc.training.title', 'calc.training.desc'],
    healing: ['calc.healing.title', 'calc.healing.desc'],
    speedup: ['calc.speedup.title', 'calc.speedup.desc'],
    resources: ['calc.resources.title', 'calc.resources.desc'],
    heroes: ['calc.heroes.title', 'calc.heroes.desc'],
  }[kind] || titles_default();

  const tabs = h('div', { class: 'kc-chips' },
    ...['training', 'healing', 'speedup', 'resources', 'heroes'].map((k) =>
      h('a', {
        class: 'kc-chip' + (k === kind ? ' is-active' : ''), href: '/calc/' + k,
      }, t(`calc.${k === 'heroes' ? 'heroes' : k}.title`))));

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t(titles[0])),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t(titles[0])), h('p', {}, t(titles[1]))),
        h('span', { class: 'kc-badge is-gold' }, t('calc.reimplemented'))),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '0' } }, tabs),
      body,
      h('div', { class: 'kc-panel-foot' }, t('calc.reimplementedNote'))));

  const build = {
    training: training, healing: healing, speedup: speedup,
    resources: resources, heroes: heroesCalc,
  }[kind] || training;

  await build(body, ctx, lang);

  function titles_default() { return ['calc.training.title', 'calc.training.desc']; }
}

/* ------------------------------------------------------------- primitives */
function field(label, input, help) {
  return h('div', { class: 'kc-field' }, h('label', {}, label), input, help && h('small', { class: 'kc-help' }, help));
}
function numInput(value, oninput, { min = 0, step = 1 } = {}) {
  return h('input', { class: 'kc-input', type: 'number', value: String(value), min: String(min), step: String(step), oninput });
}
function resultGrid(...tiles) { return h('div', { class: 'kc-grid c4', style: { marginTop: '4px' } }, ...tiles); }
function res(label, value, note) {
  return h('div', { class: 'kc-tile' },
    h('div', { class: 'kc-tile-label' }, label),
    h('div', { class: 'kc-tile-value' + (String(value).length > 11 ? ' sm' : '') }, value),
    note && h('small', { class: 'kc-tile-note' }, note));
}

/* -------------------------------------------------------------- training */
function training(body, { t }, lang) {
  const state = { tier: 5, count: 10000, speed: 200, discount: 0, ...structuredClone(TROOPS[5]) };
  const out = h('div', {});

  const tierSel = h('select', {
    class: 'kc-select',
    onchange: (e) => { state.tier = Number(e.target.value); Object.assign(state, structuredClone(TROOPS[state.tier])); redrawCosts(); calc(); },
  }, ...[1, 2, 3, 4, 5].map((i) => h('option', { value: String(i), selected: i === 5 }, 'T' + i)));

  const costHost = h('div', { class: 'kc-grid c4' });

  function redrawCosts() {
    clear(costHost);
    for (const key of ['food', 'wood', 'ore', 'gold']) {
      costHost.append(field(t('calc.' + key), numInput(state[key], (e) => { state[key] = Number(e.target.value) || 0; calc(); })));
    }
    costHost.append(field(t('calc.timeBase') + ' (s)', numInput(state.seconds, (e) => { state.seconds = Number(e.target.value) || 0; calc(); })));
  }

  function calc() {
    const n = Math.max(0, state.count);
    const disc = 1 - Math.min(95, Math.max(0, state.discount)) / 100;
    const speed = 1 + Math.max(0, state.speed) / 100;
    const totals = {};
    for (const key of ['food', 'wood', 'ore', 'gold']) totals[key] = Math.round(state[key] * n * disc);
    const baseMin = (state.seconds * n) / 60;
    const finalMin = baseMin / speed;

    clear(out);
    out.append(
      h('div', { class: 'kc-section-title' }, t('common.result')),
      resultGrid(
        res(t('calc.food'), num(totals.food, lang)),
        res(t('calc.wood'), num(totals.wood, lang)),
        res(t('calc.ore'), num(totals.ore, lang)),
        res(t('calc.gold'), num(totals.gold, lang)),
        res(t('calc.timeBase'), duration(baseMin, lang)),
        res(t('calc.timeFinal'), duration(finalMin, lang), `+${state.speed}%`),
        res(t('common.total'), num(Object.values(totals).reduce((a, b) => a + b, 0), lang),
          lang === 'ru' ? 'все ресурсы' : 'all resources'),
        res('T' + state.tier, num(n, lang), lang === 'ru' ? 'юнитов' : 'units')));
  }

  body.append(
    h('div', { class: 'kc-grid c4' },
      field(t('calc.tier'), tierSel),
      field(t('calc.count'), numInput(state.count, (e) => { state.count = Number(e.target.value) || 0; calc(); }, { step: 100 })),
      field(t('calc.speedBonus'), numInput(state.speed, (e) => { state.speed = Number(e.target.value) || 0; calc(); }, { step: 5 })),
      field(t('calc.rssBonus'), numInput(state.discount, (e) => { state.discount = Number(e.target.value) || 0; calc(); }, { step: 1 }))),
    h('div', { class: 'kc-section-title' }, t('calc.perUnit')),
    costHost, out);

  redrawCosts();
  calc();
}

/* --------------------------------------------------------------- healing */
function healing(body, { t }, lang) {
  const state = { tier: 5, wounded: 50000, ratio: 30, speed: 100, healSeconds: 3 };
  const out = h('div', {});

  const tierSel = h('select', { class: 'kc-select', onchange: (e) => { state.tier = Number(e.target.value); calc(); } },
    ...[1, 2, 3, 4, 5].map((i) => h('option', { value: String(i), selected: i === 5 }, 'T' + i)));

  function calc() {
    const base = TROOPS[state.tier];
    const n = Math.max(0, state.wounded);
    const ratio = Math.max(0, state.ratio) / 100;
    const speed = 1 + Math.max(0, state.speed) / 100;
    const totals = {};
    for (const key of ['food', 'wood', 'ore', 'gold']) totals[key] = Math.round(base[key] * n * ratio);
    const baseMin = (state.healSeconds * n) / 60;

    clear(out);
    out.append(
      h('div', { class: 'kc-section-title' }, t('common.result')),
      resultGrid(
        res(t('calc.food'), num(totals.food, lang)),
        res(t('calc.wood'), num(totals.wood, lang)),
        res(t('calc.ore'), num(totals.ore, lang)),
        res(t('calc.gold'), num(totals.gold, lang)),
        res(t('calc.timeBase'), duration(baseMin, lang)),
        res(t('calc.timeFinal'), duration(baseMin / speed, lang), `+${state.speed}%`),
        res(t('common.total'), num(Object.values(totals).reduce((a, b) => a + b, 0), lang)),
        res(t('calc.wounded'), num(n, lang), 'T' + state.tier)));
  }

  body.append(
    h('div', { class: 'kc-grid c4' },
      field(t('calc.tier'), tierSel),
      field(t('calc.wounded'), numInput(state.wounded, (e) => { state.wounded = Number(e.target.value) || 0; calc(); }, { step: 1000 })),
      field(t('calc.healRatio'), numInput(state.ratio, (e) => { state.ratio = Number(e.target.value) || 0; calc(); }),
        lang === 'ru' ? 'Доля от стоимости обучения, обычно ~30%.' : 'Share of the training cost, usually ~30%.'),
      field(t('calc.healBonus'), numInput(state.speed, (e) => { state.speed = Number(e.target.value) || 0; calc(); }, { step: 5 }))),
    h('div', { class: 'kc-grid c4' },
      field(lang === 'ru' ? 'Секунд на юнита' : 'Seconds per unit',
        numInput(state.healSeconds, (e) => { state.healSeconds = Number(e.target.value) || 0; calc(); }, { step: 0.5 }))),
    out);

  calc();
}

/* --------------------------------------------------------------- speedup */
function speedup(body, { t }, lang) {
  const have = Object.fromEntries(SPEEDUPS.map((m) => [m, 0]));
  let needMinutes = 0;
  const out = h('div', {});

  const rows = h('div', { class: 'kc-grid c4' }, ...SPEEDUPS.map((m) =>
    field(duration(m, lang), numInput(0, (e) => { have[m] = Number(e.target.value) || 0; calc(); }, { step: 1 }))));

  function calc() {
    const total = SPEEDUPS.reduce((sum, m) => sum + m * (have[m] || 0), 0);
    const diff = total - needMinutes;
    clear(out);
    out.append(
      h('div', { class: 'kc-section-title' }, t('common.result')),
      resultGrid(
        res(t('calc.speedup.sum'), duration(total, lang), num(total, lang) + (lang === 'ru' ? ' мин' : ' min')),
        res(t('calc.speedup.needed'), duration(needMinutes, lang)),
        diff >= 0
          ? res(t('calc.speedup.left'), duration(diff, lang))
          : res(t('calc.speedup.short'), duration(-diff, lang)),
        res(lang === 'ru' ? 'Предметов' : 'Items', num(SPEEDUPS.reduce((s, m) => s + (have[m] || 0), 0), lang))));
  }

  body.append(
    h('div', { class: 'kc-section-title' }, t('calc.speedup.have')),
    rows,
    h('div', { class: 'kc-grid c4' },
      field(t('calc.speedup.needed') + (lang === 'ru' ? ', мин' : ', min'),
        numInput(0, (e) => { needMinutes = Number(e.target.value) || 0; calc(); }, { step: 10 }))),
    out);

  calc();
}

/* ------------------------------------------------------------- resources */
function resources(body, { t }, lang) {
  const state = { need: 10_000_000, speed: 250_000, capacity: 600_000, legions: 5, travelMin: 6 };
  const out = h('div', {});

  function calc() {
    const legions = Math.max(1, state.legions);
    const perHour = Math.max(1, state.speed) * legions;
    const gatherHours = state.need / perHour;
    const trips = Math.ceil(state.need / Math.max(1, state.capacity * legions));
    const travelHours = (trips * state.travelMin) / 60;

    clear(out);
    out.append(
      h('div', { class: 'kc-section-title' }, t('common.result')),
      resultGrid(
        res(t('calc.resources.hours'), duration(gatherHours * 60, lang)),
        res(t('calc.resources.trips'), num(trips, lang)),
        res(lang === 'ru' ? 'С дорогой' : 'With travel', duration((gatherHours + travelHours) * 60, lang)),
        res(lang === 'ru' ? 'В час всего' : 'Per hour total', num(perHour, lang))));
  }

  body.append(
    h('div', { class: 'kc-grid c4' },
      field(t('calc.resources.need'), numInput(state.need, (e) => { state.need = Number(e.target.value) || 0; calc(); }, { step: 100000 })),
      field(t('calc.resources.gatherSpeed'), numInput(state.speed, (e) => { state.speed = Number(e.target.value) || 0; calc(); }, { step: 10000 })),
      field(t('calc.resources.capacity'), numInput(state.capacity, (e) => { state.capacity = Number(e.target.value) || 0; calc(); }, { step: 10000 })),
      field(t('calc.resources.legions'), numInput(state.legions, (e) => { state.legions = Number(e.target.value) || 1; calc(); }))),
    h('div', { class: 'kc-grid c4' },
      field(lang === 'ru' ? 'Дорога туда-обратно, мин' : 'Round trip, min',
        numInput(state.travelMin, (e) => { state.travelMin = Number(e.target.value) || 0; calc(); }))),
    out);

  calc();
}

/* ----------------------------------------------------------- hero levels */
async function heroesCalc(body, { t }, lang) {
  const heroes = (await getJSON('/data/heroes.json')).items;
  const state = { starFrom: 1, starTo: 6, lvlFrom: 1, lvlTo: 60, hero: heroes[0]?.name || '' };
  const out = h('div', {});

  const heroSel = h('select', { class: 'kc-select', onchange: (e) => { state.hero = e.target.value; calc(); } },
    ...heroes.map((x) => h('option', { value: x.name }, `${x.name} — ${t('quality.' + x.quality, x.quality)}`)));

  const starSel = (key, value) => h('select', {
    class: 'kc-select', onchange: (e) => { state[key] = Number(e.target.value); calc(); },
  }, ...[1, 2, 3, 4, 5, 6].map((i) => h('option', { value: String(i), selected: i === value }, '★'.repeat(i))));

  function calc() {
    const from = Math.min(state.starFrom, state.starTo);
    const to = Math.max(state.starFrom, state.starTo);
    const medals = HERO_STARS[to - 1] - HERO_STARS[from - 1];

    let xp = 0;
    for (let l = Math.min(state.lvlFrom, state.lvlTo); l < Math.max(state.lvlFrom, state.lvlTo); l++) xp += HERO_XP_PER_LEVEL(l);

    const hero = heroes.find((x) => x.name === state.hero);
    clear(out);
    out.append(
      h('div', { class: 'kc-section-title' }, t('common.result')),
      resultGrid(
        res(t('calc.heroes.medals'), num(medals, lang), '★'.repeat(from) + ' → ' + '★'.repeat(to)),
        res(t('calc.heroes.xp'), num(xp, lang), `${Math.min(state.lvlFrom, state.lvlTo)} → ${Math.max(state.lvlFrom, state.lvlTo)}`),
        res(t('heroes.quality'), hero ? t('quality.' + hero.quality, hero.quality) : '—', hero?.title),
        res(t('heroes.skills'), hero ? String(hero.skills.length) : '—')));
  }

  body.append(
    h('div', { class: 'kc-grid c4' },
      field(lang === 'ru' ? 'Герой' : 'Hero', heroSel),
      field(t('calc.heroes.stars') + ' — ' + t('calc.heroes.from'), starSel('starFrom', 1)),
      field(t('calc.heroes.stars') + ' — ' + t('calc.heroes.to'), starSel('starTo', 6)),
      field(t('calc.heroes.level'), h('div', { style: { display: 'flex', gap: '7px' } },
        numInput(state.lvlFrom, (e) => { state.lvlFrom = Number(e.target.value) || 1; calc(); }, { min: 1 }),
        numInput(state.lvlTo, (e) => { state.lvlTo = Number(e.target.value) || 1; calc(); }, { min: 1 })))),
    out);

  calc();
}
