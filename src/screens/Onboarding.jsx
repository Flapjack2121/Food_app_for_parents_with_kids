import { useState } from 'react';
import { storage } from '../lib/storage.js';
import { ArrowRight, PlusIcon, CheckIcon } from '../components/icons.jsx';

const ALLERGY_OPTIONS = ['Nuts', 'Dairy', 'Gluten', 'Eggs'];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [count, setCount] = useState(1);
  const [kids, setKids] = useState([{ age: 5, picky: false }]);
  const [allergies, setAllergies] = useState([]);

  const updateCount = (n) => {
    const c = Math.max(1, Math.min(6, n));
    setCount(c);
    setKids((prev) => {
      const next = [...prev];
      while (next.length < c) next.push({ age: 5, picky: false });
      while (next.length > c) next.pop();
      return next;
    });
  };

  const toggleAllergy = (a) =>
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const finish = () => {
    storage.setProfile({ name: name.trim() || 'there', kids, allergies });
    onDone();
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const Header = () => (
    <div className="flex items-center gap-2 px-5 pt-12 pb-2">
      <Logo />
      <div>
        <div className="font-extrabold text-brand-green leading-tight text-lg">Little Helpers</div>
        <div className="text-xs text-brand-green/70">Hungry minds. Happy families.</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-brand-cream">
      <Header />

      <div className="px-5 pt-3 pb-2">
        <Stepper step={step} total={4} />
      </div>

      <div className="flex-1 px-5 pb-5">
        {step === 0 && (
          <Card title="Hi there! 👋" subtitle="What should we call you?">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white rounded-2xl px-4 py-3 text-base outline-none border border-black/5 focus:border-brand-green/60"
            />
          </Card>
        )}

        {step === 1 && (
          <Card title="How many kids?" subtitle="We'll tune recipes for them.">
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
              <button
                className="w-9 h-9 rounded-full bg-brand-cream text-brand-green text-lg font-bold"
                onClick={() => updateCount(count - 1)}
              >
                −
              </button>
              <div className="text-3xl font-bold text-brand-green">{count}</div>
              <button
                className="w-9 h-9 rounded-full bg-brand-cream text-brand-green text-lg font-bold"
                onClick={() => updateCount(count + 1)}
              >
                +
              </button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Tell us about them" subtitle="Age and any picky eaters?">
            <div className="space-y-3">
              {kids.map((k, i) => (
                <div key={i} className="bg-white rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-brand-green">Kid {i + 1}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/60">Age</span>
                      <input
                        type="number"
                        min="0"
                        max="18"
                        value={k.age}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          setKids((prev) => prev.map((x, j) => (j === i ? { ...x, age: v } : x)));
                        }}
                        className="w-16 bg-brand-cream rounded-lg px-2 py-1 text-center"
                      />
                    </div>
                  </div>
                  <label className="flex items-center justify-between text-sm">
                    <span>Picky eater</span>
                    <Toggle
                      on={k.picky}
                      onChange={(on) =>
                        setKids((prev) => prev.map((x, j) => (j === i ? { ...x, picky: on } : x)))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Any allergies?" subtitle="We'll keep these out of every recipe.">
            <div className="grid grid-cols-2 gap-2">
              {ALLERGY_OPTIONS.map((a) => {
                const on = allergies.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 border text-sm ${
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
        {step < 3 ? (
          <button
            onClick={next}
            className="flex-1 rounded-2xl bg-brand-green text-white font-semibold py-3 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={18} stroke="#fff" />
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex-1 rounded-2xl bg-brand-orange text-white font-semibold py-3"
          >
            Let's cook!
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white/60 rounded-3xl p-4 border border-black/5">
      <div className="text-xl font-bold text-brand-green">{title}</div>
      {subtitle && <div className="text-sm text-black/60 mb-3">{subtitle}</div>}
      <div className="mt-3">{children}</div>
    </div>
  );
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

function Stepper({ step, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-green' : 'bg-black/10'}`}
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
