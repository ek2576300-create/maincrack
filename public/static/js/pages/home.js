/**
 * Главная страница «Хроники Кракена 888».
 * Порядок блоков: баннер → счётчики → лента новостей → лента видео канала →
 * о проекте → инструменты → недельный цикл → достижения/команда/легенды →
 * турнир → канал → FAQ.
 *
 * Все цифры в тексте подставляются из данных сайта (pets/heroes/webdata), а
 * новости и видео — из /data/site/news.json и ленты YouTube. Ничего
 * захардкоженного «на глазок» здесь нет: пустой раздел показывает состояние
 * ожидания, а не выдуманный контент.
 */
import { h, getJSON, num, compact, dateTime, empty } from '../util.js';
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

  mount.append(...[
    hero(t, lang, link),
    statsStrip(pets, skills, heroes, manifest, lang, t),
    newsSection(newsData, videos, lang, t, link),
    videosSection(videos, lang, t, link),
    aboutSection(about, lang, t, link),
    toolsSection(pets, skills, heroes, manifest, lang, t, link),
    guidesSection(pets, skills, lang, t, link),
    weekSection(lang, t, link),
    achievementsSection(achData, lang, t, link),
    teamSection(teamData, lang, t, link),
    hofSection(hofData, lang, t, link),
    tournamentSection(tournament, lang, t, link),
    channelSection(videos, lang, t, link),
    faqSection(pets, skills, heroes, manifest, lang, t, link),
  ].filter(Boolean));
}

