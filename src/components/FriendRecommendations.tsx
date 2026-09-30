'use client';

import React from 'react';

interface Recommendation {
  id: number;
  username: string;
  match_percentage: number;
  favorite_genre: string;
}

interface FriendRecommendationsProps {
  recommendations: Recommendation[];
}

export default function FriendRecommendations({ recommendations }: FriendRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-gray-500 italic">No recommendations available.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Recommended Friends</h2>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.id} className="flex items-center justify-between border-b pb-3 last:border-none">
            <div>
              <p className="font-semibold text-gray-800">{rec.username}</p>
              <p className="text-xs text-gray-500">Favorite Genre: {rec.favorite_genre}</p>
            </div>
            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
              {rec.match_percentage}% Match
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
