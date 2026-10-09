import Link from 'next/link';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import BookingForm from '@/components/BookingForm';

export const metadata = {
  title: 'Reservations',
  description: 'Reserve a seat at the Kaiseki omakase counter. Two seatings nightly, Tuesday through Saturday.',
};

export default function BookingPage() {
  return (
    <>
      <PageHero
        eyebrow="Reservations"
        title={<>Take a seat<br />at the counter</>}
        lead="Twelve seats, two seatings, Tuesday through Saturday. Please allow approximately two hours for the omakase."
        image="https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=2000&q=80"
      />

      <section className="section">
        <div className="container booking-grid">
          <BookingForm />

          <Reveal as="aside" className="aside-card">
            <h3>Before you arrive</h3>
            <dl>
              <div>
                <dt>Seatings</dt>
                <dd>5:30 PM and 8:30 PM, Tuesday through Saturday. Please arrive ten minutes early; the counter begins together.</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>Approximately two hours for the full omakase progression.</dd>
              </div>
              <div>
                <dt>Dietary</dt>
                <dd>We can accommodate most allergies with 48 hours&rsquo; notice. We are unable to offer vegetarian omakase.</dd>
              </div>
              <div>
                <dt>Dress</dt>
                <dd>Smart casual. We kindly ask guests to refrain from strong fragrances, which affect the tasting of the fish.</dd>
              </div>
            </dl>
            <hr />
            <p className="small">
              For parties larger than six, or full buyouts of the counter, please{' '}
              <Link href="/contact" style={{ color: 'var(--gold)' }}>contact us directly</Link>.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
