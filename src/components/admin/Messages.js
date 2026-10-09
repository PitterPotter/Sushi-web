'use client';

import { useEffect, useState } from 'react';
import { supabase, unwrap } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import { PanelHead } from './shared';
import { useToast } from './Toast';

export default function Messages({ tick, onRefresh }) {
  const [rows, setRows] = useState(null);
  const toast = useToast();

  useEffect(() => {
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100)
      .then(unwrap).then(setRows).catch((e) => toast(e.message, true));
  }, [tick, toast]);

  const run = async (promise) => {
    try {
      await promise.then(unwrap);
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
              <button className="link-btn" onClick={() => run(supabase.from('contact_messages').update({ read: !m.read }).eq('id', m.id))}>
                {m.read ? 'Mark unread' : 'Mark read'}
              </button>
              <a className="link-btn" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply</a>
              <button className="link-btn" onClick={() => confirm(`Delete message from ${m.name}?`) && run(supabase.from('contact_messages').delete().eq('id', m.id))}>
                Delete
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
