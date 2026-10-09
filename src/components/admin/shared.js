'use client';

import { formatDate, formatTime } from '@/lib/format';

export const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', seated: 'Seated', declined: 'Declined', cancelled: 'Cancelled', no_show: 'No-show' };
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'seated'];

export const StatusBadge = ({ status }) => <span className={`status status-${status}`}>{STATUS_LABEL[status] || status}</span>;

export function PanelHead({ eyebrow, title, onRefresh }) {
  return (
    <header className="panel-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onRefresh}>Refresh</button>
    </header>
  );
}

export function ReservationTable({ rows, empty, onOpen }) {
  if (!rows) return <div className="table-wrap"><div className="empty">Loading…</div></div>;
  if (!rows.length) return <div className="table-wrap"><div className="empty">{empty}</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Seating</th><th>Guest</th><th>Party</th><th>Preference</th><th>Menu</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td>{formatDate(r.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
              <td>{formatTime(r.seating)}</td>
              <td className="name">{r.name}<small>{r.email} · {r.phone}</small></td>
              <td>{r.guests}</td>
              <td>{r.preference || '—'}</td>
              <td>{r.menu || '—'}</td>
              <td><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
