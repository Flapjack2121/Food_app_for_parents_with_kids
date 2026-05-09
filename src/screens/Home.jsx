import { useMemo, useState } from 'react';
import { BoltIcon, SparkIcon, ClockIcon } from '../components/icons.jsx';
import Mascot from '../components/Mascot.jsx';
import { BADGES } from '../lib/storage.js';
import { imageUrlFor } from '../api/claude.js';

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
  { id: 'quick', emoji: '😤', title: 'Quick', sub: '≤15 min · normal stress' },
  { id: 'very-quick', emoji: '😰', title: 'Very Quick', sub: '≤10 min · ≤4 ingredients' },
  { id: 'emergency', emoji: '🆘', title: 'Emergency', sub: '≤5 min · whatever you have' },
];

export default function Home({
  profile,
  lastIngredients,
  stats,
  earnedBadges,
  dailySuggestion,
  dailySuggestionLoading,
  onRefreshSuggestion,
  onOpenSuggestion,
  onClone,
  onFind,
  busy,
}) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState([]);
  const [time, setTime] = useState(30);
  const [energy, setEnergy] = useState('okay');
  const [rescueOpen, setRescueOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
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

  const find = () =>
    onFind({ ingredients: allIngredients(), context: { time, energy, mode: 'normal' } });

  const triggerRescue = (mode) => {
    setRescueOpen(false);
    onFind({
      ingredients: allIngredients(),
      context: {
        time: mode === 'emergency' ? 5 : mode === 'very-quick' ? 10 : 15,
        energy,
        mode,
      },
    });
  };

  const reuseLast = () => {
    setPicked((p) => Array.from(new Set([...p, ...lastIngredients])));
    setMemoryShown(true);
  };

  const submitClone = (dishName) => {
    setCloneOpen(false);
    if (dishName?.trim()) onClone(dishName.trim());
  };

  const hasMemory = lastIngredients?.length > 0 && !memoryShown;
  const showStreak = (stats?.streak || 0) >= 1;
  const showBadges = (earnedBadges?.length || 0) > 0;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <Logo />
        <div className="flex-1">
          <div className="font-extrabold text-brand-green leading-tight text-lg">
            Little Helpers
          </div>
          <div className="text-xs text-brand-green/70">Simple meals. Happy families.</div>
        </div>
        {showBadges && (
          <button
            onClick={() => setBadgesOpen(true)}
            className="text-xs bg-white rounded-full px-2.5 py-1 border border-black/5 font-semibold text-brand-green flex items-center gap-1"
          >
            🏆 {earnedBadges.length}
          </button>
        )}
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
            {(showStreak || stats?.totalCooked > 0) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {showStreak && (
                  <span className="text-[11px] bg-brand-orange/10 text-brand-orange font-semibold rounded-full px-2 py-0.5">
                    🔥 {stats.streak}-day streak
                  </span>
                )}
                {stats?.totalCooked > 0 && (
                  <span className="text-[11px] bg-brand-green/10 text-brand-green font-semibold rounded-full px-2 py-0.5">
                    {stats.totalCooked} cooked
                  </span>
                )}
              </div>
            )}
          </div>
          <Mascot size={84} />
        </div>
      </div>

      {(dailySuggestion || dailySuggestionLoading) && (
        <div className="px-5 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-brand-green">
              Today's suggestion 🍽️
            </div>
            <button
              onClick={onRefreshSuggestion}
              disabled={dailySuggestionLoading}
              className="text-xs text-brand-orange font-semibold disabled:opacity-50"
            >
              {dailySuggestionLoading ? '…' : '↻ New'}
            </button>
          </div>
          {dailySuggestion ? (
            <button
              onClick={() => onOpenSuggestion(dailySuggestion)}
              className="w-full bg-white rounded-2xl border border-black/5 overflow-hidden flex items-center text-left active:scale-[0.99]"
            >
              <SuggestionThumb recipe={dailySuggestion} />
              <div className="flex-1 px-3 py-2.5">
                <div className="font-semibold text-brand-green text-sm leading-tight line-clamp-2">
                  {dailySuggestion.title}
                </div>
                <div className="text-[11px] text-black/60 mt-0.5 line-clamp-1">
                  {dailySuggestion.description}
                </div>
                <div className="text-[11px] text-black/55 mt-1 flex items-center gap-1">
                  <ClockIcon size={11} stroke="#E8610A" /> {dailySuggestion.prepTime} min
                </div>
              </div>
            </button>
          ) : (
            <div className="bg-white/60 rounded-2xl border border-dashed border-black/10 p-3 text-sm text-black/55 flex items-center gap-2">
              <span className="animate-pulse">🍳</span> Picking something nice for you…
            </div>
          )}
        </div>
      )}

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
        <div className="text-sm font-semibold text-brand-green mb-2">
          How's your energy today?
        </div>
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
            className="mt-2 w-full text-xs bg-brand-green/10 text-brand-green rounded-xl px-3 py-2 font-medium text-left"
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
        <button
          disabled={busy}
          onClick={() => setCloneOpen(true)}
          className="w-full rounded-2xl bg-white text-brand-green font-semibold py-3 border border-black/10 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          🍟 Healthy Clone — make a homemade version
        </button>
      </div>

      <div className="h-6" />

      {rescueOpen && (
        <RescueSheet onClose={() => setRescueOpen(false)} onPick={triggerRescue} />
      )}
      {cloneOpen && (
        <CloneSheet onClose={() => setCloneOpen(false)} onSubmit={submitClone} />
      )}
      {badgesOpen && (
        <BadgesSheet
          onClose={() => setBadgesOpen(false)}
          earned={earnedBadges || []}
          stats={stats}
        />
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
    <Sheet onClose={onClose} title="🆘 Rescue Mode" subtitle="How urgent is dinner?">
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
      <button onClick={onClose} className="w-full mt-3 text-sm text-black/60 font-medium">
        Cancel
      </button>
    </Sheet>
  );
}

