// Password hashing + session helpers. Uses only node:crypto.
import crypto from 'node:crypto';
import { Users, Sessions } from './db.mjs';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  }).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, salt, expected) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const newToken = () => crypto.randomBytes(32).toString('hex');
export const newGuestId = () => 'g_' + crypto.randomBytes(12).toString('hex');

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); }
    catch { out[k] = part.slice(i + 1).trim(); }
  }
  return out;
}

export function cookie(name, value, { maxAge = 30 * 864e2, httpOnly = true, secure = false } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${Math.floor(maxAge)}`;
  if (httpOnly) c += '; HttpOnly';
  if (secure) c += '; Secure';
  return c;
}

export const clearCookie = (name) => `${name}=; Path=/; Max-Age=0`;

/** Resolve the current visitor: logged-in user (if any) + a stable guest id. */
export function identify(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = Sessions.get(cookies.kc_session);
  let user = null;
  if (session) {
    user = Users.byId(session.user_id);
    if (user && user.status === 'blocked') { Sessions.remove(session.token); user = null; }
  }
  return { user, guestId: cookies.kc_guest || null, cookies };
}

export const isAdmin = (user) => !!user && user.role === 'admin';

/** Seed the first administrator so the panel is reachable on a fresh database. */
export function ensureAdmin() {
  if (Users.count() > 0) return null;
  const email = process.env.KC_ADMIN_EMAIL || 'admin@kraken888.local';
  const password = process.env.KC_ADMIN_PASSWORD || 'kraken888';
  const { hash, salt } = hashPassword(password);
  Users.create({ email, name: 'Admin', hash, salt, role: 'admin', lang: 'ru' });
  return { email, password };
}
