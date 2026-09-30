'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('anime');
  const [originCountry, setOriginCountry] = useState('Japan');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [episodes, setEpisodes] = useState('12');
  const [message, setMessage] = useState('');

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:8080/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          origin_country: originCountry,
          release_year: Number(releaseYear),
          episodes_or_volumes: Number(episodes),
        }),
      });

      if (!res.ok) throw new Error('Failed to create media');
      setMessage('Media created successfully!');
      setTitle('');
    } catch (err: any) {
      setMessage(err.message || 'Error creating media');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-950">Admin Management Dashboard</h1>
        {message && <div className="rounded bg-indigo-50 p-3 text-sm text-indigo-700">{message}</div>}

        <form onSubmit={handleCreateMedia} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Media (Anime / Manga / Novel)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
                <option value="novel">Novel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Origin Country</label>
              <input
                type="text"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Episodes / Volumes</label>
              <input
                type="number"
                value={episodes}
                onChange={(e) => setEpisodes(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Create Media Entry
          </button>
        </form>
      </div>
    </div>
  );
}
