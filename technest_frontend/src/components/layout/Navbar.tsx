'use client';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, ShoppingCart, User, Heart, X, ArrowRight, Menu, ChevronDown, House,
  Smartphone, Laptop, Headphones, Tablet, Watch, Gamepad2, Mouse, Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useSearchProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const SHOP_LINKS = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Our Products', href: '/products' },
  { label: 'Top rated', href: '/products?sort=rating' },
  
];

const CATEGORIES = [
  { label: 'Smartphones', icon: Smartphone },
  { label: 'Laptops', icon: Laptop },
  { label: 'Headphones', icon: Headphones },
  { label: 'Tablets', icon: Tablet },
  { label: 'Wearables', icon: Watch },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Accessories', icon: Mouse },
  { label: 'Smart Home', icon: House },
];

function getIcon(category: string) {
  return CATEGORIES.find(c => c.label === category)?.icon ?? Sparkles;
}

const linkBase =
  'flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-neutral-800 transition-colors hover:bg-lime-100';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState<'shop' | 'categories' | null>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const count = useCartStore(s => s.getCount());
  const openCart = useUIStore(s => s.openCart);
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { data: searchData, isFetching } = useSearchProducts(debounced);
  const results = searchData?.products ?? [];
  const showPanel = focused && debounced.length > 0;

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // close menus on route change
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMenuOpen(false);
      setDropdown(null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  // "/" focuses search, Esc closes everything
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setFocused(false);
        setMenuOpen(false);
        setDropdown(null);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setFocused(false);
      if (navRef.current && !navRef.current.contains(target)) setDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setDebounced('');
    setCursor(0);
    setFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[cursor] && focused && cursor > 0) {
      router.push(`/products/${results[cursor].slug}`);
    } else if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
    clearSearch();
    inputRef.current?.blur();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
  };

  const handleCartClick = () => {
    if (!user) {
      router.push('/auth/login?redirect=/cart');
      return;
    }
    openCart();
  };

  const isHome = pathname === '/';

  const SearchBox = (
    <div ref={searchRef} className='relative w-full'>
      <form
        onSubmit={handleSubmit}
        className='flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 shadow-sm transition focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-200'
      >
        <Search size={17} className='shrink-0 text-neutral-800' />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setCursor(0); }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleInputKeyDown}
          placeholder='Search gadgets...'
          autoComplete='off'
          spellCheck={false}
          className='w-1/2 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none'
        />
        {query && (
          <button type='button' onClick={clearSearch} aria-label='Clear search' className='text-neutral-400 hover:text-neutral-700'>
            <X size={15} />
          </button>
        )}
      </form>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className='absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl'
          >
            {isFetching && (
              <div className='px-3 py-3 text-sm text-neutral-500 animate-pulse'>Searching&hellip;</div>
            )}

            {!isFetching && results.length === 0 && (
              <div className='px-3 py-3 text-sm text-neutral-500'>
                No results for <strong>&ldquo;{debounced}&rdquo;</strong> &mdash; press Enter to search all
              </div>
            )}

            {results.map((r: Product, i: number) => {
              const Icon = getIcon(r.category);
              const img = r.variants?.[0]?.images?.[0];
              return (
                <Link
                  key={r._id}
                  href={`/products/${r.slug}`}
                  onClick={clearSearch}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${i === cursor ? 'bg-lime-50' : ''}`}
                >
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100'>
                    {img ? <Image src={img} alt='' width={36} height={36} className='h-9 w-9 object-cover' /> : <Icon size={18} strokeWidth={1.5} />}
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium text-neutral-900'>{r.name}</span>
                    <span className='truncate text-xs text-neutral-500'>{r.brand} &middot; {r.category}</span>
                  </span>
                  <span className='text-sm font-semibold text-neutral-900'>${r.basePrice}</span>
                  <ArrowRight size={13} className='text-neutral-400' />
                </Link>
              );
            })}

            {results.length > 0 && (
              <Link
                href={`/products?search=${encodeURIComponent(query)}`}
                onClick={clearSearch}
                className='mt-1 block rounded-xl px-3 py-2 text-center text-sm text-neutral-600 hover:bg-lime-50'
              >
                See all results for <strong>&ldquo;{query}&rdquo;</strong>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <header className='sticky top-0 z-50 w-full px-3 pt-3 sm:px-5'>
      <div
        ref={navRef}
        className='mx-auto flex h-[68px] max-w-[1400px] items-center gap-4 rounded-full border border-white/60 bg-white/80 px-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md lg:px-8'
      >
        {/* Logo (file: public/TechNestLogo.png — change extension if yours is different) */}
        <Link href='/' className='flex shrink-0 items-center gap-2' aria-label='TechNest home'>
          <Image
            src='/TechNestLogo.png'
            alt='TechNest'
            width={180}
            height={48}
            priority
            className='h-10 w-auto'
          />
          <span className='text-[22px] font-extrabold tracking-tight text-neutral-900'>
            Tech<span className='text-[#a3dc0b]'>Nest.</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className='mx-auto hidden justify-center items-center gap-1 lg:flex'>
          <Link
            href='/'
            className={`${linkBase} ${isHome ? 'bg-[#e4f5b8] hover:bg-[#e4f5b8]' : ''}`}
          >
            <House size={16} fill={isHome ? 'currentColor' : 'none'} />
            Home
          </Link>

          {/* Shop dropdown */}
          <div
            className='relative'
            onMouseEnter={() => setDropdown('shop')}
            onMouseLeave={() => setDropdown(null)}
          >
            <button
              className={linkBase}
              onClick={() => setDropdown(d => (d === 'shop' ? null : 'shop'))}
              aria-expanded={dropdown === 'shop'}
            >
              Shop
              <ChevronDown size={14} className={`transition-transform ${dropdown === 'shop' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {dropdown === 'shop' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className='absolute left-0 top-full z-50 pt-2'
                >
                  <div className='w-52 rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl'>
                    {SHOP_LINKS.map(l => (
                      <Link key={l.href} href={l.href} className='block rounded-xl px-3 py-2 text-sm text-neutral-800 hover:bg-lime-50'>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Categories dropdown */}
          <div
            className='relative'
            onMouseEnter={() => setDropdown('categories')}
            onMouseLeave={() => setDropdown(null)}
          >
            <button
              className={linkBase}
              onClick={() => setDropdown(d => (d === 'categories' ? null : 'categories'))}
              aria-expanded={dropdown === 'categories'}
            >
              Categories
              <ChevronDown size={14} className={`transition-transform ${dropdown === 'categories' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {dropdown === 'categories' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className='absolute left-0 top-full z-50 pt-2'
                >
                  <div className='w-60 rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl'>
                    {CATEGORIES.map(({ label, icon: Icon }) => (
                      <Link
                        key={label}
                        href={`/products?category=${encodeURIComponent(label)}`}
                        className='flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-800 hover:bg-lime-50'
                      >
                        <Icon size={16} strokeWidth={1.6} />
                        {label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href='/products?sort=deals' className={linkBase}>Deals</Link>
          
        </nav>

        {/* Divider */}
        <div className='ml-auto hidden h-6 w-px bg-neutral-300 lg:block' />

        {/* Desktop search */}
        <div className='hidden w-[300px] lg:block xl:w-[340px]'>{SearchBox}</div>

        {/* Icons */}
        <div className='ml-auto flex items-center gap-1 lg:ml-0'>
          <Link
            href={user ? '/account' : '/auth/login'}
            aria-label='Account'
            className='hidden h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-lime-100 sm:flex'
          >
            {user?.photoURL ? (
              <Image src={user.photoURL} width={26} height={26} alt='' className='rounded-full' />
            ) : (
              <User size={22} strokeWidth={1.8} />
            )}
          </Link>

          <Link
            href='/wishlist'
            aria-label='Wishlist'
            className='hidden h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-lime-100 sm:flex'
          >
            <Heart size={22} strokeWidth={1.8} />
          </Link>

          <button
            onClick={handleCartClick}
            aria-label='Cart'
            className='relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-lime-100'
          >
            <ShoppingCart size={22} strokeWidth={1.8} />
            {mounted && (
              <motion.span
                key={count}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className='absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime-500 px-1 text-[10px] font-bold text-white'
              >
                {count}
              </motion.span>
            )}
          </button>

          <button
            className='flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 hover:bg-lime-100 lg:hidden'
            onClick={() => setMenuOpen(v => !v)}
            aria-label='Menu'
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className='mx-auto mt-2 max-w-[1400px] rounded-3xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-md lg:hidden'
          >
            <div className='mb-3'>{SearchBox}</div>

            <div className='flex flex-col'>
              <Link href='/' className='flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-lime-50'>
                <House size={17} /> Home
              </Link>
              {SHOP_LINKS.map(l => (
                <Link key={l.href} href={l.href} className='rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-lime-50'>
                  {l.label}
                </Link>
              ))}
              <Link href='/products?sort=deals' className='rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-lime-50'>Deals</Link>
              

              <div className='my-2 h-px bg-neutral-200' />

              <Link href={user ? '/account' : '/auth/login'} className='flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-lime-50'>
                <User size={17} /> {user ? 'Account' : 'Sign in'}
              </Link>
              <Link href='/wishlist' className='flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-lime-50'>
                <Heart size={17} /> Wishlist
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}