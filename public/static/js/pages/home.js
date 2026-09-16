import { h, getJSON, num, compact, dateTime, empty } from '../util.js';
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

  mount.append(...[
    hero(t),
    aboutSection(about, lang, t, link),
    newsSection(newsData, lang, t, link),
    achievementsSection(achData, lang, t, link),
    teamSection(teamData, lang, t, link),
    hofSection(hofData, lang, t, link),
    tournamentSection(tournament, lang, t, link),
    toolsSection(pets, skills, heroes, manifest, lang, t, link),
    youtubeSection(t),
  ].filter(Boolean));
}

/* ------------------------------------------------------------------- hero */
function hero(t) {
  return h('div', { class: 'kc-banner' },
    h('div', { class: 'kc-banner-inner' },
      h('div', { class: 'kc-banner-kicker' }, 'CALL OF DRAGONS · SERVER 888'),
      h('h1', { class: 'kc-banner-title' }, t('home.hero.h1')),
      h('div', { class: 'kc-banner-sub' }, t('home.hero.sub')),
      h('div', { class: 'kc-toolbar', style: { marginTop: '16px', justifyContent: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '#about' }, t('home.hero.ctaAbout')),
        h('a', {
          class: 'kc-btn is-teal', href: 'https://www.youtube.com/@Kraken_Chronicles',
          target: '_blank', rel: 'noopener', 'data-external': '1',
        }, '▶ ' + t('home.hero.ctaYoutube')))),
    h('div', { class: 'kc-banner-lights' }));
}

/* ---------------------------------------------------------------- helper */
function section(id, title, desc, cta, ...body) {
  return h('section', { class: 'kc-panel', id, style: { scrollMarginTop: 'calc(var(--header-h) + 14px)' } },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, title), desc && h('p', {}, desc)),
      cta),
    h('div', { class: 'kc-panel-body' }, ...body));
}

/* --------------------------------------------------------------- about */
function aboutSection(about, lang, t, link) {
  const summary = about.project?.summary?.[lang];
  const teaser = about.history?.teaser?.[lang];
  return section('about', t('about.title'), SITE.tagline[lang],
    h('a', { class: 'kc-btn sm', href: '/about', onclick: link('/about') }, t('common.more')),
    summary
      ? h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, summary)
      : empty(t('about.pendingTitle'), t('about.pendingHint')),
    h('div', { class: 'kc-section-title', style: { marginTop: '16px' } }, t('about.historyTitle')),
    teaser
      ? h('p', { class: 'kc-note', style: { color: 'var(--text-dim)' } }, teaser)
      : empty(t('about.historyPendingTitle'), t('about.historyPendingHint')),
    h('div', { class: 'kc-toolbar', style: { marginTop: '10px' } },
      h('a', { class: 'kc-btn sm is-teal', href: '/about/history', onclick: link('/about/history') }, t('about.historyCta'))));
}

/* ---------------------------------------------------------------- news */
function newsSection(data, lang, t, link) {
  const items = [...(data.items || [])].filter((n) => n.published)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
    .slice(0, 3);
  return section('news', t('news.title'), t('news.desc'),
    h('a', { class: 'kc-btn sm', href: '/news', onclick: link('/news') }, t('news.all')),
    items.length
      ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((n) => newsCard(n, lang, t, link)))
      : empty(t('news.emptyTitle'), t('news.emptyHint')));
}

