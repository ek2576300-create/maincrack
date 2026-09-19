// REST API — /api/v1/*
import { Users, Sessions, Threads, Messages, Visits, db, now } from './db.mjs';
import { hashPassword, verifyPassword, newToken, newGuestId, identify, isAdmin, cookie, clearCookie } from './auth.mjs';
import { getVideos } from './youtube.mjs';

const MAX_BODY = 64 * 1024;

export function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

const clean = (v, max = 400) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMultiline = (v, max = 4000) => String(v ?? '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || ''));

const publicUser = (u) => u && ({
  id: u.id, email: u.email, name: u.name, role: u.role, lang: u.lang, status: u.status,
  gameServer: u.game_server, gameNick: u.game_nick, createdAt: u.created_at,
});

/* ------------------------------------------------------- simple rate limit */
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const t = Date.now();
  const b = buckets.get(key);
  if (!b || t > b.reset) { buckets.set(key, { n: 1, reset: t + windowMs }); return true; }
  if (b.n >= limit) return false;
  b.n++;
  return true;
}
setInterval(() => {
  const t = Date.now();
  for (const [k, b] of buckets) if (t > b.reset) buckets.delete(k);
}, 60_000).unref?.();

/* ------------------------------------------------------------------ router */
export async function handleApi(req, res, url, ctx) {
  const p = url.pathname.replace(/^\/api\/v1/, '') || '/';
  const method = req.method.toUpperCase();
  const { user, guestId } = identify(req);
  const ip = ctx.ip;
  const ua = req.headers['user-agent'] || '';
  const setCookies = [];

  // Every visitor gets a stable guest id so anonymous support threads survive reloads.
  let gid = guestId;
  if (!gid) { gid = newGuestId(); setCookies.push(cookie('kc_guest', gid, { httpOnly: false, maxAge: 365 * 864e2 })); }

  const json = (status, payload) => {
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (setCookies.length) headers['Set-Cookie'] = setCookies;
    res.writeHead(status, headers);
    res.end(body);
  };
  const bad = (msg, status = 400) => json(status, { error: msg });
  const needAuth = () => { json(401, { error: 'auth_required' }); return null; };
  const needAdmin = () => { json(403, { error: 'admin_required' }); return null; };

  let body = {};
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    try { body = await readJson(req); }
    catch (e) { return bad(e.message); }
  }

  /* ------------------------------------------------------- public content */
  // Лента YouTube-канала: RSS + curated public/data/site/videos.json.
  // Публичный GET — им пользуются главная и /videos.
  if (p === '/youtube/videos' && method === 'GET') {
    if (!rateLimit('yt:' + ip, 120, 60_000)) return bad('too_many_requests', 429);
    const data = await getVideos({ force: url.searchParams.get('force') === '1' && isAdmin(user) });
    return json(200, data);
  }

  /* ---------------------------------------------------------------- auth */
  if (p === '/auth/register' && method === 'POST') {
    if (!rateLimit('reg:' + ip, 8, 60 * 60_000)) return bad('too_many_requests', 429);
    const email = clean(body.email, 190).toLowerCase();
    const name = clean(body.name, 60) || email.split('@')[0];
    const password = String(body.password || '');
    if (!isEmail(email)) return bad('bad_email');
    if (password.length < 6) return bad('weak_password');
    if (Users.byEmail(email)) return bad('email_taken', 409);
    const { hash, salt } = hashPassword(password);
    const role = Users.count() === 0 ? 'admin' : 'user';        // first account owns the site
    const u = Users.create({ email, name, hash, salt, role, lang: body.lang === 'en' ? 'en' : 'ru' });
    const token = newToken();
    Sessions.create(token, u.id, ip, ua);
    setCookies.push(cookie('kc_session', token));
    // Adopt any anonymous support thread this browser already started.
    if (gid) db.prepare('UPDATE threads SET user_id=? WHERE guest_id=? AND user_id IS NULL').run(u.id, gid);
    return json(200, { user: publicUser(u) });
  }

  if (p === '/auth/login' && method === 'POST') {
    if (!rateLimit('login:' + ip, 20, 15 * 60_000)) return bad('too_many_requests', 429);
    const u = Users.byEmail(clean(body.email, 190));
    if (!u || !verifyPassword(String(body.password || ''), u.pass_salt, u.pass_hash)) return bad('bad_credentials', 401);
    if (u.status === 'blocked') return bad('blocked', 403);
    const token = newToken();
    Sessions.create(token, u.id, ip, ua);
    Users.touch(u.id, ip, ua);
    setCookies.push(cookie('kc_session', token));
    if (gid) db.prepare('UPDATE threads SET user_id=? WHERE guest_id=? AND user_id IS NULL').run(u.id, gid);
    return json(200, { user: publicUser(u) });
  }

  if (p === '/auth/logout' && method === 'POST') {
    const { cookies } = identify(req);
    if (cookies.kc_session) Sessions.remove(cookies.kc_session);
    setCookies.push(clearCookie('kc_session'));
    return json(200, { ok: true });
  }

  if (p === '/auth/me' && method === 'GET') {
    return json(200, { user: publicUser(user), guestId: gid });
  }

  if (p === '/auth/profile' && method === 'POST') {
    if (!user) return needAuth();
    Users.updateProfile(user.id, {
      name: body.name != null ? clean(body.name, 60) : null,
      lang: body.lang === 'en' || body.lang === 'ru' ? body.lang : null,
      game_server: body.gameServer != null ? clean(body.gameServer, 20) : null,
      game_nick: body.gameNick != null ? clean(body.gameNick, 60) : null,
    });
    return json(200, { user: publicUser(Users.byId(user.id)) });
  }

  if (p === '/auth/password' && method === 'POST') {
    if (!user) return needAuth();
    if (!verifyPassword(String(body.current || ''), user.pass_salt, user.pass_hash)) return bad('bad_credentials', 401);
    const next = String(body.next || '');
    if (next.length < 6) return bad('weak_password');
    const { hash, salt } = hashPassword(next);
    db.prepare('UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?').run(hash, salt, user.id);
    return json(200, { ok: true });
  }

  /* ------------------------------------------------------------- support */
  // The floating "Выслушаем ваши идеи" widget. Works for guests too.
  if (p === '/support/thread' && method === 'GET') {
    const t = Threads.findOpenFor({ userId: user?.id, guestId: gid });
    if (!t) return json(200, { thread: null, messages: [] });
    Threads.markReadByUser(t.id);
    return json(200, { thread: t, messages: Messages.forThread(t.id) });
  }

  if (p === '/support/message' && method === 'POST') {
    if (!rateLimit('msg:' + ip, 30, 10 * 60_000)) return bad('too_many_requests', 429);
    const text = cleanMultiline(body.body, 4000);
    if (text.length < 2) return bad('empty_message');
    let t = Threads.findOpenFor({ userId: user?.id, guestId: gid });
    if (!t) {
      t = Threads.create({
        userId: user?.id, guestId: gid,
        displayName: user?.name || clean(body.name, 60) || 'Гость',
        contact: user?.email || clean(body.contact, 190),
        subject: ['idea', 'bug', 'question', 'other'].includes(body.subject) ? body.subject : 'idea',
        lang: body.lang === 'en' ? 'en' : 'ru',
        page: clean(body.page, 200),
      });
    }
    const m = Messages.add({ threadId: t.id, role: 'user', name: t.display_name, body: text });
    return json(200, { thread: Threads.byId(t.id), message: m });
  }

  /* --------------------------------------------------------------- admin */
  if (p.startsWith('/admin/')) {
    if (!user) return needAuth();
    if (!isAdmin(user)) return needAdmin();

    if (p === '/admin/overview' && method === 'GET') {
      const byRole = db.prepare('SELECT role, COUNT(*) c FROM users GROUP BY role').all();
      const newUsers7 = db.prepare("SELECT COUNT(*) c FROM users WHERE created_at > ?")
        .get(new Date(Date.now() - 7 * 864e5).toISOString()).c;
      const online = db.prepare("SELECT COUNT(*) c FROM users WHERE last_seen_at > ?")
        .get(new Date(Date.now() - 15 * 60_000).toISOString()).c;
      return json(200, {
        users: Users.count(), byRole, newUsers7, online,
        sessions: Sessions.activeCount(),
        threads: Threads.count(), unread: Threads.unreadCount(), messages: Messages.count(),
        visits: Visits.stats(14),
        signupsByDay: db.prepare("SELECT substr(created_at,1,10) d, COUNT(*) c FROM users GROUP BY d ORDER BY d DESC LIMIT 30").all().reverse(),
      });
    }

    if (p === '/admin/users' && method === 'GET') {
      return json(200, {
        items: Users.list({ q: clean(url.searchParams.get('q') || '', 60), limit: 500 }),
        total: Users.count(),
      });
    }

    if (p === '/admin/user' && method === 'PATCH') {
      const id = Number(body.id);
      const target = Users.byId(id);
      if (!target) return bad('not_found', 404);
      if (target.id === user.id && (body.role === 'user' || body.status === 'blocked')) return bad('cannot_demote_self');
      if (body.role === 'admin' || body.role === 'user') Users.setRole(id, body.role);
      if (body.status === 'active' || body.status === 'blocked') {
        Users.setStatus(id, body.status);
        if (body.status === 'blocked') Sessions.removeForUser(id);
      }
      return json(200, { user: publicUser(Users.byId(id)) });
    }

    if (p === '/admin/user' && method === 'DELETE') {
      const id = Number(body.id);
      if (id === user.id) return bad('cannot_delete_self');
      Users.remove(id);
      return json(200, { ok: true });
    }

    if (p === '/admin/threads' && method === 'GET') {
      return json(200, {
        items: Threads.list({
          status: clean(url.searchParams.get('status') || '', 20),
          q: clean(url.searchParams.get('q') || '', 80),
        }),
        unread: Threads.unreadCount(),
      });
    }

    if (p === '/admin/thread' && method === 'GET') {
      const id = Number(url.searchParams.get('id'));
      const t = Threads.byId(id);
      if (!t) return bad('not_found', 404);
      Threads.markReadByAdmin(id);
      return json(200, { thread: Threads.byId(id), messages: Messages.forThread(id), user: publicUser(t.user_id ? Users.byId(t.user_id) : null) });
    }

    if (p === '/admin/reply' && method === 'POST') {
      const id = Number(body.id);
      const t = Threads.byId(id);
      if (!t) return bad('not_found', 404);
      const text = cleanMultiline(body.body, 4000);
      if (text.length < 1) return bad('empty_message');
      const m = Messages.add({ threadId: id, role: 'admin', name: user.name, body: text });
      Threads.markReadByAdmin(id);
      return json(200, { message: m, thread: Threads.byId(id) });
    }

    if (p === '/admin/thread' && method === 'PATCH') {
      const id = Number(body.id);
      if (!Threads.byId(id)) return bad('not_found', 404);
      if (['open', 'answered', 'closed'].includes(body.status)) Threads.setStatus(id, body.status);
      return json(200, { thread: Threads.byId(id) });
    }

    if (p === '/admin/thread' && method === 'DELETE') {
      Threads.remove(Number(body.id));
      return json(200, { ok: true });
    }

    return bad('not_found', 404);
  }

  /* --------------------------------------------------------- pet builds */
  if (p === '/builds' && method === 'GET') {
    if (!user) return needAuth();
    return json(200, { items: db.prepare('SELECT * FROM builds WHERE user_id=? ORDER BY id DESC').all(user.id) });
  }
  if (p === '/builds' && method === 'POST') {
    if (!user) return needAuth();
    const title = clean(body.title, 80) || 'Build';
    const payload = JSON.stringify(body.payload ?? {}).slice(0, 20000);
    const info = db.prepare('INSERT INTO builds (user_id,title,pet,payload,created_at) VALUES (?,?,?,?,?)')
      .run(user.id, title, clean(body.pet, 60), payload, now());
    return json(200, { item: db.prepare('SELECT * FROM builds WHERE id=?').get(info.lastInsertRowid) });
  }
  if (p === '/builds' && method === 'DELETE') {
    if (!user) return needAuth();
    db.prepare('DELETE FROM builds WHERE id=? AND user_id=?').run(Number(body.id), user.id);
    return json(200, { ok: true });
  }

  /* -------------------------------------------------------------- visits */
  if (p === '/track' && method === 'POST') {
    Visits.add({ path: clean(body.path, 200), userId: user?.id, guestId: gid, ip, ua, ref: clean(body.ref, 200) });
    if (user) Users.touch(user.id, ip, ua);
    return json(200, { ok: true });
  }

  return bad('not_found', 404);
}

// Builds table lives here so db.mjs stays focused on the core entities.
db.exec(`
CREATE TABLE IF NOT EXISTS builds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  pet        TEXT DEFAULT '',
  payload    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_builds_user ON builds(user_id);
`);
