import { useEffect, useState } from 'react';
import { storage } from '../lib/storage.js';
import { generateWeekPlan, imageUrlFor } from '../api/claude.js';
import { ClockIcon, SparkIcon } from '../components/icons.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Plan({ profile, onOpenRecipe, onBuildShoppingList }) {
  const [plan, setPlan] = useState(() => storage.getWeekPlan() || Array(7).fill(null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    storage.setWeekPlan(plan);
  }, [plan]);

  const autoFill = async () => {
    setBusy(true);
    setError(null);
    try {
      const recipes = await generateWeekPlan({ profile });
      setPlan(recipes.slice(0, 7).concat(Array(7).fill(null)).slice(0, 7));
    } catch (e) {
      console.error(e);
      setError('Could not generate the week plan. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const clearDay = (i) => setPlan((prev) => prev.map((r, j) => (j === i ? null : r)));

  const filledCount = plan.filter(Boolean).length;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div className="text-xl font-extrabold text-brand-green">Week Plan</div>
        <span className="ml-2 text-xs text-black/55">{filledCount} of 7</span>
      </div>

      <div className="px-5 pt-2 grid grid-cols-1 gap-2.5">
        {DAYS.map((d, i) => {
          const r = plan[i];
          return r ? (
            <button
              key={d}
              onClick={() => onOpenRecipe(r)}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden flex items-center text-left active:scale-[0.99]"
            >
              <PlanThumb recipe={r} />
              <div className="flex-1 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-brand-green/70 font-semibold">
                  {d}
                </div>
                <div className="font-semibold text-brand-green text-sm leading-tight line-clamp-2">
                  {r.title}
                </div>
                <div className="text-[11px] text-black/60 mt-0.5 flex items-center gap-1">
                  <ClockIcon size={11} stroke="#E8610A" /> {r.prepTime} min
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDay(i);
                }}
                className="text-xs text-black/40 px-3 py-2"
                aria-label="Clear day"
              >
                ✕
              </button>
            </button>
          ) : (
            <div
              key={d}
              className="bg-white/60 rounded-2xl border border-dashed border-black/15 px-3 py-3 flex items-center"
            >
              <div className="text-[11px] uppercase tracking-wider text-brand-green/70 font-semibold w-12">
                {d}
              </div>
              <div className="text-sm text-black/45">No recipe — tap "Auto-fill"</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="px-5 mt-3 text-xs text-red-600 bg-red-50 rounded-xl py-2 px-3 mx-5">
          {error}
        </div>
      )}

      <div className="px-5 mt-4 space-y-2.5 pb-6">
        <button
          disabled={busy}
          onClick={autoFill}
          className="w-full rounded-2xl bg-brand-green text-white font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          <SparkIcon size={18} stroke="#fff" />
          {busy ? 'Building your week...' : 'Auto-fill Week'}
        </button>
        <button
          disabled={filledCount === 0}
          onClick={() => onBuildShoppingList(plan.filter(Boolean))}
          className="w-full rounded-2xl bg-brand-orange text-white font-semibold py-3.5 disabled:opacity-50 active:scale-[0.99]"
        >
          🛒 Generate Shopping List
        </button>
      </div>
    </div>
  );
}

function PlanThumb({ recipe }) {
  const [err, setErr] = useState(false);
  const src = imageUrlFor(recipe.imageQuery || recipe.title, hash(recipe.id));
  if (err) {
    return (
      <div className="w-20 h-20 shrink-0 bg-[#fde7c8] flex items-center justify-center text-2xl">
        🍽️
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={recipe.title}
      onError={() => setErr(true)}
      className="w-20 h-20 shrink-0 object-cover"
    />
  );
}

function hash(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
