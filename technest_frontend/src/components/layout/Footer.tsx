'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';

/* ── Link data — only routes that actually exist ── */
const shopLinks = [
  { label: 'All products', href: '/products' },
  { label: 'New arrivals', href: '/products?sort=newest' },
  { label: 'Top rated', href: '/products?sort=rating' },
  { label: 'Deals', href: '/products?sort=deals' },
];

const categoryLinks = [
  { label: 'Smartphones', href: '/products?category=Smartphones' },
  { label: 'Laptops', href: '/products?category=Laptops' },
  { label: 'Headphones', href: '/products?category=Headphones' },
  { label: 'Tablets', href: '/products?category=Tablets' },
  { label: 'Wearables', href: '/products?category=Wearables' },
  { label: 'Gaming', href: '/products?category=Gaming' },
  { label: 'Accessories', href: '/products?category=Accessories' },
  { label: 'Smart Home', href: '/products?category=Smart%20Home' },
];

const accountLinks = [
  { label: 'My account', href: '/account' },
  { label: 'My orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Cart', href: '/cart' },
];

type FooterLinkItem = { label: string; href: string };

function LinkList({ links, className = '' }: { links: FooterLinkItem[]; className?: string }) {
  return (
    <ul className={`mt-5 ${className}`}>
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className='group relative inline-flex text-[13px] text-cream/60 transition-colors duration-200 hover:text-cream'
          >
            <span className='absolute -bottom-0.5 left-0 h-px w-0 bg-brand-400/80 transition-all duration-300 group-hover:w-full' />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className='font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-400'>
        {title}
      </h4>
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer id='site-footer' className='relative overflow-hidden bg-ink text-cream'>
      {/* top lime rule + ambient glow + faint grid */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent' />
      <div aria-hidden className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-32 left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/[0.08] blur-[130px]' />
        <div className='absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-brand-700/[0.12] blur-[120px]' />
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(rgba(253,251,245,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(253,251,245,0.045) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, #000 20%, transparent 78%)',
          }}
        />
      </div>

      <div className='relative mx-auto max-w-7xl px-6 pb-8 pt-14 sm:px-8 sm:pt-16'>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='grid gap-12 sm:grid-cols-3 lg:grid-cols-[1.5fr_0.9fr_1.4fr_0.9fr] lg:gap-8'
        >
          {/* Brand */}
          <div className='max-w-sm sm:col-span-3 lg:col-span-1'>
            <Link href='/' className='inline-flex items-center gap-3' aria-label='TechNest home'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cream p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10'>
                <Image
                  src='/TechNestLogo.png'
                  alt=''
                  width={96}
                  height={96}
                  className='h-full w-full object-contain'
                />
              </span>
              <span className='font-display text-[23px] font-extrabold leading-none tracking-[-0.03em] text-cream'>
                Tech<span className='text-brand-400'>Nest</span>
                <span className='text-brand-500'>.</span>
              </span>
            </Link>

            <p className='mt-5 max-w-[310px] text-[13px] leading-relaxed text-moss-faint'>
              Genuine gadgets, honest prices, and expert advice — all in one place.
            </p>
          </div>

          {/* Shop */}
          <FooterColumn title='Shop'>
            <LinkList links={shopLinks} className='space-y-3' />
          </FooterColumn>

          {/* Categories */}
          <FooterColumn title='Categories'>
            <LinkList links={categoryLinks} className='grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-1 lg:grid-cols-2' />
          </FooterColumn>

          {/* Account */}
          <FooterColumn title='Account'>
            <LinkList links={accountLinks} className='space-y-3' />
          </FooterColumn>
        </motion.div>

        {/* Bottom bar */}
        <div className='mt-14 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between'>
          <p className='text-[11.5px] tracking-wide text-moss-faint'>
            &copy; {new Date().getFullYear()} TechNest. All rights reserved.
          </p>

          <button
            type='button'
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label='Back to top'
            className='group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11.5px] font-medium text-cream/70 transition-all duration-200 hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-400'
          >
            Back to top
            <ArrowUp
              size={13}
              strokeWidth={2.2}
              className='transition-transform duration-200 group-hover:-translate-y-0.5'
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
