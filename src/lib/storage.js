const KEYS = {
  profile: 'lh.profile',
  favorites: 'lh.favorites',
  shoppingList: 'lh.shoppingList',
  weekPlan: 'lh.weekPlan',
  lastIngredients: 'lh.lastIngredients',
  ratings: 'lh.ratings',
  cookHistory: 'lh.cookHistory',
  badges: 'lh.badges',
  dailySuggestion: 'lh.dailySuggestion',
  weekPlanCompleted: 'lh.weekPlanCompleted',
};

export const BADGES = [
  { id: 'first', emoji: '🍳', name: 'First Recipe', desc: 'Cook your first recipe' },
  { id: 'planner', emoji: '📅', name: 'Planner', desc: 'Build a full 7-day plan' },
  { id: 'fire', emoji: '🔥', name: 'On Fire', desc: '7-day cooking streak' },
  { id: 'familyChef', emoji: '⭐', name: 'Family Chef', desc: 'Cook 10 recipes' },
  { id: 'mealPrepPro', emoji: '💪', name: 'Meal Prep Pro', desc: 'Cook 20 recipes' },
];

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

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function computeStreak(history) {
  const dates = new Set(history.map((h) => h.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (dates.has(daysAgoISO(i))) streak++;
    else if (i === 0 && dates.has(daysAgoISO(1))) {
      continue;
    } else break;
  }
  return streak;
}

function evalBadges(stats) {
  const earned = [];
  if (stats.totalCooked >= 1) earned.push('first');
  if (stats.weekPlanCompleted) earned.push('planner');
  if (stats.streak >= 7) earned.push('fire');
  if (stats.totalCooked >= 10) earned.push('familyChef');
  if (stats.totalCooked >= 20) earned.push('mealPrepPro');
  return earned;
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
    list.unshift({ ...entry, date: todayISO() });
    write(KEYS.ratings, list.slice(0, 60));
  },
  getLovedTitles: (n = 5) =>
    read(KEYS.ratings, [])
      .filter((r) => r.rating === 'loved')
      .slice(0, n)
      .map((r) => r.title),
  getDislikedTitles: (n = 5) =>
    read(KEYS.ratings, [])
      .filter((r) => r.rating === 'disliked')
      .slice(0, n)
      .map((r) => r.title),

  getCookHistory: () => read(KEYS.cookHistory, []),
  recordCook: (recipe) => {
    const list = read(KEYS.cookHistory, []);
    list.unshift({ id: recipe.id, title: recipe.title, date: todayISO() });
    write(KEYS.cookHistory, list.slice(0, 200));
    return list;
  },

  markWeekPlanCompleted: () => write(KEYS.weekPlanCompleted, true),
  getWeekPlanCompleted: () => read(KEYS.weekPlanCompleted, false),

  getStats: () => {
    const history = read(KEYS.cookHistory, []);
    return {
      totalCooked: history.length,
      streak: computeStreak(history),
      weekPlanCompleted: read(KEYS.weekPlanCompleted, false),
    };
  },

  getBadges: () => read(KEYS.badges, []),
  refreshBadges: () => {
    const stats = storage.getStats();
    const earned = evalBadges(stats);
    const prev = read(KEYS.badges, []);
    const newly = earned.filter((id) => !prev.includes(id));
    write(KEYS.badges, earned);
    return { earned, newly, stats };
  },

  getDailySuggestion: () => {
    const cached = read(KEYS.dailySuggestion, null);
    if (!cached) return null;
    if (cached.date !== todayISO()) return null;
    return cached.recipe;
  },
  setDailySuggestion: (recipe) =>
    write(KEYS.dailySuggestion, { date: todayISO(), recipe }),
  clearDailySuggestion: () => localStorage.removeItem(KEYS.dailySuggestion),
};
