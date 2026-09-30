'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function MediaDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMedia = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/media/${id}`);
        if (!res.ok) throw new Error('Failed to fetch media');
        const data = await res.json();
        setMedia(data);
      } catch (err) {
        // Fallback mock
        setMedia({
          id: Number(id),
          title: 'Attack on Titan',
          type: 'anime',
          origin_country: 'Japan',
          source_format: 'Manga',
          release_year: 2013,
          creator: 'Hajime Isayama',
          episodes_or_volumes: 89,
          watch_order_info: 'Season 1 -> Season 2 -> Season 3 Part 1 & 2 -> Final Season',
          ost_list: 'Guren no Yumiya, Akatsuki no Requiem, The Rumbling',
          social_links: 'Twitter: @anime_shingeki, Official Site: shingeki.tv',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-900">Loading details...</div>;
  if (!media) return <div className="flex min-h-screen items-center justify-center text-gray-900">Media not found</div>;

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
