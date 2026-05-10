import { useState } from 'react';
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
  { id: 'exhausted', emoji: '😤', label: 'Already frustrated' },
  { id: 'okay', emoji: '😔', label: 'Just get it done' },
  { id: 'energized', emoji: '🙂', label: 'Actually okay today' },
];

const RESCUE = [
  { id: 'quick', emoji: '😤', title: 'Quick', sub: '≤15 min · normal stress' },
  { id: 'very-quick', emoji: '😰', title: 'Very Quick', sub: '≤10 min · ≤4 ingredients' },
  { id: 'emergency', emoji: '🆘', title: 'Emergency', sub: '≤5 min · whatever you have' },
];

function getGreeting(name) {
  const n = name || 'there';
  const h = new Date().getHours();
  if (h >= 5 && h < 11)
    return {
      title: `Morning ${n}.`,
      sub: "Let's make today's meals as painless as possible. ☀️",
    };
  if (h >= 11 && h < 17)
    return {
      title: `Hey ${n}.`,
      sub: "What's the dinner situation looking like today? 🤔",
    };
  return {
    title: `It's dinner time, ${n}.`,
    sub: 'Let’s find something they might actually eat. 🤞',
  };
}

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

  const find = () => {
    const energyTime =
      energy === 'exhausted' ? Math.min(time, 10) : energy === 'okay' ? Math.min(time, 20) : time;
    onFind({ ingredients: allIngredients(), context: { time: energyTime, energy, mode: 'normal' } });
  };

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

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <Logo />
        <div className="flex-1">
          <div className="font-extrabold text-brand-green leading-tight text-[17px] tracking-tight">
            Little Helpers
          </div>
          <div className="text-[11px] text-brand-green/70">
            Less stress. More chances they'll eat it.
          </div>
        </div>
        {(earnedBadges?.length || 0) > 0 && (
          <button
            onClick={() => setBadgesOpen(true)}
            className="text-xs bg-white rounded-full px-3 py-1.5 font-semibold text-brand-green shadow-soft flex items-center gap-1"
          >
            🏆 {earnedBadges.length}
          </button>
        )}
      </div>

      <div className="px-5 pt-3">
        <div
          className="rounded-3xl p-5 flex items-center gap-3 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #FFFFFF 0%, #F8F4EB 60%, #EFE6D2 100%)',
            boxShadow:
              '0 1px 2px rgba(45,80,22,0.04), 0 10px 30px rgba(45,80,22,0.08)',
          }}
        >
          <div className="flex-1 relative z-10">
            <div className="text-[22px] font-extrabold text-brand-green leading-tight tracking-tight">
              {getGreeting(profile?.parentName || profile?.name).title}
            </div>
            <div className="text-[13px] text-black/65 mt-1 leading-snug">
              {getGreeting(profile?.parentName || profile?.name).sub}
            </div>
            {(showStreak || stats?.totalCooked > 0) && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {showStreak && (
                  <span className="text-[11px] bg-brand-orange/10 text-brand-orange font-semibold rounded-full px-2.5 py-1">
                    🔥 {stats.streak} days in a row. Genuinely impressive with kids.
                  </span>
                )}
                {!showStreak && stats?.totalCooked > 0 && (
                  <span className="text-[11px] bg-brand-green/10 text-brand-green font-semibold rounded-full px-2.5 py-1">
                    {stats.totalCooked} dinners survived
                  </span>
                )}
              </div>
            )}
          </div>
          <Mascot size={88} />
          <div
            className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #E8610A33 0%, transparent 70%)' }}
          />
        </div>
      </div>

      {(dailySuggestion || dailySuggestionLoading) && (
        <div className="px-5 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-green/70">
              Might work today
            </div>
            <button
              onClick={onRefreshSuggestion}
              disabled={dailySuggestionLoading}
              className="text-[11px] text-brand-orange font-bold disabled:opacity-50 px-2 py-0.5 rounded-full hover:bg-brand-orange/10"
            >
              {dailySuggestionLoading ? '…' : '↻ New'}
            </button>
          </div>
          {dailySuggestion ? (
            <button
              onClick={() => onOpenSuggestion(dailySuggestion)}
              className="w-full bg-white rounded-2xl overflow-hidden flex items-center text-left active:scale-[0.99] shadow-soft"
            >
              <SuggestionThumb recipe={dailySuggestion} />
              <div className="flex-1 px-3 py-2.5">
                <div className="font-bold text-brand-green text-sm leading-tight line-clamp-2">
                  {dailySuggestion.title}
                </div>
                <div className="text-[11px] text-black/55 mt-0.5 line-clamp-1">
                  {dailySuggestion.description}
                </div>
                <div className="text-[11px] text-black/55 mt-1 flex items-center gap-1">
                  <ClockIcon size={11} stroke="#E8610A" /> {dailySuggestion.prepTime} min
                </div>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-3 text-sm text-black/55 flex items-center gap-2 shadow-soft">
              <span className="animate-pulse">🍳</span> Picking something nice for you…
            </div>
          )}
        </div>
      )}

      <div className="px-5 mt-5">
        <SectionLabel>How long can you realistically spend?</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => (
            <Chip key={t.id} on={time === t.id} onClick={() => setTime(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        <SectionLabel>How are you feeling about cooking right now?</SectionLabel>
        <div className="grid grid-cols-1 gap-2">
          {ENERGY.map((e) => (
            <Chip key={e.id} on={energy === e.id} onClick={() => setEnergy(e.id)}>
              <span className="mr-1.5">{e.emoji}</span>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        <SectionLabel>What are you working with today?</SectionLabel>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="whatever's in there… chicken, eggs, that sad broccoli from 3 days ago…"
          className="w-full bg-white rounded-2xl px-4 py-3.5 text-base outline-none shadow-soft focus:ring-2 focus:ring-brand-green/20 transition-all"
        />
        {hasMemory && (
          <button
            onClick={reuseLast}
            className="mt-2 w-full text-xs bg-brand-green/8 text-brand-green rounded-2xl px-3 py-2.5 font-medium text-left flex items-center gap-2"
          >
            <span className="text-base">😅</span>
            <span className="flex-1">
              Still working through the same fridge? Same.{' '}
              <span className="text-brand-green/80">
                {lastIngredients.slice(0, 4).join(', ')}
                {lastIngredients.length > 4 ? '…' : ''}
              </span>
            </span>
            <span className="text-brand-green font-bold">+ Add</span>
          </button>
        )}
      </div>

      <div className="px-5 mt-4">
        <SectionLabel>Popular ingredients</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {POPULAR.map(({ name, dot }) => {
            const on = picked.includes(name);
            return (
              <button
                key={name}
                onClick={() => togglePick(name)}
                className={`flex items-center gap-2.5 rounded-full pl-2 pr-3 py-2 text-sm border transition-all active:scale-[0.97] ${
                  on
                    ? 'bg-brand-green text-white border-brand-green shadow-pop'
                    : 'bg-white text-brand-green border-transparent shadow-soft'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shrink-0 ring-1 ring-black/5"
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
          className="btn-primary w-full rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-all"
          style={{ height: 56 }}
        >
          <SparkIcon size={18} stroke="#fff" />{' '}
          {busy ? 'Searching…' : 'Find Something They Might Eat'}
        </button>
        <button
          disabled={busy}
          onClick={() => setRescueOpen(true)}
          className="w-full rounded-2xl bg-transparent text-brand-orange font-semibold border-2 border-brand-orange flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-all"
          style={{ height: 48 }}
        >
          <BoltIcon size={16} /> I just need something fast
        </button>
        <button
          disabled={busy}
          onClick={() => setCloneOpen(true)}
          className="w-full rounded-xl bg-transparent text-brand-green text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 active:opacity-70 transition-all underline-offset-4 hover:underline"
          style={{ height: 44 }}
        >
          🍟 They only eat nuggets? We got you.
        </button>
      </div>

      <div className="h-24" />

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

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-brand-green/70 mb-2 px-1">
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm font-semibold transition-all active:scale-[0.97] ${
        on
          ? 'bg-brand-green text-white shadow-pop'
          : 'bg-white text-brand-green shadow-soft'
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
            className="w-full bg-brand-cream rounded-2xl p-3.5 text-left flex items-center gap-3 active:scale-[0.99] shadow-soft"
          >
            <div className="text-2xl">{r.emoji}</div>
            <div className="flex-1">
              <div className="font-bold text-brand-green">{r.title}</div>
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
        className="w-full bg-brand-cream rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand-green/20"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-white text-brand-green font-semibold py-3 shadow-soft"
        >
          Cancel
        </button>
        <button
          disabled={!val.trim()}
          onClick={() => onSubmit(val)}
          className="btn-orange flex-1 rounded-2xl text-white font-bold py-3 disabled:opacity-50"
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
              className={`rounded-2xl p-3 flex items-center gap-3 ${
                has ? 'bg-brand-cream shadow-soft' : 'bg-white/60 opacity-60'
              }`}
            >
              <div className={`text-2xl ${has ? '' : 'grayscale'}`}>{b.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-brand-green text-sm">{b.name}</div>
                <div className="text-xs text-black/60">{b.desc}</div>
              </div>
              {has && <div className="text-xs font-bold text-brand-green">✓</div>}
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
    <div className="fixed inset-0 z-40 flex items-end justify-center animate-fade-in-up">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-7 z-50"
        style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.15)' }}
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

function Logo() {
  return (
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #3F7220 0%, #2D5016 100%)',
        boxShadow: '0 4px 12px rgba(45,80,22,0.25)',
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F5F0E8" strokeWidth="2">
        <path d="M6 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 12 4a4 4 0 0 1 4.5 2.3A4 4 0 1 1 18 14" />
        <path d="M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
      </svg>
    </div>
  );
}
