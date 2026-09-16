import { h, getJSON, num } from '../util.js';
import { SITE } from '../routes.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [pets, skills, heroes, m] = await Promise.all([
    getJSON('/data/pets.json'), getJSON('/data/pet-skills.json'),
    getJSON('/data/heroes.json'), getJSON('/data/webdata/manifest.json'),
  ]);

  const SOURCES = [
    {
      name: 'coddb.app / warpets',
      role: { ru: 'Конструктор питомцев — основа сайта', en: 'War Pet Builder — the core of this site' },
      status: 'ok',
      detail: {
        ru: `Сохранён целиком: Next.js-бандл страницы (240 КБ) + optimizer.js (81 КБ) с оптимизатором билдов. Встроен как есть — движок урона не тронут. Из бандла дополнительно извлечены ${pets.count} питомцев и ${skills.count} навыков для отдельных вкладок.`,
        en: `Captured in full: the page's Next.js bundle (240 KB) plus optimizer.js (81 KB) with the build optimiser. Embedded verbatim — the damage engine is untouched. ${pets.count} pets and ${skills.count} skills were additionally extracted from the bundle for the standalone tabs.`,
      },
    },
    {
      name: 'coddb.app (остальные разделы)',
      role: { ru: 'Калькуляторы, база, календарь, декреты, RoW-планер', en: 'Calculators, database, calendar, decrees, RoW planner' },
      status: 'partial',
      detail: {
        ru: `Зеркало снято, но 9 JS-чанков сохранились нулевого размера — вся логика этих страниц потеряна. Уцелел api/heroes.json (${heroes.count} героев), он и стал базой героев. Калькуляторы написаны заново.`,
        en: `The mirror ran, but 9 JS chunks were captured at 0 bytes — all logic on those pages is gone. api/heroes.json survived (${heroes.count} heroes) and became the hero database. The calculators were rewritten from scratch.`,
      },
    },
    {
      name: 'Tamaris War Stats (call-main)',
      role: { ru: 'Статистика игроков, альянсов и серверов', en: 'Player, alliance and server analytics' },
      status: 'ok',
      detail: {
        ru: `Полноценное React-приложение с готовой выгрузкой webdata: ${num(m.totals.players, lang)} игроков, ${num(m.totals.alliances, lang)} альянсов на серверах ${m.servers.map((s) => s.serverId).join(' и ')}, плюс достижения по игрокам. Данные перенесены целиком, интерфейс переписан под дизайн конструктора.`,
        en: `A full React app with a ready webdata export: ${num(m.totals.players, lang)} players and ${num(m.totals.alliances, lang)} alliances on servers ${m.servers.map((s) => s.serverId).join(' and ')}, plus per-player achievements. The data was carried over whole; the interface was rewritten to match the builder's design.`,
      },
    },
    {
      name: 'codfan.com',
      role: { ru: 'Четвёртый сайт', en: 'The fourth site' },
      status: 'empty',
      detail: {
        ru: 'В архиве только кэш HTTrack с одним файлом — robots.txt (895 байт). Ни одной страницы не скачалось, объединять было нечего. Если нужен и он — снимите зеркало заново и пришлите архив.',
        en: 'The archive holds only an HTTrack cache with a single file — robots.txt (895 bytes). Not one page was downloaded, so there was nothing to merge. If you want it too, re-run the mirror and send the archive.',
      },
    },
  ];

  const badge = (s) => (s === 'ok'
    ? h('span', { class: 'kc-badge is-success' }, lang === 'ru' ? 'перенесён целиком' : 'fully merged')
    : s === 'partial'
      ? h('span', { class: 'kc-badge is-gold' }, lang === 'ru' ? 'частично' : 'partial')
      : h('span', { class: 'kc-badge is-danger' }, lang === 'ru' ? 'пусто' : 'empty'));

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('aboutBuild.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('aboutBuild.title')), h('p', {}, SITE.tagline[lang]))),
      h('div', { class: 'kc-panel-body' },
        h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } },
          lang === 'ru'
            ? 'Этот сайт — объединение четырёх источников в один. За основу дизайна и логики взят конструктор питомцев (Kraken-стиль из optimizer.js v6): его палитра, панели, баннер и элементы управления распространены на все вкладки.'
            : 'This site merges four sources into one. The design and logic base is the War Pet Builder (the Kraken style from optimizer.js v6): its palette, panels, banner and controls carry across every tab.'),
        h('div', { class: 'kc-grid auto-lg', style: { marginTop: '14px' } },
          ...SOURCES.map((s) => h('div', { class: 'kc-card' },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' } },
              h('strong', { style: { color: 'var(--gold-soft)', fontSize: '14px' } }, s.name), badge(s.status)),
            h('div', { class: 'kc-note', style: { marginTop: '4px', fontWeight: '600', color: 'var(--teal-dim)' } }, s.role[lang]),
            h('p', { class: 'kc-note', style: { margin: '9px 0 0', color: 'var(--text-dim)', lineHeight: '1.6' } }, s.detail[lang])))))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, lang === 'ru' ? 'Различия в логике между сайтами' : 'Logic differences between the sites'))),
      h('div', { class: 'kc-panel-body kc-prose' },
        ...(lang === 'ru' ? [
          h('h3', {}, '1. Язык'),
          h('p', { class: 'kc-note' }, 'Конструктор хранит язык в localStorage под ключом warpet-language и в ?lang=. Tamaris — в localStorage под tws.lang. Остальные страницы coddb.app были только на английском. В объединённой версии один общий переключатель: cookie kc_lang + ?lang=, и он же прокидывается во встроенный конструктор.'),
          h('h3', {}, '2. Аккаунты'),
          h('p', { class: 'kc-note' }, 'У coddb.app была страница /login (чанк пустой, логика неизвестна). У Tamaris аккаунтов не было вообще — вкладка «Админ» вела просто на импорт CSV без всякой авторизации. Здесь сделана единая авторизация с ролями и настоящей админкой; первый зарегистрированный аккаунт становится администратором.'),
          h('h3', {}, '3. Данные'),
          h('p', { class: 'kc-note' }, 'Конструктор держит данные питомцев внутри JS-бандла. Tamaris раньше грузил гигантские CSV в браузер, а в этой версии уже перешёл на предсобранные JSON-чанки по серверам. Объединённый сайт использует вторую схему для всего: статичные JSON в /data, ничего тяжёлого в браузер не тянется.'),
          h('h3', {}, '4. Навигация'),
          h('p', { class: 'kc-note' }, 'У конструктора была своя мини-навигация на два вида (Builder / TOP) внутри страницы. У Tamaris — плоский список из 7 пунктов. У coddb.app — боковое меню, которое optimizer.js принудительно скрывал. Здесь всё сведено в один навбар с шестью категориями.'),
          h('h3', {}, '5. Калькуляторы'),
          h('p', { class: 'kc-note' }, 'Единственное место, где поведение может отличаться от оригинала: формулы coddb.app не сохранились, и калькуляторы написаны заново по открытым формулам игры. Все коэффициенты вынесены в поля ввода — их можно подогнать под свою версию.'),
        ] : [
          h('h3', {}, '1. Language'),
          h('p', { class: 'kc-note' }, 'The builder keeps its language in localStorage under warpet-language and in ?lang=. Tamaris used localStorage under tws.lang. The rest of coddb.app was English only. The merged version has one switch: a kc_lang cookie plus ?lang=, and it is passed into the embedded builder as well.'),
          h('h3', {}, '2. Accounts'),
          h('p', { class: 'kc-note' }, 'coddb.app had a /login page (empty chunk, logic unknown). Tamaris had no accounts at all — its "Admin" tab was a plain CSV import with no authentication. Here there is one auth system with roles and a real admin panel; the first account to register becomes the administrator.'),
          h('h3', {}, '3. Data'),
          h('p', { class: 'kc-note' }, 'The builder keeps pet data inside its JS bundle. Tamaris used to load huge CSVs into the browser and had already moved to pre-built per-server JSON chunks in this version. The merged site uses that second scheme throughout: static JSON under /data, nothing heavy pulled into the browser.'),
          h('h3', {}, '4. Navigation'),
          h('p', { class: 'kc-note' }, 'The builder had its own two-view mini nav (Builder / TOP) inside the page. Tamaris had a flat list of 7 items. coddb.app had a sidebar that optimizer.js force-hid. Everything is now one nav bar with six categories.'),
          h('h3', {}, '5. Calculators'),
          h('p', { class: 'kc-note' }, 'The one place where behaviour may differ from the original: coddb.app\'s formulas did not survive, so the calculators were rewritten from the published game formulas. Every coefficient is an editable input, so you can match your own version.'),
        ]))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body', style: { textAlign: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '/pets/builder', onclick: link('/pets/builder') }, '🐉 ' + t('home.cta')))));
}
