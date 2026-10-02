'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import PostComposer from '@/components/PostComposer';
import FriendRecommendations from '@/components/FriendRecommendations';
import { fetchAPI } from '@/services/api';

export type CommunityPost = {
  id: number;
  user_id: number;
  username: string;
  content: string;
  media_urls?: string;
  created_at: string;
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [recommendations, setRecommendations] = useState<{id:number; username:string; match_percentage:number; favorite_genre:string}[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
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

  const createPost = async (content: string, images: string[]) => {
    setPosting(true);
    setError('');
    try {
      const newPost = await fetchAPI('/posts', {
        method: 'POST',
        body: JSON.stringify({ content, media_urls: JSON.stringify(images) }),
      }) as CommunityPost;
      setPosts((current) => [newPost, ...current]);
      setComposerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish post.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f4f3f8] px-4 py-8 text-zinc-900 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="mx-auto w-full max-w-2xl space-y-5">
          <header className="rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 px-6 py-7 text-white shadow-lg shadow-violet-900/10 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">OtakuHub Community</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Share what you love.</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-violet-100">Talk about the stories, characters, and moments that stay with you.</p>
          </header>

          <button onClick={() => setComposerOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md">
            <Avatar name={username || 'You'} />
            <span className="flex-1 rounded-full bg-zinc-100 px-5 py-3 text-sm text-zinc-500">What would you like to share?</span>
            <span aria-hidden="true" className="hidden rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 sm:block">＋ Post</span>
          </button>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
          {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500">Loading community feed…</div> : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-2xl text-violet-700">✦</div>
              <h2 className="mt-4 font-bold text-zinc-900">Start the conversation</h2>
              <p className="mt-1 text-sm text-zinc-500">Your post will be the first one in the community feed.</p>
              <button onClick={() => setComposerOpen(true)} className="mt-5 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-800">Create a post</button>
            </div>
          ) : posts.map((post) => <PostCard key={post.id} post={post} onOpenProfile={() => router.push(`/profile?id=${post.user_id}`)} />)}
        </section>

        <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block">
          <FriendRecommendations recommendations={recommendations} />
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-xs leading-5 text-zinc-500">
            <p className="font-bold text-zinc-700">A good place for fandom</p>
            <p className="mt-1">Share recommendations, fan art, and the moments you want to talk about.</p>
          </div>
        </aside>
      </div>
      {composerOpen && <PostComposer username={username || 'You'} posting={posting} onClose={() => !posting && setComposerOpen(false)} onPublish={createPost} />}
    </main>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name.trim().slice(0, 1).toUpperCase() || 'O';
  return <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 font-bold text-white ${size === 'lg' ? 'size-11 text-base' : 'size-10 text-sm'}`}>{initials}</span>;
}
