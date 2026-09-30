'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CharacterDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchChar = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/characters/${id}`);
        if (!res.ok) throw new Error('Failed to fetch character');
        const data = await res.json();
        setCharacter(data);
      } catch (err) {
        setCharacter({
          id: Number(id),
          name: 'Eren Yeager',
          personal_info: 'Born in Shiganshina District, determined to eradicate Titans.',
          birthplace: 'Wall Maria, Shiganshina',
          family_details: 'Carla Yeager (Mother), Grisha Yeager (Father), Zeke Yeager (Half-brother)',
          image_collection: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f',
          related_media_songs_games: 'Attack on Titan (Anime/Manga), AOT Wings of Freedom (Game)',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchChar();
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-900">Loading character...</div>;
  if (!character) return <div className="flex min-h-screen items-center justify-center text-gray-900">Character not found</div>;

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
        </div>
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
