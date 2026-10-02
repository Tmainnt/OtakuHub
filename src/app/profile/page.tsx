'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FavoritesList from '@/components/FavoritesList';
import { fetchAPI } from '@/services/api';

type ProfileData = { user: { id: number; username: string; created_at: string }; favorites: { id: number; user_id: number; item_id: number; item_type: string; created_at: string }[]; radar_stats: Record<string, number>; is_owner: boolean };

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const ownUserId = localStorage.getItem('userId');
        const requestedUserId = new URLSearchParams(window.location.search).get('id') || ownUserId;
        if (!localStorage.getItem('token') || !requestedUserId) { router.replace('/login'); return; }
        setProfileData(await fetchAPI(`/users/profile?id=${encodeURIComponent(requestedUserId)}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleDeleteFavorite = async (id: number) => {
    if (!profileData) return;
    try {
      await fetchAPI(`/users/favorites?id=${id}&user_id=${profileData.user.id}`, { method: 'DELETE' });
      setProfileData((prev) => prev && ({
        ...prev,
        favorites: prev.favorites.filter((f) => f.id !== id),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete favorite.');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  if (error || !profileData) return <div role="alert" className="mx-auto my-20 max-w-xl rounded-xl bg-white p-8 text-center text-rose-700">{error || 'Profile unavailable'}</div>;
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
          {profileData.is_owner && <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              localStorage.removeItem('username');
              localStorage.removeItem('userRole');
              router.push('/login');
            }}
            className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 transition"
          >
            Logout
          </button>}
        </div>

        {/* Radar Chart Stats Section */}
        {profileData.is_owner && <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Genre Preference Radar Stats</h2>
          {Object.keys(radar_stats || {}).length === 0 ? <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">Preference insights will appear as you save titles. Your saved favorites are not yet tagged by genre.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(radar_stats).map(([genre, score]) => (
              <div key={genre} className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-indigo-600">{genre}</p>
                <p className="text-2xl font-bold text-indigo-900">{Number(score)}%</p>
              </div>
            ))}
          </div>}
        </div>}

        {/* Favorites Section */}
        {profileData.is_owner && <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Favorites</h2>
          <FavoritesList favorites={favorites} onDelete={handleDeleteFavorite} isOwner={true} />
        </div>}
      </div>
    </div>
  );
}
