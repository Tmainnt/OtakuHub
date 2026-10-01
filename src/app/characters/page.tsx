'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchAPI } from '@/services/api';

type Appearance = { id: number; title: string; type: string; release_year: number };
type Character = { id: number; name: string; personal_info: string; birthplace: string; family_details: string; image_collection: string; related_media_songs_games: string; first_appearance_year: number; appearances: Appearance[] };
type MediaOption = { id: number; title: string; type: string; release_year: number };
type Draft = Omit<Character, 'id' | 'first_appearance_year' | 'appearances'> & { mediaIds: number[] };

const subscribeToAuth = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('authchange', callback); };
};
const getRole = () => localStorage.getItem('userRole') || '';
const emptyDraft = (): Draft => ({ name: '', personal_info: '', birthplace: '', family_details: '', image_collection: '', related_media_songs_games: '', mediaIds: [] });

export default function CharactersPage() {
  const role = useSyncExternalStore(subscribeToAuth, getRole, () => '');
  const isAdmin = role === 'admin';
  const [characters, setCharacters] = useState<Character[]>([]);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [nameQuery, setNameQuery] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (nameQuery.trim()) params.set('query', nameQuery.trim());
      if (titleQuery.trim()) params.set('title', titleQuery.trim());
      if (typeFilter) params.set('type', typeFilter);
      if (yearFrom) params.set('year_from', yearFrom);
      if (yearTo) params.set('year_to', yearTo);
      try {
        const result = await fetchAPI(`/characters?${params}`, { signal: controller.signal }) as Character[];
        setCharacters(result || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not load characters.');
        setCharacters([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [nameQuery, titleQuery, typeFilter, yearFrom, yearTo]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAPI('/media').then((result: MediaOption[]) => setMediaOptions(result || [])).catch(() => setMediaOptions([]));
  }, [isAdmin]);

  const startCreate = () => { setEditingId(null); setDraft(emptyDraft()); setNotice(''); setEditorOpen(true); };
  const startEdit = (character: Character) => {
    setEditingId(character.id);
    setDraft({ name: character.name, personal_info: character.personal_info || '', birthplace: character.birthplace || '', family_details: character.family_details || '', image_collection: character.image_collection || '', related_media_songs_games: character.related_media_songs_games || '', mediaIds: character.appearances.map((appearance) => appearance.id) });
    setNotice('');
    setEditorOpen(true);
  };

  const saveCharacter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await fetchAPI('/admin/characters', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ id: editingId, name: draft.name.trim(), personal_info: draft.personal_info, birthplace: draft.birthplace, family_details: draft.family_details, image_collection: draft.image_collection, related_media_songs_games: draft.related_media_songs_games, appearances: draft.mediaIds.map((id) => ({ id })) }),
      });
      setNotice(editingId ? 'Character details updated.' : 'Character added to the catalog.');
      setEditorOpen(false);
      setDraft(emptyDraft());
      setEditingId(null);
      const params = new URLSearchParams();
      if (nameQuery.trim()) params.set('query', nameQuery.trim());
      if (titleQuery.trim()) params.set('title', titleQuery.trim());
      if (typeFilter) params.set('type', typeFilter);
      if (yearFrom) params.set('year_from', yearFrom);
      if (yearTo) params.set('year_to', yearTo);
      setCharacters(await fetchAPI(`/characters?${params}`) || []);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save character.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCharacter = async (character: Character) => {
    if (!window.confirm(`Delete ${character.name} from the character catalog?`)) return;
    setNotice('');
    try {
      await fetchAPI(`/admin/characters?id=${character.id}`, { method: 'DELETE' });
      setCharacters((items) => items.filter((item) => item.id !== character.id));
      setNotice('Character deleted.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete character.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5fa] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-3xl bg-[#111019] p-7 text-white shadow-xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">Meet the cast</p>
          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Characters</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Find characters by name, the stories they appear in, story type, and their first appearance year.</p></div>
            {isAdmin && <button type="button" onClick={startCreate} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-violet-100">＋ Add character</button>}
          </div>
        </header>

        {notice && <p role="status" className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-violet-900">{notice}</p>}

        {editorOpen && isAdmin && <form onSubmit={saveCharacter} className="space-y-5 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-gray-950">{editingId ? 'Edit character' : 'Add a character'}</h2><p className="mt-1 text-sm text-gray-500">Connect this character to one or more catalog titles.</p></div><button type="button" onClick={() => setEditorOpen(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Close</button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">Name<input required maxLength={200} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
            <label className="text-sm font-medium text-gray-700">Birthplace<input value={draft.birthplace} onChange={(event) => setDraft({ ...draft, birthplace: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Stories<select multiple value={draft.mediaIds.map(String)} onChange={(event) => setDraft({ ...draft, mediaIds: Array.from(event.target.selectedOptions, (option) => Number(option.value)) })} className="mt-2 min-h-32 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-950 outline-none focus:border-violet-400">{mediaOptions.map((media) => <option key={media.id} value={media.id}>{media.title} · {media.type} · {media.release_year || 'Year unknown'}</option>)}</select><span className="mt-1 block text-xs text-gray-500">Use Ctrl (Windows) or Command (Mac) to select multiple titles.</span></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Background<textarea rows={3} value={draft.personal_info} onChange={(event) => setDraft({ ...draft, personal_info: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Family details<textarea rows={2} value={draft.family_details} onChange={(event) => setDraft({ ...draft, family_details: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
            <label className="text-sm font-medium text-gray-700">Image URL<input type="url" value={draft.image_collection} onChange={(event) => setDraft({ ...draft, image_collection: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
            <label className="text-sm font-medium text-gray-700">Related media, games or songs<input value={draft.related_media_songs_games} onChange={(event) => setDraft({ ...draft, related_media_songs_games: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-950 outline-none focus:border-violet-400" /></label>
          </div>
          <button disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save character' : 'Add character'}</button>
        </form>}

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Character name<input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Search names" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-violet-400" /></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Story title<input value={titleQuery} onChange={(event) => setTitleQuery(event.target.value)} placeholder="Search by title" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-violet-400" /></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Story type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-violet-400"><option value="">All types</option><option value="anime">Anime</option><option value="manga">Manga</option><option value="novel">Novel</option></select></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">First appeared from<input type="number" min="0" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} placeholder="Year" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-violet-400" /></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">First appeared to<input type="number" min="0" value={yearTo} onChange={(event) => setYearTo(event.target.value)} placeholder="Year" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-gray-900 outline-none focus:border-violet-400" /></label>
          </div>
        </section>

        {loading ? <p className="py-14 text-center text-sm text-gray-500">Loading characters…</p> : error ? <div role="alert" className="rounded-xl bg-rose-50 p-5 text-center text-sm text-rose-800">{error}</div> : characters.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><p className="font-semibold text-gray-800">No characters found</p><p className="mt-1 text-sm text-gray-500">Try adjusting the name, title, type, or year filters.</p></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((character) => <article key={character.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex gap-4 p-5">
              {character.image_collection ? <Image src={character.image_collection} alt="" width={80} height={80} unoptimized className="h-20 w-20 shrink-0 rounded-xl bg-violet-50 object-cover" /> : <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl font-black text-violet-600">{character.name.slice(0, 1).toUpperCase()}</div>}
              <div className="min-w-0 flex-1"><Link href={`/characters/${character.id}`} className="block break-words text-lg font-bold text-gray-950 hover:text-violet-700">{character.name}</Link><p className="mt-1 text-sm text-gray-500">{character.birthplace || 'Origin not recorded'}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-600">First appearance {character.first_appearance_year || 'unknown'}</p></div>
            </div>
            <div className="border-t border-gray-100 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Appears in</p><div className="mt-2 flex flex-wrap gap-2">{character.appearances.length ? character.appearances.map((appearance) => <Link key={appearance.id} href={`/media/${appearance.id}`} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700">{appearance.title}</Link>) : <span className="text-sm text-gray-400">No linked title yet</span>}</div></div>
            {isAdmin && <div className="flex gap-2 border-t border-gray-100 px-5 py-3"><button onClick={() => startEdit(character)} className="rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">Edit</button><button onClick={() => void deleteCharacter(character)} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button></div>}
          </article>)}
        </div>}
      </div>
    </div>
  );
}
