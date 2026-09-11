import { h, getJSON, banner, tile, num, compact } from '../util.js';
import { SITE } from '../routes.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [pets, skills, heroes, manifest] = await Promise.all([
    getJSON('/data/pets.json'),
    getJSON('/data/pet-skills.json'),
    getJSON('/data/heroes.json'),
    getJSON('/data/webdata/manifest.json'),
  ]);

  mount.append(
    banner(SITE.name[lang], t('home.sub'), { kicker: t('home.kicker') }),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { fontSize: '15px', color: 'var(--text-dim)' } }, t('home.lead')),
        h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } },
          h('a', { class: 'kc-btn is-primary', href: '/pets/builder', onclick: link('/pets/builder') }, '🐉 ' + t('home.cta')),
          h('a', { class: 'kc-btn is-teal', href: '/stats/servers', onclick: link('/stats/servers') }, '⚔️ ' + t('home.ctaStats'))))),

    h('div', { class: 'kc-section-title' }, t('home.tiles')),
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
          ? 'Полный перебор навыков, Damage Factor и DPS, режим «лучшее за вашу сумму» с бюджетом пет-коинов. Основа этого сайта — дизайн и логика взяты отсюда.'
          : 'Exhaustive skill search, Damage Factor and DPS, and a "best for your amount" mode with a pet-coin budget. This is the core the whole site is built around.',
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
          ? 'Обучение, лечение, ускорения, ресурсы и прокачка героев. Формулы переписаны заново — оригиналы не сохранились в зеркале.'
          : 'Training, healing, speedups, resources and hero upgrades. Rewritten from scratch — the originals did not survive the mirror.',
        lang === 'ru' ? 'переписано' : 'rewritten'),
      card(link, '/guides', '🗺️',
        lang === 'ru' ? 'Гайды и календарь' : 'Guides and calendar',
        lang === 'ru'
          ? 'Как собрать питомца под урон, куда девать пет-коины и что делать в каждый день недельного цикла.'
          : 'How to build a damage pet, where pet coins go, and what each day of the weekly cycle is for.',
        null)),

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

function card(link, href, icon, title, text, source) {
  return h('a', { class: 'kc-card', href, onclick: link(href) },
    h('div', { style: { fontSize: '22px', marginBottom: '8px' } }, icon),
    h('h3', { style: { margin: '0 0 6px' } }, title),
    h('p', { class: 'kc-note', style: { margin: '0' } }, text),
    source && h('div', { style: { marginTop: '10px' } }, h('span', { class: 'kc-badge' }, source)));
}
