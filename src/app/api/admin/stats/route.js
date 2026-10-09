import { getAdminDb } from '@/lib/admin-db';
import { json, requireAdmin } from '@/lib/admin-auth';


export async function GET() {
  if (!(await requireAdmin())) return json({ error: 'Authentication required.' }, 401);
  try {
    const { data, error } = await getAdminDb().rpc('admin_stats');
    if (error) throw error;
    return json(data);
  } catch {
    return json({ error: 'Could not load dashboard statistics.' }, 503);
  }
}
