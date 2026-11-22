'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Headset,
  LayoutGrid,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

const TRUST = [
  { icon: ShieldCheck, line1: '100% Genuine', line2: 'Products', chevron: false },
  { icon: Truck, line1: 'Fast & Reliable', line2: 'Delivery', chevron: false },
  { icon: Headset, line1: '24/7 Customer', line2: 'Support', chevron: false },
  { icon: RotateCcw, line1: 'Easy Returns', line2: '', chevron: true },
];

function Star({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='currentColor'
      className={className}
      aria-hidden
    >
      <path d='M12 0c.66 6.44 5.56 11.34 12 12-6.44.66-11.34 5.56-12 12-.66-6.44-5.56-11.34-12-12C6.44 11.34 11.34 6.44 12 0Z' />
    </svg>
  );
}

export default function HeroBanner() {
  const reduce = useReducedMotion();

  const rise = (delay: number, distance = 18) => ({
    initial: reduce ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      className='relative isolate -mt-[52px] overflow-hidden bg-[#FDFBF5] pt-[52px] text-[#15181D]'
      style={{ fontFamily: 'var(--font-ubuntu), Ubuntu, sans-serif' }}
    >
      {/* soft cream + lime atmosphere */}
      <div aria-hidden className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
        <div className='absolute left-1/2 top-[-8%] h-[560px] w-[1100px] -translate-x-1/2 rounded-[50%] bg-[#F7F8ED] blur-[100px]' />
        <div className='absolute -left-[14%] top-[16%] h-[520px] w-[560px] rounded-full bg-[#EEF4D8] opacity-55 blur-[110px]' />
        <div className='absolute -right-[12%] top-[24%] h-[520px] w-[540px] rounded-full bg-[#EAF2CF] opacity-50 blur-[120px]' />
        <div className='absolute bottom-[6%] left-1/2 h-[360px] w-[820px] -translate-x-1/2 rounded-[50%] bg-[#F0F6D9] opacity-60 blur-[100px]' />

        {/* lime ribbon looping around the headline */}
        <svg
          className='absolute inset-0 h-full w-full'
          viewBox='0 0 1440 1000'
          preserveAspectRatio='none'
          fill='none'
        >
          <path
            d='M-70 470C120 398 165 244 382 187C648 116 972 110 1168 232C1322 330 1292 474 1128 538'
            stroke='#B4E22C'
            strokeWidth='2'
            opacity='0.55'
            vectorEffect='non-scaling-stroke'
          />
          <path
            d='M1188 120C1288 146 1335 220 1298 294'
            stroke='#B4E22C'
            strokeWidth='2'
            opacity='0.38'
            vectorEffect='non-scaling-stroke'
          />
        </svg>

        <Star size={26} className='absolute left-[7.5%] top-[23%] text-[#A8DF12] opacity-90' />
        <Star size={19} className='absolute right-[12%] top-[38%] text-[#B7E63A] opacity-80' />
        <Star size={14} className='absolute right-[5%] top-[62%] hidden text-[#A8DF12] opacity-70 lg:block' />
      </div>

      <div className='relative z-10 mx-auto w-full max-w-[1240px] px-4 sm:px-6'>
        {/* copy */}
        <div className='relative z-20 pt-7 text-center sm:pt-10 lg:pt-12'>
          <motion.div {...rise(0.02, 12)} className='flex justify-center'>
            <span className='inline-flex items-center gap-2 rounded-full border border-[#DDEBC0] bg-[#F1F8DB]/90 px-4 py-[7px] text-[11.5px] font-medium text-[#283018] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm sm:text-[12px]'>
              <Star size={12} className='text-[#4F6B12]' />
              Your Trusted Gadget Store
            </span>
          </motion.div>

          <motion.h1
            {...rise(0.08, 22)}
            className='mx-auto mt-4 max-w-[980px] text-[clamp(2.2rem,6.2vw,5.4rem)] font-extrabold leading-[0.94] tracking-[-0.035em] text-[#15181D] sm:mt-5'
            style={{ fontFamily: 'var(--font-nunito), Nunito, sans-serif' }}
          >
            Everything Tech.
            <br />
            All in{' '}
            <span className='relative inline-block text-[#A3DC0B]'>
              One
              <svg
                className='pointer-events-none absolute left-[-3%] top-[84%] h-[12px] w-[106%]'
                viewBox='0 0 120 16'
                fill='none'
                preserveAspectRatio='none'
                aria-hidden
              >
                <path
                  d='M3 11.5C26 4.5 64 3.5 112 8.8'
                  stroke='#A3DC0B'
                  strokeWidth='4.2'
                  strokeLinecap='round'
                  vectorEffect='non-scaling-stroke'
                />
                <path
                  d='M103 5.9C108 6.7 113 7.7 117 9'
                  stroke='#A3DC0B'
                  strokeWidth='3.6'
                  strokeLinecap='round'
                  vectorEffect='non-scaling-stroke'
                />
              </svg>
            </span>{' '}
            Place.
          </motion.h1>

          <motion.p
            {...rise(0.16, 16)}
            className='mx-auto mt-4 max-w-[520px] text-[13.5px] leading-[1.55] text-[#5E6257] sm:mt-5 sm:text-[15.5px]'
          >
            From powerful laptops to your everyday essentials,
            <br className='hidden sm:block' /> discover the gadgets that keep you ahead.
          </motion.p>

          <motion.div
            {...rise(0.24, 16)}
            className='mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3'
          >
            <Link
              href='/products'
              className='group inline-flex h-11 items-center gap-2 rounded-full bg-[#A3DC0B] px-5 text-[13px] font-semibold text-[#15181D] shadow-[0_10px_26px_-10px_rgba(163,220,11,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8fbe0a] sm:text-[13.5px]'
            >
              Shop Now
              <ArrowRight
                size={15}
                strokeWidth={2.4}
                className='transition-transform duration-200 group-hover:translate-x-0.5'
              />
            </Link>

            <Link
              href='/#categories'
              className='group inline-flex h-11 items-center gap-2 rounded-full border border-[#E1E4D6] bg-white/80 px-5 text-[13px] font-medium text-[#22261F] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CFD5BE] hover:bg-white sm:text-[13.5px]'
            >
              Explore Categories
              <LayoutGrid size={15} strokeWidth={2} className='text-[#3A4032]' />
            </Link>
          </motion.div>
        </div>

        {/* product composition */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className='relative z-10 mx-auto -mt-8 w-full max-w-[960px] sm:-mt-12 lg:-mt-20'
        >
          <Image
            src='/HeroImage.png'
            alt='Laptop, smartphone, headphones, smartwatch, earbuds and speaker arranged on a display podium'
            width={1672}
            height={941}
            preload
            sizes='(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 960px'
            className='h-auto w-full select-none'
          />
        </motion.div>
      </div>

      {/* trust strip */}
      <div className='relative z-10 border-t border-[#E9E8DC] bg-[#FCFAF4]/85 backdrop-blur-sm'>
        <div className='mx-auto grid max-w-[1100px] grid-cols-2 px-3 py-2 sm:grid-cols-4 sm:divide-x sm:divide-[#E7E6D9] sm:px-5 sm:py-3'>
          {TRUST.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.line1}
                className='flex items-center justify-center gap-2.5 px-2 py-2.5 sm:gap-3 sm:px-4'
              >
                <Icon size={21} strokeWidth={1.8} className='shrink-0 text-[#1B1E22]' />
                <div className='text-left'>
                  <p className='text-[11.5px] font-semibold leading-[1.25] text-[#22251F] sm:text-[12px]'>
                    {item.line1}
                  </p>
                  {item.line2 && (
                    <p className='text-[11px] leading-[1.25] text-[#4E5348] sm:text-[11.5px]'>
                      {item.line2}
                    </p>
                  )}
                </div>
                {item.chevron && (
                  <ChevronRight size={14} strokeWidth={2} className='ml-0.5 text-[#6A7062]' />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
