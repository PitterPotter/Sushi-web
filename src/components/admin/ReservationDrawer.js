'use client';

import { useEffect, useState } from 'react';
import { supabase, unwrap } from '@/lib/supabase';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import { STATUS_LABEL, StatusBadge } from './shared';
import { useToast } from './Toast';

const TRANSITIONS = {
  pending: ['confirmed', 'declined'],
  confirmed: ['seated', 'no_show', 'cancelled'],
  seated: ['confirmed'],
  declined: ['pending'],
  cancelled: ['pending'],
  no_show: ['seated'],
};
const ACTION_LABEL = { confirmed: 'Confirm', declined: 'Decline', seated: 'Mark seated', no_show: 'No-show', cancelled: 'Cancel booking', pending: 'Reopen' };
const btnClass = (s) =>
  s === 'confirmed' || s === 'seated' ? 'btn-solid' : ['declined', 'cancelled', 'no_show'].includes(s) ? 'btn-danger' : 'btn-ghost';

export default function ReservationDrawer({ id, onClose, onChanged }) {
  const [r, setR] = useState(null);
  const [notes, setNotes] = useState('');
  const toast = useToast();

  useEffect(() => {
    supabase.from('reservations').select('*').eq('id', id).single().then(unwrap)
      .then((row) => { setR(row); setNotes(row.admin_notes || ''); })
      .catch((e) => { toast(e.message, true); onClose(); });
  }, [id, toast, onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function update(patch, msg) {
    try {
      await supabase.from('reservations').update(patch).eq('id', id).then(unwrap);
      toast(msg);
      onChanged();
      onClose();
    } catch (e) {
      toast(e.message, true);
    }
  }

  return (
    <div className="drawer">
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <button className="drawer-close" onClick={onClose} aria-label="Close">×</button>
        {r && (
          <>
            <StatusBadge status={r.status} />
            <h2>{r.name}</h2>
            <span className="small">Requested {formatDateTime(r.created_at)}</span>
            <dl>
              <dt>When</dt><dd>{formatDate(r.date)} · {formatTime(r.seating)}</dd>
              <dt>Party</dt><dd>{r.guests} {r.guests === 1 ? 'guest' : 'guests'}</dd>
              <dt>Contact</dt><dd><a href={`mailto:${r.email}`}>{r.email}</a><br /><a href={`tel:${r.phone}`}>{r.phone}</a></dd>
              <dt>Preference</dt><dd>{r.preference || '—'}</dd>
              <dt>Menu</dt><dd>{r.menu || 'Decide at the counter'}</dd>
              <dt>Guest notes</dt><dd>{r.notes || '—'}</dd>
            </dl>
            <div className="field">
              <label htmlFor="admin-notes">Internal notes</label>
              <textarea id="admin-notes" rows={3} placeholder="Allergies confirmed, seat assignment, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="actions">
              {(TRANSITIONS[r.status] || []).map((s) => (
                <button key={s} className={`btn ${btnClass(s)}`} onClick={() => update({ status: s }, `${r.name} — ${STATUS_LABEL[s]}`)}>
                  {ACTION_LABEL[s]}
                </button>
              ))}
              <button className="btn btn-ghost" onClick={() => update({ admin_notes: notes }, 'Notes saved')}>Save notes</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
