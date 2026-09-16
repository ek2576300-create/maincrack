/**
 * Home page.
 *
 * Order of business: what the site actually does first (tools + live numbers),
 * community content second. Sections the client has not filled in yet are not
 * six empty boxes — they collapse into one compact "coming up" list, which is
 * the tidy waiting state the spec asks for without wasting a screen on it.
 */
import { h, getJSON, num, compact } from '../util.js';
import { SITE } from '../routes.js';
import { newsCard } from './news.js';
import { achievementCard } from './achievements.js';
import { teamCard } from './team.js';
import { hofCard } from './hall-of-fame.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [about, newsData, achData, teamData, hofData, tournament, pets, skills, heroes, manifest] = await Promise.all([
    getJSON('/data/site/about.json'),
    getJSON('/data/site/news.json'),
    getJSON('/data/site/achievements.json'),
    getJSON('/data/site/team.json'),
    getJSON('/data/site/hall-of-fame.json'),
    getJSON('/data/site/tournament.json'),
    getJSON('/data/pets.json'),
    getJSON('/data/pet-skills.json'),
    getJSON('/data/heroes.json'),
    getJSON('/data/webdata/manifest.json'),
  ]);

  const news = [...(newsData.items || [])].filter((n) => n.published)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const achievements = achData.items || [];
  const officers = teamData.officers || [];
  const legends = hofData.items || [];
  const hasTournament = tournament.status && tournament.status !== 'coming-soon';
  const hasAbout = Boolean(about.project?.summary?.[lang] || about.history?.teaser?.[lang]);

  /* Sections still waiting for content, in the order of the content spec. */
  const pending = [
    !hasAbout && ['/about', t('about.title'), t('about.pendingHint')],
    !news.length && ['/news', t('news.title'), t('news.emptyHint')],
    !teamData.leader && !officers.length && ['/team', t('team.title'), t('team.emptyHint')],
    !legends.length && ['/hall-of-fame', t('hof.title'), t('hof.emptyHint')],
    !hasTournament && ['/tournament', t('tournament.title'), t('tournament.pendingHint')],
  ].filter(Boolean);

  mount.append(...[
    hero(t, lang, link),
    statRow(pets, skills, heroes, manifest, lang, t),
    toolsSection(pets, skills, heroes, lang, t, link),
    hasAbout && aboutSection(about, lang, t, link),
    news.length && newsSection(news, lang, t, link),
    achievements.length && achievementsSection(achievements, lang, t, link),
    (teamData.leader || officers.length) && teamSection(teamData, officers, lang, t, link),
    legends.length && legendsSection(legends, lang, t, link),
    hasTournament && tournamentSection(tournament, lang, t, link),
    pending.length && pendingSection(pending, t, link),
    youtubeSection(t),
  ].filter(Boolean));
}

/* ------------------------------------------------------------------- hero */
function hero(t, lang, link) {
  return h('section', { class: 'kc-hero' },
    h('div', { class: 'kc-hero-kicker' }, 'Call of Dragons · ' + (lang === 'ru' ? 'сервер 888' : 'server 888')),
    h('h1', {}, t('home.hero.h1')),
    h('p', { class: 'kc-hero-lead' }, t('home.hero.sub')),
    h('div', { class: 'kc-hero-actions' },
      h('a', { class: 'kc-btn is-primary', href: '/pets/builder', onclick: link('/pets/builder') }, t('home.cta')),
      h('a', { class: 'kc-btn', href: '/stats/servers', onclick: link('/stats/servers') }, t('home.ctaStats')),
      h('a', {
        class: 'kc-btn is-ghost', href: 'https://www.youtube.com/@Kraken_Chronicles',
        target: '_blank', rel: 'noopener', 'data-external': '1',
      }, t('home.hero.ctaYoutube') + ' ↗')));
}

