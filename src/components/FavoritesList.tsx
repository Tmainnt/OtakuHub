'use client';

import React from 'react';

interface Favorite {
  id: number;
  item_id: number;
  item_type: string;
  created_at: string;
}

interface FavoritesListProps {
  favorites: Favorite[];
  onDelete: (id: number) => void;
  isOwner?: boolean;
}

export default function FavoritesList({ favorites, onDelete, isOwner = true }: FavoritesListProps) {
  if (!favorites || favorites.length === 0) {
    return <p className="text-gray-500 italic">No favorites added yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {favorites.map((fav) => (
        <div key={fav.id} className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-white">
          <div>
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 uppercase mb-1">
              {fav.item_type}
            </span>
            <p className="text-gray-800 font-medium">Item ID: {fav.item_id}</p>
          </div>
          {isOwner && (
            <button
              onClick={() => onDelete(fav.id)}
              className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100 transition"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
