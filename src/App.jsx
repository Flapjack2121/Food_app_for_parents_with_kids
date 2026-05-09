import { useState } from 'react';
import PhoneFrame from './components/PhoneFrame.jsx';
import BottomNav from './components/BottomNav.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Recipe from './screens/Recipe.jsx';
import ShoppingList from './screens/ShoppingList.jsx';
import Favorites from './screens/Favorites.jsx';
import Plan from './screens/Plan.jsx';
import CookMode from './screens/CookMode.jsx';
import { storage } from './lib/storage.js';
import { generateRecipes, adjustRecipe } from './api/claude.js';

const CATEGORIES = ['Vegetables', 'Dairy', 'Meat', 'Pantry', 'Frozen'];

export default function App() {
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [tab, setTab] = useState('home');
  const [recipe, setRecipe] = useState(null);
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

  if (!profile) {
    return (
      <PhoneFrame>
        <Onboarding onDone={() => setProfile(storage.getProfile())} />
      </PhoneFrame>
    );
  }

  const fetchAndShow = async ({ ingredients = [], context = {} }) => {
    setBusy(true);
    setError(null);
    try {
      if (ingredients.length > 0) {
        storage.setLastIngredients(ingredients);
        setLastIngredients(ingredients);
      }
      const list = await generateRecipes({
        ingredients,
        profile,
        context: { ...context, avoidTitles: seenTitles.slice(-6) },
        count: 3,
      });
      if (!list.length) throw new Error('No recipes returned');
      const [first, ...rest] = list;
      setRecipe(first);
      setRecipeQueue(rest);
      setLastRequest({ ingredients, context });
      setSeenTitles((prev) => [...prev, ...list.map((r) => r.title)]);
      setTab('recipe');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const nextIdea = async () => {
    if (recipeQueue.length > 0) {
      const [next, ...rest] = recipeQueue;
      setRecipe(next);
      setRecipeQueue(rest);
      return;
    }
    const req = lastRequest || { ingredients: [], context: { mode: 'normal' } };
    await fetchAndShow(req);
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
            onCook={startCooking}
            onNext={nextIdea}
            onBack={() => setTab('home')}
            onAdjust={handleAdjust}
            busy={busy}
            adjusting={adjusting}
          />
        )}

        {tab === 'list' && <ShoppingList list={shoppingList} onChange={setShoppingList} />}

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

        <BottomNav
          active={tab === 'recipe' ? 'home' : tab}
          onChange={(next) => {
            if (next === 'favorites') setFavorites(storage.getFavorites());
            setTab(next);
          }}
        />

        {cookOpen && recipe && (
          <CookMode recipe={recipe} onClose={() => setCookOpen(false)} />
        )}
      </div>
    </PhoneFrame>
  );
}
