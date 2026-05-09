import { HomeIcon, ChefIcon, BasketIcon, HeartIcon } from './icons.jsx';

const tabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'plan', label: 'Plan', Icon: ChefIcon },
  { id: 'list', label: 'List', Icon: BasketIcon },
  { id: 'favorites', label: 'Favorites', Icon: HeartIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 pointer-events-none">
      <nav
        className="pointer-events-auto rounded-2xl px-2 py-2 flex backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 24px rgba(45,80,22,0.10), 0 1px 4px rgba(0,0,0,0.05)',
          border: '1px solid rgba(45,80,22,0.06)',
        }}
      >
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 relative flex flex-col items-center gap-0.5 py-1 select-none transition-all"
              style={{
                color: isActive ? '#2D5016' : '#7c8378',
              }}
            >
              {isActive && (
                <span
                  className="absolute inset-0 -m-0.5 rounded-xl"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(45,80,22,0.10) 0%, rgba(45,80,22,0.04) 100%)',
                  }}
                />
              )}
              <span className="relative flex items-center justify-center mt-0.5">
                <Icon
                  size={22}
                  stroke={isActive ? '#2D5016' : '#94978f'}
                  fill={isActive && id === 'favorites' ? '#2D5016' : 'none'}
                />
              </span>
              <span className="relative text-[10.5px] font-semibold tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
