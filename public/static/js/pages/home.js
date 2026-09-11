import { h, getJSON, banner, tile, num, compact, empty } from '../util.js';
import { SITE, SOCIAL } from '../routes.js';
import { newsCard } from './news.js';
import { achievementCard } from './achievements.js';
import { memberCard as hofCard } from './hall-of-fame.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [pets, skills, heroes, manifest, project, news, achievements, team, hof, tournament] = await Promise.all([
    getJSON('/data/pets.json'),
    getJSON('/data/pet-skills.json'),
    getJSON('/data/heroes.json'),
    getJSON('/data/webdata/manifest.json'),
    getJSON('/data/content/project.json'),
    getJSON('/data/content/news.json'),
    getJSON('/data/content/achievements.json'),
    getJSON('/data/content/team.json'),
    getJSON('/data/content/hall-of-fame.json'),
    getJSON('/data/content/tournament.json'),
  ]);

  const latestNews = (news.posts || []).filter((p) => !p.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);

  const featuredAchievements = pickFeatured(achievements.items, achievements.featuredSlugs).slice(0, 3);
  const featuredHof = pickFeatured(hof.members, hof.featuredSlugs).slice(0, 3);

  mount.append(
    banner(SITE.name[lang], t('home.sub'), { kicker: t('home.kicker') }),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { fontSize: '15px', color: 'var(--text-dim)' } }, t('home.lead')),
        h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } },
          h('a', { class: 'kc-btn is-primary', href: '#about' }, '📖 ' + t('home.project.title')),
          h('a', { class: 'kc-btn is-teal', href: SOCIAL.youtube, target: '_blank', rel: 'noopener' }, '📺 ' + t('home.youtube.cta')),
          h('a', { class: 'kc-btn', href: '/pets/builder', onclick: link('/pets/builder') }, '🐉 ' + t('home.cta')),
          h('a', { class: 'kc-btn', href: '/stats/servers', onclick: link('/stats/servers') }, '⚔️ ' + t('home.ctaStats'))))),

    /* -------------------------------------------------------- о проекте */
    h('section', { class: 'kc-panel', id: 'about' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('home.project.title')))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, i18n.pick(project.description)),
        h('a', { class: 'kc-btn sm', href: '/about', onclick: link('/about') }, t('home.project.cta') + ' →'))),

    /* ------------------------------------------------------------ новости */
    h('section', { class: 'kc-panel', id: 'news' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('home.news.title'))),
        h('a', { class: 'kc-btn sm', href: '/news', onclick: link('/news') }, t('news.viewAll'))),
      h('div', { class: 'kc-panel-body' },
        latestNews.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...latestNews.map((p) => newsCard(p, t, i18n, link)))
          : empty(t('news.empty'), t('news.emptyHint')))),

    /* -------------------------------------------------------- достижения */
    h('section', { class: 'kc-panel', id: 'achievements' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('home.achievements.title'))),
        h('a', { class: 'kc-btn sm', href: '/achievements', onclick: link('/achievements') }, t('achievements.viewAll'))),
      h('div', { class: 'kc-panel-body' },
        featuredAchievements.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...featuredAchievements.map((a) => achievementCard(a, i18n)))
          : empty(t('achievements.empty'), t('achievements.emptyHint')))),

    /* --------------------------------------------------------- руководство */
    h('section', { class: 'kc-panel', id: 'team' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('home.team.title'))),
        h('a', { class: 'kc-btn sm', href: '/team', onclick: link('/team') }, t('team.viewAll'))),
      h('div', { class: 'kc-panel-body' },
        team.leader
          ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } },
            h('img', {
              src: team.leader.avatar || '/static/img/warpets/petCoin.png', alt: '', loading: 'lazy',
              style: { width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(216,180,93,.4)', objectFit: 'cover', background: '#06151a' },
            }),
            h('div', {},
              h('strong', { style: { color: 'var(--gold-soft)', fontSize: '15px', display: 'block' } }, team.leader.nick),
              h('div', { class: 'kc-note', style: { color: 'var(--teal-dim)', fontWeight: '700' } }, i18n.pick(team.leader.role))),
            team.officers?.length
              ? h('span', { class: 'kc-badge', style: { marginLeft: 'auto' } }, `+${team.officers.length} ${lang === 'ru' ? 'офицеров' : 'officers'}`)
              : null)
          : empty(t('team.empty'), t('team.emptyHint')))),

    /* --------------------------------------------------------- легенды 888 */
    h('section', { class: 'kc-panel', id: 'hall-of-fame' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('home.hof.title'))),
        h('a', { class: 'kc-btn sm', href: '/hall-of-fame', onclick: link('/hall-of-fame') }, t('hof.viewAll'))),
      h('div', { class: 'kc-panel-body' },
        featuredHof.length
          ? h('div', { class: 'kc-grid auto-lg' }, ...featuredHof.map((m) => hofCard(m, t, i18n)))
          : empty(t('hof.empty'), t('hof.emptyHint')))),

    /* -------------------------------------------------------------- турнир */
    h('section', { class: 'kc-panel', id: 'tournament' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('home.tournament.title')))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, i18n.pick(tournament.description)),
        tournament.status === 'ready'
          ? h('a', { class: 'kc-btn is-primary', href: '/tournament', onclick: link('/tournament') }, '🏹 ' + t('tournament.viewAll'))
          : h('span', { class: 'kc-badge is-gold' }, '⏳ ' + t('tournament.preparing')))),

    /* ------------------------------------------------------ игровые инструменты */
    h('div', { class: 'kc-section-title', id: 'tools' }, t('home.tools.title')),
    h('div', { class: 'kc-grid c3', style: { marginBottom: '18px' } },
      tile(t('home.stat.pets'), num(pets.count, lang), null, '/static/img/warpets/attributes/Strength.png'),
      tile(t('home.stat.skills'), num(skills.count, lang), null, '/static/img/warpets/petCoin.png'),
      tile(t('home.stat.heroes'), num(heroes.count, lang)),
      tile(t('home.stat.players'), num(manifest.totals.players, lang)),
      tile(t('home.stat.alliances'), num(manifest.totals.alliances, lang)),
      tile(t('home.stat.power'), compact(manifest.totals.totalPower, lang), num(manifest.totals.totalPower, lang))),

    h('div', { class: 'kc-grid auto-lg' },
      card(link, '/pets/builder', '🐉',
        lang === 'ru' ? 'Конструктор питомцев' : 'War Pet Builder',
        lang === 'ru'
          ? 'Полный перебор навыков, Damage Factor и DPS, режим «лучшее за вашу сумму» с бюджетом пет-коинов.'
          : 'Exhaustive skill search, Damage Factor and DPS, and a "best for your amount" mode with a pet-coin budget.',
        'coddb.app/warpets'),
      card(link, '/pets/top', '📊',
        lang === 'ru' ? 'ТОП питомцев и навыки' : 'Top pets and skills',
        lang === 'ru'
          ? `${pets.count} питомцев с максимальными характеристиками и ${skills.count} навыков со стоимостью по уровням.`
          : `${pets.count} pets with their maximum stats and ${skills.count} skills with per-level costs.`,
        'coddb.app'),
      card(link, '/db/heroes', '📜',
        lang === 'ru' ? 'База героев' : 'Hero database',
        lang === 'ru'
          ? `${heroes.count} героев: качество, сезон, летающие легионы и полное описание навыков.`
          : `${heroes.count} heroes: rarity, season, flying legions and full skill text.`,
        'coddb.app'),
      card(link, '/stats/servers', '⚔️',
        lang === 'ru' ? 'Статистика серверов' : 'Server analytics',
        lang === 'ru'
          ? `Серверы ${manifest.servers.map((s) => s.serverId).join(' и ')}: игроки, альянсы, рейтинги, сравнение и иммиграция.`
          : `Servers ${manifest.servers.map((s) => s.serverId).join(' and ')}: players, alliances, rankings, comparison and immigration.`,
        'Tamaris War Stats'),
      card(link, '/calc/training', '🧮',
        lang === 'ru' ? 'Калькуляторы' : 'Calculators',
        lang === 'ru'
          ? 'Обучение, лечение, ускорения, ресурсы и прокачка героев.'
          : 'Training, healing, speedups, resources and hero upgrades.',
        null),
      card(link, '/guides', '🗺️',
        lang === 'ru' ? 'Гайды и календарь' : 'Guides and calendar',
        lang === 'ru'
          ? 'Как собрать питомца под урон, куда девать пет-коины и что делать в каждый день недельного цикла.'
          : 'How to build a damage pet, where pet coins go, and what each day of the weekly cycle is for.',
        null)),

    /* -------------------------------------------------------------- youtube */
    h('section', { class: 'kc-panel', id: 'youtube', style: { marginTop: '18px' } },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('home.youtube.title')))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-note', style: { color: 'var(--text-dim)' } }, t('home.youtube.desc')),
        h('a', { class: 'kc-btn is-teal', href: SOCIAL.youtube, target: '_blank', rel: 'noopener' }, '📺 ' + t('home.youtube.cta')))),

    /* ---------------------------------------------------------- барахолка */
    h('section', { class: 'kc-panel', style: { opacity: '.75' } },
      h('div', { class: 'kc-panel-body', style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } },
        h('span', { class: 'kc-badge' }, lang === 'ru' ? 'скоро' : 'coming soon'),
        h('div', {},
          h('strong', { style: { color: 'var(--text-dim)' } }, t('home.marketplace.title')),
          h('p', { class: 'kc-note', style: { margin: '4px 0 0' } }, t('home.marketplace.note'))))),

    h('section', { class: 'kc-panel', style: { marginTop: '18px' } },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('home.sources')))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-note' }, t('home.sourcesNote')),
        h('div', { class: 'kc-grid c2', style: { marginTop: '12px' } },
          ...manifest.servers.map((s) => h('div', { class: 'kc-tile' },
            h('div', { class: 'kc-tile-label' }, t('common.server') + ' ' + s.serverId),
            h('div', { class: 'kc-tile-value sm' }, compact(s.totalPower, lang)),
            h('small', { class: 'kc-tile-note' },
              `${num(s.players, lang)} ${t('stats.players').toLowerCase()} · ${num(s.alliances, lang)} ${t('stats.alliances').toLowerCase()}`,
              h('br'), `${t('stats.topAlliance')}: ${s.topAllianceName}`))))),
      h('div', { class: 'kc-panel-foot' }, `${t('common.updated')}: ${manifest.generatedAt}`)),
  );
}

function pickFeatured(items = [], slugs = []) {
  if (!slugs?.length) return items;
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean);
}

function card(link, href, icon, title, text, source) {
  return h('a', { class: 'kc-card', href, onclick: link(href) },
    h('div', { style: { fontSize: '22px', marginBottom: '8px' } }, icon),
    h('h3', { style: { margin: '0 0 6px' } }, title),
    h('p', { class: 'kc-note', style: { margin: '0' } }, text),
    source && h('div', { style: { marginTop: '10px' } }, h('span', { class: 'kc-badge' }, source)));
}
