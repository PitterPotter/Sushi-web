import Image from 'next/image';

export default function PageHero({ eyebrow, title, lead, image }) {
  return (
    <section className="page-hero">
      <div className="hero-bg">
        <Image src={image} alt="" fill priority sizes="100vw" />
      </div>
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
    </section>
  );
}
