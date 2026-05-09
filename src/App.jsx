import { useState } from 'react';
import PhoneFrame from './components/PhoneFrame.jsx';
import BottomNav from './components/BottomNav.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Recipe from './screens/Recipe.jsx';
import ShoppingList from './screens/ShoppingList.jsx';
import Favorites from './screens/Favorites.jsx';
import { storage } from './lib/storage.js';
import { generateRecipe } from './api/claude.js';

export default function App() {
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [tab, setTab] = useState('home');
  const [recipe, setRecipe] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [seenTitles, setSeenTitles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => storage.getFavorites());
  const [shoppingList, setShoppingList] = useState(() => storage.getShoppingList());

  if (!profile) {
    return (
      <PhoneFrame>
        <Onboarding onDone={() => setProfile(storage.getProfile())} />
      </PhoneFrame>
    );
  }

  const fetchRecipe = async (req, { append = false } = {}) => {
    setBusy(true);
    setError(null);
    try {
      const avoid = append ? seenTitles.slice(-4) : [];
      const r = await generateRecipe({ ...req, profile, avoidTitles: avoid });
      setRecipe(r);
      setLastRequest(req);
      setSeenTitles((prev) => (append ? [...prev, r.title] : [r.title]));
      setTab('recipe');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const nextIdea = () => {
    const req = lastRequest || { ingredients: [], mode: 'normal' };
    fetchRecipe(req, { append: true });
  };

  const cookThis = () => {
    if (!recipe) return;
    const items = (recipe.missingIngredients || []).map((it) => ({ ...it, checked: false }));
    const sl = { recipeId: recipe.id, recipeTitle: recipe.title, items };
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
          <Home profile={profile} onFind={(req) => fetchRecipe(req)} busy={busy} />
        )}

        {tab === 'recipe' && (
          <Recipe
            recipe={recipe}
            onCook={cookThis}
            onNext={nextIdea}
            onBack={() => setTab('home')}
            busy={busy}
          />
        )}

        {tab === 'list' && (
          <ShoppingList list={shoppingList} onChange={setShoppingList} />
        )}

        {tab === 'favorites' && (
          <Favorites
            favorites={favorites}
            onOpen={(r) => {
              setRecipe(r);
              setTab('recipe');
            }}
          />
        )}

        <BottomNav
          active={tab}
          onChange={(next) => {
            if (next === 'favorites') setFavorites(storage.getFavorites());
            setTab(next);
          }}
        />
      </div>
    </PhoneFrame>
  );
}
