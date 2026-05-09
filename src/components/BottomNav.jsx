import { HomeIcon, ChefIcon, BasketIcon, HeartIcon } from './icons.jsx';

const tabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'plan', label: 'Plan', Icon: ChefIcon },
  { id: 'list', label: 'List', Icon: BasketIcon },
  { id: 'favorites', label: 'Favorites', Icon: HeartIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-black/5 px-2 pt-2 pb-3 z-30">
      <div className="grid grid-cols-4">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-1 py-1 select-none"
            >
              <Icon
                size={22}
                stroke={isActive ? '#2D5016' : '#7c7c7c'}
                fill={isActive && id === 'favorites' ? '#2D5016' : 'none'}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? '#2D5016' : '#7c7c7c' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
