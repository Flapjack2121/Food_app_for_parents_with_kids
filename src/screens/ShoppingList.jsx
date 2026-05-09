import { useMemo, useState } from 'react';
import { CheckIcon } from '../components/icons.jsx';
import { storage } from '../lib/storage.js';

const CATEGORIES = [
  { id: 'Vegetables', emoji: '🥦' },
  { id: 'Dairy', emoji: '🥛' },
  { id: 'Meat', emoji: '🥩' },
  { id: 'Pantry', emoji: '🥫' },
  { id: 'Frozen', emoji: '❄️' },
];

export default function ShoppingList({ list, onChange }) {
  const items = list?.items || [];
  const baseServings = list?.baseServings || 4;
  const [servings, setServings] = useState(list?.servings || baseServings);
  const [shareToast, setShareToast] = useState('');

  const grouped = useMemo(() => {
    const g = Object.fromEntries(CATEGORIES.map((c) => [c.id, []]));
    items.forEach((it, idx) => {
      const cat = g[it.category] ? it.category : 'Pantry';
      g[cat].push({ ...it, _idx: idx });
    });
    return g;
  }, [items]);

  const checkedCount = items.filter((i) => i.checked).length;

  const update = (nextItems, nextServings = servings) => {
    const sl = { ...(list || {}), items: nextItems, servings: nextServings, baseServings };
    storage.setShoppingList(sl);
    onChange(sl);
  };

  const toggle = (idx) => {
    const next = items.map((it, i) => (i === idx ? { ...it, checked: !it.checked } : it));
    update(next);
  };

  const clearChecked = () => update(items.filter((i) => !i.checked));

  const setServingsAndScale = (n) => {
    setServings(n);
    update(items, n);
  };

  const shareList = async () => {
    const ratio = servings / baseServings;
    const lines = [`Shopping List${list?.recipeTitle ? ` — ${list.recipeTitle}` : ''}`, ''];
    CATEGORIES.forEach((c) => {
      const rows = grouped[c.id];
      if (rows.length === 0) return;
      lines.push(`${c.emoji} ${c.id}`);
      rows.forEach((r) => {
        const amt = scaleAmount(r.amount, ratio);
        const unit = r.unit ? ` ${r.unit}` : '';
        lines.push(`  ☐ ${r.name}${amt ? ` — ${amt}${unit}` : ''}`);
      });
      lines.push('');
    });
    const text = lines.join('\n').trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Shopping List', text });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      setShareToast('Copied to clipboard!');
      setTimeout(() => setShareToast(''), 2000);
    } catch {
      setShareToast('Could not share — copy below.');
      setTimeout(() => setShareToast(''), 2500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-brand-cream">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div className="text-xl font-extrabold text-brand-green">Shopping List</div>
        <button
          onClick={shareList}
          disabled={items.length === 0}
          className="ml-auto text-sm font-semibold text-white bg-brand-orange px-3 py-1.5 rounded-full disabled:opacity-40"
        >
          Share
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-5 mt-10 text-center text-black/60">
          <div className="text-3xl mb-1">🛒</div>
          <div className="font-medium text-brand-green">Your list is empty.</div>
          <div className="text-sm">
            Tap "Cook This!" on a recipe or build one from your week plan.
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 mt-2">
            <div className="bg-white rounded-2xl px-4 py-3 border border-black/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-green font-semibold">For how many people?</span>
                <span className="font-bold text-brand-green">
                  {servings} {servings === 1 ? 'person' : 'people'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={servings}
                onChange={(e) => setServingsAndScale(Number(e.target.value))}
                className="w-full mt-2 accent-[#2D5016]"
              />
            </div>
          </div>

          <div className="px-5 mt-3 space-y-3">
            {CATEGORIES.map((c) => {
              const rows = grouped[c.id];
              if (rows.length === 0) return null;
              return (
                <div key={c.id} className="bg-white rounded-2xl overflow-hidden border border-black/5">
                  <div className="px-4 py-2 text-sm font-semibold text-brand-green bg-brand-cream/60 flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span>{c.id}</span>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {rows.map((it) => (
                      <li
                        key={it._idx}
                        className="px-4 py-2.5 flex items-center gap-3 cursor-pointer"
                        onClick={() => toggle(it._idx)}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            it.checked ? 'bg-brand-green border-brand-green' : 'border-black/20'
                          }`}
                        >
                          {it.checked && <CheckIcon size={14} stroke="#fff" sw={3} />}
                        </span>
                        <span
                          className={`flex-1 text-sm ${
                            it.checked ? 'line-through text-black/40' : ''
                          }`}
                        >
                          {it.name}
                        </span>
                        {it.amount != null && it.amount !== '' && (
                          <span className="text-xs text-black/55 tabular-nums">
                            {scaleAmount(it.amount, servings / baseServings)}
                            {it.unit ? ` ${it.unit}` : ''}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="px-5 mt-5 pb-6">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center border border-black/5">
          <div className="text-sm text-black/70">
            <span className="font-bold text-brand-green">{checkedCount}</span> of{' '}
            <span className="font-bold text-brand-green">{items.length}</span> items checked
          </div>
          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              className="ml-auto text-sm font-semibold text-brand-orange"
            >
              Clear checked
            </button>
          )}
        </div>
      </div>

      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-green text-white text-sm px-4 py-2 rounded-full shadow-lg z-40">
          {shareToast}
        </div>
      )}
    </div>
  );
}

function scaleAmount(amount, ratio) {
  if (amount == null || amount === '') return '';
  if (typeof amount === 'string') {
    const m = amount.match(/^([\d.]+)/);
    if (!m) return amount;
    const n = Number(m[1]) * ratio;
    return `${prettyNum(n)}${amount.slice(m[1].length)}`;
  }
  return prettyNum(Number(amount) * ratio);
}

function prettyNum(n) {
  if (!isFinite(n)) return '';
  if (n < 1) return Number(n.toFixed(2)).toString();
  if (n < 10) return Number(n.toFixed(1)).toString();
  return Math.round(n).toString();
}
