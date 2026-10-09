(() => {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.nav-toggle');

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Mark active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Scroll reveal
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const showError = (form, msg) => {
    const el = form.querySelector('.form-error');
    el.textContent = msg;
    el.hidden = !msg;
  };
  const setBusy = (form, busy) => {
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = busy;
    btn.dataset.label ??= btn.textContent;
    btn.textContent = busy ? 'Sending…' : btn.dataset.label;
  };
  const showConfirm = (form) => {
    form.classList.add('hidden');
    document.getElementById('confirm').classList.add('show');
  };

  // Booking form
  const form = document.getElementById('booking-form');
  if (form) {
    const dateEl = form.querySelector('[name="date"]');
    const timeEl = form.querySelector('[name="time"]');
    const guestsEl = form.querySelector('[name="guests"]');
    const availEl = document.getElementById('availability');
    dateEl.min = new Date().toISOString().split('T')[0];

    let availability = [];

    const renderSeatings = () => {
      const guests = Number(guestsEl.value) || 1;
      const current = timeEl.value;
      timeEl.innerHTML = '<option value="" disabled selected>Select</option>';
      availability.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = a.seating.slice(0, 5);
        const full = a.closed || a.remaining < guests;
        opt.textContent = `${db.seatingLabel(a.seating)} — ${a.closed ? 'closed' : a.remaining === 0 ? 'fully booked' : `${a.remaining} seat${a.remaining === 1 ? '' : 's'} left`}`;
        opt.disabled = full;
        if (opt.value === current && !full) opt.selected = true;
        timeEl.appendChild(opt);
      });
      if (!availability.length) return;
      const closed = availability.every((a) => a.closed);
      availEl.hidden = false;
      availEl.textContent = closed
        ? 'We are closed on this date. Please choose Tuesday to Saturday.'
        : availability.every((a) => a.remaining < guests)
          ? 'Both seatings are full for this party size. Please try another date.'
          : `Availability for ${db.formatDate(dateEl.value)}.`;
    };

    const loadAvailability = async () => {
      if (!dateEl.value || !db.configured) return;
      availEl.hidden = false;
      availEl.textContent = 'Checking availability…';
      try {
        availability = await db.getAvailability(dateEl.value);
        renderSeatings();
      } catch (err) {
        availEl.textContent = 'Could not load availability. Please try again.';
      }
    };

    dateEl.addEventListener('change', loadAvailability);
    guestsEl.addEventListener('change', renderSeatings);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showError(form, '');
      if (!form.reportValidity()) return;
      if (!db.configured) return showError(form, 'Reservations are not yet connected. Please telephone us.');
      const data = Object.fromEntries(new FormData(form));
      setBusy(form, true);
      try {
        const r = await db.createReservation(data);
        const fmt = `${db.formatDate(r.date)} at ${db.formatTime(r.seating)}`;
        document.getElementById('confirm-text').innerHTML =
          `Thank you, <strong>${esc(r.name)}</strong>. We have received your request for <strong>${r.guests} ${r.guests === 1 ? 'guest' : 'guests'}</strong> on <strong>${fmt}</strong>${r.preference ? ` at the <strong>${esc(r.preference)}</strong>` : ''}.<br>We will confirm by email at ${esc(r.email)} shortly.`;
        showConfirm(form);
      } catch (err) {
        showError(form, err.message);
        loadAvailability();
      } finally {
        setBusy(form, false);
      }
    });
  }

  // Contact form
  const contact = document.getElementById('contact-form');
  contact?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError(contact, '');
    if (!contact.reportValidity()) return;
    if (!db.configured) return showError(contact, 'Messaging is not yet connected. Please email us directly.');
    setBusy(contact, true);
    try {
      await db.submitContact(Object.fromEntries(new FormData(contact)));
      showConfirm(contact);
    } catch (err) {
      showError(contact, err.message);
    } finally {
      setBusy(contact, false);
    }
  });
})();
