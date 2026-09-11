import { h, getJSON, num } from '../util.js';

/**
 * The coddb.app artifacts page renders from its own Next.js chunk
 * (pages/db/artifacts-*.js), which the HTTrack/Playwright mirror captured as a
 * 0-byte file. Rather than invent artifact stats, this tab says so plainly and
 * shows the artifact-adjacent data that *did* survive: hero skills that grant
 * artifact-style holistic bonuses.
 */
export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const heroes = (await getJSON('/data/heroes.json')).items;

  const holistic = [];
  for (const hero of heroes) {
    for (const s of hero.skills) {
      if (s.holistic) holistic.push({ hero: hero.name, quality: hero.quality, skill: s.name, text: s.description, upgrade: s.upgrade });
    }
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('artifacts.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('artifacts.title')), h('p', {}, t('artifacts.desc')))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-error', style: { borderColor: 'rgba(238,196,106,.4)', background: 'rgba(238,196,106,.08)', color: 'var(--warn)' } },
          h('strong', {}, '⚠ ' + t('artifacts.missing'))),
        h('p', { class: 'kc-note kc-prose' }, t('artifacts.missingHint')),
        h('div', { class: 'kc-grid c3', style: { marginTop: '14px' } },
          h('div', { class: 'kc-tile' },
            h('div', { class: 'kc-tile-label' }, lang === 'ru' ? 'Пустых чанков' : 'Empty chunks'),
            h('div', { class: 'kc-tile-value' }, '14'),
            h('small', { class: 'kc-tile-note' }, 'index, login, guides, builds, calendar, decree, rowplanner, db/heroes, db/artifacts, calculators ×5')),
          h('div', { class: 'kc-tile' },
            h('div', { class: 'kc-tile-label' }, lang === 'ru' ? 'Сохранился целиком' : 'Fully captured'),
            h('div', { class: 'kc-tile-value sm' }, '/warpets'),
            h('small', { class: 'kc-tile-note' }, lang === 'ru' ? '240 КБ бандла + optimizer.js' : '240 KB bundle + optimizer.js')),
          h('div', { class: 'kc-tile' },
            h('div', { class: 'kc-tile-label' }, lang === 'ru' ? 'Спасено из API' : 'Recovered from API'),
            h('div', { class: 'kc-tile-value' }, num(heroes.length, lang)),
            h('small', { class: 'kc-tile-note' }, 'api/heroes.json'))),
        h('p', { class: 'kc-note', style: { marginTop: '14px' } },
          lang === 'ru'
            ? 'Чтобы раздел ожил, нужно повторно снять зеркало coddb.app с включённым JavaScript (скрипт mirror.mjs из архива frontend.zip) и положить получившийся JSON артефактов в public/data/artifacts.json — эта страница подхватит его автоматически.'
            : 'To bring this section to life, re-run the coddb.app mirror with JavaScript enabled (mirror.mjs from frontend.zip) and drop the resulting artifact JSON into public/data/artifacts.json — this page will pick it up automatically.'))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h2', {}, lang === 'ru' ? 'Пассивные бонусы героев' : 'Holistic hero bonuses'),
          h('p', {}, lang === 'ru'
            ? 'Навыки, действующие на все легионы — ближайший к артефактам пласт данных, который сохранился.'
            : 'Skills that affect every legion — the closest thing to artifact data that survived.'))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid auto-lg' },
          ...holistic.map((x) => h('div', { class: 'kc-card' },
            h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
              h('strong', { style: { color: 'var(--gold-soft)', fontSize: '13px' } }, x.skill),
              h('span', { class: 'kc-badge' }, x.hero)),
            h('p', { class: 'kc-note', style: { margin: '8px 0 0', color: 'var(--text-dim)' } }, x.text),
            x.upgrade && h('p', { class: 'kc-note', style: { margin: '5px 0 0' } }, x.upgrade))))),
      h('div', { class: 'kc-panel-foot' }, `${holistic.length} ${lang === 'ru' ? 'пассивных навыков' : 'holistic skills'}`)),
  );
}
