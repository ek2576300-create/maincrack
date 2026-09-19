import { h } from '../util.js';

/* The weekly Call of Dragons cycle. The coddb.app /calendar chunk was empty in
   the mirror, so this is rebuilt from the game's published rotation. */
export const WEEK = [
  { day: { ru: 'Понедельник', en: 'Monday' }, event: { ru: 'День строительства', en: 'Construction day' }, focus: { ru: 'Ускорения строительства, ресурсы на здания', en: 'Building speedups, resources into buildings' } },
  { day: { ru: 'Вторник', en: 'Tuesday' }, event: { ru: 'День науки', en: 'Research day' }, focus: { ru: 'Ускорения исследований, книги опыта', en: 'Research speedups, XP books' } },
  { day: { ru: 'Среда', en: 'Wednesday' }, event: { ru: 'День войск', en: 'Troop day' }, focus: { ru: 'Обучение войск, ускорения обучения', en: 'Troop training, training speedups' } },
  { day: { ru: 'Четверг', en: 'Thursday' }, event: { ru: 'День героев и питомцев', en: 'Hero & pet day' }, focus: { ru: 'Медали, свитки, пет-коины и янтарь', en: 'Medals, scrolls, pet coins and amber' } },
  { day: { ru: 'Пятница', en: 'Friday' }, event: { ru: 'Смешанный день', en: 'Mixed day' }, focus: { ru: 'Всё сразу — добираем очки перед выходными', en: 'Everything at once — top up points before the weekend' } },
  { day: { ru: 'Суббота', en: 'Saturday' }, event: { ru: 'Битвы королевств', en: 'Kingdom battles' }, focus: { ru: 'Массовые PvP-активности, убийства', en: 'Mass PvP activity, kills' } },
  { day: { ru: 'Воскресенье', en: 'Sunday' }, event: { ru: 'Подведение итогов', en: 'Wrap-up' }, focus: { ru: 'Сбор наград, подготовка к новому циклу', en: 'Collect rewards, prepare for the next cycle' } },
];

export function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('calendar.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('calendar.title')), h('p', {}, t('calendar.desc')))),
      h('div', { class: 'kc-panel-body' },
        h('ul', { class: 'kc-feed' }, ...WEEK.map((d, i) => h('li', { class: i === todayIdx ? 'is-now' : undefined },
          h('time', {}, d.day[lang]),
          h('span', { class: 'kc-feed-name' }, d.event[lang]),
          h('span', { class: 'kc-note', style: { flex: '2 1 260px' } }, d.focus[lang]),
          i === todayIdx && h('span', { class: 'kc-badge is-gold' }, t('calendar.today')))))),
      h('div', { class: 'kc-panel-foot' },
        lang === 'ru'
          ? 'Оригинальный /calendar на coddb.app в зеркале пустой (JS-чанк 0 байт), поэтому цикл восстановлен по опубликованной ротации игры. Даты KvK и сезонных событий зависят от сервера — сверяйтесь в игре.'
          : 'The original /calendar on coddb.app is empty in the mirror (0-byte JS chunk), so this cycle is rebuilt from the game\'s published rotation. KvK and seasonal dates vary per server — check in game.')));
}
