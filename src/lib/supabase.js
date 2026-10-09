import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured ? createClient(url, anonKey) : null;

export function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Something went wrong.');
  return data;
}

export const getAvailability = (date) => supabase.rpc('get_availability', { p_date: date }).then(unwrap);

export const createReservation = (f) =>
  supabase
    .rpc('create_reservation', {
      p_name: f.name,
      p_email: f.email,
      p_phone: f.phone,
      p_guests: Number(f.guests),
      p_date: f.date,
      p_seating: f.time,
      p_preference: f.seating || null,
      p_menu: f.menu || null,
      p_notes: f.notes || null,
    })
    .then(unwrap);

export const submitContact = (f) =>
  supabase.rpc('submit_contact', { p_name: f.name, p_email: f.email, p_subject: f.subject, p_message: f.message }).then(unwrap);
