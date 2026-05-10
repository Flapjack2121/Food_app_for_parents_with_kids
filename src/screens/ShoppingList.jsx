import { useMemo, useState } from 'react';
import { CheckIcon } from '../components/icons.jsx';
import { storage } from '../lib/storage.js';

const CATEGORIES = [
  { id: 'Vegetables', emoji: '🥦', color: '#5B8E3E' },
  { id: 'Dairy', emoji: '🥛', color: '#7BA7C6' },
  { id: 'Meat', emoji: '🥩', color: '#C25A4F' },
  { id: 'Pantry', emoji: '🥫', color: '#D8A24F' },
  { id: 'Frozen', emoji: '❄️', color: '#7DB8D9' },
];

export default function ShoppingList({ list, onChange, onNavigate }) {
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
      setShareToast('Could not share.');
      setTimeout(() => setShareToast(''), 2500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div>
          <div className="text-2xl font-extrabold text-brand-green tracking-tight">
            Shopping List
          </div>
          <div className="text-[11px] text-brand-green/60 font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'} · {checkedCount} checked
          </div>
        </div>
        <button
          onClick={shareList}
          disabled={items.length === 0}
          className="ml-auto btn-orange text-sm font-bold text-white px-4 py-2 rounded-full disabled:opacity-40"
        >
          Share
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-5 mt-10 text-center">
          <div className="text-[64px] leading-none mb-4 select-none" aria-hidden>
            🛒
          </div>
          <div className="text-xl font-extrabold text-brand-green">Your list is empty</div>
          <div className="text-sm text-black/60 mt-2 max-w-[280px] mx-auto leading-snug">
            Cook a recipe or plan your week to build your shopping list automatically
          </div>
          <div className="mt-6 space-y-2.5 max-w-[280px] mx-auto">
            <button
              onClick={() => onNavigate?.('home')}
              className="w-full rounded-xl bg-brand-green text-white font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              style={{ height: 48 }}
            >
              → Find a Recipe
            </button>
            <button
              onClick={() => onNavigate?.('plan')}
              className="w-full rounded-xl bg-transparent text-brand-green font-bold border-2 border-brand-green flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              style={{ height: 48 }}
            >
              → Plan my Week
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 mt-3">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-soft">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-green font-bold">For how many people?</span>
                <span className="font-extrabold text-brand-green text-base tabular-nums">
                  {servings}
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

          <div className="px-5 mt-3 space-y-3 pb-24">
            {CATEGORIES.map((c) => {
              const rows = grouped[c.id];
              if (rows.length === 0) return null;
              return (
                <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-soft">
                  <div
                    className="px-4 py-2.5 text-sm font-bold flex items-center gap-2"
                    style={{ background: `${c.color}15`, color: c.color }}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.id}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider opacity-70">
                      {rows.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {rows.map((it) => (
                      <li
                        key={it._idx}
                        className="px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-black/5 transition-colors"
                        onClick={() => toggle(it._idx)}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            it.checked
                              ? 'bg-brand-green'
                              : 'bg-white ring-1 ring-black/15'
                          }`}
                        >
                          {it.checked && <CheckIcon size={14} stroke="#fff" sw={3} />}
                        </span>
                        <span
                          className={`flex-1 text-sm ${
                            it.checked ? 'line-through text-black/35' : 'font-medium'
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

            {checkedCount > 0 && (
              <button
                onClick={clearChecked}
                className="w-full text-sm font-bold text-brand-orange bg-white rounded-2xl py-3 shadow-soft"
              >
                Clear {checkedCount} checked {checkedCount === 1 ? 'item' : 'items'}
              </button>
            )}
          </div>
        </>
      )}

      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-brand-green text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg z-40 animate-fade-in-up">
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
