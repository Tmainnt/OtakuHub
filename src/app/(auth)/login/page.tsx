'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { fetchAPI } from '@/services/api';

type LoginResponse = { token: string; user_id: number; username: string; role: string };

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      }) as LoginResponse;

      if (!data?.token || !data.user_id) throw new Error('The server returned an invalid login response.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', String(data.user_id));
      localStorage.setItem('userRole', data.role);
      window.dispatchEvent(new Event('authchange'));

      const next = new URLSearchParams(window.location.search).get('next');
      const destination = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/catalog';
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="login">
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-200">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-200">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required minLength={3} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-400/10" placeholder="Your username" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-400/10" placeholder="Enter your password" />
        </div>
        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}
