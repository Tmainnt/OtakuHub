'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FavoritesList from '@/components/FavoritesList';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // For demo/MVP, fetch profile for user id 1 or check token
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/users/profile?id=1');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        // fallback mock data if backend not running yet
        setProfileData({
          user: { id: 1, username: 'OtakuExplorer', created_at: new Date().toISOString() },
          favorites: [
            { id: 1, user_id: 1, item_id: 101, item_type: 'anime', created_at: new Date().toISOString() },
            { id: 2, user_id: 1, item_id: 202, item_type: 'character', created_at: new Date().toISOString() },
          ],
          radar_stats: {
            Action: 85,
            Romance: 60,
            'Sci-Fi': 75,
            Fantasy: 90,
            'Slice of Life': 50,
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleDeleteFavorite = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/users/favorites?id=${id}&user_id=1`, {
        method: 'DELETE',
      });
      setProfileData((prev: any) => ({
        ...prev,
        favorites: prev.favorites.filter((f: any) => f.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete favorite');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  const { user, favorites, radar_stats } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* User Info Header */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-sm text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>

        {/* Radar Chart Stats Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Genre Preference Radar Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(radar_stats).map(([genre, score]: [string, any]) => (
              <div key={genre} className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-indigo-600">{genre}</p>
                <p className="text-2xl font-bold text-indigo-900">{score}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Favorites Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Favorites</h2>
          <FavoritesList favorites={favorites} onDelete={handleDeleteFavorite} isOwner={true} />
        </div>
      </div>
    </div>
  );
}
