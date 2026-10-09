'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
import Brand from '@/components/Brand';

export default function Login({ onSuccess, initialError = '' }) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { username, password } = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const session = await adminFetch('/api/admin/auth', { method: 'POST', body: JSON.stringify({ username, password }) });
      onSuccess(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login-view">
      <form className="login-card form" onSubmit={onSubmit}>
        <Brand sub="Admin" />
        <div className="field">
          <label htmlFor="login-username">Username</label>
          <input type="text" id="login-username" name="username" required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input type="password" id="login-password" name="password" required autoComplete="current-password" />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-solid" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
      </form>
    </section>
  );
}
