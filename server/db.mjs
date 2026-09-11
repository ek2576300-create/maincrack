// Kraken Chronicles 888 — SQLite layer (built-in node:sqlite, no external deps)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.KC_DATA_DIR || path.join(process.cwd(), 'server', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
export const DB_FILE = path.join(DATA_DIR, 'kraken888.sqlite');

export const db = new DatabaseSync(DB_FILE);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  pass_hash     TEXT    NOT NULL,
  pass_salt     TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user',      -- user | admin
  lang          TEXT    NOT NULL DEFAULT 'ru',
  status        TEXT    NOT NULL DEFAULT 'active',    -- active | blocked
  game_server   TEXT    DEFAULT '',
  game_nick     TEXT    DEFAULT '',
  created_at    TEXT    NOT NULL,
  last_seen_at  TEXT,
  last_ip       TEXT,
  last_ua       TEXT,
  visits        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip         TEXT,
  ua         TEXT
);

CREATE TABLE IF NOT EXISTS threads (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  guest_id       TEXT,
  display_name   TEXT NOT NULL,
  contact        TEXT DEFAULT '',
  subject        TEXT NOT NULL DEFAULT 'idea',        -- idea | bug | question | other
  status         TEXT NOT NULL DEFAULT 'open',        -- open | answered | closed
  lang           TEXT NOT NULL DEFAULT 'ru',
  page           TEXT DEFAULT '',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  unread_admin   INTEGER NOT NULL DEFAULT 0,
  unread_user    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id   INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL,                          -- user | admin | system
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  path       TEXT NOT NULL,
  user_id    INTEGER,
  guest_id   TEXT,
  ip         TEXT,
  ua         TEXT,
  ref        TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_msg_thread  ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thr_updated ON threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_thr_guest   ON threads(guest_id);
CREATE INDEX IF NOT EXISTS idx_visit_time  ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sess_user   ON sessions(user_id);
`);

export const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ users */
export const Users = {
  byEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase()),
  byId: (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
  create({ email, name, hash, salt, role = 'user', lang = 'ru' }) {
    const info = db.prepare(
      `INSERT INTO users (email,name,pass_hash,pass_salt,role,lang,created_at,last_seen_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(String(email).toLowerCase(), name, hash, salt, role, lang, now(), now());
    return Users.byId(info.lastInsertRowid);
  },
  touch(id, ip, ua) {
    db.prepare('UPDATE users SET last_seen_at=?, last_ip=?, last_ua=?, visits=visits+1 WHERE id=?')
      .run(now(), ip || '', ua || '', id);
  },
  list({ q = '', limit = 200, offset = 0 } = {}) {
    const like = `%${q}%`;
    return db.prepare(
      `SELECT id,email,name,role,lang,status,game_server,game_nick,created_at,last_seen_at,last_ip,visits
       FROM users
       WHERE (? = '' OR email LIKE ? OR name LIKE ? OR game_nick LIKE ?)
       ORDER BY id DESC LIMIT ? OFFSET ?`
    ).all(q, like, like, like, limit, offset);
  },
  count: () => db.prepare('SELECT COUNT(*) c FROM users').get().c,
  setRole: (id, role) => db.prepare('UPDATE users SET role=? WHERE id=?').run(role, id),
  setStatus: (id, status) => db.prepare('UPDATE users SET status=? WHERE id=?').run(status, id),
  updateProfile: (id, { name, lang, game_server, game_nick }) =>
    db.prepare('UPDATE users SET name=COALESCE(?,name), lang=COALESCE(?,lang), game_server=COALESCE(?,game_server), game_nick=COALESCE(?,game_nick) WHERE id=?')
      .run(name ?? null, lang ?? null, game_server ?? null, game_nick ?? null, id),
  remove: (id) => db.prepare('DELETE FROM users WHERE id=?').run(id),
};

/* --------------------------------------------------------------- sessions */
export const Sessions = {
  create(token, userId, ip, ua, days = 30) {
    const exp = new Date(Date.now() + days * 864e5).toISOString();
    db.prepare('INSERT INTO sessions (token,user_id,created_at,expires_at,ip,ua) VALUES (?,?,?,?,?,?)')
      .run(token, userId, now(), exp, ip || '', ua || '');
  },
  get(token) {
    if (!token) return null;
    const s = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
    if (!s) return null;
    if (s.expires_at < now()) { Sessions.remove(token); return null; }
    return s;
  },
  remove: (token) => db.prepare('DELETE FROM sessions WHERE token=?').run(token),
  removeForUser: (id) => db.prepare('DELETE FROM sessions WHERE user_id=?').run(id),
  activeCount: () => db.prepare("SELECT COUNT(DISTINCT user_id) c FROM sessions WHERE expires_at > ?").get(now()).c,
};

