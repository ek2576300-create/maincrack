/**
 * Single source of truth for navigation + SEO.
 * Imported by the browser (as an ES module) AND by the Node server for
 * server-rendered <head> tags, so nav and SEO can never drift apart.
 */

export const SITE = {
  name: { ru: 'Хроники Кракена 888', en: 'Kraken Chronicles 888' },
  short: { ru: 'Кракен 888', en: 'Kraken 888' },
  tagline: {
    ru: 'Конструктор питомцев, база данных и статистика серверов Call of Dragons',
    en: 'War Pet Builder, database and server analytics for Call of Dragons',
  },
  description: {
    ru: 'Хроники Кракена 888 — конструктор питомцев Call of Dragons с подбором лучшего билда по урону и бюджету пет-коинов, база героев и артефактов, калькуляторы и статистика игроков и альянсов сервера 888.',
    en: 'Kraken Chronicles 888 — Call of Dragons war pet builder with best-damage and pet-coin-budget optimisation, hero and artifact database, calculators and player/alliance analytics for server 888.',
  },
  // Core keyword pool, injected on every page.
  keywords: [
    'хроники кракена 888', 'хроники кракена', 'кракен 888', 'kraken chronicles 888',
    'kraken chronicles', 'kraken 888', 'Кraken Chronicles', 'хроники кракена call of dragons',
    'альянс кракен 888', 'сервер 888 call of dragons',
    'call of dragons', 'колл оф драгонс', 'cod db', 'coddb', 'call of dragons база данных',
    'конструктор питомцев', 'конструктор питомцев call of dragons', 'war pet builder',
    'warpet builder', 'лучший билд питомца', 'питомцы call of dragons', 'боевые питомцы',
    'калькулятор call of dragons', 'калькулятор питомцев', 'pet coin', 'пет коины',
    'tamaris war stats', 'статистика call of dragons', 'рейтинг альянсов', 'топ игроков сервера',
  ],
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
};

