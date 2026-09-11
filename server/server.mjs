/**
 * Хроники Кракена 888 / Kraken Chronicles 888
 * Unified server: SPA + SEO head injection + API + the original War Pet Builder mirror.
 * Zero external dependencies — Node 22+ only.
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { handleApi } from './api.mjs';
import { ensureAdmin, identify } from './auth.mjs';
import { Visits } from './db.mjs';
import { SITE, SEO, NAV, seoFor, publicRoutes } from '../public/static/js/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MIRROR = path.join(ROOT, 'warpets');
const PORT = Number(process.env.PORT || 8888);
const HOST = process.env.HOST || '0.0.0.0';
const ORIGIN = process.env.KC_ORIGIN || `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json',
  '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript|manifest))/;

/* Paths owned by the mirrored coddb.app build (the War Pet Builder runs from these). */
const MIRROR_PREFIXES = ['/_next/', '/img/', '/svg/', '/optimizer.js', '/embed.js', '/manifest.json', '/api/heroes.json', '/favicon.ico'];

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket.remoteAddress || '';

function send(res, status, body, type = 'text/plain; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...extra });
  res.end(body);
}

async function sendFile(req, res, abs, { cache = 'public, max-age=3600' } = {}) {
  let st;
  try { st = await fsp.stat(abs); } catch { return false; }
  if (st.isDirectory()) {
    const idx = path.join(abs, 'index.html');
    try { st = await fsp.stat(idx); abs = idx; } catch { return false; }
  }
  if (!st.isFile()) return false;

  const ext = path.extname(abs).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const etag = `W/"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return true; }

  const headers = { 'Content-Type': type, 'Cache-Control': cache, ETag: etag };
  const accepts = String(req.headers['accept-encoding'] || '');
  if (COMPRESSIBLE.test(type) && st.size > 1024 && /\bgzip\b/.test(accepts)) {
    const raw = await fsp.readFile(abs);
    const gz = zlib.gzipSync(raw);
    res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': gz.length, Vary: 'Accept-Encoding' });
    res.end(req.method === 'HEAD' ? undefined : gz);
    return true;
  }
  res.writeHead(200, { ...headers, 'Content-Length': st.size });
  if (req.method === 'HEAD') { res.end(); return true; }
  fs.createReadStream(abs).pipe(res);
  return true;
}

const safeJoin = (base, urlPath) => {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { decoded = urlPath; }
  const abs = path.resolve(base, '.' + path.posix.normalize('/' + decoded));
  return abs.startsWith(path.resolve(base)) ? abs : null;
};

/* ------------------------------------------------------------ SEO / shell */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let SHELL = '';
async function loadShell() { SHELL = await fsp.readFile(path.join(PUBLIC, 'index.html'), 'utf8'); }

function renderShell(pathname, lang) {
  const key = SEO[pathname] ? pathname
    : (pathname.startsWith('/stats/player/') ? '/stats/player'
      : pathname.startsWith('/stats/alliance/') ? '/stats/alliance'
        : pathname.startsWith('/news/') ? '/news/post' : '/');
  const meta = seoFor(SEO[key] ? key : '/', lang);
  const canonical = ORIGIN + (pathname === '/' ? '/' : pathname);
  const alt = lang === 'ru' ? 'en' : 'ru';

  const jsonld = JSON.stringify([
    {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: SITE.name[lang], alternateName: [SITE.name.ru, SITE.name.en, 'Кraken Chronicles', 'CoD DB', 'Tamaris War Stats'],
      url: ORIGIN + '/', inLanguage: lang, description: SITE.description[lang],
      potentialAction: { '@type': 'SearchAction', target: `${ORIGIN}/stats/players?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
    {
      '@context': 'https://schema.org', '@type': 'WebApplication',
      name: lang === 'ru' ? 'Конструктор питомцев Call of Dragons' : 'Call of Dragons War Pet Builder',
      applicationCategory: 'GameApplication', operatingSystem: 'Web',
      url: ORIGIN + '/pets/builder',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      about: { '@type': 'VideoGame', name: 'Call of Dragons' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name[lang], item: ORIGIN + '/' },
        ...(key !== '/' ? [{ '@type': 'ListItem', position: 2, name: meta.title.split('—')[0].trim(), item: canonical }] : []),
      ],
    },
  ]);

  const head = `
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta name="keywords" content="${esc(meta.keywords)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="alternate" hreflang="ru" href="${esc(canonical)}?lang=ru">
  <link rel="alternate" hreflang="en" href="${esc(canonical)}?lang=en">
  <link rel="alternate" hreflang="x-default" href="${esc(canonical)}">
  <meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE.name[lang])}">
  <meta property="og:locale" content="${lang === 'ru' ? 'ru_RU' : 'en_US'}">
  <meta property="og:locale:alternate" content="${alt === 'ru' ? 'ru_RU' : 'en_US'}">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ORIGIN)}/static/img/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(meta.title)}">
  <meta name="twitter:description" content="${esc(meta.description)}">
  <meta name="twitter:image" content="${esc(ORIGIN)}/static/img/og-cover.svg">
  <script type="application/ld+json">${jsonld}</script>`;

  // Crawlable nav + an H1, so the page carries real text before JS runs.
  const navHtml = NAV.map((g) =>
    `<li>${esc(g.label[lang])}<ul>${g.items.filter((i) => !i.hidden && !i.adminOnly)
      .map((i) => `<li><a href="${i.path}">${esc(i.label[lang])}</a></li>`).join('')}</ul></li>`).join('');

  return SHELL
    .replace('<!--HEAD-->', head)
    .replace('<!--NOSCRIPT-->', `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p><nav><ul>${navHtml}</ul></nav>`)
    .replace('<!--LANG-->', lang)
    .replace(/__LANG__/g, lang);
}

