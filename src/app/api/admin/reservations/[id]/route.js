import { getAdminDb } from '@/lib/admin-db';
import { json, requireAdmin, sameOrigin } from '@/lib/admin-auth';


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSITIONS = {
  pending: ['confirmed', 'declined'],
  confirmed: ['seated', 'no_show', 'cancelled'],
  seated: ['confirmed'],
  declined: ['pending'],
  cancelled: ['pending'],
  no_show: ['seated'],
};

export async function GET(_request, { params }) {
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: 'Invalid reservation.' }, 400);
  try {
    const { data, error } = await getAdminDb().from('reservations').select('*').eq('id', id).single();
    if (error) throw error;
    return json(data);
  } catch {
    return json({ error: 'Reservation not found.' }, 404);
  }
}

export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: 'Invalid reservation.' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);
  const patch = {};
  if (body.status !== undefined) {
    if (!Object.hasOwn(TRANSITIONS, body.status)) return json({ error: 'Invalid status.' }, 400);
    patch.status = body.status;
  }
  if (body.admin_notes !== undefined) {
    if (typeof body.admin_notes !== 'string' || body.admin_notes.length > 2000) return json({ error: 'Notes must be 2,000 characters or fewer.' }, 400);
    patch.admin_notes = body.admin_notes;
  }
  if (!Object.keys(patch).length) return json({ error: 'No changes provided.' }, 400);

  try {
    const db = getAdminDb();
    if (patch.status) {
      const current = await db.from('reservations').select('status').eq('id', id).single();
      if (current.error) throw current.error;
      if (!TRANSITIONS[current.data.status]?.includes(patch.status)) return json({ error: 'That status change is not allowed.' }, 409);
    }
    const { data, error } = await db.from('reservations').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return json(data);
  } catch {
    return json({ error: 'Could not update reservation.' }, 503);
  }
}
