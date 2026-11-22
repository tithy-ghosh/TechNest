'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '@/components/auth/AuthShell';
import { authInputCx, authPrimaryButtonCx } from '@/components/auth/authStyles';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schemas';

const fadeUp = (i: number): MotionProps => ({
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] },
  },
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      // honour ?redirect=... (e.g. navbar sends /auth/login?redirect=/cart)
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/');
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(apiMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      brandTitle='Welcome'
      brandAccent='Back!'
      brandSubtitle='Sign in to continue your shopping journey with TechNest.'
    >
      {/* heading */}
      <motion.div {...fadeUp(0)}>
        <h1 className='text-[30px] font-extrabold tracking-tight text-neutral-900'>
          Sign In
        </h1>
        <p className='mt-2 text-sm text-neutral-500'>
          Enter your email and password to access your account.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-7 space-y-5' noValidate>
        {/* email */}
        <motion.div {...fadeUp(1)}>
          <label htmlFor='email' className='mb-1.5 block text-[13px] font-semibold text-neutral-800'>
            Email address
          </label>
          <div className='relative'>
            <Mail size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400' />
            <input
              id='email'
              {...formRegister('email')}
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
        <motion.div {...fadeUp(2)}>
          <div className='mb-1.5 flex items-center justify-between'>
            <label htmlFor='password' className='block text-[13px] font-semibold text-neutral-800'>
              Password
            </label>
            <Link
              href='/auth/forgot-password'
              className='text-xs font-semibold text-neutral-700 underline-offset-2 transition-colors hover:text-[#5c7a0a] hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <Lock size={16} className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400' />
            <input
              id='password'
              {...formRegister('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder='Your password'
              autoComplete='current-password'
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
          {errors.password && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className='mt-1.5 pl-1 text-xs text-red-500'
            >
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>

        {/* submit */}
        <motion.div {...fadeUp(3)} className='pt-1'>
          <button
            type='submit'
            disabled={loading}
            className={authPrimaryButtonCx}
          >
            {loading ? (
              <>
                <Loader2 size={17} className='animate-spin' />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={16} strokeWidth={2.5} className='transition-transform duration-200 group-hover:translate-x-0.5' />
              </>
            )}
          </button>
        </motion.div>
      </form>

      {/* register footer */}
      <motion.div {...fadeUp(4)} className='mt-7 border-t border-neutral-100 pt-5'>
        <p className='text-center text-sm text-neutral-500'>
          New to TechNest?{' '}
          <Link
            href='/auth/register'
            className='font-semibold text-[#5c7a0a] transition-colors hover:text-[#3f5608] hover:underline'
          >
            Create an account
          </Link>
        </p>
      </motion.div>

      {/* trust note */}
      <motion.div {...fadeUp(5)} className='mt-5 flex items-center justify-center gap-1.5'>
        <ShieldCheck size={13} className='text-neutral-400' />
        <span className='text-[11.5px] text-neutral-400'>SSL encrypted &amp; secure — your data stays private</span>
      </motion.div>
    </AuthShell>
  );
}
