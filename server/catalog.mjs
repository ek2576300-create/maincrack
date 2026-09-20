/**
 * Справочники игры для проверки того, что присылает форма профиля.
 *
 * Имена питомцев, их навыков и героев уже лежат в public/data — там же, где
 * их берёт фронтенд. Сервер читает те же файлы один раз при старте и держит
 * только множества имён: профиль должен ссылаться на реальный объект игры, а
 * не на произвольную строку, иначе публичная страница не сможет показать ни
 * портрет, ни характеристики.
 *
 * Артефактов в справочниках нет — их данные не пережили зеркало coddb.app
 * (см. /db/artifacts), поэтому названия артефактов остаются свободным текстом.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');

function names(file, key = 'name') {
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    return new Set((doc.items || []).map((it) => it[key]).filter(Boolean));
  } catch {
    // Пустое множество = проверка ничего не отсеет. Лучше принять данные
    // пользователя, чем уронить регистрацию профиля из-за сломанного файла.
    return new Set();
  }
}

export const PETS = names('pets.json');
export const PET_SKILLS = names('pet-skills.json');
export const HEROES = names('heroes.json');

/** Пустой справочник означает «файла нет» — тогда проверять нечего. */
const knownIn = (set, value) => set.size === 0 || set.has(value);

export const isPet = (v) => knownIn(PETS, v);
export const isPetSkill = (v) => knownIn(PET_SKILLS, v);
export const isHero = (v) => knownIn(HEROES, v);

export const UNITS = ['Infantry', 'Cavalry', 'Marksman', 'Magic'];
export const PLAY_STYLES = ['pvp', 'pve', 'farm', 'support', 'casual'];
export const CONTACT_KINDS = ['discord', 'telegram', 'youtube', 'other'];
export const ARTIFACT_QUALITIES = ['common', 'rare', 'epic', 'legendary'];
