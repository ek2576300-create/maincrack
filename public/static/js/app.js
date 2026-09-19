/**
 * Хроники Кракена 888 — application shell.
 * Client-side router + header/nav/footer + auth store + support widget mount.
 */
import { SITE, NAV, SEO, seoFor } from './routes.js';
import { createI18n } from './i18n.js';
import { h, clear, api, setMeta, loading, errorBox } from './util.js';
import { mountSupport } from './chat.js';

/* ------------------------------------------------------------------ state */
const storedLang = (() => {
  try { return localStorage.getItem('kc.lang'); } catch { return null; }
})();
const urlLang = new URLSearchParams(location.search).get('lang');
const i18n = createI18n(urlLang || storedLang || document.documentElement.dataset.lang || SITE.defaultLocale);

export const store = {
  i18n,
  user: null,
  guestId: null,
  listeners: new Set(),
  setUser(u) { this.user = u; this.listeners.forEach((f) => f(u)); },
  onUser(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

const t = (k, f) => i18n.t(k, f);

/* ----------------------------------------------------------------- routes */
const PAGES = {
  '/':                   () => import('./pages/home.js'),
  '/pets/builder':       () => import('./pages/pet-builder.js'),
  '/pets/top':           () => import('./pages/pet-top.js'),
  '/pets/skills':        () => import('./pages/pet-skills.js'),
  '/pets/builds':        () => import('./pages/pet-builds.js'),
  '/db/heroes':          () => import('./pages/heroes.js'),
  '/db/artifacts':       () => import('./pages/artifacts.js'),
  '/calc/training':      () => import('./pages/calc.js'),
  '/calc/healing':       () => import('./pages/calc.js'),
  '/calc/speedup':       () => import('./pages/calc.js'),
  '/calc/resources':     () => import('./pages/calc.js'),
  '/calc/heroes':        () => import('./pages/calc.js'),
  '/stats/servers':      () => import('./pages/stats-servers.js'),
  '/stats/players':      () => import('./pages/stats-players.js'),
  '/stats/alliances':    () => import('./pages/stats-alliances.js'),
  '/stats/rankings':     () => import('./pages/stats-rankings.js'),
  '/stats/compare':      () => import('./pages/stats-compare.js'),
  '/stats/immigration':  () => import('./pages/stats-immigration.js'),
  '/stats/player':       () => import('./pages/stats-player.js'),
  '/stats/alliance':     () => import('./pages/stats-alliance.js'),
  '/guides':             () => import('./pages/guides.js'),
  '/calendar':           () => import('./pages/calendar.js'),
  '/about':              () => import('./pages/about.js'),
  '/about/history':      () => import('./pages/about-history.js'),
  '/about/build':        () => import('./pages/about-build.js'),
  '/news':               () => import('./pages/news.js'),
  '/news/post':          () => import('./pages/news-post.js'),
  '/videos':             () => import('./pages/videos.js'),
  '/achievements':       () => import('./pages/achievements.js'),
  '/team':               () => import('./pages/team.js'),
  '/hall-of-fame':       () => import('./pages/hall-of-fame.js'),
  '/tournament':         () => import('./pages/tournament.js'),
  '/login':              () => import('./pages/login.js'),
  '/profile':            () => import('./pages/profile.js'),
  '/admin':              () => import('./pages/admin.js'),
};

/** Split a URL into a page key + params (supports /stats/player/<id>). */
function resolve(pathname) {
  if (PAGES[pathname]) return { key: pathname, params: {} };
  const m = pathname.match(/^\/stats\/(player|alliance)\/([^/]+)$/);
  if (m) return { key: `/stats/${m[1]}`, params: { id: decodeURIComponent(m[2]) } };
  const n = pathname.match(/^\/news\/([^/]+)$/);
  if (n) return { key: '/news/post', params: { slug: decodeURIComponent(n[1]) } };
  return { key: null, params: {} };
}

/* ----------------------------------------------------------------- layout */
const root = document.getElementById('kc-root');
let mainEl, navEl, headerRightEl;
let currentPath = null;
let disposePage = null;

function buildHeader() {
  navEl = h('nav', { class: 'kc-nav', id: 'kc-nav' });
  headerRightEl = h('div', { class: 'kc-header-right' });

  const setMobileOpen = (open) => {
    navEl.classList.toggle('is-mobile-open', open);
    burger.textContent = open ? '✕' : '☰';
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? t('nav.close') : t('nav.menu'));
  };
  const burger = h('button', {
    class: 'kc-burger', type: 'button', 'aria-label': t('nav.menu'), 'aria-expanded': 'false',
    onclick: () => setMobileOpen(!navEl.classList.contains('is-mobile-open')),
  }, '☰');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navEl.classList.contains('is-mobile-open')) { setMobileOpen(false); burger.focus(); }
  });
  navEl.__close = () => setMobileOpen(false);

  const header = h('header', { class: 'kc-header' },
    h('div', { class: 'kc-header-inner' },
      h('a', { class: 'kc-brand', href: '/', onclick: linkHandler('/') },
        h('div', {
          class: 'kc-brand-mark', 'aria-hidden': 'true',
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
            + '<circle cx="12" cy="4.2" r="2"/><path d="M12 6.4V21"/><path d="M8 9.4h8"/>'
            + '<path d="M4.5 14.2c0 4 3.4 6.8 7.5 6.8s7.5-2.8 7.5-6.8"/></svg>',
        }),
        h('div', { class: 'kc-brand-text' },
          h('div', { class: 'kc-brand-name', id: 'kc-brand-name' }, SITE.name[i18n.lang]),
          h('div', { class: 'kc-brand-sub', id: 'kc-brand-sub' }, SITE.short[i18n.lang]))),
      burger, navEl, headerRightEl));

  renderNav();
  renderHeaderRight();
  return header;
}

