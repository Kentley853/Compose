import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { friendlyAuthError } from '../lib/authErrors';

export type OAuthProviderName = 'google' | 'github';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  googleEnabled: boolean;
  githubEnabled: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProviderName) => Promise<void>;
  updateProfile: (profile: { fullName?: string; company?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function providerEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    session,
    user: session?.user ?? null,
    googleEnabled: providerEnabled(import.meta.env.VITE_AUTH_GOOGLE_ENABLED),
    githubEnabled: providerEnabled(import.meta.env.VITE_AUTH_GITHUB_ENABLED),
    async signIn(email, password, remember) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      localStorage.setItem('compose_auth_remember', remember ? '1' : '0');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async signUp(email, password) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      localStorage.setItem('compose_auth_remember', '1');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw new Error(friendlyAuthError(error));
      return { needsEmailConfirmation: !data.session };
    },
    async signOut() {
      if (!configured) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(friendlyAuthError(error));
    },
    async requestPasswordReset(email) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async updatePassword(password) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async signInWithProvider(provider) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async updateProfile(profile) {
      if (!configured) throw new Error('Supabase authentication is not configured.');
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          company: profile.company,
        },
      });
      if (error) throw new Error(friendlyAuthError(error));
    },
  }), [configured, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
