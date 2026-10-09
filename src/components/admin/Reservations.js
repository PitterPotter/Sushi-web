'use client';

import { useEffect, useState } from 'react';
import { supabase, unwrap } from '@/lib/supabase';
import { addDays, today } from '@/lib/format';
import { PanelHead, ReservationTable, STATUS_LABEL } from './shared';
import { useToast } from './Toast';

export default function Reservations({ tick, onRefresh, onOpen }) {
  const [filters, setFilters] = useState(() => ({ from: today(), to: addDays(30), status: '', q: '' }));
  const [rows, setRows] = useState(null);
  const toast = useToast();
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const t = setTimeout(() => {
      let q = supabase.from('reservations').select('*').order('date').order('seating').order('created_at');
      if (filters.from) q = q.gte('date', filters.from);
      if (filters.to) q = q.lte('date', filters.to);
      if (filters.status) q = q.eq('status', filters.status);
      const term = filters.q.trim().replace(/[,%()]/g, '');
      if (term) q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
      q.limit(300).then(unwrap).then(setRows).catch((e) => toast(e.message, true));
    }, 250);
    return () => clearTimeout(t);
  }, [filters, tick, toast]);

  return (
    <section className="panel">
      <PanelHead eyebrow="Reservations" title="All bookings" onRefresh={onRefresh} />
      <div className="filters">
        <div className="field"><label htmlFor="f-from">From</label><input type="date" id="f-from" value={filters.from} onChange={set('from')} /></div>
        <div className="field"><label htmlFor="f-to">To</label><input type="date" id="f-to" value={filters.to} onChange={set('to')} /></div>
        <div className="field">
          <label htmlFor="f-status">Status</label>
          <select id="f-status" value={filters.status} onChange={set('status')}>
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="f-q">Search</label><input type="search" id="f-q" placeholder="Name, email or phone" value={filters.q} onChange={set('q')} /></div>
      </div>
      <ReservationTable rows={rows} empty="No reservations match these filters." onOpen={onOpen} />
    </section>
  );
}
