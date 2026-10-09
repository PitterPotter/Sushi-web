import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
});

export const metadata = {
  title: { default: 'Kaiseki Sushi — Edomae Omakase', template: '%s — Kaiseki Sushi' },
  description: 'Kaiseki is an intimate twelve-seat Edomae sushi counter. Seasonal omakase, aged fish, and quiet craft.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