/* --------------------------------------------------------------- numbers */
function statRow(pets, skills, heroes, manifest, lang, t) {
  const cells = [
    [num(pets.count, lang), t('home.stat.pets')],
    [num(skills.count, lang), t('home.stat.skills')],
    [num(heroes.count, lang), t('home.stat.heroes')],
    [num(manifest.totals.players, lang), t('home.stat.players')],
    [num(manifest.totals.alliances, lang), t('home.stat.alliances')],
    [compact(manifest.totals.totalPower, lang), t('home.stat.power')],
  ];
  return h('div', { class: 'kc-statrow', style: { marginBottom: '34px' } },
    ...cells.map(([v, k]) => h('div', {}, h('div', { class: 'v' }, v), h('div', { class: 'k' }, k))));
}

/* ---------------------------------------------------------------- helper */
function section(id, title, desc, cta, ...body) {
  return h('section', { class: 'kc-panel', id, style: { scrollMarginTop: 'calc(var(--header-h) + 14px)' } },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, title), desc && h('p', {}, desc)),
      cta),
    h('div', { class: 'kc-panel-body' }, ...body));
}

/* -------------------------------------------------------------------- tools */
function toolsSection(pets, skills, heroes, lang, t, link) {
  const ru = lang === 'ru';
  const tools = [
    ['/pets/builder', ru ? 'Конструктор питомцев' : 'War Pet Builder',
      ru ? 'Полный перебор навыков, Damage Factor и DPS, режим «лучшее за вашу сумму».'
        : 'Exhaustive skill search, Damage Factor and DPS, and a "best for your amount" mode.'],
    ['/pets/top', ru ? 'ТОП питомцев' : 'Top war pets',
      ru ? `${pets.count} питомцев со всеми характеристиками и лидерами по каждой из них.`
        : `${pets.count} pets with full stats and a leader per attribute.`],
    ['/pets/skills', ru ? 'База навыков питомцев' : 'Pet skill database',
      ru ? `${skills.count} навыков: стоимость в пет-коинах и янтаре, зависимости, эксклюзивы.`
        : `${skills.count} skills: pet-coin and amber cost, dependencies, exclusives.`],
    ['/db/heroes', ru ? 'База героев' : 'Hero database',
      ru ? `${heroes.count} героев: качество, сезон и полное описание навыков.`
        : `${heroes.count} heroes: rarity, season and full skill text.`],
    ['/stats/servers', ru ? 'Статистика серверов' : 'Server analytics',
      ru ? 'Игроки, альянсы, рейтинги, сравнение и иммиграция.'
        : 'Players, alliances, rankings, comparison and immigration.'],
    ['/calc/training', ru ? 'Калькуляторы' : 'Calculators',
      ru ? 'Обучение войск, лечение, ускорения, ресурсы и прокачка героев.'
        : 'Troop training, healing, speedups, resources and hero upgrades.'],
    ['/guides', ru ? 'Гайды и календарь' : 'Guides and calendar',
      ru ? 'Как собрать питомца под урон и что делать в недельном цикле сервера.'
        : 'How to build a damage pet and what the weekly server cycle is for.'],
    ['/pets/builds', ru ? 'Мои билды' : 'My builds',
      ru ? 'Сохранённые сборки питомцев в вашем аккаунте.' : 'Your saved pet builds, stored in your account.'],
  ];

  return section('tools', t('home.tools.title'), t('home.tools.desc'), null,
    h('div', { class: 'kc-linkgrid' }, ...tools.map(([href, title, desc]) =>
      h('a', { class: 'kc-linkrow', href, onclick: link(href) },
        h('div', {},
          h('div', { class: 'kc-linkrow-title' }, title),
          h('div', { class: 'kc-linkrow-desc' }, desc)),
        h('span', { class: 'kc-linkrow-arrow' }, '→')))));
}

