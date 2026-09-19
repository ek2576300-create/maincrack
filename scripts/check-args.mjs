#!/usr/bin/env node
/**
 * Проверка, что функция перевода `t` приезжает в хелперы на своё место:
 *
 *     node scripts/check-args.mjs
 *
 * По фронтенду разбросаны общие хелперы, которые принимают `t` позиционным
 * аргументом — newsCard(n, lang, t, link), teamCard(person, lang, t, isLeader),
 * hofCard(person, lang, t), videoCard(v, lang, t), sourceNote(data, t, lang),
 * serverSelect(servers, onChange, t), counted(shown, total, t, lang) и секции
 * главной. Стоит вызвать такой хелпер в «обычном» порядке — и `t` уезжает в
 * соседний слот. Сборки у проекта нет, поэтому вылезает это только в браузере
 * и только на той вкладке, куда пользователь зашёл: роутер ловит TypeError и
 * рисует «Не удалось загрузить данные — t is not a function» вместо страницы.
 *
 * Скрипт сопоставляет каждый вызов с объявлением (локальным в том же модуле
 * или импортированным именованным экспортом) и требует, чтобы в слот
 * параметра `t` передавался именно идентификатор `t`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'static', 'js');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p);
  }
})(ROOT);

/** Пройти от '(' до парной ')', не спотыкаясь о строки и вложенные скобки. */
function readParens(src, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (!depth) return { body: src.slice(open + 1, i), end: i }; }
  }
  return null;
}

/** Разбить список аргументов по запятым верхнего уровня. */
function splitArgs(s) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) { cur += c; if (c === quote && s[i - 1] !== '\\') quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; cur += c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const lineOf = (src, pos) => src.slice(0, pos).split('\n').length;

/** Объявления вида `function name(...)` и `const name = (...) =>` в одном модуле. */
function declarationsIn(src) {
  const decls = new Map();
  const add = (name, params) => {
    const idx = params.findIndex((p) => p === 't');
    if (idx >= 0) decls.set(name, idx);
  };

  const fn = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g;
  for (let m; (m = fn.exec(src));) {
    const p = readParens(src, fn.lastIndex - 1);
    if (p) add(m[1], splitArgs(p.body));
  }

  const arrow = /(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(/g;
  for (let m; (m = arrow.exec(src));) {
    const p = readParens(src, arrow.lastIndex - 1);
    if (p && /^\s*=>/.test(src.slice(p.end + 1))) add(m[1], splitArgs(p.body));
  }
  return decls;
}

const declCache = new Map();
const declarationsOf = (file) => {
  if (!declCache.has(file)) declCache.set(file, declarationsIn(fs.readFileSync(file, 'utf8')));
  return declCache.get(file);
};

let bad = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  // Имя в этом модуле → слот параметра `t`. Локальные объявления + импорты.
  const expected = new Map(declarationsOf(file));
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    const target = path.resolve(path.dirname(file), m[2]);
    if (!fs.existsSync(target)) continue;
    const theirs = declarationsOf(target);
    for (const raw of m[1].split(',')) {
      const [orig, alias] = raw.trim().split(/\s+as\s+/).map((s) => s && s.trim());
      if (orig && theirs.has(orig)) expected.set(alias || orig, theirs.get(orig));
    }
  }

  for (const [name, slot] of expected) {
    // Вызов именно этого имени: не свойство (a.name()) и не объявление.
    const call = new RegExp(`(?<![A-Za-z0-9_$.])${name}\\s*\\(`, 'g');
    for (let m; (m = call.exec(src));) {
      const open = call.lastIndex - 1;
      const before = src.slice(0, open);
      if (/(?:function|const|let|var)\s+[A-Za-z0-9_$]*\s*=?\s*$/.test(before.slice(-60))) continue;

      const p = readParens(src, open);
      if (!p) continue;
      const args = splitArgs(p.body);
      if (args[slot] !== 't') {
        const got = args[slot] === undefined ? '<аргумент не передан>' : args[slot].replace(/\s+/g, ' ').slice(0, 48);
        console.log(`${rel}:${lineOf(src, open)} — ${name}() ждёт t аргументом №${slot + 1}, получает ${got}`);
        bad++;
      }
    }
  }
}

console.log(bad
  ? `\n${bad} несовпадени(е/я) — страница с таким вызовом упадёт с «t is not a function»`
  : `Функция перевода передаётся правильно во всех вызовах (${files.length} файлов).`);
process.exit(bad ? 1 : 0);
