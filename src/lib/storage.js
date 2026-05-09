const KEYS = {
  profile: 'lh.profile',
  favorites: 'lh.favorites',
  shoppingList: 'lh.shoppingList',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getProfile: () => read(KEYS.profile, null),
  setProfile: (p) => write(KEYS.profile, p),

  getFavorites: () => read(KEYS.favorites, []),
  setFavorites: (list) => write(KEYS.favorites, list),
  toggleFavorite: (recipe) => {
    const list = read(KEYS.favorites, []);
    const idx = list.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(recipe);
    write(KEYS.favorites, list);
    return list;
  },
  isFavorite: (id) => read(KEYS.favorites, []).some((r) => r.id === id),

  getShoppingList: () => read(KEYS.shoppingList, null),
  setShoppingList: (sl) => write(KEYS.shoppingList, sl),
};

export const KEYS_INTERNAL = KEYS;
