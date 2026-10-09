import { getAdminDb } from '@/lib/admin-db';
import { json, requireAdmin } from '@/lib/admin-auth';


const ACTIVE = ['pending', 'confirmed', 'seated'];

export async function GET(request) {
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const date = new URL(request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Invalid date.' }, 400);

  try {
    const db = getAdminDb();
    const [availability, tonight, pending] = await Promise.all([
      db.rpc('get_availability', { p_date: date }),
      db.from('reservations').select('*').eq('date', date).in('status', ACTIVE).order('seating'),
      db.from('reservations').select('*').eq('status', 'pending').gte('date', date).order('date').order('seating').limit(20),
    ]);
    if (availability.error || tonight.error || pending.error) throw new Error('Dashboard query failed.');
    return json({ availability: availability.data, tonight: tonight.data, pending: pending.data });
  } catch {
    return json({ error: 'Could not load tonight’s reservations.' }, 503);
  }
}
