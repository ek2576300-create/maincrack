/**
 * Home page.
 *
 * Order of business: what the site actually does first (tools + live numbers),
 * then the two living feeds — community news and the YouTube channel — and the
 * community content after them. Sections the client has not filled in yet are
 * not empty boxes: they collapse into one compact "coming up" list, which is
 * the tidy waiting state the spec asks for without wasting a screen on it.
 *
 * Every number in the copy is computed from the site's own data (pets / skills
 * / heroes / server export) and the clips come from the channel feed, so there
 * is no hand-typed content here that can silently go stale.
 */
import { h, getJSON, num, compact, dateTime } from '../util.js';
import { SITE } from '../routes.js';
import { newsCard } from './news.js';
import { achievementCard } from './achievements.js';
import { teamCard } from './team.js';
import { hofCard } from './hall-of-fame.js';
import { WEEK } from './calendar.js';
import { buildGuides } from './guides.js';
import { loadVideos, videoCard, watchUrl, sourceNote } from './videos.js';

const CHANNEL_URL = 'https://www.youtube.com/@Kraken_Chronicles';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [about, newsData, achData, teamData, hofData, tournament, pets, skills, heroes, manifest, videos] = await Promise.all([
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
    loadVideos(),
  ]);

  const news = [...(newsData.items || [])].filter((n) => n.published)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const clips = videos.items || [];
  const achievements = achData.items || [];
  const officers = teamData.officers || [];
  const legends = hofData.items || [];
  const hasTournament = tournament.status && tournament.status !== 'coming-soon';
  const hasAbout = Boolean(about.project?.summary?.[lang] || about.history?.teaser?.[lang]);

  /* Sections still waiting for content, in the order of the content spec. */
  const pending = [
    !hasAbout && ['/about', t('about.title'), t('about.pendingHint')],
    !news.length && ['/news', t('news.title'), t('news.emptyHint')],
    !clips.length && ['/videos', t('videos.title'), t('videos.emptyHint')],
    !teamData.leader && !officers.length && ['/team', t('team.title'), t('team.emptyHint')],
    !legends.length && ['/hall-of-fame', t('hof.title'), t('hof.emptyHint')],
    !hasTournament && ['/tournament', t('tournament.title'), t('tournament.pendingHint')],
  ].filter(Boolean);

  mount.append(...[
    hero(t, lang, link),
    statRow(pets, skills, heroes, manifest, lang, t),
    toolsSection(pets, skills, heroes, lang, t, link),
    news.length && newsSection(news, lang, t, link),
    clips.length && videosSection(videos, clips, lang, t, link),
    hasAbout && aboutSection(about, lang, t, link),
    achievements.length && achievementsSection(achievements, lang, t, link),
    (teamData.leader || officers.length) && teamSection(teamData, officers, lang, t, link),
    legends.length && legendsSection(legends, lang, t, link),
    hasTournament && tournamentSection(tournament, lang, t, link),
    guidesSection(pets, skills, lang, t, link),
    weekSection(lang, t, link),
    channelSection(videos, clips, lang, t, link),
    faqSection(pets, skills, heroes, manifest, lang, t),
    pending.length && pendingSection(pending, t, link),
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
      h('a', { class: 'kc-btn', href: '/videos', onclick: link('/videos') }, t('videos.all')),
      h('a', {
        class: 'kc-btn is-ghost', href: CHANNEL_URL,
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

/** Строка компактной ленты: дата — ссылка — метка. */
const feedRow = (time, anchor, ...extra) => h('li', {}, h('time', {}, time), anchor, ...extra);

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
    ['/videos', ru ? 'Видео канала' : 'Channel videos',
      ru ? 'Все ролики «Хроник Кракена»: поиск, фильтры и просмотр прямо на сайте.'
        : 'Every Kraken Chronicles video: search, filters and in-page playback.'],
  ];

  return section('tools', t('home.tools.title'), t('home.tools.desc'), null,
    h('div', { class: 'kc-linkgrid' }, ...tools.map(([href, title, desc]) =>
      h('a', { class: 'kc-linkrow', href, onclick: link(href) },
        h('div', {},
          h('div', { class: 'kc-linkrow-title' }, title),
          h('div', { class: 'kc-linkrow-desc' }, desc)),
        h('span', { class: 'kc-linkrow-arrow' }, '→')))));
}

/* ------------------------------------------------------------- news feed */
function newsSection(news, lang, t, link) {
  const rest = news.slice(3, 12);
  return section('news', t('news.title'), t('news.desc'),
    h('a', { class: 'kc-btn sm', href: '/news', onclick: link('/news') }, t('news.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...news.slice(0, 3).map((n) => newsCard(n, lang, t, link))),
    rest.length
      ? h('div', {},
        h('div', { class: 'kc-section-title', style: { marginTop: '22px' } }, t('home.feed.earlier')),
        h('ul', { class: 'kc-feed' }, ...rest.map((n) => feedRow(
          dateTime(n.date, lang),
          h('a', { href: `/news/${n.slug}`, onclick: link(`/news/${n.slug}`) }, n.title?.[lang] || n.slug),
          n.category && h('span', { class: 'kc-badge' }, t('news.category.' + n.category, n.category))))))
      : null);
}

/* ------------------------------------------------------------ video feed */
function videosSection(videos, clips, lang, t, link) {
  const rest = clips.slice(6);
  return section('videos', t('videos.title'), t('videos.sub'),
    h('a', { class: 'kc-btn sm', href: '/videos', onclick: link('/videos') }, t('videos.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...clips.slice(0, 6).map((v) => videoCard(v, lang, t))),
    rest.length
      ? h('div', {},
        h('div', { class: 'kc-section-title', style: { marginTop: '22px' } },
          t('home.feed.allVideos') + ' · ' + num(clips.length, lang)),
        h('ul', { class: 'kc-feed is-scroll' }, ...rest.map((v) => feedRow(
          v.published ? dateTime(v.published, lang) : '—',
          h('a', { href: watchUrl(v), target: '_blank', rel: 'noopener', 'data-external': '1' },
            v.titleI18n?.[lang] || v.title || v.id),
          v.views != null && h('span', { class: 'kc-badge' }, compact(v.views, lang))))))
      : null,
    h('p', { class: 'kc-note', style: { margin: '16px 0 0' } }, sourceNote(videos, t, lang)));
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

/* ----------------------------------------------------------------- guides */
function guidesSection(pets, skills, lang, t, link) {
  // Те же тексты, что и на /guides: цифры в них считаются из данных сайта.
  const guides = buildGuides({ lang, t, pets, skills }).slice(0, 4);
  return section('guides', t('guides.title'), t('guides.desc'),
    h('a', { class: 'kc-btn sm', href: '/guides', onclick: link('/guides') }, t('home.guides.all')),
    h('div', { class: 'kc-linkgrid' }, ...guides.map((g) =>
      h('a', { class: 'kc-linkrow', href: '/guides', onclick: link('/guides') },
        h('div', {},
          h('div', { class: 'kc-linkrow-title' }, g.title),
          h('div', { class: 'kc-linkrow-desc' }, g.body[0])),
        h('span', { class: 'kc-linkrow-arrow' }, '→')))));
}

/* -------------------------------------------------------------- week cycle */
function weekSection(lang, t, link) {
  const todayIdx = (new Date().getDay() + 6) % 7; // понедельник = 0
  return section('week', t('home.week.title'), t('home.week.desc'),
    h('a', { class: 'kc-btn sm', href: '/calendar', onclick: link('/calendar') }, t('home.week.all')),
    h('ul', { class: 'kc-feed' }, ...WEEK.map((d, i) => h('li', { class: i === todayIdx ? 'is-now' : undefined },
      h('time', {}, d.day[lang]),
      h('a', { href: '/calendar', onclick: link('/calendar') }, d.event[lang]),
      h('span', { class: 'kc-note', style: { flex: '2 1 240px' } }, d.focus[lang]),
      i === todayIdx && h('span', { class: 'kc-badge is-gold' }, t('calendar.today'))))));
}

/* ------------------------------------------------------------------ channel */
function channelSection(videos, clips, lang, t, link) {
  const ch = videos.channel || {};
  const totalViews = clips.reduce((s, v) => s + (Number(v.views) || 0), 0);
  const about = ch.about || ch.description?.[lang] || '';

  return section('youtube', t('home.youtube.title'), t('home.youtube.desc'),
    h('a', {
      class: 'kc-btn sm', href: ch.url || CHANNEL_URL,
      target: '_blank', rel: 'noopener', 'data-external': '1',
    }, t('home.youtube.cta') + ' ↗'),
    h('div', { class: 'kc-statrow is-4' },
      statCell(ch.handle || '@Kraken_Chronicles', t('videos.stat.channel')),
      statCell(num(ch.videoCount || clips.length, lang), t('videos.stat.videos')),
      statCell(ch.subscribers != null ? compact(ch.subscribers, lang) : '—', t('videos.stat.subs')),
      statCell((ch.viewCount || totalViews) ? compact(ch.viewCount || totalViews, lang) : '—', t('videos.stat.views'))),
    h('p', { class: 'kc-prose', style: { margin: '16px 0 0', whiteSpace: 'pre-line' } },
      about ? String(about).slice(0, 600) : t('home.youtube.aboutPending')),
    h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } },
      h('a', { class: 'kc-btn sm', href: '/videos', onclick: link('/videos') }, t('videos.all')),
      h('a', {
        class: 'kc-btn sm is-primary', href: (ch.url || CHANNEL_URL) + '?sub_confirmation=1',
        target: '_blank', rel: 'noopener', 'data-external': '1',
      }, t('videos.subscribe'))));
}

const statCell = (value, label) => h('div', {}, h('div', { class: 'v' }, value), h('div', { class: 'k' }, label));

/* ---------------------------------------------------------------------- faq */
function faqSection(pets, skills, heroes, manifest, lang, t) {
  const QA = lang === 'ru' ? [
    ['Что такое «Хроники Кракена 888»?',
      'Сайт сообщества сервера 888 в Call of Dragons и одноимённого YouTube-канала: конструктор боевых питомцев, база героев и артефактов, калькуляторы и статистика игроков и альянсов. Новости сообщества и все ролики канала собраны здесь же, на главной.'],
    ['Как быстро собрать сильного питомца?',
      `Откройте конструктор, выберите питомца — его врождённый талант закрепится первым слотом — и нажмите BEST BUILD: перебор пройдёт по ${skills.count} навыкам с учётом лимита в 3 навыка на характеристику и зависимостей Advanced/Intense.`],
    ['Откуда берутся цифры в статистике?',
      `Выгрузка по ${num(manifest.totals.players, lang)} игрокам и ${num(manifest.totals.alliances, lang)} альянсам, разложенная по серверам; у каждого раздела указан свой источник. Данные обновляются вместе с выгрузкой, а не в реальном времени.`],
    ['Откуда берутся видео на сайте?',
      'Прямо с канала «Хроники Кракена»: сервер читает его ленту, поэтому новые ролики появляются на главной сами. Полный список с поиском и фильтрами — на вкладке «Видео канала», смотреть можно не уходя с сайта.'],
  ] : [
    ['What is Kraken Chronicles 888?',
      'The site of the server 888 Call of Dragons community and its YouTube channel: a war pet builder, a hero and artifact database, calculators and player/alliance analytics. Community news and every video of the channel are collected right here on the home page.'],
    ['How do I build a strong pet quickly?',
      `Open the builder, pick a pet — its innate talent locks the first slot — and hit BEST BUILD: the search runs over ${skills.count} skills, respecting the 3-skills-per-attribute cap and Advanced/Intense dependencies.`],
    ['Where do the analytics numbers come from?',
      `An export covering ${num(manifest.totals.players, lang)} players and ${num(manifest.totals.alliances, lang)} alliances, split per server; every section names its own source. Numbers refresh with the export, not in real time.`],
    ['Where do the videos come from?',
      'Straight from the Kraken Chronicles channel: the server reads its feed, so new uploads appear on the home page by themselves. The full, searchable list is on the Channel videos tab, and clips play without leaving the site.'],
  ];

  return section('faq', t('home.faq.title'), t('home.faq.desc'), null,
    h('div', { class: 'kc-grid auto-lg' }, ...QA.map(([q, a]) =>
      h('div', {},
        h('div', { class: 'kc-linkrow-title', style: { marginBottom: '6px' } }, q),
        h('p', { class: 'kc-note', style: { margin: 0 } }, a)))),
    h('p', { class: 'kc-note', style: { marginTop: '18px' } },
      lang === 'ru'
        ? `В базе сайта: ${pets.count} питомцев, ${skills.count} навыков, ${heroes.count} героев.`
        : `In the site database: ${pets.count} pets, ${skills.count} skills, ${heroes.count} heroes.`));
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
