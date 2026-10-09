import Link from 'next/link';

export default function Brand({ sub = 'Edomae Sushi' }) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">懐</span>
      <span className="brand-name">
        Kaiseki<small>{sub}</small>
      </span>
    </Link>
  );
}
