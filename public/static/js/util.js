/* Tiny DOM + formatting helpers shared by every page module. */

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(4)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const frag = (...children) => {
  const f = document.createDocumentFragment();
  for (const c of children.flat(4)) if (c != null && c !== false) f.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return f;
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

/* --------------------------------------------------------------- format */
export const num = (n, lang = 'ru') => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'));

export function compact(n, lang = 'ru') {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const units = lang === 'ru'
    ? [[1e12, ' трлн'], [1e9, ' млрд'], [1e6, ' млн'], [1e3, ' тыс']]
    : [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [size, suffix] of units) {
    if (abs >= size) return (v / size).toFixed(v / size >= 100 ? 0 : 1).replace(/\.0$/, '') + suffix;
  }
  return String(Math.round(v));
}

export function duration(minutes, lang = 'ru') {
  let m = Math.max(0, Math.round(Number(minutes) || 0));
  const d = Math.floor(m / 1440); m -= d * 1440;
  const hh = Math.floor(m / 60); const mm = m - hh * 60;
  const L = lang === 'ru' ? ['д', 'ч', 'м'] : ['d', 'h', 'm'];
  const out = [];
  if (d) out.push(d + L[0]);
  if (hh) out.push(hh + L[1]);
  if (mm || !out.length) out.push(mm + L[2]);
  return out.join(' ');
}

export function dateTime(iso, lang = 'ru') {
  if (!iso) return '—';
  const d = new Date(String(iso).includes('T') ? iso : String(iso).replace(' ', 'T') + 'Z');
  if (Number.isNaN(+d)) return String(iso);
  return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeShort(iso, lang = 'ru') {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US',
    sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ----------------------------------------------------------------- data */
const cache = new Map();

export async function getJSON(url, { cached = true } = {}) {
  if (cached && cache.has(url)) return cache.get(url);
  const promise = fetch(url, { credentials: 'same-origin' }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  });
  if (cached) cache.set(url, promise);
  try { return await promise; }
  catch (e) { cache.delete(url); throw e; }
}

export async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch('/api/v1' + path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch { /* empty body */ }
  if (!r.ok) { const e = new Error(data.error || `http_${r.status}`); e.code = data.error; e.status = r.status; throw e; }
  return data;
}

/* -------------------------------------------------------------- widgets */
export const loading = (label = '…') => h('div', { class: 'kc-loading' }, label);

export const empty = (title, hint) => h('div', { class: 'kc-empty' },
  h('span', { class: 'mark' }, '⚓'),
  h('div', { style: { fontWeight: '700', color: 'var(--text-dim)' } }, title),
  hint && h('div', { style: { marginTop: '6px', fontSize: '12px' } }, hint));

export const errorBox = (msg) => h('div', { class: 'kc-error' }, msg);

export function tile(label, value, note, icon) {
  return h('div', { class: 'kc-tile' },
    h('div', { class: 'kc-tile-label' }, icon && h('img', { src: icon, alt: '', loading: 'lazy' }), label),
    h('div', { class: 'kc-tile-value' + (String(value).length > 12 ? ' sm' : '') }, value),
    note && h('small', { class: 'kc-tile-note' }, note));
}

export function panel(title, desc, ...body) {
  return h('section', { class: 'kc-panel' },
    (title || desc) && h('div', { class: 'kc-panel-head' }, h('div', {}, title && h('h2', {}, title), desc && h('p', {}, desc))),
    h('div', { class: 'kc-panel-body' }, ...body));
}

export function banner(title, sub, { kicker = 'CALL OF DRAGONS', compact: isCompact = false } = {}) {
  return h('div', { class: 'kc-banner' + (isCompact ? ' is-compact' : '') },
    h('div', { class: 'kc-banner-inner' },
      h('div', { class: 'kc-banner-kicker' }, kicker),
      h('div', { class: 'kc-banner-title' }, title),
      sub && h('div', { class: 'kc-banner-sub' }, sub)),
    h('div', { class: 'kc-banner-lights' }));
}

/**
 * Sortable, filterable table.
 * columns: { key, label, num?, sortable?, render?(row), value?(row), width? }
 */
export function dataTable(rows, columns, { sort, dir = -1, onSort, onRow, lang = 'ru', minWidth } = {}) {
  const thead = h('thead', {}, h('tr', {}, ...columns.map((c) => {
    const sortable = c.sortable !== false && onSort;
    const active = sort === c.key;
    return h('th', {
      class: [sortable ? 'sortable' : '', c.num ? 'num' : ''].filter(Boolean).join(' '),
      style: c.width ? { width: c.width } : undefined,
      onclick: sortable ? () => onSort(c.key) : undefined,
    }, c.label + (active ? (dir < 0 ? ' ↓' : ' ↑') : ''));
  })));

  const tbody = h('tbody', {}, ...rows.map((row, i) => {
    const tr = h('tr', { class: onRow ? 'kc-rowlink' : '' }, ...columns.map((c) => {
      const content = c.render ? c.render(row, i) : (c.value ? c.value(row) : row[c.key]);
      return h('td', { class: c.num ? 'num' : '' },
        content instanceof Node ? content : (c.num ? num(content, lang) : (content ?? '—')));
    }));
    if (onRow) tr.addEventListener('click', () => onRow(row));
    return tr;
  }));

  return h('div', { class: 'kc-table-wrap' },
    h('table', { class: 'kc-table', style: minWidth ? { minWidth } : undefined }, thead, tbody));
}

export function sortBy(rows, key, dir, accessor) {
  const get = accessor || ((r) => r[key]);
  return [...rows].sort((a, b) => {
    const x = get(a); const y = get(b);
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
    return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * dir;
  });
}

export const debounce = (fn, ms = 220) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/* ------------------------------------------------------------ SEO helper */
export function setMeta({ title, description }) {
  if (title) document.title = title;
  if (description) {
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.append(m); }
    m.content = description;
  }
  const c = document.querySelector('link[rel="canonical"]');
  if (c) c.href = location.origin + location.pathname;
}
