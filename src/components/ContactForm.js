'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isConfigured, submitContact } from '@/lib/supabase';

export default function ContactForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (!isConfigured) return setError('Messaging is not yet connected. Please email us directly.');
    setBusy(true);
    try {
      await submitContact(Object.fromEntries(new FormData(form)));
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="confirm show" role="status" aria-live="polite">
        <div className="mark">礼</div>
        <h2>Thank you</h2>
        <p>Your message has been received. We will be in touch shortly.</p>
        <br />
        <Link href="/" className="btn btn-ghost">Return Home</Link>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input type="text" id="name" name="name" placeholder="Your name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="subject">Subject</label>
        <select id="subject" name="subject" required defaultValue="">
          <option value="" disabled>Select</option>
          <option>General enquiry</option>
          <option>Private dining &amp; buyouts</option>
          <option>Press</option>
          <option>Gift vouchers</option>
          <option>Careers</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" placeholder="How can we help?" required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-footer">
        <p className="form-note">We reply within two business days. For same-day matters, please telephone.</p>
        <button type="submit" className="btn btn-solid" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
      </div>
    </form>
  );
}
