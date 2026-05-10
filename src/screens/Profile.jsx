import { useState } from 'react';
import { storage, BADGES } from '../lib/storage.js';
import { ClockIcon, HeartIcon } from '../components/icons.jsx';
import { imageUrlFor } from '../api/claude.js';

export default function Profile({
  profile,
  stats,
  earnedBadges,
  favorites,
  onEditProfile,
  onOpenRecipe,
  onResetAll,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const ratings = storage.getRatings();
  const lovedTitles = ratings.filter((r) => r.rating === 'loved').slice(0, 3);
  const lovedRecipes = lovedTitles
    .map((r) => favorites.find((f) => f.id === r.recipeId) || { id: r.recipeId, title: r.title })
    .filter(Boolean);
  const unlocks = storage.getBadgeUnlocks();

  const reset = () => {
    storage.resetAll();
    onResetAll?.();
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2">
        <div className="text-2xl font-extrabold text-brand-green tracking-tight">Profile</div>
        <div className="text-[11px] text-brand-green/60 font-medium">Your family kitchen</div>
      </div>

      {/* Family Summary */}
      <div className="px-5 mt-3">
        <SectionLabel>Family</SectionLabel>
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'linear-gradient(135deg, #3F7220 0%, #2D5016 100%)',
              }}
            >
              <span aria-hidden>👨‍👩‍👧</span>
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-brand-green text-base leading-tight">
                {profile?.parentName || 'Parent'}'s family
              </div>
              <div className="text-xs text-black/60 mt-0.5">
                {profile?.children?.length || 0} kid
                {(profile?.children?.length || 0) === 1 ? '' : 's'}
                {profile?.children?.length > 0 &&
                  ` · ${profile.children
                    .map((c) => `${c.name || 'Kid'} (${c.age})`)
                    .join(', ')}`}
              </div>
              {profile?.allergies?.length > 0 && (
                <div className="text-[11px] text-brand-orange mt-1">
                  Avoiding: {profile.allergies.join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={onEditProfile}
              className="text-xs font-bold text-brand-green bg-brand-cream rounded-full px-3 py-1.5"
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mt-4">
        <SectionLabel>Stats</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatCard emoji="🍳" label="Recipes cooked" value={stats?.totalCooked || 0} />
          <StatCard emoji="🔥" label="Day streak" value={stats?.streak || 0} />
          <StatCard
            emoji="📅"
            label="Weeks planned"
            value={stats?.weekPlanCompleted ? 1 : 0}
          />
          <StatCard emoji="❤️" label="Favorites" value={favorites?.length || 0} />
        </div>
      </div>

      {/* Badges */}
      <div className="px-5 mt-4">
        <SectionLabel>
          Badges · {earnedBadges?.length || 0} of {BADGES.length}
        </SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const has = (earnedBadges || []).includes(b.id);
            const date = unlocks?.[b.id];
            return (
              <div
                key={b.id}
                className={`rounded-2xl p-3 text-center shadow-soft transition-all ${
                  has ? 'bg-white' : 'bg-white/60'
                }`}
              >
                <div
                  className={`text-3xl ${has ? '' : 'grayscale opacity-50'} relative inline-block`}
                >
                  {b.emoji}
                  {!has && (
                    <span className="absolute -bottom-1 -right-1 text-xs">🔒</span>
                  )}
                </div>
                <div
                  className={`text-xs font-bold mt-1 ${
                    has ? 'text-brand-green' : 'text-black/40'
                  }`}
                >
                  {b.name}
                </div>
                <div className="text-[10px] text-black/45 mt-0.5 leading-tight">{b.desc}</div>
                {has && date && (
                  <div className="text-[10px] text-brand-orange font-semibold mt-1">
                    Unlocked {date}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently loved */}
      {lovedRecipes.length > 0 && (
        <div className="mt-4">
          <div className="px-5">
            <SectionLabel>Recently loved 👍</SectionLabel>
          </div>
          <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {lovedRecipes.map((r) => (
              <LovedCard key={r.id} recipe={r} onOpen={() => onOpenRecipe?.(r)} />
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="px-5 mt-6 pb-24">
        <SectionLabel>Danger zone</SectionLabel>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full text-xs text-black/45 font-medium py-3 rounded-xl bg-white/40"
          >
            Reset all app data
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="text-sm font-bold text-brand-green">
              Erase everything?
            </div>
            <div className="text-xs text-black/60 mt-1">
              This clears your profile, favorites, plan, ratings, and badges. You'll go back
              to onboarding.
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-xl bg-brand-cream text-brand-green font-semibold py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={reset}
                className="flex-1 rounded-xl bg-red-600 text-white font-bold py-2.5 text-sm"
              >
                Erase all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-brand-green/70 mb-2 px-1">
      {children}
    </div>
  );
}

function StatCard({ emoji, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-2xl font-extrabold text-brand-green tabular-nums">
          {value}
        </span>
      </div>
      <div className="text-[10px] text-black/55 uppercase tracking-wider font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

function LovedCard({ recipe, onOpen }) {
  const [err, setErr] = useState(false);
  const src = imageUrlFor(recipe.imageQuery || recipe.title, hash(recipe.id));
  return (
    <button
      onClick={onOpen}
      className="shrink-0 w-32 bg-white rounded-2xl overflow-hidden text-left shadow-soft active:scale-[0.98]"
    >
      <div className="h-20 bg-gradient-to-br from-[#fde7c8] to-[#e9bb7a] relative">
        {!err && (
          <img
            src={src}
            alt={recipe.title}
            onError={() => setErr(true)}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-1 right-1 bg-white rounded-full text-xs px-1.5 py-0.5 shadow">
          👍
        </div>
      </div>
      <div className="p-2">
        <div className="text-xs font-bold text-brand-green leading-tight line-clamp-2">
          {recipe.title}
        </div>
        {recipe.prepTime && (
          <div className="text-[10px] text-black/55 mt-1 flex items-center gap-1">
            <ClockIcon size={10} stroke="#E8610A" />
            {recipe.prepTime} min
          </div>
        )}
      </div>
    </button>
  );
}

function hash(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
