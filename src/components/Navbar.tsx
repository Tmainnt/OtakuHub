'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

const subscribeToAuth = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('authchange', callback); };
};
const hasAuthToken = () => Boolean(localStorage.getItem('token'));

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const authenticated = useSyncExternalStore(subscribeToAuth, hasAuthToken, () => false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide navbar on auth pages if desired
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authchange'));
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0b13]/95 text-white shadow-lg backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-black tracking-tight text-white">
              Otaku<span className="text-violet-300">Hub</span>
            </Link>
            {authenticated && <div className="hidden items-center gap-1 md:flex">
              <Link
                href="/catalog"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === '/catalog' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/community"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === '/community' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Community
              </Link>
              <Link
                href="/characters"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === '/characters' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Characters
              </Link>
              <Link
                href="/chat"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === '/chat' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Chat Rooms
              </Link>
              <Link
                href="/profile"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === '/profile' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Profile
              </Link>
            </div>}
          </div>
          <div className="flex items-center gap-2">
            {authenticated ? <button
              onClick={handleLogout}
              className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 sm:block"
            >
              Sign out
            </button> : <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-zinc-200 hover:text-white sm:block">Sign in</Link>}
            {!authenticated && <Link href="/register" className="hidden rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-violet-100 sm:block">Get started</Link>}
            <button type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white md:hidden">{menuOpen ? 'Close' : 'Menu'}</button>
          </div>
        </div>
        {menuOpen && <div className="grid gap-1 border-t border-white/10 py-3 md:hidden">
          {authenticated && [["/catalog", "Catalog"], ["/characters", "Characters"], ["/community", "Community"], ["/chat", "Chat rooms"], ["/profile", "Profile"]].map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white">{label}</Link>)}
          {authenticated ? <button onClick={handleLogout} className="mt-1 rounded-lg bg-white/5 px-3 py-2.5 text-left text-sm font-semibold text-white">Sign out</button> : <><Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white">Sign in</Link><Link href="/register" onClick={() => setMenuOpen(false)} className="mt-1 rounded-lg bg-violet-300 px-3 py-2.5 text-sm font-bold text-zinc-950">Create account</Link></>}
        </div>}
      </div>
    </nav>
  );
}
