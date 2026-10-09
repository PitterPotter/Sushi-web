'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Brand from '@/components/Brand';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { email, password } = Object.fromEntries(new FormData(e.currentTarget));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <section className="login-view">
      <form className="login-card form" onSubmit={onSubmit}>
        <Brand sub="Admin" />
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input type="email" id="login-email" name="email" required autoComplete="username" />
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
