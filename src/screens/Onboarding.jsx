import { useState } from 'react';
import { storage } from '../lib/storage.js';
import { ArrowRight, PlusIcon, CheckIcon } from '../components/icons.jsx';

const ALLERGY_OPTIONS = [
  'Nuts',
  'Dairy',
  'Gluten',
  'Eggs',
  'Soy',
  'Shellfish',
  'Vegetarian',
  'Vegan',
  'No Pork',
];

const SKILLS = [
  { id: 'beginner', label: 'Survival mode', sub: 'Clear steps, zero assumptions' },
  { id: 'comfortable', label: 'Getting by', sub: 'Normal recipes, not too complicated' },
  { id: 'confident', label: 'Actually enjoy it', sub: 'Bring on the variety' },
];

const STEP_META = [
  {
    emoji: '👋',
    headline: 'Hey, you showed up. That counts. 👋',
    subtitle: "Let's make dinner a little less painful. What should we call you?",
    next: "Let's do this →",
  },
  {
    emoji: '🧒',
    headline: 'Tell us about your little food critics 🧒',
    subtitle: "We'll make sure every recipe actually has a chance.",
    next: "That's my crew →",
  },
  {
    emoji: '🛡️',
    headline: "Hard no's only 🛡️",
    subtitle: 'These will never appear in any suggestion. Ever. We promise.',
    next: 'Got it, keep these out →',
  },
  {
    emoji: '🍳',
    headline: 'How are you with cooking? 🍳',
    subtitle:
      "No judgment — after a long day with kids, 'Survival mode' is the right answer for everyone.",
    next: 'Almost there →',
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [parentName, setParentName] = useState('');
  const [count, setCount] = useState(1);
  const [children, setChildren] = useState([{ name: '', age: 5, pickyEater: false }]);
  const [allergies, setAllergies] = useState([]);
  const [cookingSkill, setCookingSkill] = useState('comfortable');

  const updateCount = (n) => {
    const c = Math.max(1, Math.min(6, n));
    setCount(c);
    setChildren((prev) => {
      const next = [...prev];
      while (next.length < c) next.push({ name: '', age: 5, pickyEater: false });
      while (next.length > c) next.pop();
      return next;
    });
  };

  const toggleAllergy = (a) =>
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const saveAndCelebrate = () => {
    storage.setProfile({
      parentName: parentName.trim() || 'there',
      children,
      allergies,
      cookingSkill,
    });
    setStep(4);
  };

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const Header = () => (
    <div className="flex items-center gap-2 px-5 pt-12 pb-2">
      <Logo />
      <div>
        <div className="font-extrabold text-brand-green leading-tight text-lg">Little Helpers</div>
        <div className="text-xs text-brand-green/70">Simple meals. Happy families.</div>
      </div>
    </div>
  );

  if (step === 4) {
    return (
      <div className="flex flex-col flex-1 bg-brand-cream items-center justify-center px-6 text-center">
        <div className="text-[80px] mb-4 select-none" aria-hidden>
          🎉
        </div>
        <div className="text-2xl font-extrabold text-brand-green leading-tight">
          You're all set, {parentName.trim() || 'friend'}.
        </div>
        <div className="text-sm text-black/65 mt-3 leading-relaxed max-w-xs">
          No meal plans required. No judgment if they throw it on the floor. Just open the fridge
          and let's figure it out.
        </div>
        <button
          onClick={onDone}
          className="mt-8 w-full max-w-xs rounded-xl bg-brand-green text-white font-bold flex items-center justify-center gap-2"
          style={{ height: 56 }}
        >
          Let's find dinner →
        </button>
      </div>
    );
  }

  const meta = STEP_META[step];
  const finalStep = step === 3;

  return (
    <div className="flex flex-col flex-1 bg-brand-cream overflow-y-auto no-scrollbar">
      <Header />

      <div className="px-5 pt-3 pb-2">
        <Stepper step={step} total={4} />
        <div className="mt-3 text-center text-[13px] text-brand-green/80 font-medium">
          {meta.subtitle}
        </div>
      </div>

      <div className="flex-1 px-5 pb-5 flex flex-col" style={{ minHeight: '65vh' }}>
        <div className="text-center text-[80px] leading-none mb-3 select-none" aria-hidden>
          {meta.emoji}
        </div>
        <div className="text-center text-xl font-extrabold text-brand-green leading-tight mb-5 px-2">
          {meta.headline}
        </div>

        {step === 0 && (
          <Card>
            <input
              autoFocus
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white rounded-2xl px-4 py-3 text-base outline-none border border-black/5 focus:border-brand-green/60"
            />
          </Card>
        )}

        {step === 1 && (
          <>
            <Card>
              <div className="text-sm text-brand-green/80 font-semibold mb-2">How many kids?</div>
              <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
                <Round onClick={() => updateCount(count - 1)}>−</Round>
                <div className="text-3xl font-bold text-brand-green">{count}</div>
                <Round onClick={() => updateCount(count + 1)}>+</Round>
              </div>
            </Card>

            <div className="mt-3 space-y-2">
              {children.map((k, i) => (
                <div key={i} className="bg-white rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={k.name}
                      onChange={(e) =>
                        setChildren((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                        )
                      }
                      placeholder={`Kid ${i + 1} name`}
                      className="bg-brand-cream rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-green outline-none w-32"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/60">Age</span>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={k.age}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          setChildren((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, age: v } : x))
                          );
                        }}
                        className="w-16 bg-brand-cream rounded-lg px-2 py-1 text-center"
                      />
                    </div>
                  </div>
                  <label className="flex items-start justify-between text-xs gap-3">
                    <span className="leading-snug">
                      <span className="font-semibold text-sm text-brand-green">Picky eater</span>
                      <span className="block text-black/55 mt-0.5">
                        refuses everything, sends back meals, throws food, the works
                      </span>
                    </span>
                    <Toggle
                      on={k.pickyEater}
                      onChange={(on) =>
                        setChildren((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, pickyEater: on } : x))
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <Card>
            <div className="grid grid-cols-2 gap-2">
              {ALLERGY_OPTIONS.map((a) => {
                const on = allergies.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    className={`flex items-center justify-between rounded-2xl px-3 py-2.5 border text-sm ${
                      on
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-white text-brand-green border-black/5'
                    }`}
                  >
                    <span className="font-medium">{a}</span>
                    {on ? <CheckIcon size={18} stroke="#fff" /> : <PlusIcon size={18} />}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div className="space-y-2">
              {SKILLS.map((s) => {
                const on = cookingSkill === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCookingSkill(s.id)}
                    className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 border text-left ${
                      on
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-white text-brand-green border-black/5'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{s.label}</div>
                      <div className={`text-xs ${on ? 'text-white/80' : 'text-black/55'}`}>
                        {s.sub}
                      </div>
                    </div>
                    {on && <CheckIcon size={18} stroke="#fff" />}
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <div className="px-5 pb-6 pt-2 flex gap-3">
        {step > 0 && (
          <button
            onClick={back}
            className="flex-1 rounded-2xl bg-white text-brand-green font-semibold py-3 border border-black/5"
          >
            Back
          </button>
        )}
        {finalStep ? (
          <button
            onClick={saveAndCelebrate}
            className="flex-1 rounded-2xl bg-brand-orange text-white font-semibold py-3"
          >
            {meta.next}
          </button>
        ) : (
          <button
            onClick={next}
            className="flex-1 rounded-2xl bg-brand-green text-white font-semibold py-3 flex items-center justify-center gap-2"
          >
            {meta.next}
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ children }) {
  return <div className="bg-white/60 rounded-3xl p-4 border border-black/5">{children}</div>;
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${
        on ? 'bg-brand-orange' : 'bg-black/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function Round({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-brand-cream text-brand-green text-lg font-bold"
    >
      {children}
    </button>
  );
}

function Stepper({ step, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ease-out ${
            i <= step ? 'bg-brand-green' : 'bg-black/10'
          }`}
        />
      ))}
    </div>
  );
}

function Logo() {
  return (
    <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F5F0E8" strokeWidth="2">
        <path d="M6 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 12 4a4 4 0 0 1 4.5 2.3A4 4 0 1 1 18 14" />
        <path d="M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
      </svg>
    </div>
  );
}
