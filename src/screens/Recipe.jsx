import { useState } from 'react';
import {
  ClockIcon,
  UsersIcon,
  HeartIcon,
  SmileIcon,
  ArrowRight,
  BoltIcon,
} from '../components/icons.jsx';
import { storage } from '../lib/storage.js';

const FOOD_EMOJI = {
  pasta: '🍝',
  rice: '🍚',
  chicken: '🍗',
  egg: '🍳',
  eggs: '🍳',
  salad: '🥗',
  soup: '🍲',
  pizza: '🍕',
  taco: '🌮',
  burger: '🍔',
  sandwich: '🥪',
  pancake: '🥞',
  fish: '🐟',
  noodle: '🍜',
};

function emojiFor(title = '') {
  const t = title.toLowerCase();
  for (const k of Object.keys(FOOD_EMOJI)) if (t.includes(k)) return FOOD_EMOJI[k];
  return '🍽️';
}

export default function Recipe({ recipe, onCook, onNext, onBack, busy }) {
  const [fav, setFav] = useState(recipe ? storage.isFavorite(recipe.id) : false);

  if (!recipe) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div className="text-black/60">
          <div className="text-3xl mb-2">🍳</div>
          <div className="font-medium">No recipe yet.</div>
          <div className="text-sm">Head Home and tell us what you have.</div>
        </div>
      </div>
    );
  }

  const toggleFav = () => {
    storage.toggleFavorite(recipe);
    setFav((f) => !f);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <button onClick={onBack} className="text-brand-green text-sm font-medium">
          ← Back
        </button>
        <div className="ml-auto text-base font-bold text-brand-green">Recipe</div>
        <button onClick={toggleFav} className="ml-auto text-brand-orange" aria-label="Save">
          <HeartIcon filled={fav} stroke={fav ? '#E8610A' : '#E8610A'} />
        </button>
      </div>

      <div className="px-5 mt-2">
        <div
          className="relative w-full rounded-3xl overflow-hidden flex items-center justify-center"
          style={{
            height: 220,
            background:
              'linear-gradient(135deg, #fde7c8 0%, #f5d6a8 50%, #e9bb7a 100%)',
          }}
        >
          <div className="text-7xl select-none" aria-hidden>
            {emojiFor(recipe.title)}
          </div>
          <div className="absolute top-3 left-3 bg-brand-orange text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1">
            <ClockIcon size={12} stroke="#fff" sw={2.5} />
            {recipe.prepTime}
          </div>
          {recipe.kidFriendly && (
            <div className="absolute top-3 right-3 bg-brand-green text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1">
              <SmileIcon size={12} stroke="#fff" sw={2.5} />
              Kid-friendly
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="text-2xl font-extrabold text-brand-green">{recipe.title}</div>
        <div className="text-sm text-black/70 mt-1">{recipe.description}</div>
      </div>

      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<ClockIcon size={16} stroke="#2D5016" />} label={recipe.prepTime} sub="Time" />
          <Stat
            icon={<UsersIcon size={16} stroke="#2D5016" />}
            label={`${recipe.servings}`}
            sub="Servings"
          />
          <Stat
            icon={<BoltIcon size={16} stroke="#2D5016" />}
            label={recipe.difficulty}
            sub="Easy"
          />
        </div>
      </div>

      {recipe.ingredients?.length > 0 && (
        <Section title="Ingredients">
          <ul className="bg-white rounded-2xl divide-y divide-black/5">
            {recipe.ingredients.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{it.name}</span>
                <span className="text-black/60">{it.amount}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {recipe.steps?.length > 0 && (
        <Section title="Steps">
          <ol className="space-y-2">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3 bg-white rounded-2xl px-3 py-2.5 text-sm">
                <span className="w-6 h-6 shrink-0 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <div className="px-5 mt-5 space-y-2.5 pb-6">
        <button
          onClick={onCook}
          className="w-full rounded-2xl bg-brand-orange text-white font-semibold py-3.5"
        >
          Cook This!
        </button>
        <button
          disabled={busy}
          onClick={onNext}
          className="w-full rounded-2xl bg-white text-brand-orange font-semibold py-3.5 border-2 border-brand-orange flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? 'Finding next idea...' : (
            <>
              Next Idea <ArrowRight size={18} stroke="#E8610A" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, sub }) {
  return (
    <div className="bg-white rounded-2xl p-3 flex flex-col items-center text-center">
      <div className="mb-1">{icon}</div>
      <div className="font-bold text-brand-green text-sm">{label}</div>
      <div className="text-[11px] text-black/50">{sub}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-5 mt-5">
      <div className="text-sm font-semibold text-brand-green mb-2">{title}</div>
      {children}
    </div>
  );
}
