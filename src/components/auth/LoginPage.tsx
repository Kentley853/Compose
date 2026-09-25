import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { AuthCard, AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

const authSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  remember: z.boolean(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const LoginPage: React.FC = () => {
  const { configured, googleEnabled, githubEnabled, signIn, signUp, signInWithProvider } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signIn(values.email, values.password, values.remember);
      } else {
        const result = await signUp(values.email, values.password);
        if (result.needsEmailConfirmation) {
          setNotice('Account created. Check your email to confirm it, then sign in.');
          setMode('sign-in');
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  });

  const startOAuth = async (provider: 'google' | 'github') => {
    setFormError(null);
    setOauthProvider(provider);
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not start provider sign-in.');
      setOauthProvider(null);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight text-[#172033]">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your workspace'}
        </h1>
        <p className="mt-1 text-sm text-[#667085]">
          {mode === 'sign-in' ? 'Sign in to continue to Compose' : 'Use your email to start a private project workspace.'}
        </p>

        {!configured && (
          <div className="mt-5 rounded-xl border border-[#FEC84B] bg-[#FFFAEB] px-3 py-3 text-sm leading-6 text-[#7A2E0E]">
            Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the app.
          </div>
        )}

        {(googleEnabled || githubEnabled) && (
          <div className="mt-6 space-y-3">
            {googleEnabled && (
              <button
                type="button"
                disabled={!configured || oauthProvider !== null}
                onClick={() => startOAuth('google')}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E4E7EC] text-sm font-semibold hover:bg-[#F8F9FC] disabled:opacity-60"
              >
                Continue with Google
              </button>
            )}
            {githubEnabled && (
              <button
                type="button"
                disabled={!configured || oauthProvider !== null}
                onClick={() => startOAuth('github')}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E4E7EC] text-sm font-semibold hover:bg-[#F8F9FC] disabled:opacity-60"
              >
                Continue with GitHub
              </button>
            )}
            <div className="flex items-center gap-3 text-xs text-[#98A2B3]">
              <span className="h-px flex-1 bg-[#E4E7EC]" />
              or
              <span className="h-px flex-1 bg-[#E4E7EC]" />
            </div>
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <label className="block text-sm font-medium text-[#344054]">
            Email address
            <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-[#E4E7EC] px-3 focus-within:ring-2 focus-within:ring-[#6546F5]">
              <Mail className="h-4 w-4 text-[#98A2B3]" />
              <input
                type="email"
                autoComplete="email"
                className="h-11 w-full bg-transparent text-base outline-none"
                placeholder="you@example.com"
                {...form.register('email')}
              />
            </span>
            {form.formState.errors.email && (
              <span className="mt-1 block text-sm text-[#B42318]">{form.formState.errors.email.message}</span>
            )}
          </label>

          <label className="block text-sm font-medium text-[#344054]">
            Password
            <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-[#E4E7EC] px-3 focus-within:ring-2 focus-within:ring-[#6546F5]">
              <LockKeyhole className="h-4 w-4 text-[#98A2B3]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                className="h-11 w-full bg-transparent text-base outline-none"
                placeholder="Enter your password"
                {...form.register('password')}
              />
              <button
                type="button"
                className="grid h-11 w-11 place-items-center text-[#667085]"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
            {form.formState.errors.password && (
              <span className="mt-1 block text-sm text-[#B42318]">{form.formState.errors.password.message}</span>
            )}
          </label>

          {mode === 'sign-in' && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="inline-flex min-h-11 items-center gap-2 text-[#344054]">
                <input type="checkbox" className="h-4 w-4 accent-[#6546F5]" {...form.register('remember')} />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-semibold text-[#6546F5] hover:text-[#4632C4]">
                Forgot password?
              </Link>
            </div>
          )}

          {formError && <div className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">{formError}</div>}
          {notice && <div className="rounded-xl bg-[#ECFDF3] px-3 py-2 text-sm text-[#027A48]">{notice}</div>}

          <button
            type="submit"
            disabled={!configured || submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6546F5] to-[#5267F7] text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#667085]">
          {mode === 'sign-in' ? 'New to Compose?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-semibold text-[#6546F5]"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setFormError(null);
              setNotice(null);
            }}
          >
            {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </AuthCard>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9F2] bg-white px-4 py-3">
        <div>
          <div className="text-sm font-semibold">New to Compose?</div>
          <p className="text-sm text-[#667085]">See how the architectural workflow is organized.</p>
        </div>
        <Link to="/help" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#6546F5]">
          Take a tour
        </Link>
      </div>
    </AuthLayout>
  );
};
