// REST API — /api/v1/*
import { Users, Sessions, Threads, Messages, Visits, Profiles, ProfileItems, db, now } from './db.mjs';
import { isPet, isPetSkill, isHero, UNITS, PLAY_STYLES, CONTACT_KINDS, ARTIFACT_QUALITIES } from './catalog.mjs';
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

/** Целое в заданных границах или null — пустое поле формы это не ноль. */
function intOrNull(v, min, max) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

const oneOf = (v, list) => (list.includes(v) ? v : '');

/** Контакты: до пяти строк вида {kind, value}, всё остальное отбрасываем. */
function cleanContacts(v) {
  if (!Array.isArray(v)) return '[]';
  const out = [];
  for (const row of v.slice(0, 5)) {
    const kind = oneOf(row?.kind, CONTACT_KINDS) || 'other';
    const value = clean(row?.value, 120);
    if (value) out.push({ kind, value });
  }
  return JSON.stringify(out);
}

/** Строка профиля наружу: e-mail и служебные поля не покидают сервер. */
const publicProfile = (u, p, items) => ({
  id: u.id,
  name: u.name,
  gameNick: u.game_nick || u.name,
  gameServer: u.game_server,
  createdAt: u.created_at,
  listed: !!p.listed,
  avatar: p.avatar,
  playerId: p.player_id,
  allianceTag: p.alliance_tag,
  allianceName: p.alliance_name,
  power: p.power, kills: p.kills, merits: p.merits,
  tcLevel: p.tc_level, vipLevel: p.vip_level,
  mainUnit: p.main_unit, playStyle: p.play_style, timezone: p.timezone,
  contacts: JSON.parse(p.contacts || '[]'),
  about: p.about,
  updatedAt: p.updated_at,
  items: (items || []).map(publicItem),
});

const publicItem = (it) => ({
  id: it.id, kind: it.kind, name: it.name, level: it.level, stars: it.stars,
  extra: JSON.parse(it.extra || '{}'), note: it.note, position: it.position,
});

/**
 * extra у каждого вида свой: у пета — список навыков, у героя — уровни его
 * четырёх навыков, у артефакта — качество. Всё, что не описано здесь,
 * до базы не доходит.
 */
