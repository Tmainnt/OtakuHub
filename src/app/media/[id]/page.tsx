'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

type MediaDetails = { id: number; title: string; type: string; origin_country?: string; source_format?: string; release_year?: number; creator?: string; episodes_or_volumes?: number; watch_order_info?: string; ost_list?: string; social_links?: string; characters?: { id: number; name: string; birthplace?: string; first_appearance_year?: number }[] };

const subscribeToAuth = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('authchange', callback); };
};
const getRole = () => localStorage.getItem('userRole') || '';

export default function MediaDetailPage() {
  const isAdmin = useSyncExternalStore(subscribeToAuth, getRole, () => '') === 'admin';
  const params = useParams();
  const id = params?.id;
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchMedia = async () => {
      try {
        setError('');
        setMedia(await fetchAPI(`/media/${id}`));
      } catch (err) {
        setMedia(null);
        setError(err instanceof Error ? err.message : 'Could not load this title.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-900">Loading details...</div>;
  if (!media) return <div role="alert" className="mx-auto my-20 max-w-xl rounded-xl bg-white p-8 text-center text-gray-800"><h1 className="text-xl font-bold">{error || 'Title not found'}</h1><p className="mt-2 text-sm text-gray-500">Check the catalog connection and try again.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8 space-y-6">
        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 uppercase mb-2">
            {media.type}
          </span>
          <h1 className="text-3xl font-bold text-gray-950">{media.title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Origin Country:</strong> {media.origin_country}</p>
          <p><strong>Source Format:</strong> {media.source_format}</p>
          <p><strong>Release Year:</strong> {media.release_year}</p>
          <p><strong>Creator:</strong> {media.creator}</p>
          <p><strong>Episodes/Volumes:</strong> {media.episodes_or_volumes}</p>
        </div>
        <section className="border-t pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-gray-900">Characters in this story</h2><p className="mt-1 text-sm text-gray-500">{media.characters?.length || 0} linked characters</p></div>{isAdmin && <Link href="/characters" className="rounded-lg bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">Manage characters</Link>}</div>
          {!media.characters?.length ? <p className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">No characters have been added to this title yet.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.characters.map((character) => <Link key={character.id} href={`/characters/${character.id}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-violet-200 hover:bg-violet-50"><p className="font-semibold text-gray-900">{character.name}</p><p className="mt-1 text-xs text-gray-500">{character.birthplace || 'Origin not recorded'}{character.first_appearance_year ? ` · First appeared ${character.first_appearance_year}` : ''}</p></Link>)}</div>}
        </section>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Watch / Reading Order</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{media.watch_order_info || 'N/A'}</p>
        </div>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Soundtrack & OST List</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{media.ost_list || 'N/A'}</p>
        </div>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Official Social Links</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{media.social_links || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
