'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-service';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await signUp(email, password, familyName || undefined);
      } else {
        await signIn(email, password);
      }

      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {mode === 'signup' && (
        <div>
          <label className="mb-2 block text-sm text-text-primary" htmlFor="familyName">
            Family name
          </label>
          <input
            id="familyName"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm outline-none"
            placeholder="The Smith Family"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm text-text-primary" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm outline-none"
          placeholder="parent@example.com"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-text-primary" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm outline-none"
          placeholder={mode === 'signup' ? 'Create a password' : '••••••••'}
          required
        />
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-bg-primary transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-text-muted">
        {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link href={mode === 'signup' ? '/login' : '/signup'} className="font-medium text-accent">
          {mode === 'signup' ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </form>
  );
}
