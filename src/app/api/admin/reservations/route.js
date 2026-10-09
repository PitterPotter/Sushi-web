import { getAdminDb } from '@/lib/admin-db';
import { json, requireAdmin } from '@/lib/admin-auth';


const STATUSES = ['pending', 'confirmed', 'seated', 'declined', 'cancelled', 'no_show'];
const isDate = (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(request) {
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const params = new URL(request.url).searchParams;
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const status = params.get('status') || '';
  const rawTerm = params.get('q') || '';
  const term = rawTerm.trim().replace(/[^\p{L}\p{N}\s@.+-]/gu, '').slice(0, 100);

  if (!isDate(from) || !isDate(to) || (status && !STATUSES.includes(status))) return json({ error: 'Invalid filters.' }, 400);

  try {
    const db = getAdminDb();
    let query = db.from('reservations').select('*').order('date').order('seating').order('created_at');
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (status) query = query.eq('status', status);
    if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    const { data, error } = await query.limit(300);
    if (error) throw error;
    return json(data);
  } catch {
    return json({ error: 'Could not load reservations.' }, 503);
  }
}