/* ------------------------------------------------------------------- hero */
function hero(t, lang, link) {
  return h('div', { class: 'kc-banner' },
    h('div', { class: 'kc-banner-inner' },
      h('div', { class: 'kc-banner-kicker' }, 'CALL OF DRAGONS · SERVER 888'),
      h('h1', { class: 'kc-banner-title' }, t('home.hero.h1')),
      h('div', { class: 'kc-banner-sub' }, t('home.hero.sub')),
      h('p', { class: 'kc-banner-lead' }, t('home.lead')),
      h('div', { class: 'kc-toolbar', style: { marginTop: '16px', justifyContent: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '/pets/builder', onclick: link('/pets/builder') }, t('home.cta')),
        h('a', { class: 'kc-btn', href: '/stats/servers', onclick: link('/stats/servers') }, t('home.ctaStats')),
        h('a', {
          class: 'kc-btn is-teal', href: CHANNEL_URL,
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

/* ---------------------------------------------------------- stats strip */
function statsStrip(pets, skills, heroes, manifest, lang, t) {
  return h('div', { class: 'kc-grid c6', style: { marginTop: '14px' } },
    tile(t, num(pets.count, lang), t('home.stat.pets')),
    tile(t, num(skills.count, lang), t('home.stat.skills')),
    tile(t, num(heroes.count, lang), t('home.stat.heroes')),
    tile(t, num(manifest.totals.players, lang), t('home.stat.players')),
    tile(t, num(manifest.totals.alliances, lang), t('home.stat.alliances')),
    tile(t, compact(manifest.totals.totalPower, lang), t('home.stat.power')));
}

/* ------------------------------------------------------------- news feed */
function newsSection(data, videos, lang, t, link) {
  const items = [...(data.items || [])].filter((n) => n.published)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const cards = items.slice(0, 3);
  const rest = items.slice(3, 12);

  return section('news', t('news.title'), t('news.desc'),
    h('a', { class: 'kc-btn sm', href: '/news', onclick: link('/news') }, t('news.all')),
    cards.length
      ? h('div', {},
        h('div', { class: 'kc-grid auto-lg' }, ...cards.map((n) => newsCard(n, lang, t, link))),
        rest.length
          ? h('div', {},
            h('div', { class: 'kc-section-title', style: { marginTop: '18px' } }, t('home.feed.earlier')),
            h('ul', { class: 'kc-feed' }, ...rest.map((n) => h('li', {},
              h('time', {}, dateTime(n.date, lang)),
              h('a', { href: `/news/${n.slug}`, onclick: link(`/news/${n.slug}`) }, n.title?.[lang] || n.slug),
              n.category && h('span', { class: 'kc-badge' }, t('news.category.' + n.category, n.category))))))
          : null)
      : empty(t('news.emptyTitle'), t('news.emptyHint')));
}

/* ------------------------------------------------------------ video feed */
function videosSection(videos, lang, t, link) {
  const items = videos.items || [];
  const featured = items.slice(0, 6);
  const rest = items.slice(6);

  const body = items.length
    ? h('div', {},
      h('div', { class: 'kc-grid auto-lg' }, ...featured.map((v) => videoCard(v, lang, t))),
      rest.length
        ? h('div', {},
          h('div', { class: 'kc-section-title', style: { marginTop: '18px' } },
            t('home.feed.allVideos') + ' · ' + num(items.length, lang)),
          h('ul', { class: 'kc-feed is-scroll' }, ...rest.map((v) => h('li', {},
            h('time', {}, v.published ? dateTime(v.published, lang) : '—'),
            h('a', {
              href: watchUrl(v), target: '_blank', rel: 'noopener', 'data-external': '1',
            }, v.titleI18n?.[lang] || v.title || v.id),
            v.views != null && h('span', { class: 'kc-badge' }, '👁 ' + compact(v.views, lang))))))
        : null)
    : empty(t('videos.emptyTitle'), t('videos.emptyHint'));

  return section('videos', t('videos.title'), t('videos.sub'),
    h('a', { class: 'kc-btn sm', href: '/videos', onclick: link('/videos') }, t('videos.all')),
    body,
    h('p', { class: 'kc-note', style: { marginTop: '14px' } }, sourceNote(videos, t, lang)));
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

/* ----------------------------------------------------------------- guides */
function guidesSection(pets, skills, lang, t, link) {
  // Те же тексты, что и на /guides — цифры в них считаются из данных сайта.
  const guides = buildGuides({ lang, t, pets, skills }).slice(0, 3);
  return section('guides', t('guides.title'), t('guides.desc'),
    h('a', { class: 'kc-btn sm', href: '/guides', onclick: link('/guides') }, t('home.guides.all')),
    h('div', { class: 'kc-grid auto-lg' }, ...guides.map((g) =>
      h('a', { class: 'kc-card', href: '/guides', onclick: link('/guides') },
        h('div', { style: { fontSize: '22px', marginBottom: '8px' } }, g.icon),
        h('h3', { style: { margin: '0 0 8px' } }, g.title),
        h('p', { class: 'kc-note', style: { margin: '0', color: 'var(--text-dim)' } }, g.body[0])))));
}

/* -------------------------------------------------------------- week cycle */
function weekSection(lang, t, link) {
  const todayIdx = (new Date().getDay() + 6) % 7; // понедельник = 0
  const today = WEEK[todayIdx];
  return section('week', t('home.week.title'), t('home.week.desc'),
    h('a', { class: 'kc-btn sm', href: '/calendar', onclick: link('/calendar') }, t('home.week.all')),
    h('div', { class: 'kc-card', style: { marginBottom: '12px', borderColor: 'var(--gold)' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
        h('span', { style: { fontSize: '24px' } }, today.icon),
        h('div', { style: { flex: '1' } },
          h('div', { style: { fontWeight: '800', color: 'var(--gold-soft)' } }, today.day[lang] + ' · ' + today.event[lang]),
          h('small', { style: { color: 'var(--muted)' } }, today.focus[lang])),
        h('span', { class: 'kc-badge is-gold' }, t('calendar.today')))),
    h('div', { class: 'kc-grid c6' }, ...WEEK.map((d, i) =>
      h('div', {
        class: 'kc-tile',
        style: i === todayIdx ? { borderColor: 'rgba(216,180,93,.5)' } : undefined,
      },
      h('div', { class: 'kc-tile-label' }, d.day[lang].slice(0, 2).toUpperCase()),
      h('div', { class: 'kc-tile-value sm' }, d.icon),
      h('small', { class: 'kc-tile-note' }, d.event[lang])))));
}

/* -------------------------------------------------------------------- tools */
function toolsSection(pets, skills, heroes, manifest, lang, t, link) {
  return section('tools', t('home.tools.title'), t('home.tools.desc'),
    h('a', { class: 'kc-btn sm', href: '/pets/builder', onclick: link('/pets/builder') }, t('home.tools.all')),
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
        lang === 'ru' ? `${num(manifest.totals.players, lang)} игроков и ${num(manifest.totals.alliances, lang)} альянсов: рейтинги, сравнение и иммиграция.` : `${num(manifest.totals.players, lang)} players and ${num(manifest.totals.alliances, lang)} alliances: rankings, comparison and immigration.`),
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

/* ------------------------------------------------------------------ channel */
function channelSection(videos, lang, t, link) {
  const ch = videos.channel || {};
  const items = videos.items || [];
  const totalViews = items.reduce((s, v) => s + (Number(v.views) || 0), 0);
  const about = ch.about || ch.description?.[lang] || '';

  return section('youtube', t('home.youtube.title'), t('home.youtube.desc'),
    h('a', {
      class: 'kc-btn sm is-teal', href: ch.url || CHANNEL_URL,
      target: '_blank', rel: 'noopener', 'data-external': '1',
    }, '▶ ' + t('home.youtube.cta')),
    h('div', { class: 'kc-grid c4', style: { marginBottom: '12px' } },
      tile(t, ch.handle || '@Kraken_Chronicles', t('videos.stat.channel')),
      tile(t, num(ch.videoCount || items.length, lang), t('videos.stat.videos')),
      tile(t, ch.subscribers != null ? compact(ch.subscribers, lang) : '—', t('videos.stat.subs')),
      tile(t, (ch.viewCount || totalViews) ? compact(ch.viewCount || totalViews, lang) : '—', t('videos.stat.views'))),
    about
      ? h('p', { class: 'kc-note', style: { color: 'var(--text-dim)', whiteSpace: 'pre-line' } }, String(about).slice(0, 600))
      : h('p', { class: 'kc-note' }, t('home.youtube.aboutPending')),
    h('div', { class: 'kc-toolbar', style: { marginTop: '12px' } },
      h('a', { class: 'kc-btn sm', href: '/videos', onclick: link('/videos') }, t('videos.all')),
      h('a', {
        class: 'kc-btn sm is-primary', href: (ch.url || CHANNEL_URL) + '?sub_confirmation=1',
        target: '_blank', rel: 'noopener', 'data-external': '1',
      }, t('videos.subscribe'))));
}

/* ---------------------------------------------------------------------- faq */
function faqSection(pets, skills, heroes, manifest, lang, t, link) {
  const QA = lang === 'ru' ? [
    ['Что такое «Хроники Кракена 888»?',
      'Это сайт сообщества сервера 888 в Call of Dragons и одноимённого YouTube-канала: конструктор боевых питомцев, база героев и артефактов, калькуляторы и статистика игроков и альянсов. Новости сообщества и все ролики канала собраны на этой же странице.'],
    ['Как быстро собрать сильного питомца?',
      `Откройте конструктор, выберите питомца (его врождённый талант закрепляется первым слотом) и нажмите BEST BUILD — перебор пройдёт по ${skills.count} навыкам с учётом лимита в 3 навыка на характеристику и зависимостей Advanced/Intense.`],
    ['Откуда берутся цифры в статистике?',
      `Выгрузка по ${num(manifest.totals.players, lang)} игрокам и ${num(manifest.totals.alliances, lang)} альянсам разложена по серверам; у каждого раздела указан свой источник. Данные обновляются вместе с выгрузкой, а не в реальном времени.`],
    ['Как попасть в раздел с видео?',
      'Лента видео на главной подтягивается прямо с канала: свежие ролики появляются автоматически. Полный список со поиском и фильтрами — на вкладке «Видео».'],
  ] : [
    ['What is Kraken Chronicles 888?',
      'The site of the server 888 Call of Dragons community and its YouTube channel: a war pet builder, a hero and artifact database, calculators and player/alliance analytics. Community news and every video of the channel are collected on this page too.'],
    ['How do I build a strong pet quickly?',
      `Open the builder, pick a pet (its innate talent locks the first slot) and hit BEST BUILD — the search runs over ${skills.count} skills, respecting the 3-skills-per-attribute cap and Advanced/Intense dependencies.`],
    ['Where do the analytics numbers come from?',
      `An export covering ${num(manifest.totals.players, lang)} players and ${num(manifest.totals.alliances, lang)} alliances, split per server; every section names its own source. Numbers refresh with the export, not in real time.`],
    ['Where can I find the videos?',
      'The video feed on the home page is pulled straight from the channel, so new uploads appear on their own. The full, searchable list lives on the Videos tab.'],
  ];

  return section('faq', t('home.faq.title'), t('home.faq.desc'), null,
    h('div', { class: 'kc-grid auto-lg' }, ...QA.map(([q, a]) =>
      h('div', { class: 'kc-card' },
        h('h3', { style: { margin: '0 0 6px' } }, q),
        h('p', { class: 'kc-note', style: { margin: '0', color: 'var(--text-dim)' } }, a)))),
    h('p', { class: 'kc-note', style: { marginTop: '14px' } },
      lang === 'ru'
        ? `В базе сайта: ${pets.count} питомцев, ${skills.count} навыков, ${heroes.count} героев.`
        : `In the site database: ${pets.count} pets, ${skills.count} skills, ${heroes.count} heroes.`));
}