function cleanExtra(kind, raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  if (kind === 'pet') {
    const skills = (Array.isArray(v.skills) ? v.skills : []).slice(0, 8)
      .map((sk) => ({
        name: clean(sk?.name, 60),
        level: intOrNull(sk?.level, 1, 4),
      }))
      .filter((sk) => sk.name && isPetSkill(sk.name));
    return JSON.stringify({ skills });
  }
  if (kind === 'hero') {
    const skills = (Array.isArray(v.skills) ? v.skills : []).slice(0, 4)
      .map((lvl) => intOrNull(lvl, 0, 5));
    return JSON.stringify({ skills, expedition: !!v.expedition });
  }
  return JSON.stringify({ quality: oneOf(v.quality, ARTIFACT_QUALITIES) });
}

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

  /* ------------------------------------------------- каталог аккаунтов */
  // Публичный список: только те профили, которые владелец сам открыл.
  if (p === '/roster' && method === 'GET') {
    if (!rateLimit('roster:' + ip, 120, 60_000)) return bad('too_many_requests', 429);
    const q = url.searchParams;
    const limit = Math.min(60, Math.max(1, Number(q.get('limit')) || 24));
    const offset = Math.max(0, Number(q.get('offset')) || 0);
    const { items, total } = Profiles.list({
      q: clean(q.get('q') || '', 60),
      server: clean(q.get('server') || '', 20),
      unit: oneOf(q.get('unit') || '', UNITS),
      sort: clean(q.get('sort') || '', 20),
      limit, offset,
    });
    return json(200, { items, total, limit, offset, facets: offset ? null : Profiles.facets() });
  }

  // Публичная страница одного аккаунта.
  if (p === '/roster/profile' && method === 'GET') {
    const id = Number(url.searchParams.get('id'));
    const target = Users.byId(id);
    // Владелец и админ видят свою страницу даже закрытой — иначе не
    // посмотреть, как она выглядит, до публикации.
    const maySee = Profiles.isListed(id) || user?.id === id || isAdmin(user);
    if (!target || target.status !== 'active' || !maySee) return bad('not_found', 404);
    return json(200, {
      profile: publicProfile(target, Profiles.byUserId(id), ProfileItems.forUser(id)),
      own: user?.id === id,
    });
  }

  /* --------------------------------------------------------- свой профиль */
  if (p === '/profile/game' && method === 'GET') {
    if (!user) return needAuth();
    return json(200, {
      profile: publicProfile(user, Profiles.byUserId(user.id), ProfileItems.forUser(user.id)),
      limits: { perKind: ProfileItems.MAX_PER_KIND },
    });
  }

  if (p === '/profile/game' && method === 'POST') {
    if (!user) return needAuth();
    if (!rateLimit('profile:' + user.id, 60, 10 * 60_000)) return bad('too_many_requests', 429);

    // Ник и сервер по-прежнему живут в users — каталог ищет по ним.
    if (body.gameNick !== undefined || body.gameServer !== undefined) {
      Users.updateProfile(user.id, {
        name: null, lang: null,
        game_server: body.gameServer !== undefined ? clean(body.gameServer, 20) : null,
        game_nick: body.gameNick !== undefined ? clean(body.gameNick, 60) : null,
      });
    }

    const patch = {};
    const put = (key, value) => { if (value !== undefined) patch[key] = value; };
    put('listed', body.listed === undefined ? undefined : (body.listed ? 1 : 0));
    put('avatar', body.avatar === undefined ? undefined : (isPet(clean(body.avatar, 60)) ? clean(body.avatar, 60) : ''));
    put('player_id', body.playerId === undefined ? undefined : clean(body.playerId, 30));
    put('alliance_tag', body.allianceTag === undefined ? undefined : clean(body.allianceTag, 10));
    put('alliance_name', body.allianceName === undefined ? undefined : clean(body.allianceName, 60));
    put('power', body.power === undefined ? undefined : intOrNull(body.power, 0, 1e12));
    put('kills', body.kills === undefined ? undefined : intOrNull(body.kills, 0, 1e12));
    put('merits', body.merits === undefined ? undefined : intOrNull(body.merits, 0, 1e12));
    put('tc_level', body.tcLevel === undefined ? undefined : intOrNull(body.tcLevel, 1, 30));
    put('vip_level', body.vipLevel === undefined ? undefined : intOrNull(body.vipLevel, 0, 20));
    put('main_unit', body.mainUnit === undefined ? undefined : oneOf(body.mainUnit, UNITS));
    put('play_style', body.playStyle === undefined ? undefined : oneOf(body.playStyle, PLAY_STYLES));
    put('timezone', body.timezone === undefined ? undefined : clean(body.timezone, 40));
    put('contacts', body.contacts === undefined ? undefined : cleanContacts(body.contacts));
    put('about', body.about === undefined ? undefined : cleanMultiline(body.about, 1500));

    const saved = Profiles.save(user.id, patch);
    const fresh = Users.byId(user.id);
    return json(200, { profile: publicProfile(fresh, saved, ProfileItems.forUser(user.id)), user: publicUser(fresh) });
  }

  /* ---------------------------------------- питомцы, герои и артефакты */
  if (p === '/profile/item' && (method === 'POST' || method === 'DELETE')) {
    if (!user) return needAuth();
    if (!rateLimit('item:' + user.id, 120, 10 * 60_000)) return bad('too_many_requests', 429);

    if (method === 'DELETE') {
      ProfileItems.remove(Number(body.id), user.id);
      return json(200, { ok: true });
    }

    const kind = ProfileItems.KINDS.includes(body.kind) ? body.kind : null;
    if (!kind) return bad('bad_kind');

    const name = clean(body.name, 80);
    if (!name) return bad('empty_name');
    // Пет и герой обязаны быть из справочника: на публичной странице у них
    // портрет и характеристики, для произвольной строки их взять негде.
    if (kind === 'pet' && !isPet(name)) return bad('unknown_pet');
    if (kind === 'hero' && !isHero(name)) return bad('unknown_hero');

    const fields = {
      name,
      level: intOrNull(body.level, 1, kind === 'hero' ? 80 : 40),
      stars: intOrNull(body.stars, 0, 6),
      extra: cleanExtra(kind, body.extra),
      note: cleanMultiline(body.note, 300),
    };

    if (body.id) {
      const existing = ProfileItems.byId(Number(body.id), user.id);
      if (!existing) return bad('not_found', 404);
      if (existing.kind !== kind) return bad('bad_kind');
      return json(200, { item: publicItem(ProfileItems.update(existing.id, user.id, fields)) });
    }

    if (ProfileItems.countOf(user.id, kind) >= ProfileItems.MAX_PER_KIND) return bad('too_many_items', 409);
    return json(200, { item: publicItem(ProfileItems.add({ userId: user.id, kind, ...fields })) });
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
        rosterListed: Profiles.listedCount(), profileItems: ProfileItems.count(),
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
      // Снять профиль с публикации, не трогая его содержимое: модерация
      // каталога не должна стирать то, что человек заполнял.
      if (body.listed === false) Profiles.save(id, { listed: 0 });
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
