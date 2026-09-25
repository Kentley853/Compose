export function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'Something went wrong.');
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'That email and password do not match. Try again or reset your password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email address before signing in. Check your inbox for the confirmation message.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return 'Use a password with at least 8 characters.';
  }
  if (lower.includes('unable to validate email')) {
    return 'Enter a valid email address.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'That sign-in provider is not enabled in Supabase yet.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'The network request failed. Check your connection and try again.';
  }
  if (lower.includes('signup is disabled')) {
    return 'Email sign-up is disabled for this Supabase project.';
  }

  return message.replace(/^authapierror:\s*/i, '');
}

export function friendlyDatabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('user_id') && lower.includes('column')) {
    return 'Projects cannot be saved until the ownership migration is applied in Supabase.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('jwt')) {
    return 'You do not have permission to change this record. Sign in again and confirm the project belongs to your account.';
  }
  if (lower.includes('duplicate key')) {
    return 'A record with this identifier already exists.';
  }
  return message;
}
