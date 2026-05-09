import { useMemo } from 'react';
import { CheckIcon, PlusIcon } from '../components/icons.jsx';
import { storage } from '../lib/storage.js';

const CATEGORIES = ['Vegetables', 'Dairy', 'Meat', 'Other'];

export default function ShoppingList({ list, onChange }) {
  const items = list?.items || [];

  const grouped = useMemo(() => {
    const g = { Vegetables: [], Dairy: [], Meat: [], Other: [] };
    items.forEach((it, idx) => {
      const cat = CATEGORIES.includes(it.category) ? it.category : 'Other';
      g[cat].push({ ...it, _idx: idx });
    });
    return g;
  }, [items]);

  const checkedCount = items.filter((i) => i.checked).length;

  const toggle = (idx) => {
    const next = items.map((it, i) => (i === idx ? { ...it, checked: !it.checked } : it));
    update(next);
  };

  const clearChecked = () => update(items.filter((i) => !i.checked));

  const update = (nextItems) => {
    const sl = { ...(list || {}), items: nextItems };
    storage.setShoppingList(sl);
    onChange(sl);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div className="text-xl font-extrabold text-brand-green">Shopping List</div>
        <div className="ml-auto w-9 h-9 rounded-full bg-brand-orange text-white flex items-center justify-center">
          <PlusIcon size={18} stroke="#fff" sw={2.5} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 mt-10 text-center text-black/60">
          <div className="text-3xl mb-1">🛒</div>
          <div className="font-medium text-brand-green">Your list is empty.</div>
          <div className="text-sm">Tap "Cook This!" on a recipe to add the missing items.</div>
        </div>
      ) : (
        <div className="px-5 mt-2 space-y-3">
          {CATEGORIES.map((cat) => {
            const rows = grouped[cat];
            if (rows.length === 0) return null;
            return (
              <div key={cat} className="bg-white rounded-2xl overflow-hidden">
                <div className="px-4 py-2 text-sm font-semibold text-brand-green bg-brand-cream/60 flex items-center gap-2">
                  <span>{categoryEmoji(cat)}</span>
                  <span>{cat}</span>
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
                      {it.amount && (
                        <span className="text-xs text-black/50">{it.amount}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-5 mt-5 pb-6">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center">
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
    </div>
  );
}

function categoryEmoji(cat) {
  switch (cat) {
    case 'Vegetables':
      return '🥦';
    case 'Dairy':
      return '🥛';
    case 'Meat':
      return '🍗';
    default:
      return '🧂';
  }
}
