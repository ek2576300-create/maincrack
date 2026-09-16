(() => {
  'use strict';

  const ATTRS = ['Strength', 'Agility', 'Intelligence', 'Endurance', 'Spirit', 'Luck'];
  const TOP_PETS_DATA=[{'name':'Berserk\x20Faedrake','type':'Physical','unit':'Cavalry','maxStrength':0x141,'maxAgility':0x15b,'maxIntelligence':0x10d,'maxEndurance':0xc8,'maxSpirit':0xc8,'maxLuck':0x130},{'name':'Sapphire\x20Faedrake','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0x10d,'maxIntelligence':0x15b,'maxEndurance':0xc8,'maxSpirit':0x141,'maxLuck':0x130},{'name':'Shadow\x20Faedrake','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0x10d,'maxIntelligence':0x15b,'maxEndurance':0xc8,'maxSpirit':0x141,'maxLuck':0x130},{'name':'Golden\x20Roc','type':'Physical','unit':'Cavalry','maxStrength':0x15b,'maxAgility':0x141,'maxIntelligence':0xc8,'maxEndurance':0xc8,'maxSpirit':0x10d,'maxLuck':0x130},{'name':'Snowpeak\x20Roc','type':'Physical','unit':'Marksman','maxStrength':0x130,'maxAgility':0x141,'maxIntelligence':0x10d,'maxEndurance':0xc8,'maxSpirit':0xc8,'maxLuck':0x15b},{'name':'Night\x20Roc','type':'Physical','unit':'Marksman','maxStrength':0x130,'maxAgility':0x15b,'maxIntelligence':0xc8,'maxEndurance':0xc8,'maxSpirit':0x10d,'maxLuck':0x141},{'name':'Bruinbear','type':'Physical','unit':'Infantry','maxStrength':0x15b,'maxAgility':0x130,'maxIntelligence':0xc8,'maxEndurance':0x141,'maxSpirit':0xc8,'maxLuck':0x10d},{'name':'Sand\x20Lizard','type':'Overall','unit':'Overall','maxStrength':0x130,'maxAgility':0x130,'maxIntelligence':0x130,'maxEndurance':0xc8,'maxSpirit':0x130,'maxLuck':0xc8},{'name':'Moonbear','type':'Physical','unit':'Infantry','maxStrength':0x15b,'maxAgility':0x130,'maxIntelligence':0xc8,'maxEndurance':0x141,'maxSpirit':0xc8,'maxLuck':0x10d},{'name':'Thunder\x20Lizard','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0x130,'maxIntelligence':0x130,'maxEndurance':0xc8,'maxSpirit':0x130,'maxLuck':0x130},{'name':'Ice\x20Lizard','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0x10d,'maxIntelligence':0x15b,'maxEndurance':0xc8,'maxSpirit':0x141,'maxLuck':0x130},{'name':'Venomous\x20Lizard','type':'Physical','unit':'Overall','maxStrength':0x130,'maxAgility':0x130,'maxIntelligence':0xc8,'maxEndurance':0x130,'maxSpirit':0xc8,'maxLuck':0x130},{'name':'Seraphic\x20Faedrake','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0xc8,'maxIntelligence':0x141,'maxEndurance':0x10d,'maxSpirit':0x15b,'maxLuck':0x130},{'name':'Shadow\x20Manticore','type':'Physical','unit':'Marksman','maxStrength':0x130,'maxAgility':0x141,'maxIntelligence':0x10d,'maxEndurance':0xc8,'maxSpirit':0xc8,'maxLuck':0x15b},{'name':'Blade\x20Manticore','type':'Physical','unit':'Cavalry','maxStrength':0x15b,'maxAgility':0x141,'maxIntelligence':0xc8,'maxEndurance':0xc8,'maxSpirit':0x10d,'maxLuck':0x130},{'name':'Barbed\x20Manticore','type':'Physical','unit':'Marksman','maxStrength':0x130,'maxAgility':0x141,'maxIntelligence':0x10d,'maxEndurance':0xc8,'maxSpirit':0xc8,'maxLuck':0x15b},{'name':'Auric\x20Warhound','type':'Physical','unit':'Cavalry','maxStrength':0x15b,'maxAgility':0x141,'maxIntelligence':0xc8,'maxEndurance':0xc8,'maxSpirit':0x10d,'maxLuck':0x130},{'name':'Mossrock\x20Aurochs','type':'Physical','unit':'Infantry','maxStrength':0x141,'maxAgility':0x130,'maxIntelligence':0x10d,'maxEndurance':0x15b,'maxSpirit':0xc8,'maxLuck':0xc8},{'name':'Flaming\x20Manticore','type':'Magic','unit':'Magic','maxStrength':0xc8,'maxAgility':0x10d,'maxIntelligence':0x15b,'maxEndurance':0xc8,'maxSpirit':0x141,'maxLuck':0x130},{'name':'Windweasel','type':'Physical','unit':'Marksman','maxStrength':0x130,'maxAgility':0x15b,'maxIntelligence':0xc8,'maxEndurance':0xc8,'maxSpirit':0x10d,'maxLuck':0x141},{'name':'Bullionbeast','type':'Physical','unit':'Cavalry','maxStrength':0x141,'maxAgility':0x15b,'maxIntelligence':0x10d,'maxEndurance':0xc8,'maxSpirit':0xc8,'maxLuck':0x130},{'name':'Brimstone\x20Auroch','type':'Physical','unit':'Infantry','maxStrength':0x15b,'maxAgility':0x130,'maxIntelligence':0xc8,'maxEndurance':0x141,'maxSpirit':0xc8,'maxLuck':0x10d},{"name":"Frostbear","type":"Physical","unit":"Infantry","maxStrength":347,"maxAgility":304,"maxIntelligence":200,"maxEndurance":321,"maxSpirit":200,"maxLuck":269},{"name":"Magifox","type":"Magic","unit":"Magic","maxStrength":200,"maxAgility":269,"maxIntelligence":347,"maxEndurance":200,"maxSpirit":321,"maxLuck":304},{"name":"Toxisaur","type":"Physical","unit":"Marksman","maxStrength":304,"maxAgility":321,"maxIntelligence":269,"maxEndurance":200,"maxSpirit":200,"maxLuck":347}];
  const MAX_SKILLS_PER_ATTRIBUTE = 3;
  const COMBAT_PRESETS = [
    {id:'duel', labelKey:'presetDuel', descriptionKey:'presetDuelHelp', settings:{cycleDuration:10, targets:1, attackers:1}},
    {id:'field', labelKey:'presetField', descriptionKey:'presetFieldHelp', settings:{cycleDuration:10, targets:3, attackers:2}},
    {id:'aoe', labelKey:'presetAoe', descriptionKey:'presetAoeHelp', settings:{cycleDuration:10, targets:5, attackers:2}},
    {id:'swarm', labelKey:'presetSwarm', descriptionKey:'presetSwarmHelp', settings:{cycleDuration:10, targets:3, attackers:5}}
  ];
  const LANG_STORAGE_KEY = 'warpet-language';
  let runToken = 0;
  let lastPetName = null;
  let lastApiStatsSignature = '';
  let autoRecalcTimer = null;
  let optimizerBusy = false;
  let suppressAutoRecalcUntil = 0;
  let currentView = 'builder';
  let currentLang = (() => {
    try {
      const fromUrl = new URLSearchParams(location.search).get('lang');
      if (fromUrl === 'ru' || fromUrl === 'en') return fromUrl;
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'ru' || saved === 'en' ? saved : 'en';
    } catch (_) {
      return 'en';
    }
  })();

  const I18N = {
    en: {
      title: 'Best Damage Build',
      badge: 'FINAL DPS / MULTI-TARGET',
      pet: 'Pet',
      selectPet: 'Select a War Pet',
      petStats: 'Pet stats',
      skillSlots: 'Skill slots',
      skillLevel: 'Skill level',
      max: 'max',
      combatSettings: 'Combat settings used during optimization',
      presets: 'Presets',
      presetsHelp: 'Quickly apply battle scenarios from the newer calculator.',
      presetDuel: 'DUEL',
      presetField: 'FIELD CLASH',
      presetAoe: 'AOE CAP',
      presetSwarm: 'SWARMED',
      presetDuelHelp: '1v1-style: one enemy in range, one attacker.',
      presetFieldHelp: 'Several enemies in range; moderate pressure.',
      presetAoeHelp: 'Many enemies in range; useful for skills capped around 3 targets.',
      presetSwarmHelp: 'Many enemies hitting you; useful for counter, infection and parry models.',
      targets: 'Targets',
      attackers: 'Attackers',
      cycleDuration: 'Cycle Duration (sec)',
      petCoinBudget: 'Pet coin budget',
      budgetHelp: 'Maximum pet coins to spend. Amber skills do not use this budget and are always Lv.4.',
      bestForBudget: 'Best for your amount',
      budgetCalculating: 'Budget search…',
      spent: 'Spent',
      amberCost: 'Amber',
      budgetProgress: (checked, raw, budget) => `Budget ${budget.toLocaleString('en-US')}: checked ${checked.toLocaleString('en-US')} valid builds (${raw.toLocaleString('en-US')} combinations)…`,
      budgetDone: (targets, budget, spent) => `Done: best damage build within ${budget.toLocaleString('en-US')} pet coins. Spent ${spent.toLocaleString('en-US')}.`,
      budgetTooLow: budget => `No valid full build fits the ${budget.toLocaleString('en-US')} pet coin budget.`,
      counterattack: 'Want counterattack?',
      counterattackHelp: 'Allow Counterstrike skills and their upgrades in the generated build.',
      bestBuild: 'Best build',
      calculating: 'Calculating…',
      cancel: 'Cancel',
      introStatus: "Scores every valid combination by the original calculator's final Total Damage / DPS.",
      noteStrong: 'Targets, Attackers and counterattack choice are part of the search.',
      note: 'AoE modifiers, crit/damage buffs, dependencies and the 3-skills-per-attribute limit are evaluated inside the complete build.',
      cancelled: 'Search cancelled.',
      noValid: 'No valid build found for these settings.',
      damageFactor: 'Damage Factor',
      dps: 'DPS',
      cycle: 'Cycle',
      checked: 'Checked',
      validBuilds: 'valid builds',
      candidates: 'Candidates',
      innateLocked: 'innate / locked',
      modifies: 'modifies',
      selectPetFirst: 'Select a War Pet first.',
      noInnate: 'This pet has no innate talent in the captured database.',
      onlyCandidates: n => `Only ${n} compatible removable skills are available (+ 1 locked innate skill).`,
      testing: (targets, attackers, name) => `Targets ${targets}, attackers ${attackers}: testing final Total DPS with slot 1 locked (${name})…`,
      progress: (targets, attackers, checked, raw) => `Targets ${targets}, attackers ${attackers}: checked ${checked.toLocaleString('en-US')} valid builds (${raw.toLocaleString('en-US')} combinations)…`,
      done: (kind, targets, attackers) => `Done: exact ${kind} build for ${targets} target(s), ${attackers} attacker(s). Final Total Damage is the optimization score.`,
      singleTarget: 'single-target',
      multiTarget: 'multi-target',
      noCalculated: 'No valid build could be calculated.',
      counterOn: 'Counterattack: ON',
      counterOff: 'Counterattack: OFF',
      attributeLimit: `Maximum ${MAX_SKILLS_PER_ATTRIBUTE} skills can use the same attribute.`,
      language: 'Language',
      topPets: 'Top pets',
      autoRecalculating: 'Pet stats changed — recalculating the best build…'
    },
    ru: {
      title: 'Лучший билд по урону',
      badge: 'ИТОГОВЫЙ DPS / НЕСКОЛЬКО ЦЕЛЕЙ',
      pet: 'Питомец',
      selectPet: 'Выберите боевого питомца',
      petStats: 'Характеристики питомца',
      skillSlots: 'Слоты навыков',
      skillLevel: 'Уровень навыков',
      max: 'макс.',
      combatSettings: 'Настройки боя для оптимизации',
      presets: 'Пресеты',
      presetsHelp: 'Быстро применить боевые сценарии из новой версии калькулятора.',
      presetDuel: 'ДУЭЛЬ',
      presetField: 'ПОЛЕВОЙ БОЙ',
      presetAoe: 'AOE ЛИМИТ',
      presetSwarm: 'В ОКРУЖЕНИИ',
      presetDuelHelp: 'Бой 1 на 1: одна цель и один атакующий.',
      presetFieldHelp: 'Несколько целей в радиусе и умеренное давление.',
      presetAoeHelp: 'Много целей в радиусе для навыков с ограничением AoE.',
      presetSwarmHelp: 'Много атакующих: сценарий для контратак, Infection и похожих механик.',
      targets: 'Цели',
      attackers: 'Атакующие',
      cycleDuration: 'Длительность цикла (сек)',
      petCoinBudget: 'Бюджет пет-коинов',
      budgetHelp: 'Максимум пет-коинов, который можно потратить. Навыки за янтарь бюджет не расходуют и всегда ставятся 4 уровня.',
      bestForBudget: 'Лучшее за вашу сумму',
      budgetCalculating: 'Поиск по бюджету…',
      spent: 'Потрачено',
      amberCost: 'Янтарь',
      budgetProgress: (checked, raw, budget) => `Бюджет ${budget.toLocaleString('ru-RU')}: проверено ${checked.toLocaleString('ru-RU')} допустимых билдов (${raw.toLocaleString('ru-RU')} комбинаций)…`,
      budgetDone: (targets, budget, spent) => `Готово: лучший по урону билд в пределах ${budget.toLocaleString('ru-RU')} пет-коинов. Потрачено ${spent.toLocaleString('ru-RU')}.`,
      budgetTooLow: budget => `Полный допустимый билд не помещается в бюджет ${budget.toLocaleString('ru-RU')} пет-коинов.`,
      counterattack: 'Нужна контратака?',
      counterattackHelp: 'Разрешить Counterstrike и связанные с ним улучшения в создаваемом билде.',
      bestBuild: 'Найти лучший билд',
      calculating: 'Расчёт…',
      cancel: 'Отмена',
      introStatus: 'Проверяются все допустимые комбинации по итоговому Total Damage / DPS исходного калькулятора.',
      noteStrong: 'Количество целей, атакующих и выбор контратаки учитываются при поиске.',
      note: 'AoE-модификаторы, бонусы крита/урона, зависимости и лимит в 3 навыка на одну характеристику проверяются для полного билда.',
      cancelled: 'Поиск отменён.',
      noValid: 'Для этих настроек допустимый билд не найден.',
      damageFactor: 'Фактор урона',
      dps: 'DPS',
      cycle: 'Цикл',
      checked: 'Проверено',
      validBuilds: 'допустимых билдов',
      candidates: 'Кандидатов',
      innateLocked: 'врождённый / закреплён',
      modifies: 'улучшает',
      selectPetFirst: 'Сначала выберите боевого питомца.',
      noInnate: 'У этого питомца нет врождённого таланта в сохранённой базе.',
      onlyCandidates: n => `Доступно только ${n} совместимых заменяемых навыков (+ 1 закреплённый врождённый навык).`,
      testing: (targets, attackers, name) => `Целей: ${targets}, атакующих: ${attackers}. Проверяю итоговый DPS с закреплённым слотом 1 (${name})…`,
      progress: (targets, attackers, checked, raw) => `Целей: ${targets}, атакующих: ${attackers}. Проверено ${checked.toLocaleString('ru-RU')} допустимых билдов (${raw.toLocaleString('ru-RU')} комбинаций)…`,
      done: (kind, targets, attackers) => `Готово: найден точный ${kind} билд для ${targets} цел. и ${attackers} атакующих. Критерий оптимизации — итоговый Total Damage.`,
      singleTarget: 'одноцелевой',
      multiTarget: 'многоцелевой',
      noCalculated: 'Не удалось рассчитать ни одного допустимого билда.',
      counterOn: 'Контратака: ВКЛ',
      counterOff: 'Контратака: ВЫКЛ',
      attributeLimit: `Не более ${MAX_SKILLS_PER_ATTRIBUTE} навыков могут использовать одну характеристику.`,
      language: 'Язык',
      topPets: 'Топ питомцев',
      autoRecalculating: 'Характеристики питомца изменены — пересчитываю лучший билд…'
    }
  };

  const ATTRIBUTE_RU = {
    Strength: 'Сила',
    Agility: 'Проворство',
    Intelligence: 'Интеллект',
    Endurance: 'Выносливость',
    Spirit: 'Дух',
    Luck: 'Удача'
  };

  const PET_NAME_RU = {
    'Berserk Faedrake': 'Яростный Феодрейк',
    'Sapphire Faedrake': 'Сапфировый Феодрейк',
    'Shadow Faedrake': 'Теневой Феодрейк',
    'Golden Roc': 'Золотой Рух',
    'Snowpeak Roc': 'Снежновершинный Рух',
    'Night Roc': 'Ночной Рух',
    'Bruinbear': 'Бурый Медведь',
    'Sand Lizard': 'Песчаная Ящерица',
    'Moonbear': 'Лунный Медведь',
    'Thunder Lizard': 'Громовая Ящерица',
    'Ice Lizard': 'Ледяная Ящерица',
    'Venomous Lizard': 'Ядовитая Ящерица',
    'Seraphic Faedrake': 'Серафический Феодрейк',
    'Shadow Manticore': 'Теневая Мантикора',
    'Blade Manticore': 'Клинковая Мантикора',
    'Barbed Manticore': 'Шипастая Мантикора',
    'Auric Warhound': 'Золотой Боевой Пёс',
    'Mossrock Aurochs': 'Мохоскальный Тур',
    'Flaming Manticore': 'Пламенная Мантикора',
    'Windweasel': 'Ветряная Ласка',
    'Bullionbeast': 'Златозверь',
    'Brimstone Auroch': 'Серный Тур',
    'Frostbear': 'Морозный Медведь',
    'Magifox': 'Маголис',
    'Toxisaur': 'Токсизавр'
  };
  const UNIT_RU = { Cavalry: 'Кавалерия', Infantry: 'Пехота', Marksman: 'Стрелки', Magic: 'Маги', Overall: 'Общий' };
  const DAMAGE_TYPE_RU = { Physical: 'Физический', Magic: 'Магический', Overall: 'Общий' };

  // Exact UI strings on the mirrored War Pet page. Skill and pet names stay canonical
  // so builds can still be compared with the English in-game database.
  const SITE_TRANSLATIONS = {
    'War Pet Builder - CoD DB': 'Конструктор боевых питомцев — CoD DB',
    'Log in': 'Войти',
    'Database': 'База данных',
    'Artifacts': 'Артефакты',
    'Heroes': 'Герои',
    'Hero Builds': 'Билды героев',
    'War Pet Builder': 'Конструктор питомцев',
    'RoW Planner': 'Планировщик RoW',
    'Guides': 'Гайды',
    'Calculators': 'Калькуляторы',
    'Speedup': 'Ускорения',
    'Resources': 'Ресурсы',
    'Training': 'Обучение',
    'Healing': 'Лечение',
    'Calendar': 'Календарь',
    'Decree Editor': 'Редактор указов',
    'Support Me': 'Поддержать',
    'Discord Server': 'Discord-сервер',
    'Changelog': 'История изменений',
    'War Pet': 'Боевой питомец',
    'Strength': 'Сила',
    'Agility': 'Проворство',
    'Intelligence': 'Интеллект',
    'Endurance': 'Выносливость',
    'Spirit': 'Дух',
    'Luck': 'Удача',
    'Skills': 'Навыки',
    'Stats': 'Характеристики',
    'Crit Chance:': 'Шанс крита:',
    'Crit Damage:': 'Критический урон:',
    'Damage Increase:': 'Бонус урона:',
    'Heal Increase:': 'Бонус лечения:',
    'Self Buff': 'Собственные усиления',
    'Total': 'Итого',
    'Damage Factor:': 'Фактор урона:',
    'Cost (~):': 'Стоимость (~):',
    'General Settings': 'Общие настройки',
    'Cycle Duration:': 'Длительность цикла:',
    'Targets:': 'Цели:',
    'Attackers:': 'Атакующие:',
    'Upgrade Mode:': 'Режим улучшения:',
    'Legion HP': 'HP легиона',
    'Enemy Legion DEF Penetration': 'Пробивание защиты вражеского легиона',
    'Crit damage on Physical counterattack': 'Крит. урон физической контратаки',
    'Crit damage on Physical Hero Skill': 'Крит. урон физического навыка героя',
    'Crit damage on Physical normal attack': 'Крит. урон обычной физической атаки',
    'Legion Physical ATK': 'Физическая атака легиона',
    '/ DPS:': '/ DPS:',
    ...PET_NAME_RU
  };
  const SITE_TRANSLATIONS_REVERSE = Object.fromEntries(Object.entries(SITE_TRANSLATIONS).map(([en, ru]) => [ru, en]));

  const TOP_I18N = {
    en: {builder:'Builder', top:'Top pets', heroBuilder:'War Pet Builder', heroBuilderSub:'Exhaustive skill search and the best damage build', heroTop:'Top war pets', heroTopSub:'Maximum attributes of every war pet', title:'Pets with the best attributes', desc:'Maximum pet stats from the builder database. Click a stat header to rank by it.', search:'Search pet', all:'All units', rank:'Rank', pet:'Pet', type:'Type', unit:'Unit', total:'Total', foot:'Gold marks the maximum value for an attribute, white the next high tier.', attrs:{Strength:'Strength',Agility:'Agility',Intelligence:'Intelligence',Endurance:'Endurance',Spirit:'Spirit',Luck:'Luck'}},
    ru: {builder:'Билдер', top:'Топ питомцев', heroBuilder:'Конструктор питомцев', heroBuilderSub:'Полный перебор навыков и лучший билд по урону', heroTop:'Топ питомцев', heroTopSub:'Максимальные характеристики всех питомцев', title:'Петы с лучшими характеристиками', desc:'Максимальные характеристики петов из базы билдера. Нажмите на характеристику, чтобы построить топ.', search:'Поиск пета', all:'Все типы войск', rank:'Место', pet:'Пет', type:'Тип', unit:'Войска', total:'Сумма', foot:'Золотым отмечен максимум характеристики, белым — следующий высокий уровень.', attrs:{Strength:'Сила',Agility:'Проворство',Intelligence:'Интеллект',Endurance:'Выносливость',Spirit:'Дух',Luck:'Удача'}}
  };
  const topT = key => TOP_I18N[currentLang]?.[key] ?? TOP_I18N.en[key] ?? key;
  const sleepFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const locale = () => currentLang === 'ru' ? 'ru-RU' : 'en-US';
  const fmt = n => Number.isFinite(n) ? Number(n).toLocaleString(locale(), {maximumFractionDigits: 2}) : '—';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = key => I18N[currentLang][key] ?? I18N.en[key] ?? key;
  const attributeLabel = a => currentLang === 'ru' ? (ATTRIBUTE_RU[a] || a) : a;
  const petNameLabel = name => currentLang === 'ru' ? (PET_NAME_RU[name] || name) : name;
  const unitLabel = u => currentLang === 'ru' ? (UNIT_RU[u] || u) : u;
  const damageTypeLabel = ty => currentLang === 'ru' ? (DAMAGE_TYPE_RU[ty] || ty) : ty;

  /* The mirrored builder picks pets through a react-select whose options are plain
     text. Both the canonical English name and the Russian one resolve back to the
     canonical name so the option can be matched in either language. */
  const PET_BY_LABEL = (() => {
    const map = new Map();
    for (const pet of TOP_PETS_DATA) {
      map.set(pet.name.trim().toLowerCase(), pet.name);
      const ru = PET_NAME_RU[pet.name];
      if (ru) map.set(ru.trim().toLowerCase(), pet.name);
    }
    return map;
  })();
  const petPortraitUrl = name => `/img/warpets/portrait/${encodeURIComponent(name)}.png`;
  const PET_PLACEHOLDER = { en: 'Select a War Pet...', ru: 'Выберите питомца…' };
  const UNIT_LABELS = new Set([...Object.keys(UNIT_RU), ...Object.values(UNIT_RU)].map(v => v.toLowerCase()));

  function injectStyles() {
    if (document.getElementById('warpet-optimizer-style')) return;
    const style = document.createElement('style');
    style.id = 'warpet-optimizer-style';
    style.textContent = `
      /* Minimalist theme, mirrored from the shell's design system: one neutral
         surface scale, one accent, hairline borders, no gradients or glow. */
      :root {
        --wpo-bg:#0c0d0e; --wpo-surface:#121415; --wpo-surface-2:#171a1b; --wpo-surface-3:#1d2122;
        --wpo-line:rgba(255,255,255,.08); --wpo-line-2:rgba(255,255,255,.14); --wpo-line-3:rgba(255,255,255,.22);
        --wpo-text:#e9ebeb; --wpo-text-dim:#b6bcbc; --wpo-muted:#838d8d; --wpo-muted-2:#626b6b;
        --wpo-accent:#d8b45d; --wpo-accent-ink:#14100a; --wpo-accent-bg:rgba(216,180,93,.10);
        --wpo-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      }
      html, body { background:var(--wpo-bg) !important; }
      body { color:var(--wpo-text); font-family:var(--wpo-sans); }
      #__next > div:nth-child(2) { min-height:100vh; background:var(--wpo-bg) !important; }
      #__next nav, #__next aside { display:none !important; }
      #__next [class*="xl:pl-60"] { padding-left:0 !important; }
      #__next [class*="pt-14"][class*="min-h-screen"] { padding-top:0 !important; }
      #__next section[class*="pt-2"][class*="pb-2"] { max-width:1320px !important; margin:0 auto !important; padding:22px 24px 56px !important; }
      #__next [class*="border-stone-700/50"] { border-color:var(--wpo-line) !important; }
      #__next [class*="bg-stone-900/80"], #__next [class*="bg-stone-900/60"] { background:var(--wpo-surface) !important; box-shadow:none !important; border-radius:12px; }
      #__next [class*="bg-stone-800"] { background:var(--wpo-surface) !important; }
      #__next [class*="bg-stone-700"] { background:var(--wpo-surface-2) !important; }
      #__next [class*="bg-stone-600"] { background:var(--wpo-surface-3) !important; border-color:var(--wpo-line-2) !important; }
      #__next [class*="border-stone-600"] { border-color:var(--wpo-line-2) !important; }
      #__next .text-amber-400, #__next .text-amber-300 { color:var(--wpo-accent) !important; }
      /* The mirror's own accent colours (red/blue headings) are the last bit of
         the old palette showing through the calculator panels. */
      #__next .text-red-500, #__next .text-red-400, #__next .text-orange-400 { color:var(--wpo-accent) !important; }
      #__next .text-blue-400, #__next .text-blue-300, #__next .text-sky-400 { color:var(--wpo-muted) !important; }
      #__next .text-stone-400, #__next .text-stone-500 { color:var(--wpo-muted) !important; }
      #__next input[type="range"] { accent-color:var(--wpo-accent); }
      #__next input[type="checkbox"] {
        -webkit-appearance:none !important; appearance:none !important; width:16px !important; height:16px !important; min-width:16px !important;
        border:1px solid var(--wpo-line-3) !important; border-radius:4px !important; background:var(--wpo-surface-2) !important; background-image:none !important;
        box-shadow:none !important; cursor:pointer; vertical-align:middle;
      }
      #__next input[type="checkbox"]:checked {
        border-color:var(--wpo-accent) !important; background-color:var(--wpo-accent) !important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%2314100a' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' d='M3.4 8.3l3 3 6.3-6.6'/%3E%3C/svg%3E") !important;
        background-position:center !important; background-repeat:no-repeat !important; background-size:12px 12px !important;
        box-shadow:none !important;
      }

      /* Page header, not an ornament. */
      #wpo-kraken-banner { position:relative; min-height:0; margin:0 0 24px; padding:8px 0 20px; overflow:visible; border:0; border-bottom:1px solid var(--wpo-line); border-radius:0; background:none; box-shadow:none; }
      #wpo-kraken-banner::before, #wpo-kraken-banner::after { content:none; }
      .wpo-banner-lights { display:none; }
      .wpo-banner-inner { min-height:0; display:flex; flex-direction:column; justify-content:flex-start; align-items:flex-start; text-align:left; padding:0; }
      .wpo-banner-kicker { color:var(--wpo-muted-2); font-size:11px; font-weight:500; letter-spacing:.2em; text-transform:uppercase; }
      .wpo-banner-title { margin-top:12px; font-family:var(--wpo-sans); font-size:clamp(26px,3.6vw,38px); line-height:1.1; font-weight:600; letter-spacing:-.03em; color:var(--wpo-text); text-shadow:none; }
      .wpo-banner-sub { margin-top:10px; color:var(--wpo-muted); font-size:13px; letter-spacing:0; text-transform:none; }
      .wpo-banner-link { position:absolute; right:0; top:8px; z-index:2; display:inline-flex; align-items:center; justify-content:center; min-height:30px; padding:0 12px; border:1px solid var(--wpo-line-2); border-radius:7px; background:transparent; color:var(--wpo-text-dim); font-size:12px; font-weight:500; letter-spacing:0; text-decoration:none; backdrop-filter:none; }
      .wpo-banner-link:hover { border-color:var(--wpo-line-3); background:var(--wpo-surface-2); color:var(--wpo-text); }

      #wpo-site-nav { position:sticky; top:0; z-index:80; display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 0 4px; padding:8px 0; border:0; border-bottom:1px solid var(--wpo-line); border-radius:0; background:rgba(12,13,14,.88); box-shadow:none; backdrop-filter:saturate(140%) blur(12px); }
      .wpo-nav-left,.wpo-nav-right { display:flex; align-items:center; gap:4px; }
      .wpo-nav-btn { height:32px; min-width:0; padding:0 12px; border:0; border-radius:7px; background:transparent; color:var(--wpo-muted); font-size:13px; font-weight:500; letter-spacing:0; cursor:pointer; transition:color .15s ease,background .15s ease; }
      .wpo-nav-btn:hover { color:var(--wpo-text); background:var(--wpo-surface-2); transform:none; }
      .wpo-nav-btn.is-active { color:var(--wpo-text); border:0; background:var(--wpo-surface-3); box-shadow:none; }
      .wpo-nav-lang { display:flex; overflow:hidden; border:1px solid var(--wpo-line); border-radius:7px; }
      .wpo-nav-lang button { width:34px; height:28px; border:0; background:transparent; color:var(--wpo-muted); font-size:11px; font-weight:600; cursor:pointer; }
      .wpo-nav-lang button:hover { color:var(--wpo-text); }
      .wpo-nav-lang button.is-active { background:var(--wpo-surface-3); color:var(--wpo-text); }

      #wpo-top-view { display:none; margin:0 0 16px; opacity:1; }
      #wpo-top-view.is-active { display:block; }
      .wpo-top-panel { overflow:hidden; border:1px solid var(--wpo-line); border-radius:12px; background:var(--wpo-surface); box-shadow:none; }
      .wpo-top-head { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:16px 18px; border-bottom:1px solid var(--wpo-line); }
      .wpo-top-head h2 { margin:0; color:var(--wpo-text); font:600 19px var(--wpo-sans); letter-spacing:-.01em; }
      .wpo-top-head p { margin:5px 0 0; color:var(--wpo-muted); font-size:12.5px; }
      .wpo-top-controls { display:flex; gap:8px; flex-wrap:wrap; }
      .wpo-top-controls input,.wpo-top-controls select { height:36px; min-width:170px; border:1px solid var(--wpo-line-2); border-radius:7px; background:var(--wpo-surface-2); color:var(--wpo-text); padding:0 11px; outline:none; font:400 13px var(--wpo-sans); }
      .wpo-top-controls input:focus,.wpo-top-controls select:focus { border-color:var(--wpo-accent); }
      .wpo-top-leaders { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; padding:16px 18px; border-bottom:1px solid var(--wpo-line); }
      .wpo-top-leader { min-height:0; padding:14px 15px; border:1px solid var(--wpo-line); border-radius:9px; background:transparent; }
      .wpo-top-leader strong { display:flex; align-items:center; gap:7px; color:var(--wpo-muted); font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.09em; }
      .wpo-top-leader img { width:15px; height:15px; opacity:.75; }
      .wpo-top-leader .value { margin-top:8px; font-size:22px; font-weight:600; letter-spacing:-.02em; color:var(--wpo-text); }
      .wpo-top-leader small { display:block; margin-top:6px; color:var(--wpo-muted-2); line-height:1.45; }
      .wpo-top-table-wrap { overflow:auto; }
      .wpo-top-table { width:100%; min-width:1040px; border-collapse:collapse; }
      .wpo-top-table th { position:sticky; top:0; z-index:2; padding:10px 12px; border-bottom:1px solid var(--wpo-line-2); background:var(--wpo-surface); color:var(--wpo-muted); text-align:left; font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; white-space:nowrap; }
      .wpo-top-table th:hover { color:var(--wpo-text); }
      .wpo-top-table td { padding:10px 12px; border-bottom:1px solid var(--wpo-line); font-size:13px; color:var(--wpo-text-dim); }
      .wpo-top-table tr:hover td { background:var(--wpo-surface-2); }
      .wpo-top-petcell { display:flex; align-items:center; gap:11px; min-width:210px; }
      .wpo-top-petcell img { width:34px; height:34px; border:1px solid var(--wpo-line); border-radius:7px; background:var(--wpo-surface-2); object-fit:cover; }
      .wpo-top-petcell b { color:var(--wpo-text); font-weight:500; }
      .wpo-top-rank { color:var(--wpo-muted); font-weight:500; }
      .wpo-top-best { color:var(--wpo-accent); font-weight:600; }
      .wpo-top-high { color:var(--wpo-text); font-weight:500; }
      .wpo-top-foot { padding:13px 18px; border-top:1px solid var(--wpo-line); color:var(--wpo-muted-2); font-size:11.5px; line-height:1.5; }

      #warpet-optimizer { margin:0 0 16px; border:1px solid var(--wpo-line); border-radius:12px; background:var(--wpo-surface); overflow:hidden; box-shadow:none; }
      #warpet-optimizer * { box-sizing:border-box; }
      .wpo-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; border-bottom:1px solid var(--wpo-line); background:none; }
      .wpo-title-wrap { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      .wpo-title { color:var(--wpo-text); font-family:var(--wpo-sans); font-size:19px; font-weight:600; letter-spacing:-.01em; }
      .wpo-badge { border:1px solid var(--wpo-line-2); background:transparent; color:var(--wpo-muted); border-radius:5px; padding:3px 8px; font-size:10.5px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; }
      .wpo-head-right { display:flex; align-items:center; justify-content:flex-end; gap:12px; flex-wrap:wrap; }
      .wpo-pet { color:var(--wpo-muted); font-size:13px; text-align:right; }
      .wpo-lang { display:flex; border:1px solid var(--wpo-line); border-radius:7px; overflow:hidden; background:transparent; }
      .wpo-lang button { height:28px; min-width:34px; border:0; background:transparent; color:var(--wpo-muted); font-size:11px; font-weight:600; cursor:pointer; }
      .wpo-lang button:hover { color:var(--wpo-text); }
      .wpo-lang button.is-active { background:var(--wpo-surface-3); color:var(--wpo-text); }
      .wpo-body { padding:18px; }
      .wpo-section-title { color:var(--wpo-muted); font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.13em; margin:0 0 12px; }
      .wpo-section-title:not(:first-child) { margin-top:22px; }
      .wpo-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
      .wpo-field label { display:block; color:var(--wpo-text-dim); font-size:12.5px; font-weight:500; margin:0 0 6px; }
      .wpo-field input,.wpo-field select { width:100%; height:36px; border:1px solid var(--wpo-line-2); border-radius:7px; background:var(--wpo-surface-2); color:var(--wpo-text); padding:0 11px; outline:none; box-shadow:none; font:400 13px var(--wpo-sans); }
      .wpo-field input:focus,.wpo-field select:focus { border-color:var(--wpo-accent); box-shadow:none; }
      .wpo-help { display:block; margin-top:6px; color:var(--wpo-muted-2); font-size:11px; line-height:1.45; }
      .wpo-general { border:1px solid var(--wpo-line); border-radius:9px; padding:14px; background:transparent; }
      .wpo-presets { margin:0 0 13px; padding:0 0 13px; border-bottom:1px solid var(--wpo-line); }
      .wpo-presets-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:9px; }
      .wpo-presets-title { color:var(--wpo-muted); font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.13em; }
      .wpo-presets-info { width:15px; height:15px; border:1px solid var(--wpo-line-2); border-radius:50%; color:var(--wpo-muted); display:inline-flex; align-items:center; justify-content:center; font:500 9px/1 var(--wpo-sans); cursor:help; }
      .wpo-presets-buttons { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .wpo-preset { min-height:28px; border:1px solid var(--wpo-line); border-radius:999px; background:transparent; color:var(--wpo-muted); padding:0 11px; font-size:12px; font-weight:500; cursor:pointer; transition:.15s ease; }
      .wpo-preset:hover { color:var(--wpo-text); background:transparent; border-color:var(--wpo-line-3); }
      .wpo-preset.is-active { color:var(--wpo-accent); border-color:rgba(216,180,93,.45); background:var(--wpo-accent-bg); box-shadow:none; }
      .wpo-counter { display:flex; align-items:flex-start; gap:10px; margin-top:12px; padding:12px 13px; border:1px solid var(--wpo-line); border-radius:9px; background:transparent; cursor:pointer; }
      .wpo-counter input { width:16px; height:16px; margin:2px 0 0; accent-color:var(--wpo-accent); flex:0 0 auto; }
      .wpo-counter-text { color:var(--wpo-text); font-size:13px; font-weight:500; line-height:1.35; }
      .wpo-counter-help { display:block; margin-top:4px; color:var(--wpo-muted); font-size:12px; font-weight:400; line-height:1.5; }
      .wpo-actions { display:flex; align-items:center; gap:10px; margin-top:18px; flex-wrap:wrap; }
      #wpo-run,#wpo-run-budget { min-width:170px; height:36px; border-radius:7px; font-weight:500; cursor:pointer; padding:0 16px; letter-spacing:0; font-size:13px; font-family:var(--wpo-sans); transition:border-color .15s,background .15s,color .15s; }
      #wpo-run { border:1px solid var(--wpo-accent); background:var(--wpo-accent); color:var(--wpo-accent-ink); font-weight:600; box-shadow:none; }
      #wpo-run:hover { background:#e6c472; border-color:#e6c472; filter:none; transform:none; }
      #wpo-run-budget { border:1px solid var(--wpo-line-2); background:transparent; color:var(--wpo-text-dim); box-shadow:none; }
      #wpo-run-budget:hover { color:var(--wpo-text); border-color:var(--wpo-line-3); background:var(--wpo-surface-2); filter:none; transform:none; }
      #wpo-run:disabled,#wpo-run-budget:disabled { cursor:wait; opacity:.45; transform:none; }
      #wpo-cancel { height:36px; border:1px solid var(--wpo-line-2); border-radius:7px; background:transparent; color:var(--wpo-text-dim); padding:0 14px; cursor:pointer; display:none; font:500 13px var(--wpo-sans); }
      #wpo-status { color:var(--wpo-muted); font-size:12.5px; min-height:20px; flex:1; line-height:1.5; }
      #wpo-result { margin-top:18px; display:none; border-top:1px solid var(--wpo-line); padding-top:16px; }
      .wpo-score { display:flex; flex-wrap:wrap; gap:10px 20px; color:var(--wpo-text-dim); margin-bottom:14px; font-size:12.5px; }
      .wpo-score b { color:var(--wpo-accent); font-weight:600; }
      .wpo-cost-chip { display:inline-flex; align-items:center; gap:5px; }
      .wpo-cost-chip img { width:15px; height:15px; object-fit:contain; }
      .wpo-skills { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
      .wpo-skill { min-height:52px; border:1px solid var(--wpo-line); border-radius:9px; background:transparent; padding:11px 12px; color:var(--wpo-text); font-size:12.5px; line-height:1.4; }
      .wpo-skill small { display:block; color:var(--wpo-muted); margin-top:5px; }
      .wpo-skill.is-amber { border-color:rgba(216,180,93,.35); box-shadow:none; }
      .wpo-note { color:var(--wpo-muted); font-size:12px; margin-top:14px; line-height:1.6; }
      .wpo-note strong { color:var(--wpo-text-dim); font-weight:500; }
      /* Pet picker of the mirrored builder: room for the portrait and for the
         longer Russian names, which used to wrap out of the control. */
      #__next [id^="react-select-"][id$="-placeholder"] { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #__next div[class*="css-"][class*="-menu"] { width:max-content; min-width:100%; max-width:320px; }
      @media (max-width:980px){ .wpo-top-leaders{grid-template-columns:repeat(3,1fr)} }
      @media (max-width:900px){ #__next section[class*="pt-2"][class*="pb-2"]{padding:16px 16px 40px !important}.wpo-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.wpo-skills{grid-template-columns:repeat(2,minmax(0,1fr));} }
      @media (max-width:650px){ #wpo-site-nav{position:relative;align-items:stretch}.wpo-nav-left{flex:1}.wpo-nav-btn{min-width:0;flex:1;padding:0 9px}.wpo-top-leaders{grid-template-columns:repeat(2,1fr)}.wpo-top-controls{width:100%}.wpo-top-controls input,.wpo-top-controls select{min-width:0;flex:1} .wpo-banner-link{position:static;margin-top:14px}.wpo-head{align-items:flex-start}.wpo-head-right{align-items:flex-end;flex-direction:column}.wpo-pet{text-align:right} }
      @media (max-width:520px){ .wpo-grid,.wpo-skills{grid-template-columns:1fr 1fr}.wpo-actions{align-items:stretch}#wpo-run,#wpo-run-budget,#wpo-cancel{width:100%}.wpo-head-right{gap:7px}.wpo-title{font-size:17px}.wpo-banner-title{font-size:28px} }
    `;
    document.head.appendChild(style);
  }

  function removeChangelog() {
    const labels = new Set(['Changelog', 'История изменений']);
    document.querySelectorAll('button, a').forEach(el => {
      if (!labels.has(el.textContent.trim())) return;
      const popover = el.closest('.relative[data-headlessui-state]') || el.closest('.relative');
      (popover || el).remove();
    });
  }

  function getWarpetMain() {
    return document.querySelector('#__next section[class*="pt-2"][class*="pb-2"]');
  }

  function createTopPetsView(main) {
    let view = document.getElementById('wpo-top-view');
    if (view) return view;
    view = document.createElement('div');
    view.id = 'wpo-top-view';
    view.innerHTML = `<div class="wpo-top-panel"><div class="wpo-top-head"><div><h2 id="wpo-top-title"></h2><p id="wpo-top-desc"></p></div><div class="wpo-top-controls"><input id="wpo-top-search"><select id="wpo-top-unit"></select><select id="wpo-top-sort"></select></div></div><div class="wpo-top-leaders" id="wpo-top-leaders"></div><div class="wpo-top-table-wrap"><table class="wpo-top-table"><thead id="wpo-top-thead"></thead><tbody id="wpo-top-tbody"></tbody></table></div><div class="wpo-top-foot" id="wpo-top-foot"></div></div>`;
    view.dataset.sort = 'Strength';
    view.dataset.dir = '-1';
    view.querySelector('#wpo-top-search').addEventListener('input', renderTopPetsRows);
    view.querySelector('#wpo-top-unit').addEventListener('change', renderTopPetsRows);
    view.querySelector('#wpo-top-sort').addEventListener('change', e => { view.dataset.sort=e.target.value; view.dataset.dir='-1'; renderTopPetsRows(); });
    main.appendChild(view);
    renderTopPetsView();
    return view;
  }

  function renderTopPetsView() {
    const view = document.getElementById('wpo-top-view');
    if (!view) return;
    const A = ATTRS;
    view.querySelector('#wpo-top-title').textContent = topT('title');
    view.querySelector('#wpo-top-desc').textContent = topT('desc');
    view.querySelector('#wpo-top-search').placeholder = topT('search');
    view.querySelector('#wpo-top-foot').textContent = topT('foot');
    view.dataset.lang = currentLang;
    const unit = view.querySelector('#wpo-top-unit');
    const unitValue = unit.value;
    const units = [...new Set(TOP_PETS_DATA.map(p => p.unit))].sort();
    unit.innerHTML = `<option value="">${esc(topT('all'))}</option>` + units.map(u => `<option value="${esc(u)}">${esc(unitLabel(u))}</option>`).join('');
    if (units.includes(unitValue)) unit.value = unitValue;
    const sortSel = view.querySelector('#wpo-top-sort');
    const wantedSort = view.dataset.sort || 'Strength';
    sortSel.innerHTML = A.map(a => `<option value="${a}">${esc(topT('attrs')[a])}</option>`).join('') + `<option value="Total">${esc(topT('total'))}</option>`;
    sortSel.value = wantedSort;
    const max = {};
    A.forEach(a => max[a] = Math.max(...TOP_PETS_DATA.map(p => Number(p['max'+a] || 0))));
    view.querySelector('#wpo-top-leaders').innerHTML = A.map(a => {
      const names = TOP_PETS_DATA.filter(p => Number(p['max'+a]) === max[a]).map(p => petNameLabel(p.name)).join(', ');
      return `<div class="wpo-top-leader"><strong><img src="/img/warpets/attributes/${a}.png" alt="">${esc(topT('attrs')[a])}</strong><div class="value">${max[a]}</div><small>${esc(names)}</small></div>`;
    }).join('');
    renderTopPetsRows();
  }

  function renderTopPetsRows() {
    const view = document.getElementById('wpo-top-view');
    if (!view) return;
    const A = ATTRS;
    const total = p => A.reduce((sum,a) => sum + Number(p['max'+a] || 0), 0);
    const max = {};
    A.forEach(a => max[a] = Math.max(...TOP_PETS_DATA.map(p => Number(p['max'+a] || 0))));
    const needle = view.querySelector('#wpo-top-search').value.trim().toLowerCase();
    const unit = view.querySelector('#wpo-top-unit').value;
    const sort = view.dataset.sort || 'Strength';
    const dir = Number(view.dataset.dir || -1);
    let rows = TOP_PETS_DATA.filter(p => (!needle || p.name.toLowerCase().includes(needle) || petNameLabel(p.name).toLowerCase().includes(needle)) && (!unit || p.unit === unit));
    rows.sort((a,b) => {
      const av = sort === 'Total' ? total(a) : Number(a['max'+sort] || 0);
      const bv = sort === 'Total' ? total(b) : Number(b['max'+sort] || 0);
      return (av-bv)*dir || petNameLabel(a.name).localeCompare(petNameLabel(b.name));
    });
    view.querySelector('#wpo-top-thead').innerHTML = `<tr><th>${esc(topT('rank'))}</th><th>${esc(topT('pet'))}</th><th>${esc(topT('type'))}</th><th>${esc(topT('unit'))}</th>${A.map(a => `<th data-top-sort="${a}">${esc(topT('attrs')[a])}${sort===a?(dir<0?' ↓':' ↑'):''}</th>`).join('')}<th data-top-sort="Total">${esc(topT('total'))}${sort==='Total'?(dir<0?' ↓':' ↑'):''}</th></tr>`;
    view.querySelector('#wpo-top-tbody').innerHTML = rows.length ? rows.map((p,i) => `<tr><td class="wpo-top-rank">#${i+1}</td><td><div class="wpo-top-petcell"><img src="/img/warpets/portrait/${encodeURIComponent(p.name)}.png" alt=""><b>${esc(petNameLabel(p.name))}</b></div></td><td>${esc(damageTypeLabel(p.type))}</td><td>${esc(unitLabel(p.unit))}</td>${A.map(a => { const v=Number(p['max'+a]||0); const cls=v===max[a]?'wpo-top-best':v>=321?'wpo-top-high':''; return `<td class="${cls}">${v}</td>`; }).join('')}<td>${total(p)}</td></tr>`).join('') : `<tr><td colspan="11" style="padding:30px;text-align:center;color:#8aa7a5">—</td></tr>`;
    view.querySelectorAll('th[data-top-sort]').forEach(th => th.onclick = () => {
      const next = th.dataset.topSort;
      if (view.dataset.sort === next) view.dataset.dir = String(-Number(view.dataset.dir || -1));
      else { view.dataset.sort = next; view.dataset.dir = '-1'; view.querySelector('#wpo-top-sort').value = next; }
      renderTopPetsRows();
    });
  }

  function setAppView(view, animate = true) {
    if (view !== 'builder' && view !== 'top') return;
    const main = getWarpetMain();
    if (!main) return;
    currentView = view;
    const topView = createTopPetsView(main);
    main.querySelectorAll('[data-wpo-builder-section="1"]').forEach(el => { el.style.display = view === 'builder' ? '' : 'none'; });
    topView.classList.toggle('is-active', view === 'top');
    document.querySelectorAll('[data-wpo-view]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.wpoView === view));
    const title = document.querySelector('.wpo-banner-title');
    const sub = document.querySelector('.wpo-banner-sub');
    if (title) title.textContent = view === 'top' ? topT('heroTop') : topT('heroBuilder');
    if (sub) sub.textContent = view === 'top' ? topT('heroTopSub') : topT('heroBuilderSub');
    if (view === 'top' && (animate || topView.dataset.lang !== currentLang || !topView.dataset.rendered)) renderTopPetsView();
    topView.dataset.rendered = '1';
    if (animate && main.animate) main.animate([{opacity:.38,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
    if (animate) window.scrollTo({top:0,behavior:'smooth'});
  }

  function applyKrakenShell() {
    const root = document.getElementById('__next');
    const main = getWarpetMain();
    if (!root || !main) return;
    root.querySelectorAll('nav, aside').forEach(el => { el.style.display = 'none'; });
    removeChangelog();

    // Mark only the original React sections as builder content. Custom SPA blocks stay visible as needed.
    [...main.children].forEach(el => {
      if (!['wpo-site-nav','wpo-kraken-banner','wpo-top-view'].includes(el.id)) el.dataset.wpoBuilderSection = '1';
    });

    let nav = document.getElementById('wpo-site-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'wpo-site-nav';
      nav.innerHTML = `<div class="wpo-nav-left"><button class="wpo-nav-btn" type="button" data-wpo-view="builder"></button><button class="wpo-nav-btn" type="button" data-wpo-view="top"></button></div><div class="wpo-nav-right"><div class="wpo-nav-lang"><button type="button" data-nav-lang="en">EN</button><button type="button" data-nav-lang="ru">RU</button></div></div>`;
      nav.querySelectorAll('[data-wpo-view]').forEach(btn => btn.addEventListener('click', () => setAppView(btn.dataset.wpoView)));
      nav.querySelectorAll('[data-nav-lang]').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.navLang)));
      main.insertBefore(nav, main.firstChild);
    }

    const title = [...root.querySelectorAll('h1')].find(el => ['War Pet Builder','Конструктор питомцев'].includes(el.textContent.trim()));
    const titleSection = title?.closest('section');
    if (titleSection) titleSection.style.display = 'none';

    let banner = document.getElementById('wpo-kraken-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wpo-kraken-banner';
      banner.innerHTML = `<div class="wpo-banner-inner"><div class="wpo-banner-kicker">CALL OF DRAGONS</div><div class="wpo-banner-title"></div><div class="wpo-banner-sub"></div></div><div class="wpo-banner-lights"></div>`;
    }
    if (banner.parentElement !== main) main.insertBefore(banner, nav.nextSibling);
    else if (banner.previousElementSibling !== nav) main.insertBefore(banner, nav.nextSibling);

    createTopPetsView(main);
    renderShellLanguage();
    setAppView(currentView, false);
  }

  function renderShellLanguage() {
    const nav = document.getElementById('wpo-site-nav');
    if (nav) {
      const builder = nav.querySelector('[data-wpo-view="builder"]');
      const top = nav.querySelector('[data-wpo-view="top"]');
      if (builder) builder.textContent = topT('builder');
      if (top) top.textContent = topT('top');
      nav.querySelectorAll('[data-nav-lang]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.navLang === currentLang));
      nav.querySelectorAll('[data-wpo-view]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.wpoView === currentView));
    }
    const title = document.querySelector('.wpo-banner-title');
    const sub = document.querySelector('.wpo-banner-sub');
    if (title) title.textContent = currentView === 'top' ? topT('heroTop') : topT('heroBuilder');
    if (sub) sub.textContent = currentView === 'top' ? topT('heroTopSub') : topT('heroBuilderSub');
    const topView = document.getElementById('wpo-top-view');
    if (topView && topView.dataset.lang !== currentLang) renderTopPetsView();
  }

  function createPanel() {
    if (document.getElementById('warpet-optimizer')) return document.getElementById('warpet-optimizer');
    const panel = document.createElement('div');
    panel.id = 'warpet-optimizer';
    panel.innerHTML = `
      <div class="wpo-head">
        <div class="wpo-title-wrap"><div class="wpo-title" data-wpo-i18n="title"></div><span class="wpo-badge" data-wpo-i18n="badge"></span></div>
        <div class="wpo-head-right">
          <div class="wpo-lang" aria-label="Language"><button type="button" data-lang="en">EN</button><button type="button" data-lang="ru">RU</button></div>
          <div class="wpo-pet" id="wpo-pet"></div>
        </div>
      </div>
      <div class="wpo-body">
        <div class="wpo-section-title" data-wpo-i18n="petStats"></div>
        <div class="wpo-grid">
          ${ATTRS.map(a => `<div class="wpo-field"><label data-attr-label="${a}"></label><input data-stat="${a}" type="number" min="0" step="1"></div>`).join('')}
          <div class="wpo-field"><label data-wpo-i18n="skillSlots"></label><input id="wpo-slots" type="number" min="1" max="8" step="1" value="8"></div>
          <div class="wpo-field"><label data-wpo-i18n="skillLevel"></label><select id="wpo-tier"><option value="0">1</option><option value="1">2</option><option value="2">3</option><option value="3" selected>4</option></select></div>
        </div>
        <div class="wpo-section-title" data-wpo-i18n="combatSettings"></div>
        <div class="wpo-general">
          <div class="wpo-presets">
            <div class="wpo-presets-head"><span class="wpo-presets-title" data-wpo-i18n="presets"></span><span class="wpo-presets-info" data-wpo-i18n-title="presetsHelp">i</span></div>
            <div class="wpo-presets-buttons">
              <button class="wpo-preset" type="button" data-wpo-preset="duel" data-wpo-i18n="presetDuel" data-wpo-i18n-title="presetDuelHelp"></button>
              <button class="wpo-preset" type="button" data-wpo-preset="field" data-wpo-i18n="presetField" data-wpo-i18n-title="presetFieldHelp"></button>
              <button class="wpo-preset" type="button" data-wpo-preset="aoe" data-wpo-i18n="presetAoe" data-wpo-i18n-title="presetAoeHelp"></button>
              <button class="wpo-preset" type="button" data-wpo-preset="swarm" data-wpo-i18n="presetSwarm" data-wpo-i18n-title="presetSwarmHelp"></button>
            </div>
          </div>
          <div class="wpo-grid">
            <div class="wpo-field"><label data-wpo-i18n="targets"></label><input id="wpo-targets" type="number" min="1" max="100" step="1" value="1"></div>
            <div class="wpo-field"><label data-wpo-i18n="attackers"></label><input id="wpo-attackers" type="number" min="0" max="50" step="1" value="0"></div>
            <div class="wpo-field"><label data-wpo-i18n="cycleDuration"></label><input id="wpo-cycle" type="number" min="1" max="60" step="1" value="10"></div>
            <div class="wpo-field"><label data-wpo-i18n="petCoinBudget"></label><input id="wpo-budget" type="number" min="0" max="1000000000" step="1000" value="1000000"><small class="wpo-help" data-wpo-i18n="budgetHelp"></small></div>
          </div>
          <label class="wpo-counter">
            <input id="wpo-counterattack" type="checkbox">
            <span class="wpo-counter-text"><span data-wpo-i18n="counterattack"></span><small class="wpo-counter-help" data-wpo-i18n="counterattackHelp"></small></span>
          </label>
        </div>
        <div class="wpo-actions">
          <button id="wpo-run" type="button"></button>
          <button id="wpo-run-budget" type="button"></button>
          <button id="wpo-cancel" type="button"></button>
          <div id="wpo-status"></div>
        </div>
        <div id="wpo-result"></div>
        <div class="wpo-note"><strong data-wpo-i18n="noteStrong"></strong> <span data-wpo-i18n="note"></span> <span data-wpo-i18n="attributeLimit"></span></div>
      </div>`;

    const skillsHeadingNames = new Set(['Skills', 'Навыки']);
    const h2 = [...document.querySelectorAll('h2')].find(x => skillsHeadingNames.has(x.textContent.trim()));
    const skillsCard = h2?.closest('.flex.border') || h2?.parentElement?.parentElement;
    if (skillsCard?.parentElement) skillsCard.parentElement.insertBefore(panel, skillsCard);
    else (document.querySelector('main, section') || document.getElementById('__next'))?.prepend(panel);

    panel.querySelector('#wpo-run').addEventListener('click', runOptimizer);
    panel.querySelector('#wpo-run-budget').addEventListener('click', runBudgetOptimizer);
    panel.querySelector('#wpo-cancel').addEventListener('click', () => { runToken++; setBusy(false); setStatus(t('cancelled')); });
    for (const id of ['wpo-targets','wpo-attackers','wpo-cycle']) {
      panel.querySelector(`#${id}`)?.addEventListener('change', () => {
        pushGeneralToOriginal();
        updatePresetActiveState();
      });
      panel.querySelector(`#${id}`)?.addEventListener('input', updatePresetActiveState);
    }
    panel.querySelectorAll('[data-wpo-preset]').forEach(button => {
      button.addEventListener('click', () => applyCombatPreset(button.dataset.wpoPreset));
    });
    panel.querySelectorAll('[data-lang]').forEach(button => {
      button.addEventListener('click', () => setLanguage(button.dataset.lang));
    });

    renderPanelLanguage();
    return panel;
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ru') return;
    currentLang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {}
    document.documentElement.lang = lang;
    translateOriginalSite();
    decoratePetSelect();
    renderPanelLanguage();
    syncFromApi(true);

    // Re-render an existing optimizer result in the selected language.
    const result = document.getElementById('wpo-result');
    if (result?.dataset.hasResult === '1' && window.__wpoLastResult) {
      const r = window.__wpoLastResult;
      renderResult(r.best, r.tier, r.checked, r.candidates, r.general, r.mode || 'fixed');
    }
  }

  function renderPanelLanguage() {
    const panel = document.getElementById('warpet-optimizer');
    if (!panel) return;
    panel.querySelectorAll('[data-wpo-i18n]').forEach(el => {
      const key = el.dataset.wpoI18n;
      const value = t(key);
      if (typeof value === 'string') el.textContent = value;
    });
    panel.querySelectorAll('[data-wpo-i18n-title]').forEach(el => {
      const value = t(el.dataset.wpoI18nTitle);
      if (typeof value === 'string') el.title = value;
    });
    updatePresetActiveState();
    panel.querySelectorAll('[data-attr-label]').forEach(el => { el.textContent = attributeLabel(el.dataset.attrLabel); });
    panel.querySelectorAll('[data-lang]').forEach(button => button.classList.toggle('is-active', button.dataset.lang === currentLang));
    renderShellLanguage();
    const maxOption = panel.querySelector('#wpo-tier option[value="3"]');
    if (maxOption) maxOption.textContent = `4 (${t('max')})`;
    const run = panel.querySelector('#wpo-run');
    const budgetRun = panel.querySelector('#wpo-run-budget');
    const cancel = panel.querySelector('#wpo-cancel');
    if (run && !run.disabled) run.textContent = t('bestBuild');
    if (budgetRun && !budgetRun.disabled) budgetRun.textContent = t('bestForBudget');
    if (cancel) cancel.textContent = t('cancel');
    const status = panel.querySelector('#wpo-status');
    if (status && !status.dataset.touched) status.textContent = t('introStatus');
  }

  function translateOriginalSite() {
    const toRu = currentLang === 'ru';
    const map = toRu ? SITE_TRANSLATIONS : SITE_TRANSLATIONS_REVERSE;
    const root = document.getElementById('__next') || document.body;
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement?.closest('#warpet-optimizer')) continue;
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      if (!trimmed || !map[trimmed]) continue;
      const left = raw.match(/^\s*/)?.[0] || '';
      const right = raw.match(/\s*$/)?.[0] || '';
      node.nodeValue = left + map[trimmed] + right;
    }

    if (toRu) {
      if (document.title === 'War Pet Builder - CoD DB') document.title = SITE_TRANSLATIONS['War Pet Builder - CoD DB'];
    } else if (document.title === SITE_TRANSLATIONS['War Pet Builder - CoD DB']) {
      document.title = 'War Pet Builder - CoD DB';
    }
  }

  /**
   * The pet dropdown of the mirrored builder renders bare option labels: no
   * portrait, an English placeholder and English unit group headings even in the
   * Russian UI. Decorate it in place — portraits as CSS backgrounds rather than
   * extra DOM nodes, so React keeps owning the elements it rendered.
   */
  function decoratePetSelect() {
    const wantPlaceholder = PET_PLACEHOLDER[currentLang] || PET_PLACEHOLDER.en;
    document.querySelectorAll('[id^="react-select-"][id$="-placeholder"]').forEach(el => {
      const text = el.textContent.trim();
      if (text === wantPlaceholder) return;
      if (text === PET_PLACEHOLDER.en || text === PET_PLACEHOLDER.ru) el.textContent = wantPlaceholder;
    });

    // Group headings ("Cavalry", "Marksman", …) sit next to their unit icon.
    document.querySelectorAll('img[src*="icons/units/"]').forEach(icon => {
      const file = (icon.getAttribute('src') || '').split('/').pop() || '';
      const unit = decodeURIComponent(file).replace(/\.png$/i, '');
      if (!unit || !UNIT_RU[unit]) return;
      const label = icon.parentElement?.querySelector('span');
      if (!label) return;
      const current = label.textContent.trim();
      if (!UNIT_LABELS.has(current.toLowerCase())) return;
      const want = unitLabel(unit);
      if (current !== want) label.textContent = want;
    });

    // Options only: the chosen pet already gets its full portrait under the control,
    // and the control is too narrow to carry an icon without clipping the name.
    document.querySelectorAll('[role="option"]').forEach(host => {
      const label = host.querySelector('div') || host;
      const pet = PET_BY_LABEL.get(label.textContent.trim().toLowerCase());
      if (!pet) return;
      const url = petPortraitUrl(pet);
      if (label.dataset.wpoPetIcon === url) return;
      label.dataset.wpoPetIcon = url;
      label.style.setProperty('background-image', `url("${url}")`);
      label.style.setProperty('background-repeat', 'no-repeat');
      label.style.setProperty('background-size', '22px 22px');
      label.style.setProperty('background-position', 'left center');
      label.style.setProperty('padding-left', '28px');
      label.style.setProperty('min-height', '24px');
      label.style.setProperty('align-items', 'center');
    });
  }

  /* react-select builds its menu only while it is open, so a 350ms poll would show
     a bare list first. Watch the DOM instead and decorate within the same frame. */
  function watchPetSelect() {
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; decoratePetSelect(); });
    });
    observer.observe(document.getElementById('__next') || document.body, { childList: true, subtree: true });
  }

  function apiReady() { return window.__warpetOptimizerAPI && Array.isArray(window.__warpetOptimizerAPI.skills); }

  function isAmberSkill(skill) {
    const costs = Array.isArray(skill?.costs) ? skill.costs.map(Number).filter(Number.isFinite) : [];
    return costs.length > 0 && costs.every(cost => cost > 0 && cost <= 4);
  }

  function skillCoinCost(skill) {
    const cost = Number(skill?.costs?.[Number(skill?.tier) || 0]);
    return Number.isFinite(cost) && cost > 4 ? cost : 0;
  }

  function skillAmberCost(skill) {
    const cost = Number(skill?.costs?.[Number(skill?.tier) || 0]);
    return Number.isFinite(cost) && cost > 0 && cost <= 4 ? cost : 0;
  }

  function buildCosts(skills) {
    return (skills || []).reduce((out, skill) => {
      out.coin += skillCoinCost(skill);
      out.amber += skillAmberCost(skill);
      return out;
    }, {coin:0, amber:0});
  }

  function enforceAmberSkillLevels(api) {
    if (!Array.isArray(api?.currentSkills) || !api?.applyBuild) return;
    let changed = false;
    const normalized = api.currentSkills.map(skill => {
      if (!skill || !isAmberSkill(skill) || Number(skill.tier) === 3) return skill;
      changed = true;
      return {...skill, tier:3};
    });
    if (changed) api.applyBuild(normalized);
  }

  function enforceLockedFirstSkill(api) {
    if (!api?.pet || !Array.isArray(api.skills) || !Array.isArray(api.currentSkills)) return;
    const innate = api.skills.find(s => s.petExclusive === api.pet.name && s.talent);
    if (!innate) return;
    const current = api.currentSkills[0];
    if (current?.name === innate.name) return;
    const tier = Number.isFinite(Number(current?.tier)) ? Number(current.tier) : 0;
    api.applyBuild([{...innate, tier}, ...api.currentSkills.slice(1)]);
  }

  function readNumberBesideLabel(labelTexts) {
    const wanted = Array.isArray(labelTexts) ? labelTexts : [labelTexts];
    const labels = [...document.querySelectorAll('span')];
    const label = labels.find(el => wanted.includes(el.textContent.trim()));
    const input = label?.parentElement?.querySelector('input[type="number"]');
    const n = Number(input?.value);
    return Number.isFinite(n) ? n : null;
  }

  function readGeneralFromPage(api) {
    return {
      targets: readNumberBesideLabel(['Targets:', 'Цели:']) ?? Number(api?.targets ?? 1),
      attackers: readNumberBesideLabel(['Attackers:', 'Атакующие:']) ?? Number(api?.attackers ?? 0),
      cycleDuration: readNumberBesideLabel(['Cycle Duration:', 'Длительность цикла:']) ?? Number(api?.cycleDuration ?? 10)
    };
  }

  function syncGeneralInputs(api, force = false) {
    const panel = document.getElementById('warpet-optimizer');
    if (!panel) return;
    const g = readGeneralFromPage(api);
    const pairs = [['wpo-targets',g.targets],['wpo-attackers',g.attackers],['wpo-cycle',g.cycleDuration]];
    for (const [id, value] of pairs) {
      const input = panel.querySelector(`#${id}`);
      if (!input) continue;
      if (force || document.activeElement !== input) input.value = value;
    }
  }

  function apiStatsSignature(api) {
    return ATTRS.map(a => Number(api?.stats?.[a] ?? 0)).join('|');
  }

  function scheduleAutoRecalculate() {
    const previous = window.__wpoLastResult;
    if (!previous || !document.getElementById('warpet-optimizer')) return;
    clearTimeout(autoRecalcTimer);
    if (optimizerBusy) {
      runToken++;
      setBusy(false);
    }
    setStatus(t('autoRecalculating'));
    autoRecalcTimer = setTimeout(() => {
      const last = window.__wpoLastResult;
      if (!last) return;
      if (last.mode === 'budget') runBudgetOptimizer();
      else runOptimizer();
    }, 650);
  }

  function syncFromApi(force = false) {
    const api = window.__warpetOptimizerAPI;
    const panel = document.getElementById('warpet-optimizer');
    if (!api || !panel) return;
    enforceAmberSkillLevels(api);
    enforceLockedFirstSkill(api);
    const petName = api.pet?.name ? petNameLabel(api.pet.name) : t('selectPet');
    const petChanged = lastPetName !== api.pet?.name;
    panel.querySelector('#wpo-pet').textContent = `${t('pet')}: ${petName}`;

    const signature = apiStatsSignature(api);
    const statsChanged = !!lastApiStatsSignature && signature !== lastApiStatsSignature;
    if (force || petChanged || statsChanged) {
      ATTRS.forEach(a => {
        const input = panel.querySelector(`[data-stat="${a}"]`);
        if (input && Number.isFinite(Number(api.stats?.[a])) && (force || petChanged || document.activeElement !== input)) input.value = Number(api.stats[a]);
      });
    }

    const externalSliderChange = !force && !petChanged && statsChanged && Date.now() > suppressAutoRecalcUntil;
    lastApiStatsSignature = signature;
    lastPetName = api.pet?.name || null;
    syncGeneralInputs(api, force);
    if (externalSliderChange) scheduleAutoRecalculate();
  }

  function originalGeneralSettings(general) {
    return {
      targets: general.targets,
      attackers: general.attackers,
      cycleDuration: general.cycleDuration
    };
  }

  function updatePresetActiveState() {
    const panel = document.getElementById('warpet-optimizer');
    if (!panel) return;
    const current = {
      targets: Number(panel.querySelector('#wpo-targets')?.value),
      attackers: Number(panel.querySelector('#wpo-attackers')?.value),
      cycleDuration: Number(panel.querySelector('#wpo-cycle')?.value)
    };
    panel.querySelectorAll('[data-wpo-preset]').forEach(button => {
      const preset = COMBAT_PRESETS.find(item => item.id === button.dataset.wpoPreset);
      const active = !!preset &&
        current.targets === preset.settings.targets &&
        current.attackers === preset.settings.attackers &&
        current.cycleDuration === preset.settings.cycleDuration;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyCombatPreset(id) {
    const preset = COMBAT_PRESETS.find(item => item.id === id);
    const panel = document.getElementById('warpet-optimizer');
    if (!preset || !panel) return;
    const fields = [
      ['#wpo-targets', preset.settings.targets],
      ['#wpo-attackers', preset.settings.attackers],
      ['#wpo-cycle', preset.settings.cycleDuration]
    ];
    for (const [selector, value] of fields) {
      const input = panel.querySelector(selector);
      if (input) input.value = value;
    }
    updatePresetActiveState();
    pushGeneralToOriginal();
    if (window.__wpoLastResult) scheduleAutoRecalculate();
  }

  function pushGeneralToOriginal() {
    const api = window.__warpetOptimizerAPI;
    if (!api?.setGeneralSettings) return;
    api.setGeneralSettings(originalGeneralSettings(getGeneralSettings()));
  }

  function setBusy(busy, mode = 'fixed') {
    optimizerBusy = !!busy;
    const run = document.getElementById('wpo-run');
    const budgetRun = document.getElementById('wpo-run-budget');
    const cancel = document.getElementById('wpo-cancel');
    if (run) { run.disabled = busy; run.textContent = busy && mode === 'fixed' ? t('calculating') : t('bestBuild'); }
    if (budgetRun) { budgetRun.disabled = busy; budgetRun.textContent = busy && mode === 'budget' ? t('budgetCalculating') : t('bestForBudget'); }
    if (cancel) cancel.style.display = busy ? 'inline-block' : 'none';
  }

  function setStatus(text) {
    const el = document.getElementById('wpo-status');
    if (el) {
      el.dataset.touched = '1';
      el.textContent = text;
    }
  }

  function getStats() {
    const panel = document.getElementById('warpet-optimizer');
    const stats = {};
    for (const a of ATTRS) {
      const v = Number(panel.querySelector(`[data-stat="${a}"]`).value);
      stats[a] = Number.isFinite(v) ? Math.max(0, v) : 0;
    }
    return stats;
  }

  function getGeneralSettings() {
    const panel = document.getElementById('warpet-optimizer');
    const clamp = (n, min, max, fallback) => Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : fallback;
    return {
      targets: clamp(panel.querySelector('#wpo-targets')?.value, 1, 100, 1),
      attackers: clamp(panel.querySelector('#wpo-attackers')?.value, 0, 50, 0),
      cycleDuration: clamp(panel.querySelector('#wpo-cycle')?.value, 1, 60, 10),
      budget: Math.round(clamp(panel.querySelector('#wpo-budget')?.value, 0, 1000000000, 1000000)),
      counterattack: !!panel.querySelector('#wpo-counterattack')?.checked
    };
  }

  function compatible(skill, pet) {
    if (!pet) return false;
    if (skill.petExclusive && skill.petExclusive !== pet.name) return false;
    return skill.type === pet.type || skill.type === 'Overall' ||
      (pet.type === 'Overall' && skill.type === 'Physical') ||
      (pet.type === 'Overall' && skill.type === 'Magic' && skill.category === 'Legion');
  }

  function getLockedSkill(api, tier) {
    if (!api?.pet) return null;
    const innate = (api.skills || []).find(s => s.petExclusive === api.pet.name && s.talent);
    return innate ? {...innate, tier} : null;
  }

  function belongsToCounterstrikeChain(skill, byName, seen = new Set()) {
    if (!skill || seen.has(skill.name)) return false;
    seen.add(skill.name);
    if (/counterstrike/i.test(skill.name || '')) return true;
    if (!skill.dependency) return false;
    if (/counterstrike/i.test(skill.dependency)) return true;
    return belongsToCounterstrikeChain(byName.get(skill.dependency), byName, seen);
  }

  function getCandidates(api, tier, lockedSkill, allowCounterattack) {
    const all = api.skills;
    const byName = new Map(all.map(s => [s.name, s]));
    const seenNames = new Set();
    return all
      .filter(s => compatible(s, api.pet))
      .filter(s => !lockedSkill || s.name !== lockedSkill.name)
      .filter(s => s.category === 'Warpet' || (s.dependency && byName.get(s.dependency)?.category === 'Warpet'))
      .filter(s => allowCounterattack || !belongsToCounterstrikeChain(s, byName))
      // Some pets' innate talent shares its name with the base skill of its own
      // upgrade chain (e.g. Windweasel's "North Wind"), and the source skill
      // list can otherwise carry more than one entry per name. Without this,
      // the exhaustive search can pick the same skill name into two different
      // slots — a build the original page can't actually represent, which is
      // why re-selecting either of those slots afterwards shows no options.
      .filter(s => (seenNames.has(s.name) ? false : (seenNames.add(s.name), true)))
      .map(s => ({...s, tier: isAmberSkill(s) ? 3 : tier}));
  }

  function withConditionalDefaults(api, skills) {
    const out = {...(api.conditionalValues || {})};
    for (const skill of skills) {
      for (const field of (skill.conditionalFields || [])) {
        if (out[field.key] !== undefined) continue;
        if (field.type === 'hero') out[field.key] = (api.heroes || []).find(h => h.name === field.default) || field.default;
        else out[field.key] = field.default ?? (field.type === 'boolean' || field.type === 'checkbox' ? false : 0);
      }
    }
    return out;
  }

  function dependenciesSatisfied(skills) {
    const names = new Set(skills.map(s => s.name));
    return skills.every(s => !s.dependency || names.has(s.dependency));
  }

  function attributeLimitSatisfied(skills) {
    const counts = new Map();
    for (const skill of skills) {
      const attr = String(skill?.attribute || '').trim();
      if (!attr) continue;
      const next = (counts.get(attr) || 0) + 1;
      if (next > MAX_SKILLS_PER_ATTRIBUTE) return false;
      counts.set(attr, next);
    }
    return true;
  }

  function renderResult(best, tier, checked, candidates, general, mode = 'fixed') {
    const result = document.getElementById('wpo-result');
    if (!best) {
      result.style.display = 'block';
      result.dataset.hasResult = '0';
      result.innerHTML = `<div style="color:#f08c82">${esc(mode === 'budget' ? t('budgetTooLow')(general.budget) : t('noValid'))}</div>`;
      return;
    }
    const locked = best.skills[0];
    const sorted = [locked, ...best.skills.slice(1).sort((a,b) => {
      const ar = a.dependency || a.name, br = b.dependency || b.name;
      return ar.localeCompare(br) || Number(!!a.dependency)-Number(!!b.dependency) || a.name.localeCompare(b.name);
    })].filter(Boolean);
    const dps = best.totalDamage / Math.max(1, Number(general.cycleDuration));
    const costs = best.costs || buildCosts(best.skills);
    result.style.display = 'block';
    result.dataset.hasResult = '1';
    result.innerHTML = `
      <div class="wpo-score">
        <span>${esc(t('damageFactor'))}: <b>${fmt(best.totalDamage)}</b></span>
        <span>${esc(t('dps'))}: <b>${fmt(dps)}</b></span>
        <span>${esc(t('targets'))}: <b>${fmt(general.targets)}</b></span>
        <span>${esc(t('attackers'))}: <b>${fmt(general.attackers)}</b></span>
        <span>${esc(t('cycle'))}: <b>${fmt(general.cycleDuration)}s</b></span>
        <span class="wpo-cost-chip">${esc(t('spent'))}: <b>${costs.coin.toLocaleString(locale())}</b><img src="/img/warpets/petCoin.png" alt="Pet Coin"></span>
        ${costs.amber ? `<span class="wpo-cost-chip"><b>${costs.amber.toLocaleString(locale())}</b><img src="/img/warpets/amber.png" alt="Amber"> ${esc(t('amberCost'))}</span>` : ''}
        ${mode === 'budget' ? `<span>${esc(t('petCoinBudget'))}: <b>${Number(general.budget).toLocaleString(locale())}</b></span>` : ''}
        <span>${esc(general.counterattack ? t('counterOn') : t('counterOff'))}</span>
        <span>${esc(t('checked'))}: <b>${checked.toLocaleString(locale())}</b> ${esc(t('validBuilds'))}</span>
        <span>${esc(t('candidates'))}: <b>${candidates}</b></span>
      </div>
      <div class="wpo-skills">${sorted.map((s, i) => `<div class="wpo-skill${isAmberSkill(s) ? ' is-amber' : ''}">${esc(s.name)}${i === 0 ? ' 🔒' : ''}<small>${esc(attributeLabel(s.attribute || ''))} · Lv.${Number(s.tier)+1}${isAmberSkill(s) ? ` · ${esc(t('amberCost'))}` : ''}${i === 0 ? ` · ${esc(t('innateLocked'))}` : (s.dependency ? ` · ${esc(t('modifies'))} ${esc(s.dependency)}` : '')}</small></div>`).join('')}</div>`;
  }

  async function runOptimizer() {
    const api = window.__warpetOptimizerAPI;
    if (!apiReady() || !api.pet) { setStatus(t('selectPetFirst')); return; }

    // Read the actual original calculator inputs immediately before the search.
    syncGeneralInputs(api, true);

    const panel = document.getElementById('warpet-optimizer');
    const stats = getStats();
    const general = getGeneralSettings();
    const slots = Math.min(8, Math.max(1, Number(panel.querySelector('#wpo-slots').value) || 8));
    const tier = Math.min(3, Math.max(0, Number(panel.querySelector('#wpo-tier').value) || 0));
    panel.querySelector('#wpo-slots').value = slots;

    const lockedSkill = getLockedSkill(api, tier);
    if (!lockedSkill) { setStatus(t('noInnate')); return; }
    const selectableSlots = Math.max(0, slots - 1);
    const candidates = getCandidates(api, tier, lockedSkill, general.counterattack);
    if (selectableSlots > candidates.length) { setStatus(t('onlyCandidates')(candidates.length)); return; }

    const token = ++runToken;
    setBusy(true, 'fixed');
    setStatus(t('testing')(general.targets, general.attackers, lockedSkill.name));
    document.getElementById('wpo-result').style.display = 'none';

    let best = null;
    let checked = 0;
    let raw = 0;
    const totalCandidates = candidates.length;
    const yieldEvery = totalCandidates >= 20 ? 1000 : 2500;
    const idx = Array.from({length: selectableSlots}, (_, i) => i);

    while (true) {
      if (token !== runToken) break;
      raw++;
      const selected = idx.map(i => candidates[i]);
      const combo = [lockedSkill, ...selected];

      // The original builder accepts at most three skills tied to the same stat.
      // Reject impossible combinations before the expensive damage calculation.
      if (attributeLimitSatisfied(combo) && dependenciesSatisfied(combo)) {
        const cond = withConditionalDefaults(api, combo);
        let calc = null;
        try { calc = api.calculate(combo, stats, cond, general); } catch (e) { /* invalid conditional combo */ }
        const damage = Number(calc?.totalDamage);
        if (Number.isFinite(damage)) {
          checked++;
          if (!best || damage > best.totalDamage) best = {totalDamage: damage, skills: combo, calc, cond, costs: buildCosts(combo)};
        }
      }

      if (raw % yieldEvery === 0) {
        setStatus(t('progress')(general.targets, general.attackers, checked, raw));
        await sleepFrame();
      }

      let pos = selectableSlots - 1;
      while (pos >= 0 && idx[pos] === totalCandidates - selectableSlots + pos) pos--;
      if (pos < 0) break;
      idx[pos]++;
      for (let j = pos + 1; j < selectableSlots; j++) idx[j] = idx[j - 1] + 1;
    }

    if (token !== runToken) return;
    if (best) {
      suppressAutoRecalcUntil = Date.now() + 1400;
      api.setStats(stats);
      api.setGeneralSettings?.(originalGeneralSettings(general));
      api.applyBuild(best.skills);
      renderResult(best, tier, checked, candidates.length, general, 'fixed');
      window.__wpoLastResult = {best, tier, checked, candidates: candidates.length, general, mode:'fixed'};
      const targetWord = general.targets > 1 ? t('multiTarget') : t('singleTarget');
      setStatus(t('done')(targetWord, general.targets, general.attackers));
    } else {
      renderResult(null, tier, checked, candidates.length, general, 'fixed');
      window.__wpoLastResult = null;
      setStatus(t('noCalculated'));
    }
    setBusy(false);
  }

  function makeBudgetBaseSkills(combo) {
    return combo.map((skill, index) => ({
      ...skill,
      tier: isAmberSkill(skill) ? 3 : (index === 0 || Number(skill?.costs?.[0]) <= 4 ? 3 : 0)
    }));
  }

  function calculateBuildSafe(api, skills, stats, general) {
    try {
      const cond = withConditionalDefaults(api, skills);
      const calc = api.calculate(skills, stats, cond, general);
      const damage = Number(calc?.totalDamage);
      if (!Number.isFinite(damage)) return null;
      return {calc, cond, damage};
    } catch (_) {
      return null;
    }
  }

  function optimizeTiersForBudget(api, combo, stats, general, budget, strategy = 'efficiency') {
    let skills = makeBudgetBaseSkills(combo);
    let costs = buildCosts(skills);
    if (costs.coin > budget) return null;

    // Common case (including the default 1M budget): if every coin skill fits at Lv.4,
    // use the exact max-level version immediately.
    const maxSkills = skills.map(skill => isAmberSkill(skill) ? {...skill, tier:3} : {...skill, tier:3});
    const maxCosts = buildCosts(maxSkills);
    if (maxCosts.coin <= budget) {
      const final = calculateBuildSafe(api, maxSkills, stats, general);
      return final ? {totalDamage:final.damage, skills:maxSkills, calc:final.calc, cond:final.cond, costs:maxCosts} : null;
    }

    let current = calculateBuildSafe(api, skills, stats, general);
    if (!current) return null;

    for (let step = 0; step < 24; step++) {
      let choice = null;
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (!skill || isAmberSkill(skill) || Number(skill.tier) >= 3 || skillCoinCost(skill) === 0) continue;
        const upgraded = {...skill, tier:Number(skill.tier) + 1};
        const extra = skillCoinCost(upgraded) - skillCoinCost(skill);
        if (extra <= 0 || costs.coin + extra > budget) continue;
        const testSkills = skills.slice();
        testSkills[i] = upgraded;
        const tested = calculateBuildSafe(api, testSkills, stats, general);
        if (!tested) continue;
        const gain = tested.damage - current.damage;
        const score = strategy === 'damage' ? tested.damage : gain / extra;
        if (!choice || score > choice.score || (score === choice.score && tested.damage > choice.tested.damage)) {
          choice = {i, upgraded, extra, score, tested};
        }
      }
      if (!choice) break;
      skills = skills.slice();
      skills[choice.i] = choice.upgraded;
      costs = {coin:costs.coin + choice.extra, amber:buildCosts(skills).amber};
      current = choice.tested;
    }

    return {totalDamage:current.damage, skills, calc:current.calc, cond:current.cond, costs};
  }

  async function runBudgetOptimizer() {
    const api = window.__warpetOptimizerAPI;
    if (!apiReady() || !api.pet) { setStatus(t('selectPetFirst')); return; }

    syncGeneralInputs(api, true);
    const panel = document.getElementById('warpet-optimizer');
    const stats = getStats();
    const general = getGeneralSettings();
    const budget = general.budget;
    const slots = Math.min(8, Math.max(1, Number(panel.querySelector('#wpo-slots').value) || 8));
    panel.querySelector('#wpo-slots').value = slots;

    // In budget mode free/innate and amber skills are always Lv.4.
    const lockedSkill = getLockedSkill(api, 3);
    if (!lockedSkill) { setStatus(t('noInnate')); return; }
    const selectableSlots = Math.max(0, slots - 1);
    const candidates = getCandidates(api, 3, lockedSkill, general.counterattack);
    if (selectableSlots > candidates.length) { setStatus(t('onlyCandidates')(candidates.length)); return; }

    const token = ++runToken;
    setBusy(true, 'budget');
    setStatus(t('budgetProgress')(0, 0, budget));
    document.getElementById('wpo-result').style.display = 'none';

    let best = null;
    let checked = 0;
    let raw = 0;
    const totalCandidates = candidates.length;
    const yieldEvery = totalCandidates >= 20 ? 120 : 350;
    const idx = Array.from({length: selectableSlots}, (_, i) => i);

    while (true) {
      if (token !== runToken) break;
      raw++;
      const selected = idx.map(i => candidates[i]);
      const combo = [lockedSkill, ...selected];

      if (attributeLimitSatisfied(combo) && dependenciesSatisfied(combo)) {
        const efficient = optimizeTiersForBudget(api, combo, stats, general, budget, 'efficiency');
        const direct = efficient && efficient.costs.coin < budget ? optimizeTiersForBudget(api, combo, stats, general, budget, 'damage') : null;
        const fitted = !direct || (efficient && efficient.totalDamage >= direct.totalDamage) ? efficient : direct;
        if (fitted) {
          checked++;
          if (!best || fitted.totalDamage > best.totalDamage ||
              (fitted.totalDamage === best.totalDamage && fitted.costs.coin > best.costs.coin)) best = fitted;
        }
      }

      if (raw % yieldEvery === 0) {
        setStatus(t('budgetProgress')(checked, raw, budget));
        await sleepFrame();
      }

      let pos = selectableSlots - 1;
      while (pos >= 0 && idx[pos] === totalCandidates - selectableSlots + pos) pos--;
      if (pos < 0) break;
      idx[pos]++;
      for (let j = pos + 1; j < selectableSlots; j++) idx[j] = idx[j - 1] + 1;
    }

    if (token !== runToken) return;
    if (best) {
      suppressAutoRecalcUntil = Date.now() + 1400;
      api.setStats(stats);
      api.setGeneralSettings?.(originalGeneralSettings(general));
      api.applyBuild(best.skills);
      renderResult(best, 3, checked, candidates.length, general, 'budget');
      window.__wpoLastResult = {best, tier:3, checked, candidates:candidates.length, general, mode:'budget'};
      setStatus(t('budgetDone')(general.targets, budget, best.costs.coin));
    } else {
      renderResult(null, 3, checked, candidates.length, general, 'budget');
      window.__wpoLastResult = null;
      setStatus(t('budgetTooLow')(budget));
    }
    setBusy(false);
  }

  function boot() {
    injectStyles();
    applyKrakenShell();
    document.documentElement.lang = currentLang;
    translateOriginalSite();
    decoratePetSelect();
    if (!apiReady()) return setTimeout(boot, 150);
    const panel = createPanel();
    if (!panel) return setTimeout(boot, 250);
    syncFromApi(true);

    // Next/React can redraw labels after hydration or when a pet changes.
    // Re-apply exact UI translations without touching canonical skill/pet names.
    watchPetSelect();
    setInterval(() => {
      applyKrakenShell();
      removeChangelog();
      translateOriginalSite();
      decoratePetSelect();
      syncFromApi(false);
    }, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
