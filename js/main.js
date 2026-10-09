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

  // Booking form
  const form = document.getElementById('booking-form');
  if (form) {
    const date = form.querySelector('[name="date"]');
    if (date) date.min = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      const when = new Date(`${data.date}T${data.time}`);
      const fmt = when.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      document.getElementById('confirm-text').innerHTML =
        `Thank you, <strong>${data.name}</strong>. We have received your request for <strong>${data.guests} ${data.guests === '1' ? 'guest' : 'guests'}</strong> on <strong>${fmt}</strong>${data.seating ? ` at the <strong>${data.seating}</strong>` : ''}.<br>A confirmation will be sent to ${data.email}.`;
      form.classList.add('hidden');
      document.getElementById('confirm').classList.add('show');
    });
  }

  // Contact form
  const contact = document.getElementById('contact-form');
  contact?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!contact.reportValidity()) return;
    contact.classList.add('hidden');
    document.getElementById('confirm').classList.add('show');
  });
})();