/** Nav categories → tabs. `id` doubles as the i18n key namespace. */
export const NAV = [
  {
    id: 'pets',
    icon: '🐉',
    label: { ru: 'Питомцы', en: 'War Pets' },
    items: [
      { path: '/', id: 'home', label: { ru: 'Главная', en: 'Home' }, hidden: true },
      { path: '/pets/builder', id: 'builder', label: { ru: 'Конструктор питомцев', en: 'War Pet Builder' }, primary: true },
      { path: '/pets/top', id: 'top', label: { ru: 'ТОП питомцев', en: 'Top War Pets' } },
      { path: '/pets/skills', id: 'skills', label: { ru: 'База навыков', en: 'Skill database' } },
      { path: '/pets/builds', id: 'builds', label: { ru: 'Мои билды', en: 'My builds' } },
    ],
  },
  {
    id: 'db',
    icon: '📜',
    label: { ru: 'База данных', en: 'Database' },
    items: [
      { path: '/db/heroes', id: 'heroes', label: { ru: 'Герои', en: 'Heroes' } },
      { path: '/db/artifacts', id: 'artifacts', label: { ru: 'Артефакты', en: 'Artifacts' } },
    ],
  },
  {
    id: 'calc',
    icon: '🧮',
    label: { ru: 'Калькуляторы', en: 'Calculators' },
    items: [
      { path: '/calc/training', id: 'training', label: { ru: 'Обучение войск', en: 'Troop training' } },
      { path: '/calc/healing', id: 'healing', label: { ru: 'Лечение', en: 'Healing' } },
      { path: '/calc/speedup', id: 'speedup', label: { ru: 'Ускорения', en: 'Speedups' } },
      { path: '/calc/resources', id: 'resources', label: { ru: 'Ресурсы', en: 'Resources' } },
      { path: '/calc/heroes', id: 'heroCalc', label: { ru: 'Прокачка героев', en: 'Hero upgrades' } },
    ],
  },
  {
    id: 'stats',
    icon: '⚔️',
    label: { ru: 'Статистика', en: 'War Stats' },
    items: [
      { path: '/stats/servers', id: 'servers', label: { ru: 'Серверы', en: 'Servers' } },
      { path: '/stats/players', id: 'players', label: { ru: 'Игроки', en: 'Players' } },
      { path: '/stats/alliances', id: 'alliances', label: { ru: 'Альянсы', en: 'Alliances' } },
      { path: '/stats/rankings', id: 'rankings', label: { ru: 'Рейтинги', en: 'Rankings' } },
      { path: '/stats/compare', id: 'compare', label: { ru: 'Сравнение', en: 'Compare' } },
      { path: '/stats/immigration', id: 'immigration', label: { ru: 'Иммиграция', en: 'Immigration' } },
      { path: '/stats/player', id: 'player', label: { ru: 'Профиль игрока', en: 'Player profile' }, hidden: true },
      { path: '/stats/alliance', id: 'alliance', label: { ru: 'Профиль альянса', en: 'Alliance profile' }, hidden: true },
    ],
  },
  {
    id: 'server888',
    icon: '🐙',
    label: { ru: 'Хроники Кракена', en: 'Kraken Chronicles' },
    items: [
      { path: '/about', id: 'about', label: { ru: 'О проекте', en: 'About' } },
      { path: '/news', id: 'news', label: { ru: 'Новости', en: 'News' } },
      { path: '/achievements', id: 'achievements', label: { ru: 'Достижения', en: 'Achievements' } },
      { path: '/team', id: 'team', label: { ru: 'Команда 888', en: 'Team 888' } },
      { path: '/hall-of-fame', id: 'hallOfFame', label: { ru: 'Легенды 888', en: 'Legends of 888' } },
      { path: '/tournament', id: 'tournament', label: { ru: 'Турнир', en: 'Tournament' } },
    ],
  },
  {
    id: 'community',
    icon: '🗺️',
    label: { ru: 'Гайды и календарь', en: 'Guides & calendar' },
    items: [
      { path: '/guides', id: 'guides', label: { ru: 'Гайды', en: 'Guides' } },
      { path: '/calendar', id: 'calendar', label: { ru: 'Календарь', en: 'Calendar' } },
      { path: '/about/build', id: 'aboutBuild', label: { ru: 'Как устроен сайт', en: 'How this site is built' } },
    ],
  },
  {
    id: 'account',
    icon: '👤',
    label: { ru: 'Аккаунт', en: 'Account' },
    items: [
      { path: '/login', id: 'login', label: { ru: 'Вход и регистрация', en: 'Sign in' } },
      { path: '/profile', id: 'profile', label: { ru: 'Профиль', en: 'Profile' } },
      { path: '/admin', id: 'admin', label: { ru: 'Админка', en: 'Admin panel' }, adminOnly: true },
    ],
  },
];

