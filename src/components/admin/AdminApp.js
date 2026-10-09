'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
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
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

function Shell() {
  const [session, setSession] = useState(undefined);
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tick, setTick] = useState(0);
  const [drawerId, setDrawerId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    adminFetch('/api/admin/auth')
      .then((result) => setSession(result.authenticated ? result : null))
      .catch((error) => { setAuthError(error.message); setSession(null); });
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!session) return;
    adminFetch('/api/admin/stats')
      .then(setStats)
      .catch((error) => {
        toast(error.message, true);
        if (error.message === 'Authentication required.') setSession(null);
      });
  }, [session, tick, toast]);

  async function signOut() {
    try {
      await adminFetch('/api/admin/auth', { method: 'DELETE' });
      setSession(null);
      setStats(null);
    } catch (error) {
      toast(error.message, true);
    }
  }

  if (session === undefined) return null;
  if (!session) return <Login initialError={authError} onSuccess={(next) => { setAuthError(''); setSession(next); refresh(); }} />;

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
          <span className="small">{session.username}</span>
          <button className="link-btn" onClick={signOut}>Sign out</button>
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
