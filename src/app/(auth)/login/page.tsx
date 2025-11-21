'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, subscribeToAuth } from '@/services/authClient';
import { validateEmail, rateLimiter } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsub = subscribeToAuth((user) => {
        if (user) router.replace('/');
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
      return () => undefined;
    }
  }, [router]);

  const handleEmailBlur = () => {
    if (email) {
      const validation = validateEmail(email);
      setEmailError(validation.valid ? null : validation.error || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setRateLimitError(null);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'Invalid email');
      return;
    }

    // Validate password presence
    if (!password || password.trim().length === 0) {
      setError('Password is required');
      return;
    }

    // Check rate limiting
    if (!rateLimiter.isAllowed('login', 5, 60000)) {
      const resetTime = Math.ceil(rateLimiter.getResetTime('login', 60000) / 1000);
      setRateLimitError(`Too many login attempts. Please try again in ${resetTime} seconds.`);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      rateLimiter.clear('login'); // Clear on successful login
      router.replace('/');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to login';

      // Provide user-friendly error messages
      if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email address');
      } else if (errorMessage.includes('wrong-password')) {
        setError('Incorrect password. Please try again');
      } else if (errorMessage.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later');
      } else if (errorMessage.includes('invalid-email')) {
        setEmailError('Invalid email address');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full'>
      <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-1'>Welcome back</h1>
      <p className='text-sm text-muted-foreground mb-6'>
        Sign in to access your dashboard.
      </p>

      <form onSubmit={handleSubmit} className='space-y-5'>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-foreground'>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
            onBlur={handleEmailBlur}
            className={`w-full rounded-lg border ${emailError ? 'border-destructive' : 'border-input'} bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-destructive/20 focus:border-destructive' : 'focus:ring-primary/20 focus:border-primary'} transition-all duration-200`}
            placeholder='you@example.com'
            required
            autoComplete='email'
          />
          {emailError && (
            <p className='text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>{emailError}</p>
          )}
        </div>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-foreground'>Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className='w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200'
            placeholder='••••••••'
            required
            autoComplete='current-password'
          />
        </div>

        {(error || rateLimitError) && (
          <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200'>
            <p className='text-sm text-destructive'>{rateLimitError || error}</p>
          </div>
        )}

        <button
          type='submit'
          disabled={loading || !!emailError}
          className='w-full mt-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
        >
          {loading ? (
            <span className='inline-flex items-center gap-2'>
              <span className='h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
              <span>Signing in...</span>
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className='mt-6 text-sm text-muted-foreground text-center'>
        Don&apos;t have an account?{' '}
        <Link href='/signup' className='text-primary font-medium hover:underline transition-all duration-200'>
          Sign up
        </Link>
      </p>
    </div>
  );
}
