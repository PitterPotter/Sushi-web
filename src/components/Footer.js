import Link from 'next/link';
import Brand from './Brand';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Brand />
            <p>A twelve-seat sushi counter in SoHo devoted to the Edomae tradition. Reservations are released on the first of each month.</p>
          </div>
          <div>
            <h4>Visit</h4>
            <ul>
              <li>14 Rue Mercer</li>
              <li>New York, NY 10012</li>
              <li><Link href="/contact">Directions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Hours</h4>
            <ul>
              <li>Tue – Sat</li>
              <li>5:30 PM &amp; 8:30 PM</li>
              <li>Closed Sun &amp; Mon</li>
            </ul>
          </div>
          <div>
            <h4>Menu</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/booking">Reservations</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Kaiseki Sushi</span>
          <span>Omakase only · Smart casual</span>
        </div>
      </div>
    </footer>
  );
}
