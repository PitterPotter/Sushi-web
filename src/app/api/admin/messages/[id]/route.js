import { getAdminDb } from '@/lib/admin-db';
import { json, requireAdmin, sameOrigin } from '@/lib/admin-auth';


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: 'Invalid message.' }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);
  if (typeof body.read !== 'boolean') return json({ error: 'Invalid read state.' }, 400);
  try {
    const { data, error } = await getAdminDb().from('contact_messages').update({ read: body.read }).eq('id', id).select('*').single();
    if (error) throw error;
    return json(data);
  } catch {
    return json({ error: 'Could not update message.' }, 503);
  }
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  const { id } = await params;
  if (!UUID.test(id)) return json({ error: 'Invalid message.' }, 400);
  try {
    const { error } = await getAdminDb().from('contact_messages').delete().eq('id', id);
    if (error) throw error;
    return json({ deleted: true });
  } catch {
    return json({ error: 'Could not delete message.' }, 503);
  }
}
