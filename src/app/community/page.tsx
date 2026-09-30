'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import FriendRecommendations from '@/components/FriendRecommendations';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await fetch('http://localhost:8080/api/posts');
        const postsData = await postsRes.json();
        setPosts(postsData || []);

        const recsRes = await fetch('http://localhost:8080/api/users/recommendations');
        const recsData = await recsRes.json();
        setRecommendations(recsData || []);
      } catch (err) {
        // Fallback mock data
        setPosts([
          { id: 1, user_id: 1, content: 'Just finished watching Attack on Titan Final Season. Absolute masterpiece!', created_at: new Date().toISOString() },
        ]);
        setRecommendations([
          { id: 2, username: 'AnimeOtaku99', match_percentage: 95, favorite_genre: 'Action & Fantasy' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1, content, media_urls: mediaUrl }),
      });
      if (!res.ok) throw new Error('Failed to create post');
      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      setContent('');
      setMediaUrl('');
    } catch (err) {
      console.error('Error creating post');
    }
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
                placeholder="Image or Video URL (optional)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Post
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-600">Loading community feed...</p>
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
