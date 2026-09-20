/**
 * Общее для каталога аккаунтов, публичной страницы игрока и формы профиля.
 *
 * Питомцы и герои в профиле хранятся каноническими английскими именами — теми
 * же, что в pets.json и heroes.json. Показываем их через справочник: так у
 * питомца появляется портрет и русское имя, а у героя — качество и подзаголовок,
 * и при этом в базе не лежит копия игровых данных, которая разойдётся с сайтом.
 */
import { h, getJSON, num, compact } from '../util.js';

export const UNITS = ['Infantry', 'Cavalry', 'Marksman', 'Magic'];
export const PLAY_STYLES = ['pvp', 'pve', 'farm', 'support', 'casual'];
export const CONTACT_KINDS = ['discord', 'telegram', 'youtube', 'other'];
export const QUALITIES = ['common', 'rare', 'epic', 'legendary'];

export const QUALITY_COLOR = { legendary: '#f0c96a', epic: '#b48ce0', rare: '#6fb4e8', common: '#9aa4a4' };

/** Справочники сайта. getJSON кэширует, так что вызов дешёвый. */
export async function loadCatalogs() {
  const [pets, skills, heroes] = await Promise.all([
    getJSON('/data/pets.json'), getJSON('/data/pet-skills.json'), getJSON('/data/heroes.json'),
  ]);
  return {
    pets: pets.items,
    skills: skills.items,
    heroes: heroes.items,
    petBy: new Map(pets.items.map((p) => [p.name, p])),
    skillBy: new Map(skills.items.map((s) => [s.name, s])),
    heroBy: new Map(heroes.items.map((x) => [x.name, x])),
  };
}

export const petLabel = (pet, lang) => (pet ? ((lang === 'ru' && pet.name_ru) || pet.name) : '');
export const petPortrait = (pet) => (pet ? '/static/img/warpets/' + pet.portrait : null);

/** Ник в игре, если он указан, иначе имя аккаунта на сайте. */
export const displayNick = (row) => row.game_nick || row.gameNick || row.name || '—';

/**
 * Аватар — портрет питомца из базы. Загрузки файлов на сайте нет, а портреты
 * уже лежат в статике, поэтому выбор из них не требует ни хранилища, ни
 * модерации картинок.
 */
export function avatarEl(profile, catalogs, size = 48) {
  const dim = { width: size + 'px', height: size + 'px' };
  const pet = catalogs?.petBy.get(profile.avatar);
  if (pet) {
    return h('img', {
      src: petPortrait(pet), alt: '', loading: 'lazy',
      style: {
        ...dim, borderRadius: '50%', objectFit: 'cover', flexShrink: '0',
        boxShadow: '0 0 0 1px var(--line-2)',
      },
    });
  }
  const initial = displayNick(profile).trim().charAt(0).toUpperCase() || '?';
  return h('div', {
    style: {
      ...dim, borderRadius: '50%', flexShrink: '0', display: 'grid', placeItems: 'center',
      boxShadow: '0 0 0 1px var(--line-2)', background: 'var(--surface-2)',
      color: 'var(--accent)', fontWeight: '700', fontSize: Math.round(size * 0.4) + 'px',
    },
  }, initial);
}

export const unitIcon = (unit, size = 18) => (UNITS.includes(unit)
  ? h('img', {
    src: `/static/img/icons/units/${unit}.png`,
    alt: '', loading: 'lazy', style: { width: size + 'px', height: size + 'px' },
  })
  : null);

export const unitLabel = (unit, t) => (unit ? t('unit.' + unit, unit) : '');

/** «12,4 млн» с точным числом в подсказке: в карточке важен порядок величины. */
export const bigNumber = (value, lang) => (value == null
  ? '—'
  : h('span', { title: num(value, lang) }, compact(value, lang)));

/* ------------------------------------------------------- карточки записей */

