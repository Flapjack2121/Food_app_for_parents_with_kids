const KEYS = {
  profile: 'lh.profile',
  favorites: 'lh.favorites',
  shoppingList: 'lh.shoppingList',
  weekPlan: 'lh.weekPlan',
  lastIngredients: 'lh.lastIngredients',
  ratings: 'lh.ratings',
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

  getWeekPlan: () => read(KEYS.weekPlan, null),
  setWeekPlan: (wp) => write(KEYS.weekPlan, wp),

  getLastIngredients: () => read(KEYS.lastIngredients, []),
  setLastIngredients: (list) => write(KEYS.lastIngredients, list),

  getRatings: () => read(KEYS.ratings, []),
  addRating: (entry) => {
    const list = read(KEYS.ratings, []).filter((r) => r.recipeId !== entry.recipeId);
    list.unshift(entry);
    write(KEYS.ratings, list.slice(0, 50));
  },
};
