'use client';

import React from 'react';

interface PostCardProps {
  post: {
    id: number;
    user_id: number;
    content: string;
    media_urls?: string;
    created_at: string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-600">User #{post.user_id}</span>
        <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      {post.media_urls && (
        <div className="mt-2 rounded overflow-hidden bg-gray-100 p-2 text-xs text-gray-500">
          Attached media: {post.media_urls}
        </div>
      )}
    </div>
  );
}
