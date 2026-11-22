'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Sparkle, Star } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

const BLOB_ROTATIONS = [-9, 7, -5, 11, -7, 4];

const formatReviewCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
};

function ProductBlob({ index }: { index: number }) {
  const rotation = BLOB_ROTATIONS[index % BLOB_ROTATIONS.length];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 160"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[86%] w-[88%]"
      style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
    >
      <path
        d="M99.8 8.6c34.6-8.7 77.4 9.8 90.4 43.5 13 33.7-4.3 78.2-36.8 95.1-32.5 16.9-79.9 6.4-105.9-21.5C21.5 97.8 17.9 56.2 37.8 31.2 57.7 6.2 65.2 17.3 99.8 8.6Z"
        fill="#eaf4d2"
      />
    </svg>
  );
}

function FeaturedCard({
  product,
  index,
  wishlisted,
  onWishlist,
}: {
  product: Product;
  index: number;
  wishlisted: boolean;
  onWishlist: (product: Product, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const variant = product.variants?.[0];
  const image = variant?.images?.[0] ?? null;
  const price = variant?.price ?? product.basePrice;
  const comparePrice =
    product.comparePrice && product.comparePrice > price ? product.comparePrice : null;
  const hasRating = product.avgRating > 0 && product.reviewCount > 0;

  return (
    <article className="featured-card group relative flex flex-col overflow-hidden rounded-[14px] border border-[#eceadd] bg-white shadow-[0_1px_2px_rgba(63,74,34,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(63,74,34,0.10)]">
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-[2] rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fbe0a] focus-visible:ring-offset-2"
      />

      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: 'calc(var(--fp-card) * 0.73)' }}
      >
        <ProductBlob index={index} />

        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 170px, (max-width: 1024px) 200px, 240px"
            className="z-[1] object-contain p-[7%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            style={{
              maskImage:
                'radial-gradient(ellipse 64% 64% at 50% 50%, #000 46%, rgba(0,0,0,0.7) 62%, transparent 88%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 64% 64% at 50% 50%, #000 46%, rgba(0,0,0,0.7) 62%, transparent 88%)',
            }}
          />
        ) : (
          <div className="relative z-[1] flex h-full items-center justify-center text-[11px] text-neutral-300">
            No image
          </div>
        )}

        <button
          type="button"
          onClick={(event) => onWishlist(product, event)}
          aria-label={`${wishlisted ? 'Remove' : 'Add'} ${product.name} ${
            wishlisted ? 'from' : 'to'
          } wishlist`}
          className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full text-[#3c4036] transition-all duration-200 hover:bg-white/80 hover:text-red-500 active:scale-90"
        >
          <Heart
            size={14}
            strokeWidth={1.7}
            className={wishlisted ? 'fill-red-500 text-red-500' : ''}
          />
        </button>
      </div>

      <div className="flex min-h-[calc(var(--fp-card)*0.48)] flex-1 flex-col px-3 pb-3 pt-2">
        <p className="text-[10px] font-medium leading-none text-[#8a8d7f]">{product.category}</p>

        <h3 className="mt-1 line-clamp-1 font-display text-[13px] font-bold leading-tight text-[#22261f] transition-colors duration-200 group-hover:text-[#5c7a0a]">
          {product.name}
        </h3>

        <div className="mt-1 flex min-h-[14px] items-center gap-1 leading-none">
          <Star
            size={10}
            strokeWidth={1.5}
            className={hasRating ? 'fill-[#e8a317] text-[#e8a317]' : 'text-[#c9ccbf]'}
          />
          {hasRating ? (
            <>
              <span className="text-[10px] font-semibold text-[#3f4338]">
                {product.avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-[#9a9d90]">
                ({formatReviewCount(product.reviewCount)} reviews)
              </span>
            </>
          ) : (
            <span className="text-[10px] text-[#9a9d90]">No reviews yet</span>
          )}
        </div>

        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          <span className="text-[14px] font-bold leading-none text-[#15181d]">
            ${price.toFixed(2)}
          </span>
          {comparePrice && (
            <span className="text-[10px] font-medium leading-none text-[#a7aa9c] line-through">
              ${comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="featured-card overflow-hidden rounded-[14px] border border-[#eceadd] bg-white">
      <div
        className="relative animate-pulse"
        style={{ height: 'calc(var(--fp-card) * 0.73)' }}
      >
        <div className="absolute left-1/2 top-1/2 h-[70%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f1f4e7]" />
      </div>
      <div className="flex min-h-[calc(var(--fp-card)*0.48)] flex-col gap-2 px-3 pb-3 pt-2.5">
        <div className="h-2 w-1/3 animate-pulse rounded bg-[#f1f0e7]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#f1f0e7]" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-[#f1f0e7]" />
        <div className="mt-auto h-3 w-1/3 animate-pulse rounded bg-[#f1f0e7]" />
      </div>
    </div>
  );
}

function NavButton({
  direction,
  label,
  onClick,
  compact = false,
}: {
  direction: 'prev' | 'next';
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full border border-[#e3e1d4] bg-white/80 text-[#2f332b] shadow-[0_1px_2px_rgba(63,74,34,0.06)] backdrop-blur transition-all duration-200 hover:border-[#2f332b] hover:bg-[#2f332b] hover:text-white active:scale-95 ${
        compact ? 'h-7 w-7' : 'h-8 w-8'
      }`}
    >
      <Icon size={compact ? 13 : 15} strokeWidth={1.8} />
    </button>
  );
}

function SectionDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute -left-40 -top-36 h-[340px] w-[500px] opacity-80"
        viewBox="0 0 500 400"
        fill="none"
      >
        <path
          d="M125 34C213-8 334 4 410 72C486 140 497 250 435 318C373 386 242 411 142 367C42 323-22 214 11 130C44 46 61 68 125 34Z"
          fill="#edf5d9"
        />
      </svg>

      <svg
        className="absolute -right-36 -top-40 h-[360px] w-[470px] opacity-90"
        viewBox="0 0 500 400"
        fill="none"
      >
        <path
          d="M125 34C213-8 334 4 410 72C486 140 497 250 435 318C373 386 242 411 142 367C42 323-22 214 11 130C44 46 61 68 125 34Z"
          fill="#eef6de"
          transform="rotate(164 250 200)"
        />
      </svg>

      <svg
        className="absolute -bottom-32 -right-24 h-[300px] w-[420px] opacity-80"
        viewBox="0 0 500 400"
        fill="none"
      >
        <path
          d="M125 34C213-8 334 4 410 72C486 140 497 250 435 318C373 386 242 411 142 367C42 323-22 214 11 130C44 46 61 68 125 34Z"
          fill="#eaf4d3"
          transform="rotate(196 250 200)"
        />
      </svg>

      <Sparkle className="absolute left-[8%] top-[19%] h-4 w-4 text-[#b6e33e]" fill="currentColor" />
      <Sparkle
        className="absolute bottom-[9%] right-[3%] h-4 w-4 text-[#b6e33e]"
        fill="currentColor"
      />
      <Sparkle
        className="absolute left-[2.5%] top-[68%] h-2.5 w-2.5 text-[#d3eb95]"
        fill="currentColor"
      />
    </div>
  );
}

export default function FeaturedProducts() {
  const { data, isLoading } = useFeaturedProducts();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const user = useAuthStore((s) => s.user);

  const autoScrollTop = useMemo(
    () =>
      AutoScroll({
        speed: 0.5,
        startDelay: 0,
        direction: 'backward',
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    [],
  );

  const autoScrollBottom = useMemo(
    () =>
      AutoScroll({
        speed: 0.5,
        startDelay: 0,
        direction: 'forward',
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    [],
  );

  const [topRef, topApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true, containScroll: false },
    [autoScrollTop],
  );

  const [bottomRef, bottomApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true, containScroll: false },
    [autoScrollBottom],
  );

  const resumeTimers = useRef<{ top?: number; bottom?: number }>({});

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      autoScrollTop.stop();
      autoScrollBottom.stop();
    }

    const timers = resumeTimers.current;
    return () => {
      window.clearTimeout(timers.top);
      window.clearTimeout(timers.bottom);
    };
  }, [autoScrollTop, autoScrollBottom]);

  const handleWishlist = (product: Product, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error('Please log in to save items');
      return;
    }

    const variant = product.variants?.[0];
    toggleWishlist({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      basePrice: product.basePrice,
      comparePrice: product.comparePrice,
      variantSku: variant?.sku ?? '',
      image: variant?.images?.[0] ?? '',
    });
  };

  const navigate = (row: 'top' | 'bottom', direction: 'prev' | 'next') => {
    const api = row === 'top' ? topApi : bottomApi;
    const plugin = row === 'top' ? autoScrollTop : autoScrollBottom;
    if (!api) return;

    plugin.stop();
    if (direction === 'prev') api.scrollPrev();
    else api.scrollNext();

    window.clearTimeout(resumeTimers.current[row]);
    resumeTimers.current[row] = window.setTimeout(() => plugin.play(), 2200);
  };

  const products = data ?? [];
  const rowOne = products.filter((_, index) => index % 2 === 0);
  const rowTwo = products.filter((_, index) => index % 2 === 1);

  const fillRow = (items: Product[]) => {
    if (items.length === 0) return [];
    const repeats = Math.max(1, Math.ceil(10 / items.length));
    return Array.from({ length: repeats }, () => items).flat();
  };

  const topSlides = fillRow(rowOne.length > 0 ? rowOne : products);
  const bottomSlides = fillRow(rowTwo.length > 0 ? rowTwo : products);

  const slideStyle = {
    flex: '0 0 calc(var(--fp-card) + var(--fp-gap))',
    paddingLeft: 'var(--fp-gap)',
  } as React.CSSProperties;

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="featured-section relative overflow-hidden border-y border-[#e9e7da] bg-[#f7f6ed]">
      <SectionDecor />

      <div className="featured-shell relative z-10 pb-12 pt-9 sm:pb-14 sm:pt-11 lg:pb-16 lg:pt-12">
        <header className="relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6d8] px-3 py-1.5 text-[11px] font-semibold leading-none text-[#3f4a22]">
            <Star size={10} strokeWidth={1.5} className="fill-[#8fbe0a] text-[#8fbe0a]" />
            Top Picks
          </span>

          <div className="mt-4 flex w-full items-center gap-4 sm:gap-6 lg:pr-20">
            <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-[#dfe8c9] sm:block" />
            <h2 className="shrink-0 font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] text-[#15181d] sm:text-[36px] lg:text-[38px]">
              Featured Products
            </h2>
            <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-[#dfe8c9] sm:block" />
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#7a7d70] sm:text-[14px]">
            Handpicked tech. Better everyday experiences.
          </p>

          <div className="absolute right-0 top-[46px] hidden items-center gap-2 lg:flex">
            <NavButton
              direction="prev"
              label="Previous featured products"
              onClick={() => navigate('top', 'prev')}
            />
            <NavButton
              direction="next"
              label="Next featured products"
              onClick={() => navigate('top', 'next')}
            />
          </div>
        </header>

        {isLoading ? (
          <div className="mt-8 overflow-hidden sm:mt-9">
            <div className="flex" style={{ marginLeft: 'calc(var(--fp-gap) * -1)' }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="min-w-0" style={slideStyle}>
                  <FeaturedCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Row 1 — auto-scrolls to the right */}
            <div className="mt-8 overflow-hidden sm:mt-9">
              <div ref={topRef} className="overflow-hidden">
                <div
                  className="flex touch-pan-y"
                  style={{ marginLeft: 'calc(var(--fp-gap) * -1)' }}
                >
                  {topSlides.map((product, index) => (
                    <div
                      key={`top-${product._id}-${index}`}
                      className="min-w-0"
                      style={slideStyle}
                    >
                      <FeaturedCard
                        product={product}
                        index={index}
                        wishlisted={isInWishlist(product._id)}
                        onWishlist={handleWishlist}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 — auto-scrolls to the left */}
            <div className="relative mt-6 sm:mt-7 lg:pl-[60px]">
              <div className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1.5 lg:flex">
                <NavButton
                  compact
                  direction="prev"
                  label="Previous featured products row two"
                  onClick={() => navigate('bottom', 'prev')}
                />
                <NavButton
                  compact
                  direction="next"
                  label="Next featured products row two"
                  onClick={() => navigate('bottom', 'next')}
                />
              </div>

              <div ref={bottomRef} className="overflow-hidden">
                <div
                  className="flex touch-pan-y"
                  style={{ marginLeft: 'calc(var(--fp-gap) * -1)' }}
                >
                  {bottomSlides.map((product, index) => (
                    <div
                      key={`bottom-${product._id}-${index}`}
                      className="min-w-0"
                      style={slideStyle}
                    >
                      <FeaturedCard
                        product={product}
                        index={index + 2}
                        wishlisted={isInWishlist(product._id)}
                        onWishlist={handleWishlist}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-9 flex justify-center sm:mt-10">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-[#2f332b] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(47,51,43,0.18)] transition-all duration-200 hover:bg-[#15181d] hover:shadow-[0_10px_26px_rgba(47,51,43,0.24)] active:scale-[0.98]"
          >
            View All Products
            <ArrowRight
              size={15}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
