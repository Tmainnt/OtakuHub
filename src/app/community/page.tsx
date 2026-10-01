'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import FriendRecommendations from '@/components/FriendRecommendations';
import { fetchAPI } from '@/services/api';

export default function CommunityPage() {
  const [posts, setPosts] = useState<{id:number; user_id:number; content:string; media_urls?:string; created_at:string}[]>([]);
  const [recommendations, setRecommendations] = useState<{id:number; username:string; match_percentage:number; favorite_genre:string}[]>([]);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postData, recData] = await Promise.all([fetchAPI('/posts'), fetchAPI('/users/recommendations')]);
        setPosts(postData || []);
        setRecommendations(recData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not connect to the community.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const userId = localStorage.getItem('userId');
    if (!localStorage.getItem('token') || !userId) { setError('Sign in to publish a post.'); return; }
    setPosting(true); setError('');
    try {
      const newPost = await fetchAPI('/posts', { method: 'POST', body: JSON.stringify({ user_id: Number(userId), content, media_urls: mediaUrl }) });
      setPosts([newPost, ...posts]);
      setContent('');
      setMediaUrl('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not publish post.'); }
    finally { setPosting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Otaku Community Feed</h1>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                placeholder="Share your thoughts about anime, manga, or novels..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Image or video URL (optional)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition"
              >
                {posting ? 'Publishing…' : 'Publish'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-600">Loading community feed...</p>
            ) : error ? (
              <p role="alert" className="rounded-xl bg-rose-50 p-5 text-sm text-rose-800">{error}</p>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No posts yet. Be the first to start a conversation.</div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>

        <div className="space-y-6">
          <FriendRecommendations recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
}
