import { h } from '../util.js';

/* The weekly Call of Dragons cycle. The coddb.app /calendar chunk was empty in
   the mirror, so this is rebuilt from the game's published rotation. */
const WEEK = [
  { day: { ru: 'Понедельник', en: 'Monday' }, event: { ru: 'День строительства', en: 'Construction day' }, focus: { ru: 'Ускорения строительства, ресурсы на здания', en: 'Building speedups, resources into buildings' }, icon: '🏗️' },
  { day: { ru: 'Вторник', en: 'Tuesday' }, event: { ru: 'День науки', en: 'Research day' }, focus: { ru: 'Ускорения исследований, книги опыта', en: 'Research speedups, XP books' }, icon: '📚' },
  { day: { ru: 'Среда', en: 'Wednesday' }, event: { ru: 'День войск', en: 'Troop day' }, focus: { ru: 'Обучение войск, ускорения обучения', en: 'Troop training, training speedups' }, icon: '⚔️' },
  { day: { ru: 'Четверг', en: 'Thursday' }, event: { ru: 'День героев и питомцев', en: 'Hero & pet day' }, focus: { ru: 'Медали, свитки, пет-коины и янтарь', en: 'Medals, scrolls, pet coins and amber' }, icon: '🐉' },
  { day: { ru: 'Пятница', en: 'Friday' }, event: { ru: 'Смешанный день', en: 'Mixed day' }, focus: { ru: 'Всё сразу — добираем очки перед выходными', en: 'Everything at once — top up points before the weekend' }, icon: '🎲' },
  { day: { ru: 'Суббота', en: 'Saturday' }, event: { ru: 'Битвы королевств', en: 'Kingdom battles' }, focus: { ru: 'Массовые PvP-активности, убийства', en: 'Mass PvP activity, kills' }, icon: '🔥' },
  { day: { ru: 'Воскресенье', en: 'Sunday' }, event: { ru: 'Подведение итогов', en: 'Wrap-up' }, focus: { ru: 'Сбор наград, подготовка к новому циклу', en: 'Collect rewards, prepare for the next cycle' }, icon: '🏆' },
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
        h('div', { class: 'kc-grid auto' }, ...WEEK.map((d, i) => {
          const isToday = i === todayIdx;
          return h('div', {
            class: 'kc-card',
            style: isToday ? { borderColor: 'var(--gold)', boxShadow: '0 0 0 1px rgba(216,180,93,.25), 0 12px 30px rgba(0,0,0,.3)' } : undefined,
          },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } },
              h('span', { style: { fontSize: '20px' } }, d.icon),
              h('div', { style: { flex: '1' } },
                h('div', { style: { fontWeight: '800', color: isToday ? 'var(--gold-soft)' : 'var(--text)' } }, d.day[lang]),
                h('small', { style: { color: 'var(--muted)' } }, d.event[lang])),
              isToday && h('span', { class: 'kc-badge is-gold' }, t('calendar.today'))),
            h('p', { class: 'kc-note', style: { margin: '10px 0 0', color: 'var(--text-dim)' } },
              h('strong', {}, t('calendar.focus') + ': '), d.focus[lang]));
        }))),
      h('div', { class: 'kc-panel-foot' },
        lang === 'ru'
          ? 'Оригинальный /calendar на coddb.app в зеркале пустой (JS-чанк 0 байт), поэтому цикл восстановлен по опубликованной ротации игры. Даты KvK и сезонных событий зависят от сервера — сверяйтесь в игре.'
          : 'The original /calendar on coddb.app is empty in the mirror (0-byte JS chunk), so this cycle is rebuilt from the game\'s published rotation. KvK and seasonal dates vary per server — check in game.')));
}
