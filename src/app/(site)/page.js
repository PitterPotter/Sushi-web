import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

const DISHES = [
  { name: 'Otoro', desc: 'Fatty bluefin belly, aged seven days, brushed with nikiri', img: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hokkaido Uni', desc: 'Bafun sea urchin, crisp nori, a drop of brined yuzu', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=900&q=80' },
  { name: 'Kohada', desc: 'Gizzard shad, salt and vinegar cured in the Edo tradition', img: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=900&q=80' },
];

const TIERS = [
  { name: 'Hana', price: '$185', desc: 'Fifteen pieces of nigiri, seasonal appetiser, soup and dessert. Our classic progression.' },
  { name: 'Tsuki', price: '$245', desc: 'Eighteen pieces with premium cuts — otoro, uni, kinmedai — and a sake pairing of four pours.' },
  { name: 'Yuki', price: '$320', desc: 'The full counter experience. Rare seasonal catch, aged selections and a vintage sake pairing.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-bg">
          <Image
            src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=2000&q=80"
            alt="Nigiri sushi arranged on a dark slate plate"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-kanji" aria-hidden="true">鮨</div>
        <div className="container">
          <div className="hero-content">
            <span className="eyebrow">Twelve seats · One counter</span>
            <h1>The quiet art<br />of <em>Edomae</em></h1>
            <p className="lead">An intimate omakase guided by the seasons. Fish aged and cured with patience, rice warmed to the temperature of the hand, served one piece at a time.</p>
            <div className="hero-actions">
              <Link href="/booking" className="btn btn-solid">Reserve a Seat</Link>
              <a href="#philosophy" className="btn btn-ghost">Our Philosophy</a>
            </div>
          </div>
          <div className="hero-meta">
            <div>Seatings<strong>5:30 &amp; 8:30 PM</strong></div>
            <div>Address<strong>14 Rue Mercer, SoHo</strong></div>
            <div>Closed<strong>Sunday &amp; Monday</strong></div>
          </div>
        </div>
        <span className="scroll-cue" aria-hidden="true" />
      </section>

      <section className="section intro" id="philosophy">
        <div className="container intro-grid">
          <Reveal className="intro-img">
            <Image
              src="https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80"
              alt="Chef slicing fish at the counter"
              width={1200}
              height={1500}
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </Reveal>
          <Reveal delay="1">
            <span className="eyebrow">Philosophy</span>
            <h2>Restraint is the<br />highest form of respect</h2>
            <br />
            <p className="lead">Edomae sushi was born in Tokyo Bay, where fish was salted, vinegared and aged not for luxury but for necessity. We honour that lineage — every piece is a conversation between time, temperature and the fish itself.</p>
            <p className="lead">Chef Hiroshi Tanaka trained for fourteen years in Ginza before opening Kaiseki. He serves each guest personally, from the first sliver of hirame to the final tamago.</p>
            <div className="signature">
              <span className="serif">Hiroshi Tanaka</span>
              <span>Chef &amp; Owner</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section menu">
        <div className="container">
          <Reveal className="menu-head">
            <div>
              <span className="eyebrow">This season</span>
              <h2>From the counter</h2>
            </div>
            <p className="lead">A glimpse of what is on the cutting board this month. The full progression changes nightly with the market.</p>
          </Reveal>
          <div className="menu-grid">
            {DISHES.map((d, i) => (
              <Reveal as="article" key={d.name} className="dish" delay={i ? String(i) : undefined}>
                <Image src={d.img} alt={d.name} width={900} height={1200} sizes="(max-width: 960px) 100vw, 33vw" />
                <div className="dish-body">
                  <div>
                    <h3>{d.name}</h3>
                    <p>{d.desc}</p>
                  </div>
                  <span className="price">Omakase</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section omakase">
        <div className="container">
          <Reveal className="omakase-inner">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Omakase</span>
            <h2>Leave it to us</h2>
            <p className="lead">Omakase means &ldquo;I entrust you.&rdquo; Each evening unfolds in roughly eighteen courses over two hours, paced to the room and the fish.</p>
          </Reveal>
          <div className="tiers">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} className="tier" delay={i ? String(i) : undefined}>
                <span className="serif">{t.name}</span>
                <div className="price">{t.price}</div>
                <p>{t.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section quote">
        <Reveal className="container">
          <blockquote>&ldquo;A meal that feels less like dinner and more like being let in on a secret. The rice alone is worth the reservation.&rdquo;</blockquote>
          <cite>— The Culinary Review</cite>
        </Reveal>
      </section>
    </>
  );
}
