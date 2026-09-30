'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CatalogPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/media?query=${search}&type=${typeFilter}`);
        if (!res.ok) throw new Error('Failed to fetch catalog');
        const data = await res.json();
        setMediaList(data || []);
      } catch (err) {
        // Fallback mock data
        setMediaList([
          { id: 1, title: 'Attack on Titan', type: 'anime', origin_country: 'Japan', release_year: 2013, episodes_or_volumes: 89 },
          { id: 2, title: 'Solo Leveling', type: 'manga', origin_country: 'South Korea', release_year: 2018, episodes_or_volumes: 200 },
          { id: 3, title: 'Overlord', type: 'novel', origin_country: 'Japan', release_year: 2012, episodes_or_volumes: 16 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [search, typeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 shadow rounded-lg">
          <h1 className="text-3xl font-bold text-gray-950">Anime, Manga & Novel Catalog</h1>
          <div className="flex gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-gray-300 p-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="anime">Anime</option>
              <option value="manga">Manga</option>
              <option value="novel">Novel</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading catalog...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mediaList.map((item) => (
              <Link key={item.id} href={`/media/${item.id}`} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 uppercase mb-2">
                  {item.type}
                </span>
                <h2 className="text-xl font-bold text-gray-950 mb-1">{item.title}</h2>
                <p className="text-sm text-gray-700">Origin: {item.origin_country} ({item.release_year})</p>
                <p className="text-sm text-gray-700">Episodes/Volumes: {item.episodes_or_volumes}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
