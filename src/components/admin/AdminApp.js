'use client';

import { useCallback, useEffect, useState } from 'react';
import { isConfigured, supabase, unwrap } from '@/lib/supabase';
import Brand from '@/components/Brand';
import Login from './Login';
import Overview from './Overview';
import Reservations from './Reservations';
import Messages from './Messages';
import ReservationDrawer from './ReservationDrawer';
import { ToastProvider, useToast } from './Toast';

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'reservations', label: 'Reservations', pill: 'pending' },
  { id: 'messages', label: 'Messages', pill: 'unread_messages' },
];

export default function AdminApp() {
  if (!isConfigured) {
    return (
      <div className="login-view">
        <div className="login-card">
          <p className="form-error">
            Supabase is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

function Shell() {
  const [session, setSession] = useState(undefined);
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tick, setTick] = useState(0);
  const [drawerId, setDrawerId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!session) return;
    supabase.rpc('admin_stats').then(unwrap).then(setStats).catch((e) => toast(e.message, true));
  }, [session, tick, toast]);

  if (session === undefined) return null;
  if (!session) return <Login />;

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand sub="Admin" />
        <nav className="side-nav">
          {VIEWS.map((v) => (
            <button key={v.id} className={`side-link${view === v.id ? ' active' : ''}`} onClick={() => setView(v.id)}>
              {v.label}
              {v.pill && stats?.[v.pill] > 0 && <span className="pill">{stats[v.pill]}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="small">{session.user.email}</span>
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </aside>

      <main className="content">
        {view === 'overview' && <Overview stats={stats} tick={tick} onRefresh={refresh} onOpen={setDrawerId} />}
        {view === 'reservations' && <Reservations tick={tick} onRefresh={refresh} onOpen={setDrawerId} />}
        {view === 'messages' && <Messages tick={tick} onRefresh={refresh} />}
      </main>

      {drawerId && <ReservationDrawer id={drawerId} onClose={() => setDrawerId(null)} onChanged={refresh} />}
    </div>
  );
}
