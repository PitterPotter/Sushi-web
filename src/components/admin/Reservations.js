'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
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
      const params = new URLSearchParams(filters);
      adminFetch(`/api/admin/reservations?${params}`).then(setRows).catch((e) => toast(e.message, true));
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
