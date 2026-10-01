import Link from 'next/link';

export default function AuthLayout({ children, mode }: { children: React.ReactNode; mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#09090f] px-4 py-10 text-white sm:px-6">
      <div className="pointer-events-none absolute -left-40 top-0 -z-10 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 -z-10 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111019] shadow-2xl shadow-black/40 lg:grid-cols-[1fr_0.9fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-violet-500/15 via-[#171421] to-fuchsia-500/10 p-12 lg:flex">
          <Link href="/" className="w-fit text-2xl font-black tracking-tight">Otaku<span className="text-violet-300">Hub</span></Link>
          <div className="py-12">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">A home for every fandom</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">Your next<br /><span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">favorite story</span><br />starts here.</h1>
            <p className="mt-6 max-w-sm leading-7 text-zinc-400">Keep your favorites close, find new stories, and share the moments you love with fellow fans.</p>
          </div>
          <p className="text-xs text-zinc-600">Discover · Collect · Connect</p>
        </aside>

        <section className="p-6 sm:p-10 lg:p-12">
          <Link href="/" className="text-lg font-black tracking-tight lg:hidden">Otaku<span className="text-violet-300">Hub</span></Link>
          <div className="mx-auto mt-8 max-w-md lg:mt-10">
            <p className="text-sm font-semibold text-violet-300">{isLogin ? 'WELCOME BACK' : 'YOUR COMMUNITY AWAITS'}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{isLogin ? 'Sign in to OtakuHub' : 'Create your account'}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{isLogin ? 'Pick up where your fandom left off.' : 'Join fans discovering and sharing the stories they love.'}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-7 text-center text-sm text-zinc-400">
              {isLogin ? 'New to OtakuHub?' : 'Already have an account?'}{' '}
              <Link href={isLogin ? '/register' : '/login'} className="font-semibold text-violet-300 transition hover:text-violet-200">
                {isLogin ? 'Create an account' : 'Sign in'}
              </Link>
            </p>
            <Link href="/" className="mt-8 block text-center text-xs text-zinc-600 transition hover:text-zinc-300">← Back to homepage</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