function linkHandler(href) {
  return (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
}

export function navigate(href, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', href);
  else history.pushState({}, '', href);
  render();
}

/** Smooth-scroll to an in-page anchor once its section has had a chance to mount. */
function scrollToHash(hash) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = hash && document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderNav() {
  clear(navEl);
  for (const group of NAV) {
    const items = group.items.filter((it) => !it.hidden && (!it.adminOnly || store.user?.role === 'admin'));
    if (!items.length) continue;

    const menu = h('div', { class: 'kc-menu' }, ...items.map((it) =>
      h('a', {
        href: it.path, class: it.path === currentPath ? 'is-active' : '', onclick: linkHandler(it.path),
      }, it.label[i18n.lang], it.primary && h('span', { class: 'kc-menu-tag' }, i18n.lang === 'ru' ? 'основа' : 'core'))));

    const btn = h('button', { class: 'kc-cat-btn', type: 'button' },
      h('span', {}, group.icon), group.label[i18n.lang], h('span', { class: 'kc-caret' }, '▼'));

    const cat = h('div', {
      class: 'kc-cat' + (items.some((it) => it.path === currentPath) ? ' is-active' : ''),
      dataset: { cat: group.id },
    }, btn, menu);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = cat.classList.contains('is-open');
      navEl.querySelectorAll('.kc-cat').forEach((c) => c.classList.remove('is-open'));
      if (!wasOpen) cat.classList.add('is-open');
    });
    navEl.append(cat);
  }
}

document.addEventListener('click', () => {
  navEl?.querySelectorAll('.kc-cat').forEach((c) => c.classList.remove('is-open'));
});

function renderHeaderRight() {
  clear(headerRightEl);

  const lang = h('div', { class: 'kc-lang' },
    ...['ru', 'en'].map((l) => h('button', {
      type: 'button', class: i18n.lang === l ? 'is-active' : '',
      onclick: () => setLang(l),
    }, l.toUpperCase())));

  const account = store.user
    ? h('button', { class: 'kc-userchip', type: 'button', onclick: () => navigate('/profile') },
      h('span', { class: 'kc-dot' }),
      h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, store.user.name),
      store.user.role === 'admin' && h('span', { class: 'kc-badge-admin' }, 'ADM'))
    : h('button', { class: 'kc-userchip', type: 'button', onclick: () => navigate('/login') }, t('nav.signIn'));

  headerRightEl.append(lang, account);
}

function setLang(l) {
  i18n.set(l);
  const url = new URL(location.href);
  url.searchParams.set('lang', l);
  history.replaceState({}, '', url.pathname + url.search);
  document.getElementById('kc-brand-name').textContent = SITE.name[l];
  document.getElementById('kc-brand-sub').textContent = SITE.short[l];
  renderNav();
  renderHeaderRight();
  render({ force: true });
}