function publishedNewsSlugs() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'site', 'news.json'), 'utf8'));
    return (data.items || []).filter((it) => it.published && it.slug).map((it) => `/news/${it.slug}`);
  } catch { return []; }
}

function sitemap() {
  const paths = [...publicRoutes(), ...publishedNewsSlugs()];
  const urls = paths.map((p) => `  <url>
    <loc>${ORIGIN}${p}</loc>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : p === '/pets/builder' ? '0.9' : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${ORIGIN}${p}?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${p}?lang=en"/>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

/* ------------------------------------------------------------------ server */
await loadShell();
const seeded = ensureAdmin();

const server = http.createServer(async (req, res) => {
  const ctx = { ip: clientIp(req) };
  let url;
  try { url = new URL(req.url, ORIGIN); } catch { return send(res, 400, 'Bad request'); }
  const p = url.pathname;

  try {
    if (p.startsWith('/api/v1')) return await handleApi(req, res, url, ctx);

    if (p === '/robots.txt') {
      return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /profile\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
    }
    if (p === '/sitemap.xml') return send(res, 200, sitemap(), MIME['.xml']);

    // Static assets of the unified SPA.
    if (p.startsWith('/static/') || p.startsWith('/data/')) {
      const abs = safeJoin(PUBLIC, p);
      if (abs && await sendFile(req, res, abs, { cache: p.startsWith('/data/') ? 'public, max-age=300' : 'public, max-age=86400' })) return;
      return send(res, 404, 'Not found');
    }

    // The original War Pet Builder mirror, served untouched at /warpets.
    if (p === '/warpets' || p.startsWith('/warpets/')) {
      const rel = p.replace(/^\/warpets/, '') || '/';
      const abs = safeJoin(MIRROR, '/warpets' + (rel === '/' ? '' : rel));
      if (abs && await sendFile(req, res, abs, { cache: 'no-cache' })) return;
      const alt = safeJoin(MIRROR, rel);
      if (alt && await sendFile(req, res, alt)) return;
      return send(res, 404, 'Not found');
    }
    // The builder requests /api/heroes/ ; the mirror stores it as /api/heroes.json.
    if (p === '/api/heroes' || p === '/api/heroes/') {
      const abs = safeJoin(MIRROR, '/api/heroes.json');
      if (abs && await sendFile(req, res, abs)) return;
    }
    if (MIRROR_PREFIXES.some((pre) => p === pre || p.startsWith(pre))) {
      const abs = safeJoin(MIRROR, p);
      if (abs && await sendFile(req, res, abs)) return;
      return send(res, 404, 'Not found');
    }

    // Everything else is an SPA route: render the shell with route-specific SEO.
    if (req.method === 'GET' || req.method === 'HEAD') {
      const { user, cookies } = identify(req);
      const lang = url.searchParams.get('lang') === 'en' ? 'en'
        : url.searchParams.get('lang') === 'ru' ? 'ru'
          : (cookies.kc_lang === 'en' ? 'en' : user?.lang === 'en' ? 'en' : 'ru');
      const html = renderShell(p, lang);
      const status = SEO[p] || p === '/' || p.startsWith('/stats/player/') || p.startsWith('/stats/alliance/') || p.startsWith('/news/') ? 200 : 404;
      if (req.method === 'GET' && !p.startsWith('/admin')) {
        try { Visits.add({ path: p, userId: user?.id, guestId: cookies.kc_guest, ip: ctx.ip, ua: req.headers['user-agent'] || '', ref: req.headers.referer || '' }); } catch { /* analytics must never break a page */ }
      }
      return send(res, status, req.method === 'HEAD' ? '' : html, MIME['.html'], { 'Cache-Control': 'no-cache' });
    }

    return send(res, 405, 'Method not allowed');
  } catch (err) {
    console.error('[server]', p, err);
    if (!res.headersSent) send(res, 500, 'Internal error');
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  ⚓  ${SITE.name.ru} / ${SITE.name.en}`);
  console.log(`      ${ORIGIN}`);
  console.log(`      ${SITE.tagline.ru}\n`);
  if (seeded) {
    console.log('  Создан администратор по умолчанию / default admin account created:');
    console.log(`      email:    ${seeded.email}`);
    console.log(`      password: ${seeded.password}`);
    console.log('  Смените пароль после первого входа (Профиль → Сменить пароль).\n');
  }
});

process.on('SIGINT', () => { console.log('\nbye'); server.close(() => process.exit(0)); });
