'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { fetchAPI } from '@/services/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="register">
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-200">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-200">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required minLength={3} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-400/10" placeholder="Choose a username" />
          <p className="mt-2 text-xs text-zinc-500">Use 3 to 32 characters.</p>
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-400/10" placeholder="Create a password" />
          <p className="mt-2 text-xs text-zinc-500">Use at least 8 characters.</p>
        </div>
        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  );
}