function buildFooter() {
  const cols = NAV.map((g) => h('div', {},
    h('h4', {}, g.label[i18n.lang]),
    h('ul', {}, ...g.items.filter((i) => !i.hidden && !i.adminOnly)
      .map((i) => h('li', {}, h('a', { href: i.path, onclick: linkHandler(i.path) }, i.label[i18n.lang]))))));

  return h('footer', { class: 'kc-footer', id: 'kc-footer' },
    h('div', { class: 'kc-footer-inner' }, ...cols),
    h('div', { class: 'kc-footer-note' },
      h('div', {}, t('footer.merged')),
      h('div', { style: { marginTop: '6px' } }, t('footer.legal')),
      h('div', { style: { marginTop: '6px', opacity: '.7' } },
        SITE.name[i18n.lang], ' · ', SITE.tagline[i18n.lang])));
}

/* ------------------------------------------------------------------ render */
async function render({ force = false } = {}) {
  const pathname = location.pathname;
  if (!force && pathname === currentPath) {
    if (location.hash) scrollToHash(location.hash);
    return;
  }
  currentPath = pathname;

  navEl?.querySelectorAll('.kc-cat').forEach((c) => c.classList.remove('is-open'));
  navEl?.__close?.();
  renderNav();

  const { key, params } = resolve(pathname);
  const meta = seoFor(SEO[key] ? key : '/', i18n.lang);
  setMeta(meta);

  const flush = key === '/pets/builder';
  mainEl.className = 'kc-main' + (flush ? ' is-flush' : '');
  clear(mainEl);
  mainEl.append(loading(t('common.loading')));

  if (disposePage) { try { disposePage(); } catch { /* page teardown is best-effort */ } disposePage = null; }

  if (!key) {
    clear(mainEl);
    mainEl.append(h('div', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
      h('h1', {}, '404 — ' + t('common.notFound')),
      h('p', { class: 'kc-note' }, t('common.notFoundHint')),
      h('a', { class: 'kc-btn is-primary', href: '/', onclick: linkHandler('/') }, t('common.home')))));
    return;
  }

  try {
    const mod = await PAGES[key]();
    if (currentPath !== pathname) return;              // navigated away while importing
    clear(mainEl);
    const ctx = { store, i18n, t, params, navigate, link: linkHandler, mount: mainEl };
    disposePage = (await mod.render(mainEl, ctx)) || null;
  } catch (err) {
    console.error('[route]', pathname, err);
    if (currentPath !== pathname) return;
    clear(mainEl);
    mainEl.append(errorBox(t('common.error') + ' — ' + err.message),
      h('button', { class: 'kc-btn', onclick: () => render({ force: true }) }, t('common.retry')));
  }

  if (location.hash) scrollToHash(location.hash);
  else window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  track(pathname);
}

let lastTracked = null;
function track(path) {
  if (path === lastTracked) return;
  lastTracked = path;
  api('/track', { method: 'POST', body: { path, ref: document.referrer || '' } }).catch(() => { /* analytics is optional */ });
}

/* -------------------------------------------------------------------- boot */
async function boot() {
  clear(root);
  mainEl = h('main', { class: 'kc-main', id: 'kc-main' });
  const shell = h('div', { class: 'kc-shell' }, buildHeader(), mainEl);
  root.append(shell);

  try {
    const me = await api('/auth/me');
    store.user = me.user;
    store.guestId = me.guestId;
  } catch { /* offline or first run — carry on as a guest */ }
  renderHeaderRight();
  renderNav();

  await render({ force: true });

  const footer = buildFooter();
  shell.append(footer);
  i18n.onChange(() => {
    const next = buildFooter();
    footer.replaceWith(next);
    footer.remove?.();
  });

  mountSupport({ store, i18n, t });

  store.onUser(() => { renderHeaderRight(); renderNav(); });
  window.addEventListener('popstate', () => render({ force: true }));

  // Intercept in-app links rendered by pages, so they never full-reload.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="/"]');
    if (!a || a.target === '_blank' || a.dataset.external || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (href.startsWith('/static/') || href.startsWith('/data/') || href.startsWith('/warpets')) return;
    e.preventDefault();
    navigate(href);
  });
}

export const auth = {
  async login(email, password) { const r = await api('/auth/login', { method: 'POST', body: { email, password } }); store.setUser(r.user); return r.user; },
  async register(payload) { const r = await api('/auth/register', { method: 'POST', body: { ...payload, lang: i18n.lang } }); store.setUser(r.user); return r.user; },
  async logout() { await api('/auth/logout', { method: 'POST' }); store.setUser(null); },
};

window.KC = { store, navigate, i18n, auth };
boot();
