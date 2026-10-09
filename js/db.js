// Shared Supabase client + helpers. Requires config.js and the supabase-js CDN script to be loaded first.
window.db = (() => {
  const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR-PROJECT-REF');
  const client = configured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

  const unwrap = ({ data, error }) => {
    if (error) throw new Error(error.message || 'Something went wrong.');
    return data;
  };

  const SEATING_LABELS = { '17:30:00': 'First seating — 5:30 PM', '20:30:00': 'Second seating — 8:30 PM' };
  const seatingLabel = (t) => SEATING_LABELS[t] || SEATING_LABELS[`${t}:00`] || formatTime(t);

  function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function formatDate(d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', opts);
  }

  return {
    client,
    configured,
    seatingLabel,
    formatTime,
    formatDate,
    getAvailability: (date) => client.rpc('get_availability', { p_date: date }).then(unwrap),
    createReservation: (f) =>
      client.rpc('create_reservation', {
        p_name: f.name, p_email: f.email, p_phone: f.phone, p_guests: Number(f.guests),
        p_date: f.date, p_seating: f.time, p_preference: f.seating || null,
        p_menu: f.menu || null, p_notes: f.notes || null,
      }).then(unwrap),
    submitContact: (f) =>
      client.rpc('submit_contact', { p_name: f.name, p_email: f.email, p_subject: f.subject, p_message: f.message }).then(unwrap),
  };
})();
