import { useState } from 'react';
import { ClockIcon, HeartIcon } from '../components/icons.jsx';
import { imageUrlFor } from '../api/claude.js';

export default function Favorites({ favorites, onOpen }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center gap-2">
        <div>
          <div className="text-2xl font-extrabold text-brand-green tracking-tight flex items-center gap-2">
            Favorites
            <HeartIcon size={20} stroke="#E8610A" filled />
          </div>
          <div className="text-[11px] text-brand-green/60 font-medium">
            {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="px-5 mt-12 text-center text-black/60">
          <div className="text-4xl mb-2">💚</div>
          <div className="font-bold text-brand-green">No favorites yet.</div>
          <div className="text-sm mt-1">Tap the heart on a recipe to save it here.</div>
        </div>
      ) : (
        <div className="px-5 mt-3 grid grid-cols-2 gap-3 pb-24">
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
  const [loaded, setLoaded] = useState(false);
  const src = imageUrlFor(recipe.imageQuery || recipe.title, hash(recipe.id));
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-2xl overflow-hidden text-left shadow-soft active:scale-[0.98] transition-all"
    >
      <div
        className="h-28 flex items-center justify-center relative"
        style={{
          background: err
            ? 'linear-gradient(135deg, #fde7c8 0%, #f5d6a8 60%, #e9bb7a 100%)'
            : 'linear-gradient(135deg, #fde7c8, #e9bb7a)',
        }}
      >
        {err ? (
          <span className="text-4xl">🍽️</span>
        ) : (
          <>
            {!loaded && (
              <span className="absolute text-3xl text-brand-green/30 animate-pulse">🍽️</span>
            )}
            <img
              src={src}
              alt={recipe.title}
              loading="lazy"
              onError={() => setErr(true)}
              onLoad={() => setLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-sm font-bold text-brand-green leading-tight line-clamp-2">
          {recipe.title}
        </div>
        <div className="text-[11px] text-black/60 mt-1 flex items-center gap-1">
          <ClockIcon size={11} stroke="#E8610A" />
          {recipe.prepTime} min
          {recipe.kidFriendly && (
            <span className="ml-auto text-[10px] text-brand-green font-bold">✓ Kid</span>
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
