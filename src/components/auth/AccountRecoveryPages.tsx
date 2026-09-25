import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { AuthCard, AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

const emailSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirm: z.string().min(8, 'Confirm your new password.'),
}).refine((values) => values.password === values.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match.',
});

export const ForgotPasswordPage: React.FC = () => {
  const { configured, requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    }
  });

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          Enter the email on your account. If it exists, Supabase will send a reset link.
        </p>
        {sent ? (
          <div className="mt-5 rounded-xl bg-[#ECFDF3] px-3 py-3 text-sm leading-6 text-[#027A48]">
            If an account exists for that email, a reset message is on the way. Open the link on this device to choose a new password.
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium">
              Email address
              <input
                type="email"
                className="mt-1.5 h-12 w-full rounded-xl border border-[#E4E7EC] px-3 text-base outline-none focus:ring-2 focus:ring-[#6546F5]"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <span className="mt-1 block text-sm text-[#B42318]">{form.formState.errors.email.message}</span>
              )}
            </label>
            {error && <div className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">{error}</div>}
            <button
              type="submit"
              disabled={!configured || form.formState.isSubmitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6546F5] font-semibold text-white disabled:opacity-60"
            >
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset email
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#6546F5]">
          Back to sign in
        </Link>
      </AuthCard>
    </AuthLayout>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { configured, updatePassword, loading, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await updatePassword(password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.');
    }
  });

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          This page completes the email reset link. The new password replaces the previous one on your account.
        </p>
        {!loading && configured && !session && (
          <div className="mt-5 rounded-xl bg-[#FFFAEB] px-3 py-3 text-sm leading-6 text-[#7A2E0E]">
            Open the reset link from your email so Supabase can start a recovery session. Then set the new password here.
          </div>
        )}
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
          <label className="block text-sm font-medium">
            New password
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1.5 h-12 w-full rounded-xl border border-[#E4E7EC] px-3 text-base outline-none focus:ring-2 focus:ring-[#6546F5]"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <span className="mt-1 block text-sm text-[#B42318]">{form.formState.errors.password.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1.5 h-12 w-full rounded-xl border border-[#E4E7EC] px-3 text-base outline-none focus:ring-2 focus:ring-[#6546F5]"
              {...form.register('confirm')}
            />
            {form.formState.errors.confirm && (
              <span className="mt-1 block text-sm text-[#B42318]">{form.formState.errors.confirm.message}</span>
            )}
          </label>
          {error && <div className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">{error}</div>}
          <button
            type="submit"
            disabled={!configured || !session || form.formState.isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6546F5] font-semibold text-white disabled:opacity-60"
          >
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

export const HelpPage: React.FC = () => (
  <AuthLayout>
    <AuthCard>
      <h1 className="text-2xl font-semibold tracking-tight">How Compose AI helps</h1>
      <div className="mt-4 space-y-3 text-sm leading-6 text-[#475467]">
        <p>
          Compose AI is an early-stage workspace for architects, developers, and builders. It organizes a project from setup and documents through plot notes, a design brief, room program, concept schemes, floor plans, 3D massing, exterior direction, preliminary compliance notes, cost, and deliverables.
        </p>
        <p>
          It does not replace a licensed architect, engineer, surveyor, contractor, or code official. Plans, costs, and compliance notes are preliminary and need professional verification.
        </p>
        <p>
          Zoning values stay unverified until you or a verified source enter them. The app will not treat a missing survey as a measured site.
        </p>
      </div>
      <Link to="/login" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[#6546F5]">
        Return to sign in
      </Link>
    </AuthCard>
  </AuthLayout>
);
