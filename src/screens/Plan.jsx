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
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div>
          <div className="text-2xl font-extrabold text-brand-green tracking-tight">
            Week Plan
          </div>
          <div className="text-[11px] text-brand-green/60 font-medium">
            {filledCount} of 7 days planned
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 grid grid-cols-1 gap-2.5">
        {DAYS.map((d, i) => {
          const r = plan[i];
          return r ? (
            <div
              key={d}
              className="bg-white rounded-2xl shadow-soft overflow-hidden flex items-stretch active:scale-[0.99] transition-all"
            >
              <button
                onClick={() => onOpenRecipe(r)}
                className="flex-1 flex items-center text-left"
              >
                <PlanThumb recipe={r} />
                <div className="flex-1 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-brand-green/70 font-bold">
                    {d}
                  </div>
                  <div className="font-bold text-brand-green text-sm leading-tight line-clamp-2">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-black/55 mt-1 flex items-center gap-1">
                    <ClockIcon size={11} stroke="#E8610A" /> {r.prepTime} min
                  </div>
                </div>
              </button>
              <button
                onClick={() => clearDay(i)}
                className="px-3 text-black/35 hover:text-black/60"
                aria-label="Clear day"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              key={d}
              className="rounded-2xl px-4 py-3.5 flex items-center"
              style={{
                background: 'rgba(255,255,255,0.4)',
                border: '1.5px dashed rgba(45,80,22,0.18)',
              }}
            >
              <div className="text-[10px] uppercase tracking-wider text-brand-green/70 font-bold w-12">
                {d}
              </div>
              <div className="text-sm text-black/40 italic">No recipe yet</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mx-5 mt-3 text-xs text-red-600 bg-red-50 rounded-xl py-2 px-3">
          {error}
        </div>
      )}

      <div className="px-5 mt-5 space-y-2.5 pb-24">
        <button
          disabled={busy}
          onClick={autoFill}
          className="btn-primary w-full rounded-2xl text-white font-bold py-4 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          <SparkIcon size={18} stroke="#fff" />
          {busy ? 'Building your week…' : 'Auto-fill Week'}
        </button>
        <button
          disabled={filledCount === 0}
          onClick={() => onBuildShoppingList(plan.filter(Boolean))}
          className="btn-orange w-full rounded-2xl text-white font-bold py-4 disabled:opacity-50 active:scale-[0.99]"
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
      <div className="w-20 h-20 shrink-0 bg-gradient-to-br from-[#fde7c8] to-[#e9bb7a] flex items-center justify-center text-2xl">
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
