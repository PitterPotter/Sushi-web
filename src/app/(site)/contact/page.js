import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact',
  description: 'Find Kaiseki Sushi in SoHo, New York. Hours, directions, private dining and press enquiries.',
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>We look forward<br />to welcoming you</>}
        lead="For reservations, please use our booking page. For everything else — private dining, press, or simply a question — reach us below."
        image="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-list">
            <Reveal className="contact-item">
              <h3>Address</h3>
              <p>14 Rue Mercer<br />New York, NY 10012</p>
              <p className="sub">Between Grand and Canal. Nearest subway: Canal St (N, Q, R, W, 6).</p>
            </Reveal>
            <Reveal className="contact-item" delay="1">
              <h3>Telephone</h3>
              <a href="tel:+12125550142">+1 (212) 555-0142</a>
              <p className="sub">Tuesday – Saturday, 12:00 – 5:00 PM</p>
            </Reveal>
            <Reveal className="contact-item" delay="2">
              <h3>Email</h3>
              <a href="mailto:hello@kaiseki-sushi.com">hello@kaiseki-sushi.com</a>
              <p className="sub">Private dining &amp; events: events@kaiseki-sushi.com</p>
            </Reveal>
            <Reveal className="contact-item" delay="3">
              <h3>Hours</h3>
              <div className="hours">
                <div><span>Tuesday – Thursday</span><span>5:30 PM · 8:30 PM</span></div>
                <div><span>Friday – Saturday</span><span>5:30 PM · 8:30 PM</span></div>
                <div className="closed"><span>Sunday – Monday</span><span>Closed</span></div>
              </div>
            </Reveal>
          </div>

          <Reveal delay="1">
            <ContactForm />
          </Reveal>
        </div>

        <div className="container">
          <Reveal className="map">
            <iframe
              title="Map to Kaiseki Sushi"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Mercer+St+%26+Grand+St,+New+York,+NY+10012&output=embed"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