/* --------------------------------------------------------------- about */
function aboutSection(about, lang, t, link) {
  const summary = about.project?.summary?.[lang];
  const teaser = about.history?.teaser?.[lang];
  return section('about', t('about.title'), SITE.tagline[lang],
    h('a', { class: 'kc-btn sm', href: '/about', onclick: link('/about') }, t('common.more')),
    summary && h('p', { class: 'kc-prose' }, summary),
    teaser && h('div', {},
      h('div', { class: 'kc-section-title' }, t('about.historyTitle')),
      h('p', { class: 'kc-prose', style: { margin: '0 0 12px' } }, teaser),
      h('a', { class: 'kc-btn sm', href: '/about/history', onclick: link('/about/history') }, t('about.historyCta'))));
}

/* ---------------------------------------------------------------- news */
function newsSection(news, lang, t, link) {
  return section('news', t('news.title'), t('news.desc'),
    h('a', { class: 'kc-btn sm', href: '/news', onclick: link('/news') }, t('news.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...news.slice(0, 3).map((n) => newsCard(n, lang, t, link))));
}

/* ------------------------------------------------------------ achievements */
function achievementsSection(all, lang, t, link) {
  const featured = all.filter((a) => a.featured);
  const items = (featured.length ? featured : all).slice(0, 6);
  return section('achievements', t('achievements.title'), t('achievements.desc'),
    h('a', { class: 'kc-btn sm', href: '/achievements', onclick: link('/achievements') }, t('achievements.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...items.map((a) => achievementCard(a, lang))));
}

/* -------------------------------------------------------------------- team */
function teamSection(data, officers, lang, t, link) {
  return section('team', t('team.title'), t('team.desc'),
    h('a', { class: 'kc-btn sm', href: '/team', onclick: link('/team') }, t('team.all')),
    h('div', { class: 'kc-grid auto-lg' },
      data.leader && teamCard(data.leader, lang, t, true),
      ...officers.slice(0, 5).map((o) => teamCard(o, lang, t, false))));
}

/* --------------------------------------------------------------- legends */
function legendsSection(all, lang, t, link) {
  const featured = all.filter((p) => p.featured);
  const items = (featured.length ? featured : all).slice(0, 6);
  return section('hall-of-fame', t('hof.title'), t('hof.desc'),
    h('a', { class: 'kc-btn sm', href: '/hall-of-fame', onclick: link('/hall-of-fame') }, t('hof.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...items.map((p) => hofCard(p, lang, t))));
}

/* --------------------------------------------------------------- tournament */
function tournamentSection(data, lang, t, link) {
  return section('tournament', t('tournament.title'), t('tournament.desc'),
    h('a', { class: 'kc-btn sm', href: '/tournament', onclick: link('/tournament') }, t('common.more')),
    data.name?.[lang] && h('h3', { style: { margin: '0 0 8px' } }, data.name[lang]),
    data.description?.[lang] ? h('p', { class: 'kc-prose', style: { margin: 0 } }, data.description[lang]) : null);
}

/* ----------------------------------------------------------------- pending */
function pendingSection(pending, t, link) {
  return h('section', { class: 'kc-panel' },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, t('home.soon.title')), h('p', {}, t('home.soon.desc')))),
    h('div', { class: 'kc-panel-body', style: { paddingTop: '4px', paddingBottom: '6px' } },
      ...pending.map(([href, title, hint]) => h('a', {
        class: 'kc-pending', href, onclick: link(href),
        id: href.replace(/^\//, '').replace(/\//g, '-'),
        style: { scrollMarginTop: 'calc(var(--header-h) + 14px)' },
      },
      h('span', { class: 'n' }, title),
      h('span', { style: { color: 'var(--muted-2)' } }, hint),
      h('span', { class: 's' }, t('home.soon.tag'))))));
}

/* ------------------------------------------------------------------ youtube */
function youtubeSection(t) {
  return h('section', { class: 'kc-panel', id: 'youtube' },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, t('home.youtube.title')), h('p', {}, t('home.youtube.desc'))),
      h('a', {
        class: 'kc-btn sm', href: 'https://www.youtube.com/@Kraken_Chronicles',
        target: '_blank', rel: 'noopener', 'data-external': '1',
      }, t('home.youtube.cta') + ' ↗')));
}
