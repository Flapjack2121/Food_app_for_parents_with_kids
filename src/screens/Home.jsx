import { useState } from 'react';
import { BoltIcon, SparkIcon } from '../components/icons.jsx';

const POPULAR = [
  { name: 'Chicken', emoji: '🍗' },
  { name: 'Eggs', emoji: '🥚' },
  { name: 'Pasta', emoji: '🍝' },
  { name: 'Tomatoes', emoji: '🍅' },
  { name: 'Cheese', emoji: '🧀' },
  { name: 'Rice', emoji: '🍚' },
  { name: 'Broccoli', emoji: '🥦' },
  { name: 'Milk', emoji: '🥛' },
];

export default function Home({ profile, onFind, busy }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState([]);

  const togglePick = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const allIngredients = () => {
    const typed = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set([...picked, ...typed]));
  };

  const find = (mode) => {
    const list = allIngredients();
    if (list.length === 0 && mode === 'normal') return;
    onFind({ ingredients: list, mode });
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <Logo />
        <div>
          <div className="font-extrabold text-brand-green leading-tight text-lg">Little Helpers</div>
          <div className="text-xs text-brand-green/70">Hungry minds. Happy families.</div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-start gap-2">
          <div>
            <div className="text-2xl font-extrabold text-brand-green leading-tight">
              Hi {profile?.name || 'there'}! 👋
            </div>
            <div className="text-sm text-black/70 mt-1">
              Let's turn what you have into something delicious.
            </div>
          </div>
          <div className="ml-auto text-3xl select-none" aria-hidden>
            🥕
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="text-sm font-semibold text-brand-green mb-2">What's in your fridge?</div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add ingredients..."
          className="w-full bg-white rounded-2xl px-4 py-3 text-base outline-none border border-black/5 focus:border-brand-green/50"
        />
      </div>

      <div className="px-5 mt-5">
        <div className="text-sm font-semibold text-brand-green mb-2">Popular ingredients</div>
        <div className="grid grid-cols-2 gap-2">
          {POPULAR.map(({ name, emoji }) => {
            const on = picked.includes(name);
            return (
              <button
                key={name}
                onClick={() => togglePick(name)}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm border transition-colors ${
                  on
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white text-brand-green border-black/5'
                }`}
              >
                <span className="text-base" aria-hidden>
                  {emoji}
                </span>
                <span className="font-medium">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-2.5">
        <button
          disabled={busy}
          onClick={() => find('normal')}
          className="w-full rounded-2xl bg-brand-green text-white font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <SparkIcon size={18} stroke="#fff" /> {busy ? 'Cooking up ideas...' : 'Find Recipe'}
        </button>
        <button
          disabled={busy}
          onClick={() => find('lazy')}
          className="w-full rounded-2xl bg-brand-orange text-white font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <BoltIcon size={18} /> Lazy Mode · ≤10 min · ≤4 ingredients
        </button>
      </div>

      <div className="h-6" />
    </div>
  );
}

function Logo() {
  return (
    <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F5F0E8" strokeWidth="2">
        <path d="M6 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 12 4a4 4 0 0 1 4.5 2.3A4 4 0 1 1 18 14" />
        <path d="M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
      </svg>
    </div>
  );
}
