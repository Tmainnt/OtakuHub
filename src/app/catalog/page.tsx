'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/services/api';

type MediaItem = { id: number; title: string; type: string; origin_country?: string; source_format?: string; release_year?: number; creator?: string; episodes_or_volumes?: number; watch_order_info?: string; ost_list?: string; social_links?: string };
type MediaDraft = Omit<MediaItem, 'id'>;

const subscribeToAuth = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('authchange', callback); };
};
const getRole = () => localStorage.getItem('userRole') || '';
const emptyDraft = (): MediaDraft => ({ title: '', type: 'anime', origin_country: '', source_format: '', release_year: undefined, creator: '', episodes_or_volumes: undefined, watch_order_info: '', ost_list: '', social_links: '' });
const inputClass = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

export default function CatalogPage() {
  const role = useSyncExternalStore(subscribeToAuth, getRole, () => '');
  const isAdmin = role === 'admin';
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<MediaDraft>(emptyDraft());
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ query: search, type: typeFilter });
      try {
        setMediaList(await fetchAPI(`/media?${params}`, { signal: controller.signal }) || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not connect to the catalog.');
        setMediaList([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [search, typeFilter, refreshKey]);

  const startCreate = () => { setEditingId(null); setDraft(emptyDraft()); setNotice(''); setEditorOpen(true); };
  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setDraft({ title: item.title, type: item.type, origin_country: item.origin_country || '', source_format: item.source_format || '', release_year: item.release_year || undefined, creator: item.creator || '', episodes_or_volumes: item.episodes_or_volumes || undefined, watch_order_info: item.watch_order_info || '', ost_list: item.ost_list || '', social_links: item.social_links || '' });
    setNotice('');
    setEditorOpen(true);
  };

  const saveMedia = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await fetchAPI('/admin/media', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, title: draft.title.trim(), id: editingId }) });
      setNotice(editingId ? 'Title updated.' : 'Title added to the catalog.');
      setEditorOpen(false);
      setEditingId(null);
      setDraft(emptyDraft());
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save this title.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!window.confirm(`Delete “${item.title}” from the catalog?`)) return;
    setNotice('');
    try {
      await fetchAPI(`/admin/media?id=${item.id}`, { method: 'DELETE' });
      setMediaList((items) => items.filter((media) => media.id !== item.id));
      setNotice('Title deleted.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete this title.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5fa] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-3xl bg-[#111019] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">The OtakuHub library</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Explore stories</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Find anime, manga and novels to add to your collection.</p></div>
            {isAdmin && <button type="button" onClick={startCreate} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-violet-100">＋ Add a title</button>}
          </div>
        </header>

        {notice && <p role="status" className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-violet-900">{notice}</p>}

        {editorOpen && isAdmin && <form onSubmit={saveMedia} className="space-y-5 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-gray-950">{editingId ? 'Edit catalog title' : 'Add a catalog title'}</h2><p className="mt-1 text-sm text-gray-500">The information is saved to the OtakuHub catalog.</p></div><button type="button" onClick={() => setEditorOpen(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Close</button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">Title<input required maxLength={250} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700">Type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className={inputClass}><option value="anime">Anime</option><option value="manga">Manga</option><option value="novel">Novel</option></select></label>
            <label className="text-sm font-medium text-gray-700">Origin country<input value={draft.origin_country} onChange={(event) => setDraft({ ...draft, origin_country: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700">Source format<input value={draft.source_format} onChange={(event) => setDraft({ ...draft, source_format: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700">Release year<input type="number" min="1900" max="2100" value={draft.release_year ?? ''} onChange={(event) => setDraft({ ...draft, release_year: event.target.value ? Number(event.target.value) : undefined })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700">Creator<input value={draft.creator} onChange={(event) => setDraft({ ...draft, creator: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700">Episodes / volumes<input type="number" min="0" value={draft.episodes_or_volumes ?? ''} onChange={(event) => setDraft({ ...draft, episodes_or_volumes: event.target.value ? Number(event.target.value) : undefined })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Watch / reading order<textarea rows={2} value={draft.watch_order_info} onChange={(event) => setDraft({ ...draft, watch_order_info: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">OST list<textarea rows={2} value={draft.ost_list} onChange={(event) => setDraft({ ...draft, ost_list: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Official links<input value={draft.social_links} onChange={(event) => setDraft({ ...draft, social_links: event.target.value })} className={inputClass} /></label>
          </div>
          <button disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add title'}</button>
        </form>}

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:p-6">
          <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Search titles<input type="search" placeholder="Search anime, manga, novels…" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} /></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 sm:w-56">Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClass}><option value="">All types</option><option value="anime">Anime</option><option value="manga">Manga</option><option value="novel">Novel</option></select></label>
        </section>

        {loading ? <p className="py-14 text-center text-sm text-gray-500">Loading catalog…</p> : error ? <div role="alert" className="rounded-xl bg-rose-50 p-6 text-center text-rose-800">{error}<p className="mt-2 text-sm">Check the backend connection and try again.</p></div> : mediaList.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><p className="font-semibold text-gray-800">No titles found</p><p className="mt-1 text-sm text-gray-500">Try a different title or type filter.</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mediaList.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={`/media/${item.id}`} className="block p-6">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">{item.type}</span>
              <h2 className="mt-4 break-words text-xl font-bold text-gray-950">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{[item.origin_country, item.release_year].filter(Boolean).join(' · ') || 'Details coming soon'}</p>
              {item.creator && <p className="mt-1 text-sm text-gray-600">by {item.creator}</p>}
              {item.episodes_or_volumes ? <p className="mt-3 text-xs font-medium text-gray-400">{item.episodes_or_volumes} {item.type === 'anime' ? 'episodes' : 'volumes'}</p> : null}
            </Link>
            {isAdmin && <div className="flex gap-2 border-t border-gray-100 px-5 py-3"><button onClick={() => startEdit(item)} className="rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">Edit</button><button onClick={() => void deleteMedia(item)} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button></div>}
          </article>)}
        </div>}
      </div>
    </div>
  );
}
