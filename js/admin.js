(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toLocaleDateString('en-CA');
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); };
  const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', seated: 'Seated', declined: 'Declined', cancelled: 'Cancelled', no_show: 'No-show' };
  const ACTIVE = ['pending', 'confirmed', 'seated'];

  const loginView = $('#login-view'), appView = $('#app-view');
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg, error = false) => {
    toastEl.textContent = msg;
    toastEl.className = `toast${error ? ' error' : ''}`;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 3200);
  };

  if (!db.configured) {
    document.body.innerHTML = '<div class="login-view"><div class="login-card"><p class="form-error">Supabase is not configured. Add your project URL and anon key to <code>js/config.js</code>.</p></div></div>';
    return;
  }
  const sb = db.client;
  const unwrap = ({ data, error }) => { if (error) throw error; return data; };

  // ---------------------------------------------------------------- Auth
  const loginForm = $('#login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.form-error', loginForm);
    err.hidden = true;
    const { email, password } = Object.fromEntries(new FormData(loginForm));
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { err.textContent = error.message; err.hidden = false; }
  });
  $('#logout').addEventListener('click', () => sb.auth.signOut());

  sb.auth.onAuthStateChange((_evt, session) => {
    loginView.hidden = !!session;
    appView.hidden = !session;
    if (session) {
      $('#user-email').textContent = session.user.email;
      loadAll();
    }
  });

  // ---------------------------------------------------------------- Navigation
  $$('.side-link').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('.side-link').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.panel').forEach((p) => (p.hidden = p.dataset.panel !== btn.dataset.view));
    })
  );
  $$('[data-refresh]').forEach((b) => b.addEventListener('click', loadAll));

  // ---------------------------------------------------------------- Data
  async function loadAll() {
    try {
      await Promise.all([loadStats(), loadTonight(), loadPending(), loadReservations(), loadMessages()]);
    } catch (e) {
      toast(e.message || 'Failed to load data', true);
    }
  }

  async function loadStats() {
    const s = await sb.rpc('admin_stats').then(unwrap);
    $('#today-label').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('#stat-tonight').textContent = s.tonight_covers;
    $('#stat-tonight-parties').textContent = `${s.tonight_parties} ${s.tonight_parties === 1 ? 'party' : 'parties'}`;
    $('#stat-week').textContent = s.week_covers;
    $('#stat-pending').textContent = s.pending;
    $('#stat-messages').textContent = s.unread_messages;
    setPill('#pill-pending', s.pending);
    setPill('#pill-messages', s.unread_messages);
  }
  const setPill = (sel, n) => { const el = $(sel); el.textContent = n; el.hidden = !n; };

  async function loadTonight() {
    const [avail, rows] = await Promise.all([
      db.getAvailability(today()),
      sb.from('reservations').select('*').eq('date', today()).in('status', ACTIVE).order('seating').then(unwrap),
    ]);
    $('#tonight-seatings').innerHTML = avail.map((a) => {
      const pct = Math.min(100, Math.round((a.booked / a.capacity) * 100));
      const list = rows.filter((r) => r.seating === a.seating);
      return `<div class="seating-card">
        <header><b>${db.formatTime(a.seating)}</b><span>${a.booked} / ${a.capacity} covers</span></header>
        <div class="bar"><i class="${a.remaining === 0 ? 'full' : ''}" style="width:${pct}%"></i></div>
        <ul>${list.length ? list.map((r) => `<li data-id="${r.id}"><span>${esc(r.name)}${r.preference ? ` <small class="small">· ${esc(r.preference)}</small>` : ''}</span><span>${r.guests} · ${statusBadge(r.status)}</span></li>`).join('') : '<li class="small">No bookings</li>'}</ul>
      </div>`;
    }).join('');
    $$('#tonight-seatings li[data-id]').forEach((li) => li.addEventListener('click', () => openDrawer(li.dataset.id)));
  }

  async function loadPending() {
    const rows = await sb.from('reservations').select('*').eq('status', 'pending').gte('date', today()).order('date').order('seating').limit(20).then(unwrap);
    renderTable($('#pending-list'), rows, 'No pending requests. All caught up.');
  }

  const filters = { from: $('#f-from'), to: $('#f-to'), status: $('#f-status'), q: $('#f-q') };
  filters.from.value = today();
  filters.to.value = addDays(new Date(), 30);
  let debounce;
  Object.values(filters).forEach((el) => el.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(loadReservations, 250); }));

  async function loadReservations() {
    let q = sb.from('reservations').select('*').order('date').order('seating').order('created_at');
    if (filters.from.value) q = q.gte('date', filters.from.value);
    if (filters.to.value) q = q.lte('date', filters.to.value);
    if (filters.status.value) q = q.eq('status', filters.status.value);
    const term = filters.q.value.trim();
    if (term) q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    const rows = await q.limit(300).then(unwrap);
    renderTable($('#reservations-list'), rows, 'No reservations match these filters.');
  }

  async function loadMessages() {
    const rows = await sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100).then(unwrap);
    $('#messages-list').innerHTML = rows.length ? rows.map((m) => `
      <article class="message ${m.read ? '' : 'unread'}" data-id="${m.id}">
        <header>
          <div><b>${esc(m.name)}</b><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></div>
          <span class="meta">${new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </header>
        <span class="meta">${esc(m.subject)}</span>
        <p>${esc(m.message)}</p>
        <footer>
          <button class="link-btn" data-toggle-read>${m.read ? 'Mark unread' : 'Mark read'}</button>
          <a class="link-btn" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject)}">Reply</a>
          <button class="link-btn" data-delete>Delete</button>
        </footer>
      </article>`).join('') : '<div class="message empty">No messages yet.</div>';

    $$('#messages-list .message[data-id]').forEach((el) => {
      const id = el.dataset.id;
      const m = rows.find((r) => r.id === id);
      $('[data-toggle-read]', el).addEventListener('click', async () => {
        await sb.from('contact_messages').update({ read: !m.read }).eq('id', id).then(unwrap);
        loadMessages(); loadStats();
      });
      $('[data-delete]', el).addEventListener('click', async () => {
        if (!confirm(`Delete message from ${m.name}?`)) return;
        await sb.from('contact_messages').delete().eq('id', id).then(unwrap);
        loadMessages(); loadStats();
      });
    });
  }

  // ---------------------------------------------------------------- Rendering
  const statusBadge = (s) => `<span class="status status-${s}">${STATUS_LABEL[s] || s}</span>`;

  function renderTable(el, rows, emptyMsg) {
    if (!rows.length) return (el.innerHTML = `<div class="empty">${emptyMsg}</div>`);
    el.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Seating</th><th>Guest</th><th>Party</th><th>Preference</th><th>Menu</th><th>Status</th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-id="${r.id}">
        <td>${db.formatDate(r.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
        <td>${db.formatTime(r.seating)}</td>
        <td class="name">${esc(r.name)}<small>${esc(r.email)} · ${esc(r.phone)}</small></td>
        <td>${r.guests}</td>
        <td>${esc(r.preference || '—')}</td>
        <td>${esc(r.menu || '—')}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>`).join('')}</tbody></table>`;
    $$('tbody tr', el).forEach((tr) => tr.addEventListener('click', () => openDrawer(tr.dataset.id)));
  }

  // ---------------------------------------------------------------- Drawer
  const drawer = $('#drawer');
  $$('[data-close]', drawer).forEach((b) => b.addEventListener('click', () => (drawer.hidden = true)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && (drawer.hidden = true));

  async function openDrawer(id) {
    const r = await sb.from('reservations').select('*').eq('id', id).single().then(unwrap);
    const transitions = {
      pending: ['confirmed', 'declined'],
      confirmed: ['seated', 'no_show', 'cancelled'],
      seated: ['confirmed'],
      declined: ['pending'], cancelled: ['pending'], no_show: ['seated'],
    }[r.status] || [];
    const labels = { confirmed: 'Confirm', declined: 'Decline', seated: 'Mark seated', no_show: 'No-show', cancelled: 'Cancel booking', pending: 'Reopen' };

    $('#drawer-body').innerHTML = `
      ${statusBadge(r.status)}
      <h2>${esc(r.name)}</h2>
      <span class="small">Requested ${new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
      <dl>
        <dt>When</dt><dd>${db.formatDate(r.date)} · ${db.formatTime(r.seating)}</dd>
        <dt>Party</dt><dd>${r.guests} ${r.guests === 1 ? 'guest' : 'guests'}</dd>
        <dt>Contact</dt><dd><a href="mailto:${esc(r.email)}">${esc(r.email)}</a><br><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></dd>
        <dt>Preference</dt><dd>${esc(r.preference || '—')}</dd>
        <dt>Menu</dt><dd>${esc(r.menu || 'Decide at the counter')}</dd>
        <dt>Guest notes</dt><dd>${esc(r.notes || '—')}</dd>
      </dl>
      <div class="field">
        <label for="admin-notes">Internal notes</label>
        <textarea id="admin-notes" rows="3" placeholder="Allergies confirmed, seat assignment, etc.">${esc(r.admin_notes || '')}</textarea>
      </div>
      <div class="actions">
        ${transitions.map((s) => `<button class="btn ${s === 'confirmed' || s === 'seated' ? 'btn-solid' : s === 'declined' || s === 'cancelled' || s === 'no_show' ? 'btn-danger' : 'btn-ghost'}" data-status="${s}">${labels[s]}</button>`).join('')}
        <button class="btn btn-ghost" data-save-notes>Save notes</button>
      </div>`;
    drawer.hidden = false;

    const update = async (patch, msg) => {
      try {
        await sb.from('reservations').update(patch).eq('id', id).then(unwrap);
        toast(msg);
        drawer.hidden = true;
        loadAll();
      } catch (e) { toast(e.message, true); }
    };
    $$('[data-status]', drawer).forEach((b) => b.addEventListener('click', () => update({ status: b.dataset.status }, `${r.name} — ${STATUS_LABEL[b.dataset.status]}`)));
    $('[data-save-notes]', drawer).addEventListener('click', () => update({ admin_notes: $('#admin-notes').value }, 'Notes saved'));
  }
})();
