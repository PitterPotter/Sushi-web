'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isConfigured, getAvailability, createReservation } from '@/lib/supabase';
import { formatDate, formatTime, seatingLabel, today } from '@/lib/format';

const Field = ({ id, label, children }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    {children}
  </div>
);

export default function BookingForm() {
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [time, setTime] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availMsg, setAvailMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [minDate, setMinDate] = useState('');

  useEffect(() => setMinDate(today()), []);

  useEffect(() => {
    if (!date || !isConfigured) return;
    let cancelled = false;
    setAvailMsg('Checking availability…');
    getAvailability(date)
      .then((a) => !cancelled && setAvailability(a))
      .catch(() => !cancelled && setAvailMsg('Could not load availability. Please try again.'));
    return () => { cancelled = true; };
  }, [date]);

  const g = Number(guests) || 1;
  const seatingFull = (a) => a.closed || a.remaining < g;

  useEffect(() => {
    if (!availability) return;
    if (time && availability.some((a) => a.seating.slice(0, 5) === time && seatingFull(a))) setTime('');
    setAvailMsg(
      availability.every((a) => a.closed)
        ? 'We are closed on this date. Please choose Tuesday to Saturday.'
        : availability.every(seatingFull)
          ? 'Both seatings are full for this party size. Please try another date.'
          : `Availability for ${formatDate(date)}.`
    );
  }, [availability, g]); // eslint-disable-line react-hooks/exhaustive-deps

  const seatingOptions = availability
    ? availability.map((a) => ({
        value: a.seating.slice(0, 5),
        disabled: seatingFull(a),
        label: `${seatingLabel(a.seating)} — ${a.closed ? 'closed' : a.remaining === 0 ? 'fully booked' : `${a.remaining} seat${a.remaining === 1 ? '' : 's'} left`}`,
      }))
    : [
        { value: '17:30', label: 'First seating — 5:30 PM' },
        { value: '20:30', label: 'Second seating — 8:30 PM' },
      ];

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (!isConfigured) return setError('Reservations are not yet connected. Please telephone us.');
    setBusy(true);
    try {
      setResult(await createReservation(Object.fromEntries(new FormData(form))));
    } catch (err) {
      setError(err.message);
      setAvailability(null);
      getAvailability(date).then(setAvailability).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="confirm show" role="status" aria-live="polite">
        <div className="mark">承</div>
        <h2>Request received</h2>
        <p>
          Thank you, <strong>{result.name}</strong>. We have received your request for{' '}
          <strong>{result.guests} {result.guests === 1 ? 'guest' : 'guests'}</strong> on{' '}
          <strong>{formatDate(result.date)} at {formatTime(result.seating)}</strong>
          {result.preference && <> at the <strong>{result.preference}</strong></>}.
          <br />We will confirm by email at {result.email} shortly.
        </p>
        <br />
        <Link href="/" className="btn btn-ghost">Return Home</Link>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <Field id="name" label="Full name"><input type="text" id="name" name="name" placeholder="Your name" required autoComplete="name" /></Field>
        <Field id="email" label="Email"><input type="email" id="email" name="email" placeholder="you@example.com" required autoComplete="email" /></Field>
      </div>
      <div className="form-row">
        <Field id="phone" label="Phone"><input type="tel" id="phone" name="phone" placeholder="+1 (212) 000 0000" required autoComplete="tel" /></Field>
        <Field id="guests" label="Guests">
          <select id="guests" name="guests" required value={guests} onChange={(e) => setGuests(e.target.value)}>
            <option value="" disabled>Select</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
            <option value="6">6 guests — full counter side</option>
          </select>
        </Field>
      </div>
      <div className="form-row">
        <Field id="date" label="Date"><input type="date" id="date" name="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field id="time" label="Seating">
          <select id="time" name="time" required value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="" disabled>Select</option>
            {seatingOptions.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
          </select>
        </Field>
      </div>
      {availMsg && <p className="form-hint">{availMsg}</p>}
      <div className="form-row">
        <Field id="seating" label="Preference">
          <select id="seating" name="seating" defaultValue="">
            <option value="">No preference</option>
            <option value="counter">Counter — in front of the chef</option>
            <option value="alcove">Private alcove (4–6 guests)</option>
          </select>
        </Field>
        <Field id="menu" label="Omakase">
          <select id="menu" name="menu" defaultValue="">
            <option value="">Decide at the counter</option>
            <option value="hana">Hana — $185</option>
            <option value="tsuki">Tsuki — $245</option>
            <option value="yuki">Yuki — $320</option>
          </select>
        </Field>
      </div>
      <Field id="notes" label="Dietary notes & occasions">
        <textarea id="notes" name="notes" placeholder="Allergies, aversions, anniversaries…" />
      </Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-footer">
        <p className="form-note">A card is required to hold your seats. Cancellations within 48 hours incur a $75 per-guest fee.</p>
        <button type="submit" className="btn btn-solid" disabled={busy}>{busy ? 'Sending…' : 'Request Reservation'}</button>
      </div>
    </form>
  );
}
