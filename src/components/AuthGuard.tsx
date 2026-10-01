'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('authchange', callback);
  };
};

const hasToken = () => Boolean(localStorage.getItem('token'));
const isPublicPath = (pathname: string) => pathname === '/' || pathname === '/login' || pathname === '/register';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authenticated = useSyncExternalStore(subscribe, hasToken, () => false);
  const publicPath = isPublicPath(pathname);

  useEffect(() => {
    if (!publicPath && !authenticated) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [authenticated, pathname, publicPath, router]);

  if (publicPath || authenticated) return children;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#09090f] px-6 text-white" role="status" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-300" />
        <p className="mt-4 text-sm text-zinc-400">Checking your session…</p>
      </div>
    </div>
  );
}
