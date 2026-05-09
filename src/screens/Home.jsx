import { useState } from 'react';
import { BoltIcon, SparkIcon } from '../components/icons.jsx';
import Mascot from '../components/Mascot.jsx';

const POPULAR = [
  { name: 'Chicken', dot: '#E8B07A' },
  { name: 'Eggs', dot: '#F4C84A' },
  { name: 'Pasta', dot: '#E8610A' },
  { name: 'Tomatoes', dot: '#D8412B' },
  { name: 'Cheese', dot: '#F2B530' },
  { name: 'Rice', dot: '#E6DCC2' },
  { name: 'Broccoli', dot: '#5B8E3E' },
  { name: 'Milk', dot: '#CFE0EE' },
];

const TIMES = [
  { id: 5, label: '5 min' },
  { id: 15, label: '15 min' },
  { id: 30, label: '30 min' },
  { id: 60, label: '1 hour' },
];

const ENERGY = [
  { id: 'exhausted', emoji: '😴', label: 'Exhausted' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'energized', emoji: '💪', label: 'Energized' },
];

const RESCUE = [
  {
    id: 'quick',
    emoji: '😤',
    title: 'Quick',
    sub: '≤15 min · normal stress',
  },
  {
    id: 'very-quick',
    emoji: '😰',
    title: 'Very Quick',
    sub: '≤10 min · ≤4 ingredients',
  },
  {
    id: 'emergency',
    emoji: '🆘',
    title: 'Emergency',
    sub: '≤5 min · whatever you have',
  },
];

export default function Home({ profile, lastIngredients, onFind, busy }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState([]);
  const [time, setTime] = useState(30);
  const [energy, setEnergy] = useState('okay');
  const [rescueOpen, setRescueOpen] = useState(false);
  const [memoryShown, setMemoryShown] = useState(false);

  const togglePick = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const allIngredients = () => {
    const typed = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set([...picked, ...typed]));
  };

  const find = () => onFind({ ingredients: allIngredients(), context: { time, energy, mode: 'normal' } });

  const triggerRescue = (mode) => {
    setRescueOpen(false);
    onFind({
      ingredients: allIngredients(),
      context: { time: mode === 'emergency' ? 5 : mode === 'very-quick' ? 10 : 15, energy, mode },
    });
  };

  const reuseLast = () => {
    setPicked((p) => Array.from(new Set([...p, ...lastIngredients])));
    setMemoryShown(true);
  };

  const hasMemory = lastIngredients?.length > 0 && !memoryShown;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <Logo />
        <div>
          <div className="font-extrabold text-brand-green leading-tight text-lg">
            Little Helpers
          </div>
          <div className="text-xs text-brand-green/70">Simple meals. Happy families.</div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="bg-white rounded-3xl p-4 border border-black/5 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-brand-green leading-tight">
              Hi {profile?.parentName || profile?.name || 'there'}! 👋
            </div>
            <div className="text-sm text-black/70 mt-1 leading-snug">
              Let's turn what you have into something delicious.
            </div>
          </div>
          <Mascot size={84} />
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="text-sm font-semibold text-brand-green mb-2">
          How much time do you have?
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => (
            <Chip key={t.id} on={time === t.id} onClick={() => setTime(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="text-sm font-semibold text-brand-green mb-2">How's your energy today?</div>
        <div className="grid grid-cols-3 gap-2">
          {ENERGY.map((e) => (
            <Chip key={e.id} on={energy === e.id} onClick={() => setEnergy(e.id)}>
              <span className="mr-1">{e.emoji}</span>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="text-sm font-semibold text-brand-green mb-2">What's in your fridge?</div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add ingredients..."
          className="w-full bg-white rounded-2xl px-4 py-3 text-base outline-none border border-black/5 focus:border-brand-green/50"
        />
        {hasMemory && (
          <button
            onClick={reuseLast}
            className="mt-2 w-full text-xs bg-brand-green/10 text-brand-green rounded-xl px-3 py-2 font-medium"
          >
            🧠 Still have these from last time? {lastIngredients.slice(0, 4).join(', ')}
            {lastIngredients.length > 4 ? '…' : ''} — tap to add
          </button>
        )}
      </div>

      <div className="px-5 mt-4">
        <div className="text-sm font-semibold text-brand-green mb-2">Popular ingredients</div>
        <div className="grid grid-cols-2 gap-2">
          {POPULAR.map(({ name, dot }) => {
            const on = picked.includes(name);
            return (
              <button
                key={name}
                onClick={() => togglePick(name)}
                className={`flex items-center gap-2.5 rounded-full pl-2 pr-3 py-2 text-sm border transition-colors ${
                  on
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white text-brand-green border-black/5'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shrink-0 border border-black/5"
                  style={{ background: on ? '#fff' : dot, opacity: on ? 0.85 : 1 }}
                />
                <span className="font-semibold">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-2.5">
        <button
          disabled={busy}
          onClick={find}
          className="w-full rounded-2xl bg-brand-green text-white font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          <SparkIcon size={18} stroke="#fff" />{' '}
          {busy ? 'Cooking up ideas...' : 'Find Recipe'}
        </button>
        <button
          disabled={busy}
          onClick={() => setRescueOpen(true)}
          className="w-full rounded-2xl bg-brand-orange text-white font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          <BoltIcon size={18} /> 🆘 Rescue Mode
        </button>
      </div>

      <div className="h-6" />

      {rescueOpen && (
        <RescueSheet onClose={() => setRescueOpen(false)} onPick={triggerRescue} />
      )}
    </div>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm font-medium border transition-colors ${
        on
          ? 'bg-brand-green text-white border-brand-green'
          : 'bg-white text-brand-green border-black/5'
      }`}
    >
      {children}
    </button>
  );
}

function RescueSheet({ onClose, onPick }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-7 z-50"
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' }}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
        <div className="text-lg font-extrabold text-brand-green text-center">🆘 Rescue Mode</div>
        <div className="text-xs text-black/60 text-center mb-3">How urgent is dinner?</div>
        <div className="space-y-2">
          {RESCUE.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className="w-full bg-brand-cream rounded-2xl p-3 text-left flex items-center gap-3 active:scale-[0.99] border border-black/5"
            >
              <div className="text-2xl">{r.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-brand-green">{r.title}</div>
                <div className="text-xs text-black/60">{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-black/60 font-medium"
        >
          Cancel
        </button>
      </div>
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
