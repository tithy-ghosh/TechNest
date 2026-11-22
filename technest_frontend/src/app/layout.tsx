import type { Metadata } from 'next';
import Providers from './Providers';
import { SiteNavbar, SiteFooter } from '@/components/layout/PageChrome';
import CartDrawer from '@/components/layout/CartDrawer';
import ChatWidget from '@/components/layout/ChatWidget';
import localFont from 'next/font/local';
import './globals.css';


const nunito = localFont({
  src: './fonts/Nunito-Variable.woff2',
  weight: '400 900',
  variable: '--font-nunito',
  display: 'swap',
});

const ubuntu = localFont({
  src: [
    { path: './fonts/Ubuntu-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Ubuntu-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Ubuntu-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-ubuntu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TechNest — Shop the Latest Gadgets',
    template: '%s | TechNest',
  },
  description: 'Discover cutting-edge smartphones, laptops, audio gear, and more. Free shipping on orders over $50. 2-year warranty on all electronics.',
  keywords: ['electronics', 'gadgets', 'smartphones', 'laptops', 'headphones', 'tablets', 'tech store'],
  authors: [{ name: 'TechNest' }],
  creator: 'TechNest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://technest-frontend.vercel.app',
    siteName: 'TechNest',
    title: 'TechNest — Shop the Latest Gadgets',
    description: 'Discover cutting-edge smartphones, laptops, audio gear, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TechNest',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechNest — Shop the Latest Gadgets',
    description: 'Discover cutting-edge smartphones, laptops, audio gear, and more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${nunito.variable} ${ubuntu.variable} font-sans overflow-x-hidden`} >
        <Providers>
          <SiteNavbar />
          <main>{children}</main>
          <CartDrawer />
          <ChatWidget />
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}