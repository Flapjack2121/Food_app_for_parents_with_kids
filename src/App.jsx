import { useEffect, useState } from 'react';
import PhoneFrame from './components/PhoneFrame.jsx';
import BottomNav from './components/BottomNav.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Recipe from './screens/Recipe.jsx';
import ShoppingList from './screens/ShoppingList.jsx';
import Favorites from './screens/Favorites.jsx';
import Plan from './screens/Plan.jsx';
import Profile from './screens/Profile.jsx';
import CookMode from './screens/CookMode.jsx';
import { storage, BADGES } from './lib/storage.js';
import { generateRecipes, adjustRecipe, cloneDish } from './api/claude.js';

const CATEGORIES = ['Vegetables', 'Dairy', 'Meat', 'Pantry', 'Frozen'];

export default function App() {
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [tab, setTab] = useState('home');
  const [recipe, setRecipe] = useState(null);
  const [recipeBatch, setRecipeBatch] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recipeQueue, setRecipeQueue] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);
  const [seenTitles, setSeenTitles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => storage.getFavorites());
  const [shoppingList, setShoppingList] = useState(() => storage.getShoppingList());
  const [lastIngredients, setLastIngredients] = useState(() => storage.getLastIngredients());
  const [cookOpen, setCookOpen] = useState(false);

  const [stats, setStats] = useState(() => storage.getStats());
  const [earnedBadges, setEarnedBadges] = useState(() => storage.getBadges());
  const [badgeToast, setBadgeToast] = useState(null);
  const [dailySuggestion, setDailySuggestion] = useState(() => storage.getDailySuggestion());
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (!dailySuggestion) {
      fetchDailySuggestion();
    }
  }, [profile]);

  if (!profile) {
    return (
      <PhoneFrame>
        <Onboarding onDone={() => setProfile(storage.getProfile())} />
      </PhoneFrame>
    );
  }

  async function fetchDailySuggestion() {
    setDailyLoading(true);
    try {
      const list = await generateRecipes({
        ingredients: [],
        profile,
        context: {
          mode: 'normal',
          lovedRecipes: storage.getLovedTitles(),
          dislikedRecipes: storage.getDislikedTitles(),
        },
        count: 1,
      });
      const r = list[0];
      if (r) {
        storage.setDailySuggestion(r);
        setDailySuggestion(r);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDailyLoading(false);
    }
  }

  const refreshSuggestion = () => {
    storage.clearDailySuggestion();
    setDailySuggestion(null);
    fetchDailySuggestion();
  };

  const fetchAndShow = async ({ ingredients = [], context = {} }) => {
    setBusy(true);
    setError(null);
    try {
      if (ingredients.length > 0) {
        storage.setLastIngredients(ingredients);
        setLastIngredients(ingredients);
      }
      if (context?.mode && context.mode !== 'normal') {
        storage.incrementRescue();
      }
      const list = await generateRecipes({
        ingredients,
        profile,
        context: {
          ...context,
          avoidTitles: seenTitles.slice(-6),
          lovedRecipes: storage.getLovedTitles(),
          dislikedRecipes: storage.getDislikedTitles(),
        },
        count: 3,
      });
      if (!list.length) throw new Error('No recipes returned');
      setRecipeBatch(list);
      setActiveIndex(0);
      setRecipe(list[0]);
      setRecipeQueue([]);
      setLastRequest({ ingredients, context });
      setSeenTitles((prev) => [...prev, ...list.map((r) => r.title)]);
      setTab('recipe');
      const used = ingredients.length;
      const have = list[0]?.ingredients?.filter((i) => i.haveIt).length || 0;
      if (used >= 3 && have >= used) {
        storage.incrementNoWaste();
      }
      const fresh = storage.refreshBadges();
      setStats(fresh.stats);
      setEarnedBadges(fresh.earned);
      if (fresh.newly.length > 0) showBadgeToast(fresh.newly[0]);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const showBadgeToast = (id) => {
    const b = BADGES.find((x) => x.id === id);
    if (!b) return;
    setBadgeToast(b);
    try {
      import('canvas-confetti').then((mod) => {
        const fire = mod.default || mod;
        fire({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
    } catch {}
    setTimeout(() => setBadgeToast(null), 4000);
  };

  const nextIdea = async () => {
    if (recipeBatch.length > 0 && activeIndex < recipeBatch.length - 1) {
      const next = activeIndex + 1;
      setActiveIndex(next);
      setRecipe(recipeBatch[next]);
      return;
    }
    const req = lastRequest || { ingredients: [], context: { mode: 'normal' } };
    await fetchAndShow(req);
  };

  const prevIdea = () => {
    if (recipeBatch.length > 0 && activeIndex > 0) {
      const prev = activeIndex - 1;
      setActiveIndex(prev);
      setRecipe(recipeBatch[prev]);
    }
  };

  const swipeRecipe = (dir) => {
    if (dir === 'next') nextIdea();
    else if (dir === 'prev') prevIdea();
  };

  const handleAdjust = async (problem) => {
    if (!recipe) return;
    setAdjusting(true);
    setError(null);
    try {
      const fixed = await adjustRecipe({ recipe, problem, profile });
      setRecipe(fixed);
      setSeenTitles((prev) => [...prev, fixed.title]);
    } catch (e) {
      console.error(e);
      setError(e.message || "Couldn't adjust the recipe.");
    } finally {
      setAdjusting(false);
    }
  };

  const handleClone = async (dishName) => {
    setBusy(true);
    setError(null);
    try {
      const r = await cloneDish({ dishName, profile });
      setRecipe(r);
      setRecipeQueue([]);
      setLastRequest(null);
      setSeenTitles((prev) => [...prev, r.title]);
      setTab('recipe');
    } catch (e) {
      console.error(e);
      setError(e.message || "Couldn't build that clone.");
    } finally {
      setBusy(false);
    }
  };

  const startCooking = () => {
    if (!recipe) return;
    const items = (recipe.missingIngredients || []).map((it) => ({ ...it, checked: false }));
    if (items.length > 0) {
      const sl = {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        items,
        baseServings: recipe.servings || 4,
        servings: recipe.servings || 4,
      };
      storage.setShoppingList(sl);
      setShoppingList(sl);
    }
    setCookOpen(true);
  };

  const finishCooking = ({ rating }) => {
    if (recipe) {
      storage.recordCook(recipe);
      if (rating) {
        storage.addRating({ recipeId: recipe.id, title: recipe.title, rating });
      }
      const { earned, newly, stats: nextStats } = storage.refreshBadges();
      setStats(nextStats);
      setEarnedBadges(earned);
      if (newly.length > 0) showBadgeToast(newly[0]);
    }
    setCookOpen(false);
  };

  const buildShoppingFromPlan = (recipes) => {
    const items = [];
    const seen = new Set();
    recipes.forEach((r) => {
      (r.missingIngredients || []).forEach((it) => {
        const key = `${(it.name || '').toLowerCase()}|${it.unit || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          name: it.name,
          amount: it.amount ?? '',
          unit: it.unit || '',
          category: CATEGORIES.includes(it.category) ? it.category : 'Pantry',
          checked: false,
        });
      });
    });
    const sl = {
      recipeId: 'week',
      recipeTitle: 'Week plan',
      items,
      baseServings: recipes[0]?.servings || 4,
      servings: recipes[0]?.servings || 4,
    };
    storage.setShoppingList(sl);
    setShoppingList(sl);
    if (recipes.length >= 7) {
      storage.markWeekPlanCompleted();
      const { earned, newly } = storage.refreshBadges();
      setEarnedBadges(earned);
      if (newly.length > 0) showBadgeToast(newly[0]);
    }
    setTab('list');
  };

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1 min-h-0">
        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-100">
            {error}
          </div>
        )}

        {tab === 'home' && (
          <Home
            profile={profile}
            lastIngredients={lastIngredients}
            stats={stats}
            earnedBadges={earnedBadges}
            dailySuggestion={dailySuggestion}
            dailySuggestionLoading={dailyLoading}
            onRefreshSuggestion={refreshSuggestion}
            onOpenSuggestion={(r) => {
              setRecipe(r);
              setRecipeQueue([]);
              setLastRequest(null);
              setTab('recipe');
            }}
            onClone={handleClone}
            onFind={fetchAndShow}
            busy={busy}
          />
        )}

        {tab === 'plan' && (
          <Plan
            profile={profile}
            onOpenRecipe={(r) => {
              setRecipe(r);
              setRecipeQueue([]);
              setTab('recipe');
            }}
            onBuildShoppingList={buildShoppingFromPlan}
          />
        )}

        {tab === 'recipe' && (
          <Recipe
            recipe={recipe}
            recipes={recipeBatch}
            activeIndex={activeIndex}
            onSwipe={swipeRecipe}
            onCook={startCooking}
            onNext={nextIdea}
            onPrev={prevIdea}
            onBack={() => setTab('home')}
            onAdjust={handleAdjust}
            busy={busy}
            adjusting={adjusting}
          />
        )}

        {tab === 'list' && (
          <ShoppingList
            list={shoppingList}
            onChange={setShoppingList}
            onNavigate={setTab}
          />
        )}

        {tab === 'favorites' && (
          <Favorites
            favorites={favorites}
            onOpen={(r) => {
              setRecipe(r);
              setRecipeQueue([]);
              setTab('recipe');
            }}
          />
        )}

        {tab === 'profile' && (
          <Profile
            profile={profile}
            stats={stats}
            earnedBadges={earnedBadges}
            favorites={favorites}
            onEditProfile={() => setProfile(null)}
            onOpenRecipe={(r) => {
              setRecipe(r);
              setRecipeBatch([]);
              setActiveIndex(0);
              setTab('recipe');
            }}
            onResetAll={() => {
              setProfile(null);
              setFavorites([]);
              setShoppingList(null);
              setLastIngredients([]);
              setStats(storage.getStats());
              setEarnedBadges([]);
              setDailySuggestion(null);
              setTab('home');
            }}
          />
        )}

        <BottomNav
          active={tab === 'recipe' ? 'home' : tab}
          onChange={(next) => {
            if (next === 'favorites') setFavorites(storage.getFavorites());
            if (next === 'profile') {
              setStats(storage.getStats());
              setEarnedBadges(storage.getBadges());
              setFavorites(storage.getFavorites());
            }
            setTab(next);
          }}
        />

        {cookOpen && recipe && (
          <CookMode
            recipe={recipe}
            onClose={() => setCookOpen(false)}
            onFinish={finishCooking}
          />
        )}

        {badgeToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-brand-green text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-[fadeIn_0.3s]">
            <div className="text-2xl">{badgeToast.emoji}</div>
            <div>
              <div className="text-xs font-semibold opacity-80">Badge unlocked!</div>
              <div className="text-sm font-bold">{badgeToast.name}</div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