function CloneSheet({ onClose, onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <Sheet
      onClose={onClose}
      title="🍟 Healthy Clone"
      subtitle="What does your kid only eat? We'll make a homemade version."
    >
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="e.g. McNuggets, Big Mac, frozen pizza"
        className="w-full bg-brand-cream rounded-2xl px-4 py-3 text-base outline-none border border-black/5 focus:border-brand-green/50"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-white text-brand-green font-semibold py-3 border border-black/10"
        >
          Cancel
        </button>
        <button
          disabled={!val.trim()}
          onClick={() => onSubmit(val)}
          className="flex-1 rounded-2xl bg-brand-orange text-white font-semibold py-3 disabled:opacity-50"
        >
          Make it
        </button>
      </div>
    </Sheet>
  );
}

function BadgesSheet({ onClose, earned, stats }) {
  return (
    <Sheet
      onClose={onClose}
      title="🏆 Badges"
      subtitle={`${earned.length} of ${BADGES.length} earned`}
    >
      <div className="space-y-2">
        {BADGES.map((b) => {
          const has = earned.includes(b.id);
          return (
            <div
              key={b.id}
              className={`rounded-2xl p-3 flex items-center gap-3 border ${
                has
                  ? 'bg-brand-cream border-brand-green/30'
                  : 'bg-white border-black/5 opacity-60'
              }`}
            >
              <div className={`text-2xl ${has ? '' : 'grayscale'}`}>{b.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-brand-green text-sm">{b.name}</div>
                <div className="text-xs text-black/60">{b.desc}</div>
              </div>
              {has && <div className="text-xs font-semibold text-brand-green">✓</div>}
            </div>
          );
        })}
      </div>
      {stats && (
        <div className="mt-3 text-[11px] text-black/55 text-center">
          🍳 {stats.totalCooked} cooked · 🔥 {stats.streak}-day streak
        </div>
      )}
      <button onClick={onClose} className="w-full mt-3 text-sm text-black/60 font-medium">
        Close
      </button>
    </Sheet>
  );
}

function Sheet({ onClose, title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-7 z-50"
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' }}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
        <div className="text-lg font-extrabold text-brand-green text-center">{title}</div>
        {subtitle && (
          <div className="text-xs text-black/60 text-center mb-3">{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  );
}

function SuggestionThumb({ recipe }) {
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