/* -------------------------------------------------------- support threads */
export const Threads = {
  create({ userId, guestId, displayName, contact, subject, lang, page }) {
    const t = now();
    const info = db.prepare(
      `INSERT INTO threads (user_id,guest_id,display_name,contact,subject,lang,page,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(userId ?? null, guestId ?? null, displayName, contact || '', subject || 'idea', lang || 'ru', page || '', t, t);
    return Threads.byId(info.lastInsertRowid);
  },
  byId: (id) => db.prepare('SELECT * FROM threads WHERE id=?').get(id),
  findOpenFor({ userId, guestId }) {
    if (userId) return db.prepare("SELECT * FROM threads WHERE user_id=? AND status!='closed' ORDER BY id DESC LIMIT 1").get(userId);
    if (guestId) return db.prepare("SELECT * FROM threads WHERE guest_id=? AND status!='closed' ORDER BY id DESC LIMIT 1").get(guestId);
    return null;
  },
  list({ status = '', q = '', limit = 200 } = {}) {
    const like = `%${q}%`;
    return db.prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM messages m WHERE m.thread_id=t.id) AS msg_count,
              (SELECT body FROM messages m WHERE m.thread_id=t.id ORDER BY m.id DESC LIMIT 1) AS last_body
       FROM threads t
       WHERE (? = '' OR t.status = ?)
         AND (? = '' OR t.display_name LIKE ? OR t.contact LIKE ?
              OR EXISTS (SELECT 1 FROM messages m WHERE m.thread_id=t.id AND m.body LIKE ?))
       ORDER BY t.unread_admin DESC, t.updated_at DESC LIMIT ?`
    ).all(status, status, q, like, like, like, limit);
  },
  setStatus: (id, status) => db.prepare('UPDATE threads SET status=?, updated_at=? WHERE id=?').run(status, now(), id),
  markReadByAdmin: (id) => db.prepare('UPDATE threads SET unread_admin=0 WHERE id=?').run(id),
  markReadByUser: (id) => db.prepare('UPDATE threads SET unread_user=0 WHERE id=?').run(id),
  remove: (id) => db.prepare('DELETE FROM threads WHERE id=?').run(id),
  unreadCount: () => db.prepare('SELECT COUNT(*) c FROM threads WHERE unread_admin > 0').get().c,
  count: () => db.prepare('SELECT COUNT(*) c FROM threads').get().c,
};

export const Messages = {
  add({ threadId, role, name, body }) {
    const t = now();
    const info = db.prepare(
      'INSERT INTO messages (thread_id,author_role,author_name,body,created_at) VALUES (?,?,?,?,?)'
    ).run(threadId, role, name, body, t);
    if (role === 'user') {
      db.prepare("UPDATE threads SET updated_at=?, unread_admin=unread_admin+1, status=CASE WHEN status='closed' THEN 'open' ELSE status END WHERE id=?").run(t, threadId);
    } else {
      db.prepare("UPDATE threads SET updated_at=?, unread_user=unread_user+1, status='answered' WHERE id=?").run(t, threadId);
    }
    return db.prepare('SELECT * FROM messages WHERE id=?').get(info.lastInsertRowid);
  },
  forThread: (id) => db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY id ASC').all(id),
  count: () => db.prepare('SELECT COUNT(*) c FROM messages').get().c,
};

/* ----------------------------------------------------------------- visits */
export const Visits = {
  add({ path: p, userId, guestId, ip, ua, ref }) {
    db.prepare('INSERT INTO visits (path,user_id,guest_id,ip,ua,ref,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(p, userId ?? null, guestId ?? null, ip || '', ua || '', ref || '', now());
  },
  stats(days = 14) {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    return {
      byDay: db.prepare("SELECT substr(created_at,1,10) d, COUNT(*) c, COUNT(DISTINCT COALESCE(user_id, guest_id)) u FROM visits WHERE created_at > ? GROUP BY d ORDER BY d").all(since),
      topPages: db.prepare('SELECT path, COUNT(*) c FROM visits WHERE created_at > ? GROUP BY path ORDER BY c DESC LIMIT 15').all(since),
      total: db.prepare('SELECT COUNT(*) c FROM visits').get().c,
      uniques: db.prepare('SELECT COUNT(DISTINCT COALESCE(user_id, guest_id)) c FROM visits WHERE created_at > ?').get(since).c,
    };
  },
  prune(days = 90) {
    db.prepare('DELETE FROM visits WHERE created_at < ?').run(new Date(Date.now() - days * 864e5).toISOString());
  },
};
