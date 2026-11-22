'use client';
import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';

export function AuthProvider({children}:{children:React.ReactNode}) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true })
      .then(({ data }) => {
        if (cancelled) return;
        const session = data?.data;
        if (session?.user && session?.accessToken) {
          setAuth(session.user, session.accessToken);
          useWishlistStore.getState().fetchWishlist();
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        // Don't wipe a session created while this request was in flight
        // (e.g. the user submitted the login form before refresh finished).
        if (!cancelled && !useAuthStore.getState().accessToken) clearAuth();
      });

    return () => { cancelled = true; };
  }, [setAuth, clearAuth]);

  return <>{children}</>;
}
