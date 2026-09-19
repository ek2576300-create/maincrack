#!/usr/bin/env node
/**
 * Проверка, что каждый именованный импорт фронтенда существует в модуле, из
 * которого его тянут:
 *
 *     node scripts/check-imports.mjs
 *
 * Браузер такие ошибки показывает только в рантайме («does not provide an
 * export named …»), и страница при этом не рисуется вообще. Скрипт находит их
 * до деплоя — запускайте после правок в public/static/js.
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

const exportsOf = (file) => {
  const s = fs.readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of s.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of s.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  if (/export\s+default/.test(s)) names.add('default');
  return names;
};

let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    const target = path.resolve(path.dirname(f), m[2]);
    if (!fs.existsSync(target)) { console.log(`MISSING MODULE ${path.relative(ROOT, f)} → ${m[2]}`); bad++; continue; }
    const have = exportsOf(target);
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name && !have.has(name)) {
        console.log(`MISSING EXPORT '${name}' — ${path.relative(ROOT, f)} импортирует из ${m[2]}`);
        bad++;
      }
    }
  }
}
console.log(bad ? `\n${bad} проблем(ы)` : `Все импорты разрешаются (${files.length} файлов).`);
process.exit(bad ? 1 : 0);
