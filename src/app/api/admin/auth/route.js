import {
  checkLoginRateLimit,
  clearAdminSession,
  clearLoginFailures,
  clientIpHash,
  hasAdminConfig,
  json,
  recordLoginFailure,
  sameOrigin,
  setAdminSession,
  verifyAdminCredentials,
  getAdminSession,
} from '@/lib/admin-auth';


export async function GET() {
  if (!hasAdminConfig()) return json({ error: 'Admin login is not configured.' }, 503);
  try {
    const session = await getAdminSession();
    return json({ authenticated: Boolean(session), username: session?.username || null });
  } catch {
    return json({ error: 'Admin login is not configured.' }, 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!hasAdminConfig()) return json({ error: 'Admin login is not configured.' }, 503);

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) return json({ error: 'Invalid request.' }, 400);
  const username = typeof credentials.username === 'string' ? credentials.username.trim().slice(0, 100) : '';
  const password = typeof credentials.password === 'string' ? credentials.password.slice(0, 1024) : '';
  if (!username || !password) return json({ error: 'Enter your username and password.' }, 400);

  try {
    const ipHash = clientIpHash(request);
    if (!(await checkLoginRateLimit(ipHash))) {
      return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429, { 'Retry-After': '900' });
    }

    if (!(await verifyAdminCredentials(username, password))) {
      await recordLoginFailure(ipHash);
      return json({ error: 'Invalid username or password.' }, 401);
    }

    await clearLoginFailures(ipHash);
    await setAdminSession(process.env.ADMIN_USERNAME);
    return json({ authenticated: true, username: process.env.ADMIN_USERNAME });
  } catch {
    return json({ error: 'Admin login is temporarily unavailable.' }, 503);
  }
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  try {
    await clearAdminSession();
    return json({ authenticated: false });
  } catch {
    return json({ error: 'Could not sign out.' }, 500);
  }
}
