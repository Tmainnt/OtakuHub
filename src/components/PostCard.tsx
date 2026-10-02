'use client';

import React from 'react';
import type { CommunityPost } from '@/app/community/page';

export default function PostCard({ post, onOpenProfile }: { post: CommunityPost; onOpenProfile: () => void }) {
  let images: string[] = [];
  if (post.media_urls) {
    try {
      const parsed: unknown = JSON.parse(post.media_urls);
      images = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [post.media_urls];
    } catch {
      images = [post.media_urls];
    }
  }
  const name = post.username || `User ${post.user_id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <button type="button" onClick={onOpenProfile} aria-label={`View ${name}'s profile`} className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-base font-extrabold text-white transition hover:ring-4 hover:ring-violet-100">{name.slice(0, 1).toUpperCase()}</button>
        <div className="min-w-0 flex-1"><button type="button" onClick={onOpenProfile} className="block max-w-full truncate text-left text-sm font-extrabold text-zinc-900 hover:text-violet-700">{name}</button><time dateTime={post.created_at} className="mt-0.5 block text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</time></div>
        <span aria-hidden="true" className="text-lg text-zinc-400">···</span>
      </header>
      {post.content && <p className="whitespace-pre-wrap break-words px-5 py-4 text-[15px] leading-7 text-zinc-800 sm:px-6">{post.content}</p>}
      {images.length > 0 && <div className={`grid gap-1.5 overflow-hidden ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {images.slice(0, 5).map((image, index) => <img key={`${post.id}-${index}`} src={image} alt={`Image ${index + 1} shared by ${name}`} loading="lazy" className={`max-h-[560px] min-h-28 w-full bg-zinc-100 object-cover ${images.length === 3 && index === 0 ? 'row-span-2 h-full' : ''}`} />)}
      </div>}
      <footer className="flex items-center gap-2 border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 sm:px-6">
        <span className="grid size-6 place-items-center rounded-full bg-violet-100 text-violet-700">✦</span>
        <span>Shared with OtakuHub community</span>
      </footer>
    </article>
  );
}
