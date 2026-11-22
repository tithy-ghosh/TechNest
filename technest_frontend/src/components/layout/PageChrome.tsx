'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Auth pages (/auth/*) are focused, full-screen forms —
 * the global navbar and footer are hidden there.
 */
function chromeHidden(pathname: string) {
  return pathname.startsWith('/auth');
}

export function SiteNavbar() {
  const pathname = usePathname();
  if (chromeHidden(pathname)) return null;
  return <Navbar />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (chromeHidden(pathname)) return null;
  return <Footer />;
}
