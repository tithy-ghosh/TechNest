'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2,
  ShieldCheck, MailCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '@/components/auth/AuthShell';
import { authInputCx, authPrimaryButtonCx } from '@/components/auth/authStyles';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth.schemas';

const fadeUp = (i: number): MotionProps => ({
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] },
  },
});

function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  'bg-neutral-200', 'bg-red-400', 'bg-amber-400', 'bg-lime-400', 'bg-[#7a9e0a]',
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password') ?? '';
  const score = useMemo(() => passwordScore(password), [password]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password);
      setSubmittedEmail(data.email);
      setRegistered(true);
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(apiMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      brandTitle='Join'
      brandAccent='TechNest!'
      brandSubtitle='Create your account and start shopping the latest tech today.'
    >
      <AnimatePresence mode='wait'>
        {registered ? (
          /* ══════ success state ══════ */
          <motion.div
            key='success'
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className='py-6 text-center'
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220 }}
              className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100'
            >
              <MailCheck size={30} className='text-[#5c7a0a]' strokeWidth={1.8} />
            </motion.div>

            <h1 className='mb-2 text-[30px] font-extrabold tracking-tight text-neutral-900'>
              Check your email
            </h1>
            <p className='text-sm text-neutral-500'>We sent a verification link to</p>
            <p className='mb-5 mt-1 text-sm font-semibold text-neutral-900'>{submittedEmail}</p>
            <p className='mx-auto mb-8 max-w-[300px] text-xs leading-relaxed text-neutral-400'>
              Click the link to activate your account.
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Link
              href='/auth/login'
              className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#a3dc0b] to-[#65a30d] px-7 text-sm font-bold text-white shadow-[0_8px_24px_rgba(143,190,10,0.35)] transition-all duration-200 hover:shadow-[0_10px_32px_rgba(143,190,10,0.5)]'
            >
              Back to login
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </motion.div>
        ) : (
          <motion.div key='form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* heading */}
            <motion.div {...fadeUp(0)}>
              <h1 className='text-[30px] font-extrabold tracking-tight text-neutral-900'>
                Create your account
              </h1>
              <p className='mt-2 text-sm text-neutral-500'>
                Start shopping the latest tech today.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className='mt-7 space-y-5' noValidate>
              {/* name */}
              <motion.div {...fadeUp(1)}>
                <label htmlFor='name' className='mb-1.5 block text-[13px] font-semibold text-neutral-800'>
                  Full name
                </label>
                <div className='relative'>
                  <User size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400' />
                  <input
                    id='name'
                    {...register('name')}
                    type='text'
                    placeholder='John Doe'
                    autoComplete='name'
                    className={authInputCx(!!errors.name)}
                  />
                </div>
                {errors.name && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className='mt-1.5 pl-1 text-xs text-red-500'
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </motion.div>

              {/* email */}
              <motion.div {...fadeUp(2)}>
                <label htmlFor='email' className='mb-1.5 block text-[13px] font-semibold text-neutral-800'>
                  Email address
                </label>
                <div className='relative'>
                  <Mail size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400' />
                  <input
                    id='email'
                    {...register('email')}
                    type='email'
                    placeholder='you@example.com'
                    autoComplete='email'
                    className={authInputCx(!!errors.email)}
                  />
                </div>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className='mt-1.5 pl-1 text-xs text-red-500'
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              {/* password */}
              <motion.div {...fadeUp(3)}>
                <label htmlFor='password' className='mb-1.5 block text-[13px] font-semibold text-neutral-800'>
                  Password
                </label>
                <div className='relative'>
                  <Lock size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400' />
                  <input
                    id='password'
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Min. 8 characters'
                    autoComplete='new-password'
                    className={authInputCx(!!errors.password)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700'
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* strength meter */}
                {password.length > 0 && !errors.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-2.5 overflow-hidden'
                  >
                    <div className='flex items-center gap-1.5'>
                      {[1, 2, 3, 4].map(seg => (
                        <span
                          key={seg}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            score >= seg ? STRENGTH_COLORS[score] : 'bg-neutral-200'
                          }`}
                        />
                      ))}
                      <span className='ml-1 w-14 text-right text-[10.5px] font-semibold text-neutral-500'>
                        {STRENGTH_LABELS[score]}
                      </span>
                    </div>
                  </motion.div>
                )}
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className='mt-1.5 pl-1 text-xs text-red-500'
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              {/* terms note */}
              <motion.p {...fadeUp(4)} className='text-xs leading-relaxed text-neutral-400'>
                By creating an account you agree to our{' '}
                <span className='font-medium text-neutral-500'>Terms of Service</span> and{' '}
                <span className='font-medium text-neutral-500'>Privacy Policy</span>.
              </motion.p>

              {/* submit */}
              <motion.div {...fadeUp(5)} className='pt-0.5'>
                <button
                  type='submit'
                  disabled={loading}
                  className={authPrimaryButtonCx}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className='animate-spin' />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={16} strokeWidth={2.5} className='transition-transform duration-200 group-hover:translate-x-0.5' />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* divider + sign in */}
            <motion.div {...fadeUp(6)} className='mt-7 border-t border-neutral-100 pt-5'>
              <p className='text-center text-sm text-neutral-500'>
                Already have an account?{' '}
                <Link
                  href='/auth/login'
                  className='font-semibold text-[#5c7a0a] transition-colors hover:text-[#3f5608] hover:underline'
                >
                  Sign in
                </Link>
              </p>
            </motion.div>

            {/* trust note */}
            <motion.div {...fadeUp(7)} className='mt-5 flex items-center justify-center gap-1.5'>
              <ShieldCheck size={13} className='text-neutral-400' />
              <span className='text-[11.5px] text-neutral-400'>SSL encrypted &amp; secure — your data stays private</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
