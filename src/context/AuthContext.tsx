import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export type AuthModalView = 'sign_in' | 'sign_up' | 'forgot_password' | 'verification_sent';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalView: AuthModalView;
  setAuthModalView: (view: AuthModalView) => void;
  openSignIn: () => void;
  openSignUp: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_MOCK_USER_KEY = 'compose_ai_supabase_mock_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('sign_in');
  const isConfigured = isSupabaseConfigured();

  // Restore authenticated session on mount
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (isConfigured) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Error fetching Supabase session:', error);
          }
          if (mounted && data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        } catch (e) {
          console.warn('Supabase auth getSession caught error:', e);
        }
      } else {
        // Mock fallback user for preview/offline evaluation
        try {
          const savedMock = localStorage.getItem(LOCAL_STORAGE_MOCK_USER_KEY);
          if (savedMock && mounted) {
            const parsed = JSON.parse(savedMock);
            setUser(parsed);
          } else if (mounted) {
            // Default demo architect account
            const defaultUser: any = {
              id: 'usr-architect-alpha-01',
              email: 'composeai1406@gmail.com',
              user_metadata: {
                full_name: 'Lead Architectural Engineer',
                role: 'Principal Architect',
              },
              app_metadata: { provider: 'email' },
              created_at: new Date().toISOString(),
            };
            setUser(defaultUser);
            localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(defaultUser));
          }
        } catch (e) {
          console.warn('Mock auth parse error:', e);
        }
      }

      if (mounted) setLoading(false);
    }

    initializeAuth();

    // Listen to live Supabase auth state changes if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (isConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [isConfigured]);

  const openSignIn = () => {
    setAuthModalView('sign_in');
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthModalView('sign_up');
    setAuthModalOpen(true);
  };

  // Sign In implementation
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (!isConfigured) {
      // Mock sign in
      const mockUser: any = {
        id: `usr-${btoa(email.toLowerCase()).substring(0, 12)}`,
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: email.split('@')[0],
          role: 'Architect',
        },
        app_metadata: { provider: 'email' },
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(mockUser));
      setAuthModalOpen(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      setAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed.' };
    }
  };

  // Sign Up implementation
  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (!isConfigured) {
      // Mock sign up
      const mockUser: any = {
        id: `usr-${btoa(email.toLowerCase()).substring(0, 12)}`,
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: fullName || email.split('@')[0],
          role: 'Architect',
        },
        app_metadata: { provider: 'email' },
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(mockUser));
      setAuthModalOpen(false);
      return { success: true, requiresEmailVerification: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            role: 'Architect',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // Confirmation email sent
        setAuthModalView('verification_sent');
        return { success: true, requiresEmailVerification: true };
      }

      setUser(data.user);
      setSession(data.session);
      setAuthModalOpen(false);
      return { success: true, requiresEmailVerification: false };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  // Sign Out implementation
  const signOut = async (): Promise<void> => {
    if (!isConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_MOCK_USER_KEY);
      setUser(null);
      setSession(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (e) {
      console.warn('Sign out warning:', e);
      setUser(null);
      setSession(null);
    }
  };

  // Forgot Password implementation
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email) {
      return { success: false, error: 'Please enter your account email address.' };
    }

    if (!isConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not send reset email.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        authModalOpen,
        setAuthModalOpen,
        authModalView,
        setAuthModalView,
        openSignIn,
        openSignUp,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
