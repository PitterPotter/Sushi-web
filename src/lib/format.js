const SEATING_LABELS = { '17:30': 'First seating — 5:30 PM', '20:30': 'Second seating — 8:30 PM' };

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', opts);
}

export function formatDateTime(iso, opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) {
  return new Date(iso).toLocaleString('en-US', opts);
}

export const seatingLabel = (t) => SEATING_LABELS[t.slice(0, 5)] || formatTime(t);

export const today = () => new Date().toLocaleDateString('en-CA');

export const addDays = (n, from = new Date()) => {
  const x = new Date(from);
  x.setDate(x.getDate() + n);
  return x.toLocaleDateString('en-CA');
};
