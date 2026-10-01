import Link from 'next/link';

const sections = [
  { href: '/catalog', number: '01', title: 'Discover stories', copy: 'Browse anime, manga and novels. Find your next world to get lost in.', color: 'from-violet-500/20' },
  { href: '/community', number: '02', title: 'Find your people', copy: 'Share what you love and meet fans with the same taste.', color: 'from-pink-500/20' },
  { href: '/chat', number: '03', title: 'Talk it out', copy: 'Join a room and chat about the latest episode or chapter.', color: 'from-cyan-500/20' },
];

export default function Home() {
  return <div className="overflow-hidden bg-[#09090f] text-white">
    <section className="relative mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-6 py-24 sm:px-10 lg:min-h-[680px]">
      <div className="pointer-events-none absolute -right-20 top-8 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="relative max-w-3xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[.22em] text-violet-200"><span className="h-2 w-2 rounded-full bg-fuchsia-400" /> Your fandom, all in one place</p>
        <h1 className="text-5xl font-black leading-[1.04] tracking-tight sm:text-7xl">Stories bring us<br/><span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">together.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">A home for anime, manga and novel fans. Keep track of what you love, share your thoughts, and find your community.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="/catalog" className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-violet-100">Explore the catalog <span aria-hidden>→</span></Link><Link href="/register" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Join OtakuHub</Link></div>
      </div>
      <div className="relative mt-16 grid max-w-3xl grid-cols-3 gap-3 sm:mt-20 sm:gap-5">{[['Anime', 'Explore'], ['Manga', 'Collect'], ['Community', 'Connect']].map(([label, sub]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur sm:p-5"><p className="text-lg font-bold sm:text-2xl">{label}</p><p className="mt-1 text-xs text-zinc-500 sm:text-sm">{sub}</p></div>)}</div>
    </section>
    <section className="border-t border-white/5 bg-white/[.02] px-6 py-20 sm:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">Make it yours</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your fandom has a home.</h2><div className="mt-10 grid gap-4 md:grid-cols-3">{sections.map((section) => <Link key={section.number} href={section.href} className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${section.color} to-transparent p-6 transition hover:-translate-y-1 hover:border-white/20`}><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest text-zinc-500">{section.number}</span><span className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-white">↗</span></div><h3 className="mt-9 text-xl font-bold">{section.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{section.copy}</p></Link>)}</div></div></section>
  </div>;
}
