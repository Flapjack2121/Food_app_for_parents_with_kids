import { useEffect, useRef, useState } from 'react';

export default function CookMode({ recipe, onClose, onFinish }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const tickRef = useRef(null);
  const beepRef = useRef(null);

  const steps = recipe?.steps || [];
  const step = steps[stepIdx];
  const isLast = stepIdx >= steps.length - 1;

  useEffect(() => {
    if (!step) return;
    const t = step.timerSeconds || 0;
    setSecsLeft(t);
    if (t > 0) {
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [stepIdx, recipe?.id]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          setRunning(false);
          alarm();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  const alarm = () => {
    try {
      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);
    } catch {}
    try {
      const ctx = beepRef.current || new (window.AudioContext || window.webkitAudioContext)();
      beepRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.2;
      o.start();
      setTimeout(() => {
        o.stop();
      }, 600);
    } catch {}
  };

  const next = () => setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  if (!recipe || !step) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="text-xl font-bold text-brand-green">No steps to cook.</div>
        <button
          onClick={onClose}
          className="mt-4 rounded-2xl bg-brand-green text-white font-semibold px-5 py-3"
        >
          Close
        </button>
      </div>
    );
  }

  const totalSecs = step.timerSeconds || 0;
  const progress = totalSecs > 0 ? 1 - secsLeft / totalSecs : 0;

  return (
    <div className="fixed inset-0 z-50 bg-brand-cream flex flex-col">
      <div className="flex items-center px-4 pt-12 pb-2">
        <button
          onClick={onClose}
          className="text-sm font-semibold text-brand-green bg-white rounded-full px-3 py-1.5 border border-black/5"
        >
          ✕ Close
        </button>
        <div className="flex-1 text-center text-sm font-semibold text-brand-green">
          {recipe.title}
        </div>
        <div className="w-16" />
      </div>

      <div className="px-5 mt-2">
        <div className="text-xs text-black/55 uppercase tracking-wider">
          Step {stepIdx + 1} of {steps.length}
        </div>
        <div className="mt-2 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-green transition-all"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-2xl font-bold text-brand-green leading-snug">
          {step.instruction}
        </div>

        {totalSecs > 0 && (
          <div className="mt-8 w-full max-w-[260px]">
            <div className="relative w-44 h-44 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#00000010"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#E8610A"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * progress}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-extrabold text-brand-green tabular-nums">
                  {fmt(secsLeft)}
                </div>
                <div className="text-xs text-black/55 mt-1">
                  {secsLeft === 0 ? 'Done!' : running ? 'Running...' : 'Paused'}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {secsLeft > 0 ? (
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="rounded-full bg-brand-green text-white font-semibold px-4 py-2 text-sm"
                >
                  {running ? 'Pause' : 'Resume'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSecsLeft(totalSecs);
                    setRunning(true);
                  }}
                  className="rounded-full bg-white text-brand-green border border-brand-green/30 font-semibold px-4 py-2 text-sm"
                >
                  Restart timer
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-8 pt-3 grid grid-cols-2 gap-3">
        <button
          onClick={prev}
          disabled={stepIdx === 0}
          className="rounded-2xl bg-white text-brand-green font-semibold py-4 border border-black/10 disabled:opacity-40 active:scale-[0.99]"
        >
          ← Previous
        </button>
        {isLast ? (
          <button
            onClick={() => setRatingOpen(true)}
            className="rounded-2xl bg-brand-orange text-white font-semibold py-4 active:scale-[0.99]"
          >
            ✓ Done Cooking
          </button>
        ) : (
          <button
            onClick={next}
            className="rounded-2xl bg-brand-green text-white font-semibold py-4 active:scale-[0.99]"
          >
            Next →
          </button>
        )}
      </div>

      {ratingOpen && (
        <RatingSheet
          onPick={(rating) => {
            setRatingOpen(false);
            onFinish?.({ rating });
          }}
          onSkip={() => {
            setRatingOpen(false);
            onFinish?.({ rating: null });
          }}
        />
      )}
    </div>
  );
}

function RatingSheet({ onPick, onSkip }) {
  const opts = [
    { id: 'disliked', emoji: '👎', label: 'Kids hated it' },
    { id: 'okay', emoji: '😐', label: 'It was okay' },
    { id: 'loved', emoji: '👍', label: 'Kids loved it!' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onSkip} />
      <div
        className="relative bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-7"
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.15)' }}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />
        <div className="text-lg font-extrabold text-brand-green text-center">
          How did it go?
        </div>
        <div className="text-xs text-black/60 text-center mb-3">
          We'll learn what your family likes.
        </div>
        <div className="grid grid-cols-3 gap-2">
          {opts.map((o) => (
            <button
              key={o.id}
              onClick={() => onPick(o.id)}
              className="bg-brand-cream rounded-2xl p-3 flex flex-col items-center text-center border border-black/5 active:scale-[0.99]"
            >
              <span className="text-3xl">{o.emoji}</span>
              <span className="text-[11px] font-semibold text-brand-green mt-1">
                {o.label}
              </span>
            </button>
          ))}
        </div>
        <button onClick={onSkip} className="w-full mt-3 text-sm text-black/60 font-medium">
          Skip
        </button>
      </div>
    </div>
  );
}

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
