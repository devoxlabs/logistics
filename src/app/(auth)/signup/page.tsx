'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup, subscribeToAuth } from '@/services/authClient';
import { validateEmail, validatePassword, validateName, rateLimiter } from '@/lib/validation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
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

  const handleNameBlur = () => {
    if (name) {
      const validation = validateName(name);
      setNameError(validation.valid ? null : validation.error || null);
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      const validation = validateEmail(email);
      setEmailError(validation.valid ? null : validation.error || null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(null);

    if (value.length > 0) {
      const validation = validatePassword(value);
      if (!validation.valid) {
        setPasswordError(validation.error || null);
        setPasswordStrength(null);
      } else {
        setPasswordStrength(validation.strength || null);
      }
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setRateLimitError(null);

    // Validate name (optional but if provided must be valid)
    if (name) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        setNameError(nameValidation.error || 'Invalid name');
        return;
      }
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || 'Invalid email');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || 'Invalid password');
      return;
    }

    // Check rate limiting
    if (!rateLimiter.isAllowed('signup', 3, 60000)) {
      const resetTime = Math.ceil(rateLimiter.getResetTime('signup', 60000) / 1000);
      setRateLimitError(`Too many signup attempts. Please try again in ${resetTime} seconds.`);
      return;
    }

    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      rateLimiter.clear('signup'); // Clear on successful signup
      router.replace('/');
    } catch (err: any) {
      const errorMessage = err.message ?? 'Failed to sign up';

      // Provide user-friendly error messages
      if (errorMessage.includes('email-already-in-use')) {
        setEmailError('An account with this email already exists');
      } else if (errorMessage.includes('invalid-email')) {
        setEmailError('Invalid email address');
      } else if (errorMessage.includes('weak-password')) {
        setPasswordError('Password is too weak');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return '';
    return passwordStrength === 'strong' ? 'bg-success' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-destructive';
  };

  const getStrengthWidth = () => {
    if (!passwordStrength) return '0%';
    return passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%';
  };

  return (
    <div className='w-full'>
      <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-1'>
        Create account
      </h1>
      <p className='text-sm text-muted-foreground mb-6'>
        Sign up to start using the dashboard.
      </p>

      <form onSubmit={handleSubmit} className='space-y-5'>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-foreground'>Name (Optional)</label>
          <input
            type='text'
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            onBlur={handleNameBlur}
            className={`w-full rounded-lg border ${nameError ? 'border-destructive' : 'border-input'} bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${nameError ? 'focus:ring-destructive/20 focus:border-destructive' : 'focus:ring-primary/20 focus:border-primary'} transition-all duration-200`}
            placeholder='John Doe'
            autoComplete='name'
          />
          {nameError && (
            <p className='text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>{nameError}</p>
          )}
        </div>
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
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={`w-full rounded-lg border ${passwordError ? 'border-destructive' : 'border-input'} bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${passwordError ? 'focus:ring-destructive/20 focus:border-destructive' : 'focus:ring-primary/20 focus:border-primary'} transition-all duration-200`}
            placeholder='••••••••'
            required
            autoComplete='new-password'
          />
          {password.length > 0 && !passwordError && passwordStrength && (
            <div className='space-y-1'>
              <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
                  style={{ width: getStrengthWidth() }}
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                Password strength: <span className='font-medium capitalize'>{passwordStrength}</span>
              </p>
            </div>
          )}
          {passwordError && (
            <p className='text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>{passwordError}</p>
          )}
          {!passwordError && password.length === 0 && (
            <p className='text-xs text-muted-foreground'>
              Must be 8+ characters with uppercase, lowercase, number, and special character
            </p>
          )}
        </div>

        {(error || rateLimitError) && (
          <div className='rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200'>
            <p className='text-sm text-destructive'>{rateLimitError || error}</p>
          </div>
        )}

        <button
          type='submit'
          disabled={loading || !!nameError || !!emailError || !!passwordError}
          className='w-full mt-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
        >
          {loading ? (
            <span className='inline-flex items-center gap-2'>
              <span className='h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
              <span>Creating account...</span>
            </span>
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      <p className='mt-6 text-sm text-muted-foreground text-center'>
        Already have an account?{' '}
        <Link href='/login' className='text-primary font-medium hover:underline transition-all duration-200'>
          Sign in
        </Link>
      </p>
    </div>
  );
}
