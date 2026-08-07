'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { setAuthNextCookie } from '@/lib/auth/pending-query';

type OAuthProvider = 'google' | 'github';

type SignUpOptions = {
  name?: string;
  /** Where to send the user after email confirmation (e.g. /search?q=...). */
  next?: string;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithOAuth: (provider: OAuthProvider, next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
};

/**
 * The auth callback URL is intentionally kept free of query params: Supabase's
 * redirect-URL allowlist matches the full URL (query string included), so a
 * bare /auth/callback matches the common dashboard entry without wildcards.
 * The post-auth destination is carried in a cookie instead (setAuthNextCookie).
 */
function buildAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  if (isSupabaseConfigured && !clientRef.current) {
    clientRef.current = createClient();
  }
  const client = clientRef.current;

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: 'Authentication is not configured.' };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    },
    [client],
  );

  const signUp = useCallback(
    async (email: string, password: string, options?: SignUpOptions) => {
      if (!client) return { error: 'Authentication is not configured.', needsConfirmation: false };
      if (options?.next) setAuthNextCookie(options.next);
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: options?.name ? { name: options.name } : undefined,
          emailRedirectTo: buildAuthCallbackUrl(),
        },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    },
    [client],
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider, next?: string) => {
      if (!client) return;
      if (next) setAuthNextCookie(next);
      await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: buildAuthCallbackUrl() },
      });
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
  }, [client]);

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      if (!client) return { error: 'Authentication is not configured.' };
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });
      return { error: error ? error.message : null };
    },
    [client],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signOut,
      resetPasswordForEmail,
    }),
    [
      user,
      session,
      loading,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signOut,
      resetPasswordForEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
