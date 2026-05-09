import { useEffect, useMemo, useState } from 'react';
import {
  ClockIcon,
  UsersIcon,
  HeartIcon,
  SmileIcon,
  ArrowRight,
  BoltIcon,
} from '../components/icons.jsx';
import { storage } from '../lib/storage.js';
import { imageUrlFor } from '../api/claude.js';

const COMPLAINTS = [
  { id: 'spicy', label: 'Too spicy' },
  { id: 'texture', label: 'Wrong texture' },
  { id: 'ingredient', label: 'Hates an ingredient' },
  { id: 'looks', label: 'Looks weird' },
];

export default function Recipe({
  recipe,
  onCook,
  onNext,
  onBack,
  onAdjust,
  busy,
  adjusting,
}) {
  const [fav, setFav] = useState(recipe ? storage.isFavorite(recipe.id) : false);
  const [imgError, setImgError] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  useEffect(() => {
    setFav(recipe ? storage.isFavorite(recipe.id) : false);
    setImgError(false);
  }, [recipe?.id]);

  const imgSrc = useMemo(() => {
    if (!recipe) return null;
    return imageUrlFor(recipe.imageQuery || recipe.title, hashSeed(recipe.id || recipe.title));
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6 bg-brand-cream">
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

  const sendComplaint = (problem) => {
    setComplaintOpen(false);
    onAdjust?.(problem);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-brand-green border border-black/5"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 text-center text-base font-bold text-brand-green">Recipe</div>
        <button
          onClick={toggleFav}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-black/5"
          aria-label="Save"
        >
          <HeartIcon filled={fav} stroke="#E8610A" size={18} />
        </button>
      </div>

      <div className="px-5 mt-2">
        <div
          className="relative w-full rounded-3xl overflow-hidden bg-[#fde7c8]"
          style={{ height: 220 }}
        >
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={recipe.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-7xl"
              style={{
                background:
                  'linear-gradient(135deg, #fde7c8 0%, #f5d6a8 50%, #e9bb7a 100%)',
              }}
            >
              🍽️
            </div>
          )}
          <div className="absolute top-3 left-3 bg-brand-orange text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
            <ClockIcon size={12} stroke="#fff" sw={2.5} />
            {recipe.prepTime} min
          </div>
          {recipe.kidFriendly && (
            <div className="absolute top-3 right-3 bg-brand-green text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
              <SmileIcon size={12} stroke="#fff" sw={2.5} />
              Kid-friendly
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="text-2xl font-extrabold text-brand-green leading-tight">
          {recipe.title}
        </div>
        <div className="text-sm text-black/70 mt-1 leading-snug">{recipe.description}</div>
        {recipe.kidFriendlyReason && (
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-green bg-brand-green/10 rounded-full px-2 py-1 font-medium">
            ✓ {recipe.kidFriendlyReason}
          </div>
        )}
      </div>

      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<ClockIcon size={16} stroke="#2D5016" />}
            label={`${recipe.prepTime} min`}
            sub="Time"
          />
          <Stat
            icon={<UsersIcon size={16} stroke="#2D5016" />}
            label={`${recipe.servings}`}
            sub="Servings"
          />
          <Stat
            icon={<BoltIcon size={16} stroke="#2D5016" />}
            label={recipe.difficulty}
            sub="Difficulty"
          />
        </div>
      </div>

      {(recipe.calories || recipe.protein || recipe.carbs) && (
        <div className="px-5 mt-3">
          <div className="bg-white rounded-2xl px-4 py-2.5 border border-black/5 flex justify-between text-xs">
            <NutBlock label="Calories" value={recipe.calories} unit="kcal" />
            <NutBlock label="Protein" value={recipe.protein} unit="g" />
            <NutBlock label="Carbs" value={recipe.carbs} unit="g" />
          </div>
        </div>
      )}

      {recipe.ingredients?.length > 0 && (
        <Section title="Ingredients">
          <ul className="bg-white rounded-2xl divide-y divide-black/5 border border-black/5">
            {recipe.ingredients.map((it, i) => (
              <li key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    it.haveIt ? 'bg-brand-green' : 'bg-brand-orange'
                  }`}
                  title={it.haveIt ? 'You have this' : 'Need to buy'}
                />
                <span className="flex-1">{it.name}</span>
                <span className="text-black/60 text-xs">
                  {it.amount} {it.unit}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {recipe.steps?.length > 0 && (
        <Section title="Steps">
          <ol className="space-y-2">
            {recipe.steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 bg-white rounded-2xl px-3 py-2.5 text-sm border border-black/5"
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">
                  {s.stepNumber || i + 1}
                </span>
                <span className="leading-snug flex-1">{s.instruction}</span>
                {s.timerSeconds > 0 && (
                  <span className="text-[11px] text-brand-orange font-semibold whitespace-nowrap">
                    ⏱ {fmtTime(s.timerSeconds)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      <div className="px-5 mt-5 space-y-2.5 pb-2">
        <button
          onClick={onCook}
          className="w-full rounded-2xl bg-brand-orange text-white font-semibold py-3.5 active:scale-[0.99]"
        >
          🍳 Cook This!
        </button>
        <button
          disabled={busy}
          onClick={onNext}
          className="w-full rounded-2xl bg-white text-brand-orange font-semibold py-3.5 border-2 border-brand-orange flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          {busy ? (
            'Finding next idea...'
          ) : (
            <>
              Next Idea <ArrowRight size={18} stroke="#E8610A" />
            </>
          )}
        </button>
        <button
          disabled={adjusting}
          onClick={() => setComplaintOpen(true)}
          className="w-full rounded-2xl bg-white text-black/70 font-medium py-2.5 text-sm border border-black/10 disabled:opacity-60"
        >
          {adjusting ? 'Tweaking the recipe...' : "🙅 My kid won't eat this"}
        </button>
      </div>

      <div className="h-6" />

      {complaintOpen && (
        <ComplaintSheet
          onClose={() => setComplaintOpen(false)}
          onPick={sendComplaint}
        />
      )}
    </div>
  );
}

function ComplaintSheet({ onClose, onPick }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-7 z-50"
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' }}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
        <div className="text-lg font-extrabold text-brand-green text-center">
          What's the problem?
        </div>
        <div className="text-xs text-black/60 text-center mb-3">
          We'll tweak the recipe right away.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {COMPLAINTS.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.label)}
              className="bg-brand-cream rounded-2xl p-3 text-sm font-semibold text-brand-green border border-black/5 active:scale-[0.99]"
            >
              {c.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 text-sm text-black/60 font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NutBlock({ label, value, unit }) {
  if (value == null) return <div className="flex-1" />;
  return (
    <div className="flex-1 text-center">
      <div className="font-bold text-brand-green text-sm">
        {value}
        <span className="text-[10px] text-black/60 ml-0.5">{unit}</span>
      </div>
      <div className="text-[10px] text-black/55 uppercase">{label}</div>
    </div>
  );
}

function Stat({ icon, label, sub }) {
  return (
    <div className="bg-white rounded-2xl p-3 flex flex-col items-center text-center border border-black/5">
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

function fmtTime(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function hashSeed(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}