/** Питомец: портрет, уровень/звёзды и набор навыков чипами. */
function petCard(item, catalogs, lang, t) {
  const pet = catalogs.petBy.get(item.name);
  const skills = item.extra?.skills || [];
  return h('article', { class: 'kc-card' },
    h('div', { style: { display: 'flex', gap: '11px', alignItems: 'center' } },
      pet
        ? h('img', {
          src: petPortrait(pet), alt: '', loading: 'lazy',
          style: { width: '46px', height: '46px', borderRadius: '9px', objectFit: 'cover', flexShrink: '0' },
        })
        : null,
      h('div', { style: { minWidth: '0', flex: '1' } },
        h('div', { style: { fontWeight: '600', color: 'var(--text)' } }, petLabel(pet, lang) || item.name),
        h('div', { class: 'kc-note', style: { marginTop: '2px' } },
          [levelText(item, t), starsText(item)].filter(Boolean).join(' · ') || '—'))),
    skills.length
      ? h('div', { class: 'kc-chips', style: { marginTop: '10px' } },
        ...skills.map((sk) => h('span', { class: 'kc-chip' },
          sk.name + (sk.level ? ` · ${t('gp.item.level')} ${sk.level}` : ''))))
      : null,
    noteEl(item));
}

/** Герой: качество цветом, как в базе героев, и уровни четырёх навыков. */
function heroCard(item, catalogs, lang, t) {
  const hero = catalogs.heroBy.get(item.name);
  const levels = (item.extra?.skills || []).filter((v) => v != null);
  return h('article', { class: 'kc-card' },
    h('div', { style: { display: 'flex', gap: '9px', alignItems: 'baseline', flexWrap: 'wrap' } },
      h('span', {
        style: { fontWeight: '600', color: hero ? (QUALITY_COLOR[hero.quality] || 'var(--text)') : 'var(--text)' },
      }, item.name),
      hero?.title ? h('small', { style: { color: 'var(--muted-2)' } }, hero.title) : null),
    h('div', { class: 'kc-note', style: { marginTop: '4px' } },
      [
        levelText(item, t),
        starsText(item),
        hero ? t('heroes.season') + ' ' + hero.season : '',
        item.extra?.expedition ? t('gp.item.expedition') : '',
      ].filter(Boolean).join(' · ') || '—'),
    levels.length
      ? h('div', { class: 'kc-note', style: { marginTop: '8px', color: 'var(--text-dim)' } },
        t('gp.item.heroSkills') + ': ' + levels.join(' / '))
      : null,
    noteEl(item));
}

/** Артефакт: справочника нет, поэтому только то, что ввёл владелец. */
function artifactCard(item, catalogs, lang, t) {
  const quality = item.extra?.quality;
  return h('article', { class: 'kc-card' },
    h('div', { style: { display: 'flex', gap: '9px', alignItems: 'center', flexWrap: 'wrap' } },
      h('span', { style: { fontWeight: '600', color: 'var(--text)' } }, item.name),
      quality
        ? h('span', { class: 'kc-badge', style: { color: QUALITY_COLOR[quality] } }, t('gp.quality.' + quality))
        : null),
    h('div', { class: 'kc-note', style: { marginTop: '4px' } },
      [levelText(item, t), starsText(item)].filter(Boolean).join(' · ') || '—'),
    noteEl(item));
}

const levelText = (item, t) => (item.level ? `${t('gp.item.level')} ${item.level}` : '');
const starsText = (item) => (item.stars ? '★'.repeat(Math.min(6, item.stars)) : '');
const noteEl = (item) => (item.note
  ? h('p', { class: 'kc-note', style: { margin: '9px 0 0', color: 'var(--text-dim)', whiteSpace: 'pre-wrap' } }, item.note)
  : null);

const CARDS = { pet: petCard, hero: heroCard, artifact: artifactCard };

/**
 * `actions` — кнопки владельца («Изменить» / «Удалить»). Они уезжают внутрь
 * карточки, а не под неё: снаружи они выглядели оторванными от записи.
 */
export function itemCard(item, catalogs, lang, t, actions) {
  const card = (CARDS[item.kind] || artifactCard)(item, catalogs, lang, t);
  if (actions) card.append(actions);
  return card;
}
