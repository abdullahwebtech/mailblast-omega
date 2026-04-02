'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isEmailVerified: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  supabase: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabase();

  const isEmailVerified = !!(user?.email_confirmed_at);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      
      // Inject X-User-Id interceptor for initial load if user exists
      if (s?.user) {
        setupFetchInterceptor(s.user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, s: Session | null) => {
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          setupFetchInterceptor(s.user.id);
        } else {
          removeFetchInterceptor();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      removeFetchInterceptor();
    };
  }, [supabase]);

  // Fetch interceptor helpers
  const setupFetchInterceptor = (userId: string) => {
    if (!userId || (window as any)._fetchInterceptorSetup) return;
    
    const originalFetch = window.fetch;
    window.fetch = async (resource, config) => {
      let finalResource = resource;
      let finalConfig = config;

      const url = typeof finalResource === 'string' ? finalResource : (finalResource instanceof Request ? finalResource.url : '');
      const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanApiUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
      const isInterceptTarget = url.startsWith(cleanApiUrl) || url.startsWith('/api');

      if (isInterceptTarget) {
        if (typeof finalResource === 'string') {
          finalConfig = { ...config };
          const headers = new Headers(finalConfig.headers || {});
          headers.set('X-User-Id', userId);
          finalConfig.headers = headers;
        } else if (finalResource instanceof Request) {
          const newHeaders = new Headers(finalResource.headers);
          newHeaders.set('X-User-Id', userId);
          finalResource = new Request(finalResource, { headers: newHeaders });
        }
      }

      return (window as any)._originalFetch(finalResource, finalConfig);
    };
    
    (window as any)._originalFetch = originalFetch;
    (window as any)._fetchInterceptorSetup = true;
  };

  const removeFetchInterceptor = () => {
    if ((window as any)._originalFetch) {
      window.fetch = (window as any)._originalFetch;
      (window as any)._fetchInterceptorSetup = false;
    }
  };

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Auth not configured', needsVerification: false };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) return { error: error.message, needsVerification: false };

      // If user exists but identities is empty, email is already taken
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: 'An account with this email already exists. Please log in instead.', needsVerification: false };
      }

      return { error: null, needsVerification: true };
    } catch (e: any) {
      return { error: e.message || 'Signup failed', needsVerification: false };
    }
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Auth not configured' };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Login failed' };
    }
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: 'Auth not configured' };
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) return { error: error.message };
      if (data?.url) {
        window.location.href = data.url;
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Google sign-in failed' };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/');
  }, [supabase, router]);

  const resendVerification = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Auth not configured' };
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to resend' };
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Auth not configured' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Password reset failed' };
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{
      user, session, loading, isEmailVerified,
      signUp, signIn, signInWithGoogle, signOut, resendVerification, resetPassword, supabase
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
