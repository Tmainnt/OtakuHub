'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Link from 'next/link';

type CharacterDetails = { id: number; name: string; personal_info?: string; birthplace?: string; family_details?: string; image_collection?: string; related_media_songs_games?: string; first_appearance_year?: number; appearances?: { id: number; title: string; type: string; release_year: number }[] };

export default function CharacterDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchChar = async () => {
      try {
        setError('');
        setCharacter(await fetchAPI(`/characters/${id}`));
      } catch (err) {
        setCharacter(null);
        setError(err instanceof Error ? err.message : 'Could not load this character.');
      } finally {
        setLoading(false);
      }
    };
    fetchChar();
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-900">Loading character...</div>;
  if (!character) return <div role="alert" className="mx-auto my-20 max-w-xl rounded-xl bg-white p-8 text-center text-gray-800"><h1 className="text-xl font-bold">{error || 'Character not found'}</h1><p className="mt-2 text-sm text-gray-500">Check the catalog connection and try again.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8 space-y-6">
        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800 uppercase mb-2">
            Character Profile
          </span>
          <h1 className="text-3xl font-bold text-gray-950">{character.name}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Birthplace:</strong> {character.birthplace}</p>
          <p><strong>Family:</strong> {character.family_details}</p>
          <p><strong>First appearance:</strong> {character.first_appearance_year || 'Unknown'}</p>
        </div>
        <section className="border-t pt-4"><h2 className="text-xl font-semibold text-gray-900">Appears in</h2><div className="mt-3 flex flex-wrap gap-2">{character.appearances?.length ? character.appearances.map((appearance) => <Link key={appearance.id} href={`/media/${appearance.id}`} className="rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100">{appearance.title} · {appearance.type}</Link>) : <p className="text-sm text-gray-500">No linked titles yet.</p>}</div></section>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Background</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{character.personal_info}</p>
        </div>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Related Media, Games & Songs</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{character.related_media_songs_games}</p>
        </div>
      </div>
    </div>
  );
}
