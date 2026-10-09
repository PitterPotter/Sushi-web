'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
import { formatDateTime } from '@/lib/format';
import { PanelHead } from './shared';
import { useToast } from './Toast';

export default function Messages({ tick, onRefresh }) {
  const [rows, setRows] = useState(null);
  const toast = useToast();

  useEffect(() => {
    adminFetch('/api/admin/messages').then(setRows).catch((e) => toast(e.message, true));
  }, [tick, toast]);

  const run = async (request) => {
    try {
      await request();
      onRefresh();
    } catch (e) {
      toast(e.message, true);
    }
  };

  return (
    <section className="panel">
      <PanelHead eyebrow="Messages" title="Inbox" onRefresh={onRefresh} />
      <div className="messages">
        {!rows && <div className="message empty">Loading…</div>}
        {rows && !rows.length && <div className="message empty">No messages yet.</div>}
        {rows?.map((m) => (
          <article key={m.id} className={`message${m.read ? '' : ' unread'}`}>
            <header>
              <div><b>{m.name}</b><a href={`mailto:${m.email}`}>{m.email}</a></div>
              <span className="meta">{formatDateTime(m.created_at)}</span>
            </header>
            <span className="meta">{m.subject}</span>
            <p>{m.message}</p>
            <footer>
              <button className="link-btn" onClick={() => run(() => adminFetch(`/api/admin/messages/${m.id}`, { method: 'PATCH', body: JSON.stringify({ read: !m.read }) }))}>
                {m.read ? 'Mark unread' : 'Mark read'}
              </button>
              <a className="link-btn" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply</a>
              <button className="link-btn" onClick={() => confirm(`Delete message from ${m.name}?`) && run(() => adminFetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' }))}>
                Delete
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
