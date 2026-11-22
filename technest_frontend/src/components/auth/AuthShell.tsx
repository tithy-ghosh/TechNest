'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import { ShieldCheck, Zap, Headset } from 'lucide-react';
import type { ReactNode } from 'react';

const fadeUp = (i: number): MotionProps => ({
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] },
  },
});

const FEATURES = [
  { icon: ShieldCheck, label: <span>Secure &amp;<br />Private</span> },
  { icon: Zap, label: <span>Fast<br />Checkout</span> },
  { icon: Headset, label: <span>24/7<br />Support</span> },
];

interface AuthShellProps {
  children: ReactNode;
  brandTitle?: string;
  brandAccent?: string;
  brandSubtitle?: string;
}

export default function AuthShell({
  children,
  brandTitle = 'Welcome',
  brandAccent = 'Back!',
  brandSubtitle = 'Sign in to continue your shopping journey with TechNest.',
}: AuthShellProps) {
  return (
    <div className='relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#fbfdf5] px-4 py-8 sm:px-6'>
      {/* ── page background ── */}
      <div aria-hidden className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-48 right-[-10%] h-[560px] w-[560px] rounded-full bg-lime-300/25 blur-[130px]' />
        <div className='absolute bottom-[-12%] left-[-8%] h-[480px] w-[480px] rounded-full bg-lime-400/20 blur-[130px]' />
      </div>

      {/* ── card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className='relative z-10 flex w-full max-w-[1080px] overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_12px_48px_rgba(0,0,0,0.08)]'
      >
        {/* ══════ LEFT — brand panel ══════ */}
        <div
          className='relative hidden w-[46%] flex-col overflow-hidden p-9 lg:flex'
          style={{
            // Matches LoginImage.png's cream backdrop so the product photo
            // melts into the panel instead of sitting in a visible box.
            background:
              'radial-gradient(90% 75% at 84% 70%, rgba(201,232,111,0.32) 0%, rgba(201,232,111,0) 62%), linear-gradient(160deg, #fcfbee 0%, #fbfaec 55%, #f7f8e3 100%)',
          }}
        >
          {/* logo */}
          <motion.div {...fadeUp(0)} className='relative z-10 flex items-center gap-2.5 mix-blend-darken'>
            <Image
              src='/TechNestLogo.png'
              alt='TechNest'
              width={44}
              height={44}
              priority
              className='h-11 w-auto'
            />
            <span className='text-[22px] font-extrabold tracking-tight text-neutral-900'>
              Tech<span className='text-[#8fce0a]'>Nest.</span>
            </span>
          </motion.div>

          {/* heading */}
          <motion.div {...fadeUp(1)} className='relative z-10 mt-10'>
            <h2 className='text-[34px] font-extrabold leading-tight tracking-tight text-neutral-900'>
              {brandTitle}{' '}
              <span className='relative inline-block text-[#84c006]'>
                {brandAccent}
                <svg
                  aria-hidden
                  viewBox='0 0 120 12'
                  className='absolute -bottom-1.5 left-0 w-full'
                  preserveAspectRatio='none'
                >
                  <motion.path
                    d='M4 9 C 32 3, 88 2, 116 7'
                    fill='none'
                    stroke='#a3dc0b'
                    strokeWidth='4'
                    strokeLinecap='round'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                  />
                </svg>
              </span>
            </h2>
            <p className='mt-3 max-w-[320px] text-[15px] leading-relaxed text-neutral-600'>
              {brandSubtitle}
            </p>
          </motion.div>

          {/* product image — blend mode + matching cream panel hide its backdrop */}
          <div className='relative mt-6 min-h-[240px] flex-1'>
            <Image
              src='/LoginImage.png'
              alt='Latest TechNest gadgets — laptop and headphones'
              fill
              priority
              sizes='(min-width: 1024px) 460px, 0px'
              className='object-contain object-center mix-blend-darken'
            />
          </div>

          {/* feature chips */}
          <motion.div {...fadeUp(2)} className='relative z-10 mt-6 flex items-start justify-between gap-3'>
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <div key={i} className='flex items-center gap-2.5'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/85 shadow-sm'>
                  <Icon size={19} className='text-[#5c7a0a]' strokeWidth={1.7} />
                </span>
                <span className='text-[11.5px] font-medium leading-snug text-neutral-700'>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══════ RIGHT — form panel ══════ */}
        <div className='relative flex min-w-0 flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-14'>
          {/* mobile logo */}
          <div className='mb-8 flex items-center gap-2 lg:hidden'>
            <Image
              src='/TechNestLogo.png'
              alt='TechNest'
              width={36}
              height={36}
              priority
              className='h-9 w-auto mix-blend-darken'
            />
            <span className='text-xl font-extrabold tracking-tight text-neutral-900'>
              Tech<span className='text-[#8fce0a]'>Nest.</span>
            </span>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
