import { ClockIcon, HeartIcon } from '../components/icons.jsx';

const FOOD_EMOJI = {
  pasta: '🍝',
  rice: '🍚',
  chicken: '🍗',
  egg: '🍳',
  eggs: '🍳',
  salad: '🥗',
  soup: '🍲',
  pizza: '🍕',
  taco: '🌮',
  burger: '🍔',
  sandwich: '🥪',
  pancake: '🥞',
  fish: '🐟',
  noodle: '🍜',
};
function emojiFor(title = '') {
  const t = title.toLowerCase();
  for (const k of Object.keys(FOOD_EMOJI)) if (t.includes(k)) return FOOD_EMOJI[k];
  return '🍽️';
}

export default function Favorites({ favorites, onOpen }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-12 pb-2 flex items-center">
        <div className="text-xl font-extrabold text-brand-green">Favorites</div>
        <HeartIcon size={20} stroke="#E8610A" filled />
      </div>

      {favorites.length === 0 ? (
        <div className="px-5 mt-10 text-center text-black/60">
          <div className="text-3xl mb-1">💚</div>
          <div className="font-medium text-brand-green">No favorites yet.</div>
          <div className="text-sm">Tap the heart on a recipe to save it here.</div>
        </div>
      ) : (
        <div className="px-5 mt-2 grid grid-cols-2 gap-3 pb-8">
          {favorites.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r)}
              className="bg-white rounded-2xl overflow-hidden text-left border border-black/5"
            >
              <div
                className="h-24 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #fde7c8 0%, #f5d6a8 60%, #e9bb7a 100%)',
                }}
              >
                <span className="text-4xl">{emojiFor(r.title)}</span>
              </div>
              <div className="p-2.5">
                <div className="text-sm font-semibold text-brand-green leading-tight line-clamp-2">
                  {r.title}
                </div>
                <div className="text-[11px] text-black/60 mt-1 flex items-center gap-1">
                  <ClockIcon size={12} stroke="#E8610A" />
                  {r.prepTime}
                  {r.kidFriendly && (
                    <span className="ml-auto text-[10px] text-brand-green font-semibold">
                      Kid-friendly
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
