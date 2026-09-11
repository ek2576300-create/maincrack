import { h, clear, getJSON, sortBy, num } from '../util.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const [pets, skills] = await Promise.all([getJSON('/data/pets.json'), getJSON('/data/pet-skills.json')]);

  // A couple of numbers pulled live from the data, so guides stay honest.
  const amber = skills.items.filter((s) => (s.costs || []).every((c) => c > 0 && c <= 12));
  const strongest = sortBy(pets.items, 'total', -1)[0];
  const talents = skills.items.filter((s) => s.talent);

  const GUIDES = lang === 'ru' ? [
    {
      icon: '🐉', title: 'Как собрать питомца под максимальный урон',
      body: [
        'Первый слот навыка — врождённый талант выбранного питомца. Он закреплён, конструктор его не убирает и не заменяет: при 8 слотах перебираются оставшиеся 7.',
        `В базе ${talents.length} врождённых талантов — по одному на питомца, поэтому выбор питомца сразу задаёт один навык из билда.`,
        'Не более 3 навыков могут висеть на одной характеристике (Сила / Ловкость / Интеллект / Выносливость / Дух / Удача). Закреплённый талант тоже считается в этот лимит.',
        'Advanced- и Intense-навыки требуют базовый навык в том же билде. Конструктор отбрасывает комбинации, где зависимость не выполнена, поэтому «Advanced Painbloom» без «Painbloom» вы в результатах не увидите.',
        'Кнопка BEST BUILD оптимизирует не отдельные навыки, а итоговый Total Damage / DPS с учётом целей, атакующих и длительности цикла — это то, что реально решает в поле.',
      ],
    },
    {
      icon: '🪙', title: 'Куда девать пет-коины и янтарь',
      body: [
        `${amber.length} навыков из ${skills.count} оплачиваются янтарём, а не пет-коинами. Конструктор всегда ставит им 4 уровень и не списывает за них бюджет.`,
        'Кнопка «ЛУЧШЕЕ ЗА ВАШУ СУММУ» ищет лучший полный билд, укладывающийся в заданный бюджет пет-коинов, и может выставлять разный уровень каждому навыку — в отличие от BEST BUILD, который ставит всем один уровень.',
        'По умолчанию бюджет — 1 000 000 пет-коинов. Ставьте свою реальную сумму: результат заметно меняется, потому что дорогие навыки 4 уровня быстро съедают лимит.',
        'Практика: сначала прогоните BEST BUILD без бюджета — это ваш потолок. Потом «за вашу сумму» — это то, что доступно сегодня. Разница между двумя цифрами и есть цена апгрейда.',
      ],
    },
    {
      icon: '⚔️', title: 'Пресеты боя: какой когда',
      body: [
        'DUEL (1 цель, 1 атакующий) — соло-размен. Здесь выигрывают навыки чистого одиночного урона.',
        'FIELD CLASH (3 цели, 2 атакующих) — обычный полевой бой. Универсальный дефолт.',
        'AOE CAP (5 целей, 2 атакующих) — большая свалка. Полезен, чтобы увидеть навыки с потолком примерно в 3 цели: в этом режиме они перестают расти.',
        'SWARMED (3 цели, 5 атакующих) — вас бьют много кто. Здесь оживают контратака, инфекция и парирование.',
        'Галочка «Нужна контратака?» по умолчанию выключена. Пока она выключена, Counterstrike и всё, что от него зависит, из перебора исключаются — так билд не тратит слоты на механику, которой у вас нет.',
      ],
    },
    {
      icon: '📊', title: 'Как читать статистику сервера',
      body: [
        'Сила (power) — самая грубая метрика: она растёт и от войск, и от построек, и от исследований. Для оценки боевой готовности смотрите её вместе с уровнем ратуши.',
        'Очки сценариев показывают, кто реально ходит в события, а не просто фармит.',
        'Очки иммиграции есть только у переехавших. Сервер 888 в выгрузке содержит 498 иммигрантов, сервер 1028 — ни одного, поэтому вкладка «Иммиграция» на 1028 пустая, и это не ошибка.',
        'Столбец «Не в сети» — самый практичный: он показывает, кто из топа реально ушёл из игры.',
      ],
    },
    {
      icon: '🔍', title: `Самый «толстый» питомец в базе — ${strongest.name}`,
      body: [
        `Сумма максимальных характеристик: ${num(strongest.total, lang)}. Тип урона: ${t('dmg.' + strongest.type)}, род войск: ${t('unit.' + strongest.unit)}.`,
        'Но сумма характеристик — не то же самое, что урон. Питомец с меньшей суммой, но с талантом и навыками под ваш род войск, часто бьёт сильнее. Проверяйте конструктором, а не таблицей.',
      ],
    },
  ] : [
    {
      icon: '🐉', title: 'Building a war pet for maximum damage',
      body: [
        'The first skill slot is the pet\'s innate talent. It is locked — the builder never removes or replaces it, so with 8 slots the search covers the remaining 7.',
        `The database holds ${talents.length} innate talents, one per pet, so picking the pet already fixes one skill in the build.`,
        'At most 3 skills may hang on the same attribute (Strength / Agility / Intelligence / Endurance / Spirit / Luck). The locked talent counts toward that limit too.',
        'Advanced and Intense skills require their base skill in the same build. Combinations that break a dependency are discarded, so you will never see "Advanced Painbloom" without "Painbloom".',
        'BEST BUILD optimises the final Total Damage / DPS — with targets, attackers and cycle duration folded in — not individual skill numbers. That is what actually decides a field fight.',
      ],
    },
    {
      icon: '🪙', title: 'Where pet coins and amber go',
      body: [
        `${amber.length} of the ${skills.count} skills are paid in amber rather than pet coins. The builder always runs those at Lv.4 and never charges them to the budget.`,
        '"BEST FOR YOUR AMOUNT" finds the best complete build that fits a given pet-coin budget and may assign a different level to each skill — unlike BEST BUILD, which puts every skill at the same level.',
        'The default budget is 1,000,000 pet coins. Put in your real number: the result shifts noticeably, because Lv.4 on expensive skills eats the cap fast.',
        'In practice: run BEST BUILD with no budget first — that is your ceiling. Then run the budget mode — that is what you can afford today. The gap between the two numbers is the price of the upgrade.',
      ],
    },
    {
      icon: '⚔️', title: 'Combat presets: which one when',
      body: [
        'DUEL (1 target, 1 attacker) — a solo trade. Pure single-target damage wins here.',
        'FIELD CLASH (3 targets, 2 attackers) — an ordinary field fight. The sensible default.',
        'AOE CAP (5 targets, 2 attackers) — a big pile-up. Useful for spotting skills that cap around 3 targets: in this mode they stop scaling.',
        'SWARMED (3 targets, 5 attackers) — many things are hitting you. Counterstrike, infection and parry models come alive here.',
        'The "Want counterattack?" checkbox is off by default. While it is off, Counterstrike and everything depending on it is excluded from the search, so the build does not spend slots on a mechanic you do not run.',
      ],
    },
    {
      icon: '📊', title: 'Reading the server analytics',
      body: [
        'Power is the bluntest metric: troops, buildings and research all feed it. Read it next to the town centre level to judge actual combat readiness.',
        'Scenario points show who actually turns up to events instead of only farming.',
        'Immigration score only exists for players who moved in. In this export server 888 has 498 immigrants and server 1028 has none — so the Immigration tab on 1028 is empty by design, not broken.',
        'The "offline for" column is the most practical one: it shows which of the top names have actually quit.',
      ],
    },
    {
      icon: '🔍', title: `The beefiest pet in the database — ${strongest.name}`,
      body: [
        `Sum of maximum stats: ${num(strongest.total, lang)}. Damage type: ${t('dmg.' + strongest.type)}, unit class: ${t('unit.' + strongest.unit)}.`,
        'But a stat total is not damage. A pet with a smaller total, whose talent and skills match your unit class, often hits harder. Check it in the builder, not in the table.',
      ],
    },
  ];

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('guides.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('guides.title')), h('p', {}, t('guides.desc'))),
        h('a', { class: 'kc-btn sm is-primary', href: '/pets/builder', onclick: link('/pets/builder') }, '🐉 ' + t('pets.builder.title'))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid auto-lg' }, ...GUIDES.map((g) => h('article', { class: 'kc-card' },
          h('div', { style: { fontSize: '22px', marginBottom: '8px' } }, g.icon),
          h('h3', { style: { margin: '0 0 10px' } }, g.title),
          ...g.body.map((p) => h('p', { class: 'kc-note', style: { margin: '0 0 9px', color: 'var(--text-dim)', lineHeight: '1.6' } }, p))))))));
}