/* ------------------------------------------------------------ achievements */
function achievementsSection(data, lang, t, link) {
  const all = data.items || [];
  if (!all.length) return null; // ТЗ §7: hide the whole block until it has content.
  const featured = all.filter((a) => a.featured);
  const items = (featured.length ? featured : all).slice(0, 6);
  return section('achievements', t('achievements.title'), t('achievements.desc'),
    h('a', { class: 'kc-btn sm', href: '/achievements', onclick: link('/achievements') }, t('achievements.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...items.map((a) => achievementCard(a, lang))));
}

/* -------------------------------------------------------------------- team */
function teamSection(data, lang, t, link) {
  const leader = data.leader || null;
  const officers = (data.officers || []).slice(0, 5);
  return section('team', t('team.title'), t('team.desc'),
    h('a', { class: 'kc-btn sm', href: '/team', onclick: link('/team') }, t('team.all')),
    !leader && !officers.length
      ? empty(t('team.emptyTitle'), t('team.emptyHint'))
      : h('div', {},
        leader && h('div', { style: { marginBottom: '16px', maxWidth: '360px' } }, teamCard(leader, lang, t, true)),
        officers.length > 0 && h('div', { class: 'kc-grid auto-lg' }, ...officers.map((o) => teamCard(o, lang, t, false)))));
}

/* --------------------------------------------------------------- hall of fame */
function hofSection(data, lang, t, link) {
  const all = data.items || [];
  const featured = all.filter((p) => p.featured);
  const items = (featured.length ? featured : all).slice(0, 6);
  return section('hall-of-fame', t('hof.title'), t('hof.desc'),
    h('a', { class: 'kc-btn sm', href: '/hall-of-fame', onclick: link('/hall-of-fame') }, t('hof.all')),
    items.length
      ? h('div', { class: 'kc-grid auto-lg' }, ...items.map((p) => hofCard(p, lang, t)))
      : empty(t('hof.emptyTitle'), t('hof.emptyHint')));
}

/* --------------------------------------------------------------- tournament */
function tournamentSection(data, lang, t, link) {
  const isPending = !data.status || data.status === 'coming-soon';
  return section('tournament', t('tournament.title'), t('tournament.desc'),
    h('a', { class: 'kc-btn sm', href: '/tournament', onclick: link('/tournament') }, t('common.more')),
    isPending
      ? empty(t('tournament.pendingTitle'), t('tournament.pendingHint'))
      : h('div', {},
        data.name?.[lang] && h('h3', { style: { margin: '0 0 8px' } }, data.name[lang]),
        data.description?.[lang] && h('p', { class: 'kc-note' }, data.description[lang])));
}

/* -------------------------------------------------------------------- tools */
function toolsSection(pets, skills, heroes, manifest, lang, t, link) {
  return section('tools', t('home.tools.title'), t('home.tools.desc'),
    h('a', { class: 'kc-btn sm', href: '/pets/builder', onclick: link('/pets/builder') }, t('home.tools.all')),
    h('div', { class: 'kc-grid c3', style: { marginBottom: '16px' } },
      tile(t, num(pets.count, lang), t('home.stat.pets')),
      tile(t, num(skills.count, lang), t('home.stat.skills')),
      tile(t, num(heroes.count, lang), t('home.stat.heroes')),
      tile(t, num(manifest.totals.players, lang), t('home.stat.players')),
      tile(t, num(manifest.totals.alliances, lang), t('home.stat.alliances')),
      tile(t, compact(manifest.totals.totalPower, lang), t('home.stat.power'))),
    h('div', { class: 'kc-grid auto-lg' },
      toolCard(link, '/pets/builder', '🐉',
        lang === 'ru' ? 'Конструктор питомцев' : 'War Pet Builder',
        lang === 'ru' ? 'Полный перебор навыков, Damage Factor и DPS, режим «лучшее за вашу сумму».' : 'Exhaustive skill search, Damage Factor and DPS, and a "best for your amount" mode.'),
      toolCard(link, '/pets/top', '📊',
        lang === 'ru' ? 'ТОП питомцев и навыки' : 'Top pets and skills',
        lang === 'ru' ? `${pets.count} питомцев и ${skills.count} навыков со всеми характеристиками.` : `${pets.count} pets and ${skills.count} skills with full stats.`),
      toolCard(link, '/db/heroes', '📜',
        lang === 'ru' ? 'База героев' : 'Hero database',
        lang === 'ru' ? `${heroes.count} героев: качество, сезон и полное описание навыков.` : `${heroes.count} heroes: rarity, season and full skill text.`),
      toolCard(link, '/stats/servers', '⚔️',
        lang === 'ru' ? 'Статистика серверов' : 'Server analytics',
        lang === 'ru' ? 'Игроки, альянсы, рейтинги, сравнение и иммиграция.' : 'Players, alliances, rankings, comparison and immigration.'),
      toolCard(link, '/calc/training', '🧮',
        lang === 'ru' ? 'Калькуляторы' : 'Calculators',
        lang === 'ru' ? 'Обучение, лечение, ускорения, ресурсы и прокачка героев.' : 'Training, healing, speedups, resources and hero upgrades.'),
      toolCard(link, '/guides', '🗺️',
        lang === 'ru' ? 'Гайды и календарь' : 'Guides and calendar',
        lang === 'ru' ? 'Как собрать питомца под урон и что делать в недельном цикле.' : 'How to build a damage pet and what the weekly cycle is for.')));
}

function tile(t, value, label) {
  return h('div', { class: 'kc-tile' }, h('div', { class: 'kc-tile-value' }, value), h('div', { class: 'kc-tile-label' }, label));
}

function toolCard(link, href, icon, title, text) {
  return h('a', { class: 'kc-card', href, onclick: link(href) },
    h('div', { style: { fontSize: '22px', marginBottom: '8px' } }, icon),
    h('h3', { style: { margin: '0 0 6px' } }, title),
    h('p', { class: 'kc-note', style: { margin: '0' } }, text));
}

/* ------------------------------------------------------------------ youtube */
function youtubeSection(t) {
  return section('youtube', t('home.youtube.title'), t('home.youtube.desc'), null,
    h('a', {
      class: 'kc-btn is-primary', href: 'https://www.youtube.com/@Kraken_Chronicles',
      target: '_blank', rel: 'noopener', 'data-external': '1',
    }, '▶ ' + t('home.youtube.cta')));
}
