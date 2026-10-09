import 'server-only';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { getAdminDb } from './admin-db';

const scrypt = promisify(scryptCallback);
const COOKIE = 'kaiseki_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;

function equalText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Admin session secret is not configured.');
  return secret;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function hasAdminConfig() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.ADMIN_SESSION_SECRET &&
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function verifyAdminCredentials(username, password) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !encoded) throw new Error('Admin credentials are not configured.');

  const [scheme, nText, rText, pText, salt, expected] = encoded.split('$');
  if (scheme !== 'scrypt' || nText !== '16384' || rText !== '8' || pText !== '1' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) {
    throw new Error('Admin password hash is invalid.');
  }

  const actual = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const validPassword = timingSafeEqual(actual, Buffer.from(expected, 'hex'));
  return equalText(username, expectedUsername) && validPassword;
}

function sessionHash(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token) ? sign(token) : null;
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  const hash = sessionHash(token);
  if (!hash) return null;
  const { data, error } = await getAdminDb()
    .from('admin_sessions')
    .select('username')
    .eq('session_hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data?.username === process.env.ADMIN_USERNAME ? { username: data.username } : null;
}

export async function setAdminSession(username) {
  const store = await cookies();
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const db = getAdminDb();
  const cleanup = await db.from('admin_sessions').delete().lt('expires_at', new Date(now).toISOString());
  if (cleanup.error) throw cleanup.error;
  const { error } = await db.from('admin_sessions').insert({
    session_hash: sign(token),
    username,
    expires_at: new Date(now + SESSION_SECONDS * 1000).toISOString(),
  });
  if (error) throw error;
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  const hash = sessionHash(store.get(COOKIE)?.value);
  store.delete(COOKIE);
  if (!hash) return;
  const { error } = await getAdminDb().from('admin_sessions').delete().eq('session_hash', hash);
  if (error) throw error;
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store, private', ...headers } });
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  try {
    return await getAdminSession();
  } catch {
    return null;
  }
}

export function clientIpHash(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = request.headers.get('x-real-ip') || forwarded?.split(',').at(-1)?.trim() || 'unknown';
  return createHmac('sha256', sessionSecret()).update(ip).digest('hex');
}

export async function checkLoginRateLimit(ipHash) {
  const db = getAdminDb();
  const expired = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const cleanup = await db.from('admin_login_attempts').delete().eq('ip_hash', ipHash).lt('created_at', expired);
  if (cleanup.error) throw cleanup.error;
  const result = await db.from('admin_login_attempts').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', cutoff);
  if (result.error) throw result.error;
  return (result.count || 0) < RATE_MAX;
}

export async function recordLoginFailure(ipHash) {
  const { error } = await getAdminDb().from('admin_login_attempts').insert({ ip_hash: ipHash });
  if (error) throw error;
}

export async function clearLoginFailures(ipHash) {
  const { error } = await getAdminDb().from('admin_login_attempts').delete().eq('ip_hash', ipHash);
  if (error) throw error;
}
