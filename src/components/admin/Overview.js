'use client';

import { useEffect, useState } from 'react';
import { supabase, unwrap, getAvailability } from '@/lib/supabase';
import { formatTime, today } from '@/lib/format';
import { ACTIVE_STATUSES, PanelHead, ReservationTable, StatusBadge } from './shared';
import { useToast } from './Toast';

export default function Overview({ stats, tick, onRefresh, onOpen }) {
  const [avail, setAvail] = useState([]);
  const [tonight, setTonight] = useState([]);
  const [pending, setPending] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const d = today();
    Promise.all([
      getAvailability(d),
      supabase.from('reservations').select('*').eq('date', d).in('status', ACTIVE_STATUSES).order('seating').then(unwrap),
      supabase.from('reservations').select('*').eq('status', 'pending').gte('date', d).order('date').order('seating').limit(20).then(unwrap),
    ])
      .then(([a, t, p]) => { setAvail(a); setTonight(t); setPending(p); })
      .catch((e) => toast(e.message, true));
  }, [tick, toast]);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="panel">
      <PanelHead eyebrow="Overview" title={todayLabel} onRefresh={onRefresh} />

      <div className="stats">
        <Stat label="Tonight's covers" value={stats?.tonight_covers} sub={stats && `${stats.tonight_parties} ${stats.tonight_parties === 1 ? 'party' : 'parties'}`} />
        <Stat label="Next 7 days" value={stats?.week_covers} sub="covers booked" />
        <Stat label="Pending requests" value={stats?.pending} sub="awaiting confirmation" />
        <Stat label="Unread messages" value={stats?.unread_messages} sub="in the inbox" />
      </div>

      <h3 className="sub-head">Tonight&rsquo;s seatings</h3>
      <div className="seatings">
        {avail.map((a) => {
          const list = tonight.filter((r) => r.seating === a.seating);
          const pct = Math.min(100, Math.round((a.booked / a.capacity) * 100));
          return (
            <div className="seating-card" key={a.seating}>
              <header><b>{formatTime(a.seating)}</b><span>{a.booked} / {a.capacity} covers</span></header>
              <div className="bar"><i className={a.remaining === 0 ? 'full' : ''} style={{ width: `${pct}%` }} /></div>
              <ul>
                {list.length ? list.map((r) => (
                  <li key={r.id} onClick={() => onOpen(r.id)} style={{ cursor: 'pointer' }}>
                    <span>{r.name}{r.preference && <small className="small"> · {r.preference}</small>}</span>
                    <span>{r.guests} · <StatusBadge status={r.status} /></span>
                  </li>
                )) : <li className="small">No bookings</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <h3 className="sub-head">Needs attention</h3>
      <ReservationTable rows={pending} empty="No pending requests. All caught up." onOpen={onOpen} />
    </section>
  );
}

const Stat = ({ label, value, sub }) => (
  <div className="stat">
    <span>{label}</span>
    <strong>{value ?? '–'}</strong>
    <small>{sub}</small>
  </div>
);
