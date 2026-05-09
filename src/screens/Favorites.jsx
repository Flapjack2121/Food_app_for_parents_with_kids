import { useState } from 'react';
import { ClockIcon, HeartIcon } from '../components/icons.jsx';
import { imageUrlFor } from '../api/claude.js';

export default function Favorites({ favorites, onOpen }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center gap-2">
        <div className="text-xl font-extrabold text-brand-green">Favorites</div>
        <HeartIcon size={20} stroke="#E8610A" filled />
      </div>

      {favorites.length === 0 ? (
        <div className="px-5 mt-10 text-center text-black/60">
          <div className="text-3xl mb-1">💚</div>
          <div className="font-medium text-brand-green">No favorites yet.</div>
          <div className="text-sm">Tap the heart on a recipe to save it here.</div>
        </div>
      ) : (
        <div className="px-5 mt-2 grid grid-cols-2 gap-3 pb-8">
          {favorites.map((r) => (
            <FavCard key={r.id} recipe={r} onOpen={() => onOpen(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavCard({ recipe, onOpen }) {
  const [err, setErr] = useState(false);
  const src = imageUrlFor(recipe.imageQuery || recipe.title, hash(recipe.id));
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-2xl overflow-hidden text-left border border-black/5 active:scale-[0.99]"
    >
      <div
        className="h-24 flex items-center justify-center bg-[#fde7c8]"
        style={{
          background: err
            ? 'linear-gradient(135deg, #fde7c8 0%, #f5d6a8 60%, #e9bb7a 100%)'
            : undefined,
        }}
      >
        {err ? (
          <span className="text-4xl">🍽️</span>
        ) : (
          <img
            src={src}
            alt={recipe.title}
            loading="lazy"
            onError={() => setErr(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-2.5">
        <div className="text-sm font-semibold text-brand-green leading-tight line-clamp-2">
          {recipe.title}
        </div>
        <div className="text-[11px] text-black/60 mt-1 flex items-center gap-1">
          <ClockIcon size={12} stroke="#E8610A" />
          {recipe.prepTime}
          {recipe.kidFriendly && (
            <span className="ml-auto text-[10px] text-brand-green font-semibold">
              Kid-friendly
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