/** Per-route SEO. Falls back to SITE defaults. */
export const SEO = {
  '/': {
    title: {
      ru: 'Хроники Кракена 888 — конструктор питомцев и база Call of Dragons',
      en: 'Kraken Chronicles 888 — War Pet Builder & Call of Dragons database',
    },
    description: SITE.description,
    keywords: ['хроники кракена 888', 'kraken chronicles 888', 'call of dragons', 'конструктор питомцев'],
  },
  '/pets/builder': {
    title: {
      ru: 'Конструктор питомцев Call of Dragons — лучший билд по урону | Хроники Кракена 888',
      en: 'War Pet Builder — best damage build | Kraken Chronicles 888',
    },
    description: {
      ru: 'Конструктор боевых питомцев Call of Dragons: полный перебор навыков, расчёт Damage Factor и DPS, режим «лучшее за вашу сумму» с бюджетом пет-коинов, учёт целей, атакующих и контратаки.',
      en: 'Call of Dragons war pet builder: exhaustive skill search, Damage Factor and DPS scoring, a "best for your budget" mode with a pet-coin cap, targets/attackers and counterattack handling.',
    },
    keywords: ['конструктор питомцев', 'war pet builder', 'лучший билд питомца', 'warpet calculator', 'пет коины', 'best damage build'],
  },
  '/pets/top': {
    title: { ru: 'ТОП боевых питомцев Call of Dragons — таблица характеристик | Кракен 888', en: 'Top Call of Dragons war pets — stat table | Kraken 888' },
    description: {
      ru: 'Полная таблица 25 боевых питомцев Call of Dragons: сила, ловкость, интеллект, выносливость, дух и удача на максимуме, тип урона и род войск.',
      en: 'Full table of 25 Call of Dragons war pets: max Strength, Agility, Intelligence, Endurance, Spirit and Luck, damage type and unit class.',
    },
    keywords: ['топ питомцев call of dragons', 'характеристики питомцев', 'war pets stats', 'лучшие питомцы'],
  },
  '/pets/skills': {
    title: { ru: 'База навыков питомцев Call of Dragons — 123 навыка | Кракен 888', en: 'War pet skill database — 123 skills | Kraken 888' },
    description: {
      ru: 'Все 123 навыка боевых питомцев Call of Dragons: характеристика, тип, стоимость в пет-коинах и янтаре, зависимости Advanced/Intense и эксклюзивные таланты.',
      en: 'All 123 Call of Dragons war pet skills: attribute, type, pet-coin and amber cost, Advanced/Intense dependencies and pet-exclusive talents.',
    },
    keywords: ['навыки питомцев', 'war pet skills', 'advanced intense', 'таланты питомцев'],
  },
  '/pets/builds': {
    title: { ru: 'Мои сохранённые билды питомцев | Хроники Кракена 888', en: 'My saved pet builds | Kraken Chronicles 888' },
    description: { ru: 'Сохраняйте, сравнивайте и делитесь билдами боевых питомцев Call of Dragons.', en: 'Save, compare and share Call of Dragons war pet builds.' },
  },
  '/db/heroes': {
    title: { ru: 'Герои Call of Dragons — база данных и навыки | Кракен 888', en: 'Call of Dragons heroes — database and skills | Kraken 888' },
    description: {
      ru: 'База 51 героя Call of Dragons: качество, сезон, летающие легионы, полное описание всех навыков и уровней прокачки.',
      en: 'Database of 51 Call of Dragons heroes: rarity, season, flying legions, full skill descriptions and upgrade tiers.',
    },
    keywords: ['герои call of dragons', 'cod heroes', 'навыки героев', 'легендарные герои'],
  },
  '/db/artifacts': {
    title: { ru: 'Артефакты Call of Dragons — свойства и эффекты | Кракен 888', en: 'Call of Dragons artifacts | Kraken 888' },
    description: { ru: 'Справочник артефактов Call of Dragons: редкость, эффекты, применение в бою и на карте.', en: 'Call of Dragons artifact reference: rarity, effects and battlefield use.' },
    keywords: ['артефакты call of dragons', 'cod artifacts'],
  },
  '/calc/training': {
    title: { ru: 'Калькулятор обучения войск Call of Dragons | Кракен 888', en: 'Troop training calculator | Kraken 888' },
    description: { ru: 'Расчёт ресурсов, времени и ускорений на обучение войск любого тира с учётом бонусов скорости обучения.', en: 'Resource, time and speedup cost of training any troop tier, with training-speed bonuses.' },
    keywords: ['калькулятор обучения войск', 'training calculator call of dragons'],
  },
  '/calc/healing': {
    title: { ru: 'Калькулятор лечения войск Call of Dragons | Кракен 888', en: 'Troop healing calculator | Kraken 888' },
    description: { ru: 'Сколько ресурсов и времени нужно, чтобы вылечить раненые легионы после боя.', en: 'Resources and time needed to heal wounded legions after a battle.' },
    keywords: ['калькулятор лечения', 'healing calculator call of dragons'],
  },
  '/calc/speedup': {
    title: { ru: 'Калькулятор ускорений Call of Dragons | Кракен 888', en: 'Speedup calculator | Kraken 888' },
    description: { ru: 'Сложите ускорения всех номиналов и узнайте, сколько времени вы можете закрыть.', en: 'Add up speedups of every denomination and see how much time they cover.' },
    keywords: ['калькулятор ускорений', 'speedup calculator'],
  },
  '/calc/resources': {
    title: { ru: 'Калькулятор ресурсов и сбора Call of Dragons | Кракен 888', en: 'Resource & gathering calculator | Kraken 888' },
    description: { ru: 'Планируйте добычу дерева, руды, золота и маны с учётом скорости сбора и вместимости легионов.', en: 'Plan wood, ore, gold and mana gathering with gather speed and load capacity.' },
    keywords: ['калькулятор ресурсов', 'resource calculator call of dragons'],
  },
  '/calc/heroes': {
    title: { ru: 'Калькулятор прокачки героев Call of Dragons | Кракен 888', en: 'Hero upgrade calculator | Kraken 888' },
    description: { ru: 'Сколько медалей и опыта нужно на повышение звёзд и уровня героя.', en: 'Medals and XP required to raise a hero\'s stars and level.' },
    keywords: ['прокачка героев call of dragons', 'hero calculator'],
  },
  '/stats/servers': {
    title: { ru: 'Серверы Call of Dragons — сила, игроки, альянсы | Кракен 888', en: 'Call of Dragons servers | Kraken 888' },
    description: { ru: 'Сводка по серверам: суммарная сила, количество игроков и альянсов, лидеры сервера 888 и 1028.', en: 'Server overview: total power, player and alliance counts, leaders of servers 888 and 1028.' },
    keywords: ['сервер 888 call of dragons', 'статистика серверов', 'call of dragons servers'],
  },
  '/stats/players': {
    title: { ru: 'Топ игроков Call of Dragons — сила и очки | Хроники Кракена 888', en: 'Top Call of Dragons players | Kraken Chronicles 888' },
    description: { ru: 'Рейтинг игроков сервера: сила, уровень ратуши, собранные ресурсы, очки сценариев и иммиграции.', en: 'Player leaderboard: power, town centre level, resources gathered, scenario and immigration points.' },
    keywords: ['топ игроков сервера', 'рейтинг игроков call of dragons', 'tamaris war stats'],
  },
  '/stats/alliances': {
    title: { ru: 'Рейтинг альянсов Call of Dragons — Кraken Chronicles 888', en: 'Call of Dragons alliance rankings | Kraken Chronicles 888' },
    description: { ru: 'Альянсы сервера 888 и 1028: сила, заслуги, флаги, очки оружейной. Включая Кraken Chronicles.', en: 'Alliances of servers 888 and 1028: power, merits, flags and armoury season points, including Kraken Chronicles.' },
    keywords: ['рейтинг альянсов', 'альянс кракен 888', 'kraken chronicles alliance', 'call of dragons alliances'],
  },
  '/stats/rankings': {
    title: { ru: 'Рейтинги Call of Dragons по метрикам | Кракен 888', en: 'Call of Dragons rankings by metric | Kraken 888' },
    description: { ru: 'Отдельные рейтинги по силе, ресурсам, сценариям, ратуше и иммиграции для каждого сервера.', en: 'Separate leaderboards for power, resources, scenarios, town centre and immigration on every server.' },
  },
  '/stats/compare': {
    title: { ru: 'Сравнение игроков и альянсов Call of Dragons | Кракен 888', en: 'Compare players and alliances | Kraken 888' },
    description: { ru: 'Поставьте двух игроков или два альянса рядом и сравните все метрики.', en: 'Put two players or two alliances side by side and compare every metric.' },
  },
  '/stats/immigration': {
    title: { ru: 'Иммиграция на сервер Call of Dragons | Кракен 888', en: 'Server immigration | Kraken 888' },
    description: { ru: 'Кто переехал на сервер, с какой силой и очками иммиграции.', en: 'Who migrated to the server, with what power and immigration score.' },
    keywords: ['иммиграция call of dragons', 'переезд на сервер'],
  },
  '/guides': {
    title: { ru: 'Гайды Call of Dragons — питомцы, герои, война | Хроники Кракена 888', en: 'Call of Dragons guides | Kraken Chronicles 888' },
    description: { ru: 'Практические гайды: как собрать питомца под урон, как тратить пет-коины, как читать статистику сервера.', en: 'Practical guides: building a damage pet, spending pet coins, reading server analytics.' },
    keywords: ['гайд call of dragons', 'гайд по питомцам', 'call of dragons guide'],
  },
  '/calendar': {
    title: { ru: 'Календарь событий Call of Dragons | Кракен 888', en: 'Call of Dragons event calendar | Kraken 888' },
    description: { ru: 'Недельный цикл событий, дни KvK, армейские и строительные дни.', en: 'Weekly event cycle, KvK days, army and construction days.' },
  },
  '/about': {
    title: { ru: 'О проекте «Хроники Кракена» — сервер 888', en: 'About Kraken Chronicles — server 888' },
    description: {
      ru: 'Хроники Кракена — сообщество сервера 888 в Call of Dragons: история, люди и достижения.',
      en: 'Kraken Chronicles — the server 888 community in Call of Dragons: history, people and achievements.',
    },
    keywords: ['хроники кракена 888', 'сервер 888 call of dragons', 'о проекте'],
  },
  '/about/history': {
    title: { ru: 'История сервера 888 — Хроники Кракена', en: 'History of server 888 — Kraken Chronicles' },
    description: {
      ru: 'Как создавался сервер 888 и сообщество «Хроники Кракена»: ключевые этапы и события.',
      en: 'How server 888 and the Kraken Chronicles community were founded: key milestones and events.',
    },
  },
  '/about/build': {
    title: { ru: 'Как устроен сайт Хроники Кракена 888', en: 'How the Kraken Chronicles 888 site is built' },
    description: { ru: 'Что объединено в этом сайте и откуда взяты данные.', en: 'What this site merges and where its data comes from.' },
  },
  '/news': {
    title: { ru: 'Новости — Хроники Кракена 888', en: 'News — Kraken Chronicles 888' },
    description: {
      ru: 'Новости проекта «Хроники Кракена» и сервера 888: события, обновления, турниры.',
      en: 'Kraken Chronicles project and server 888 news: events, updates, tournaments.',
    },
  },
  // Fallback SEO for /news/:slug (a real, indexable page per article — just
  // not enumerable here as a single static path, so it's excluded from the
  // sitemap below by key rather than by noindex).
  '/news/post': {
    title: { ru: 'Новость — Хроники Кракена 888', en: 'News — Kraken Chronicles 888' },
    description: { ru: 'Новости проекта «Хроники Кракена» и сервера 888.', en: 'Kraken Chronicles project and server 888 news.' },
  },
  '/achievements': {
    title: { ru: 'Достижения 888 — Хроники Кракена', en: 'Achievements of 888 — Kraken Chronicles' },
    description: {
      ru: 'Кубки, победы в сезонах и другие достижения сервера 888 и альянса Кraken Chronicles.',
      en: 'Trophies, season wins and other achievements of server 888 and the Kraken Chronicles alliance.',
    },
  },
  '/team': {
    title: { ru: 'Команда 888 — глава и офицеры | Хроники Кракена', en: 'Team 888 — leader and officers | Kraken Chronicles' },
    description: {
      ru: 'Действующее руководство сообщества сервера 888: глава, офицеры и контакты.',
      en: 'The server 888 community\'s current leadership: leader, officers and contacts.',
    },
  },
  '/hall-of-fame': {
    title: { ru: 'Легенды 888 — исторические участники | Хроники Кракена', en: 'Legends of 888 — hall of fame | Kraken Chronicles' },
    description: {
      ru: 'Бывшие участники сервера 888, внёсшие вклад в развитие сообщества.',
      en: 'Former members of server 888 who shaped the community.',
    },
  },
  '/tournament': {
    title: { ru: 'Турнир «Хроники Кракена»', en: 'The Kraken Chronicles tournament' },
    description: {
      ru: 'Турнир сообщества сервера 888: статус, даты и результаты.',
      en: 'The server 888 community tournament: status, dates and results.',
    },
  },
  '/login': { title: { ru: 'Вход и регистрация | Хроники Кракена 888', en: 'Sign in | Kraken Chronicles 888' }, description: { ru: 'Войдите, чтобы сохранять билды питомцев и писать в поддержку.', en: 'Sign in to save pet builds and message support.' }, noindex: true },
  '/profile': { title: { ru: 'Профиль | Хроники Кракена 888', en: 'Profile | Kraken Chronicles 888' }, noindex: true },
  '/admin': { title: { ru: 'Админка | Хроники Кракена 888', en: 'Admin panel | Kraken Chronicles 888' }, noindex: true },
};

/** All public routes, for sitemap.xml. */
export function publicRoutes() {
  // '/news/post' is a fallback SEO key for /news/:slug, not a real path.
  return Object.keys(SEO).filter((p) => !SEO[p].noindex && p !== '/news/post');
}

export function findItem(path) {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.path === path) return { group, item };
    }
  }
  return null;
}

export function seoFor(path, lang = 'ru') {
  const base = SEO[path] || SEO['/'];
  const pick = (v, fb) => (typeof v === 'object' && v ? (v[lang] || v.ru || v.en) : (v ?? fb));
  const kw = [...new Set([...(base.keywords || []), ...SITE.keywords])];
  return {
    title: pick(base.title, SITE.name[lang]),
    description: pick(base.description, SITE.description[lang]),
    keywords: kw.join(', '),
    noindex: !!base.noindex,
  };
}
