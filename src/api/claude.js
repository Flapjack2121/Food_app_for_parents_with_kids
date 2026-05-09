import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

function getClient() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

function buildPrompt({ ingredients, profile, mode, avoidTitles = [] }) {
  const kids = (profile?.kids || [])
    .map((k, i) => `Kid ${i + 1}: age ${k.age}${k.picky ? ', picky eater' : ''}`)
    .join('; ');
  const allergies = (profile?.allergies || []).join(', ') || 'none';
  const lazy = mode === 'lazy';
  const onHand = ingredients.length > 0 ? ingredients.join(', ') : 'unspecified — surprise me with a kid-friendly classic';
  const avoidLine =
    avoidTitles.length > 0
      ? `\n- Suggest something DIFFERENT from these recently shown dishes: ${avoidTitles.join(', ')}.`
      : '';

  return `You are a warm, practical home-cooking helper for parents.

Suggest ONE specific, real, named dish (e.g. "Chicken Fried Rice", "Cheesy Broccoli Pasta Bake", "Sheet-Pan Chicken Fajitas", "Spaghetti Bolognese", "Tomato Egg-Drop Noodles"). Never invent generic combos like "carrots with cheese" or "pasta and milk".

Family profile:
- Kids: ${kids || 'unspecified'}
- Allergies (must avoid): ${allergies}
- Mode: ${lazy ? 'LAZY (max 10 min total time, max 4 ingredients total)' : 'normal weeknight'}

Ingredients on hand: ${onHand}

Hard rules:
- The dish must be a recognizable real recipe, balanced and complete (a starch / protein / veg where possible). NEVER suggest two random items as a "dish".
- Use as many of the on-hand ingredients as you sensibly can; assume the cook also has pantry basics (oil, salt, pepper, water, common spices). Anything else needed goes in "missingIngredients".
- Strictly avoid every listed allergy ingredient and obvious derivatives (e.g. dairy → no butter/yogurt/cream).
- Make it appeal to kids of the listed ages — mild, familiar flavors, fun to eat.
- ${lazy ? 'TOTAL ingredients ≤ 4, prepTime under 10 min, no oven, minimal chopping.' : 'Weeknight friendly (≤ 30 min). 6–10 ingredients max.'}
- "imageQuery": 1–3 lowercase keywords describing the finished dish for an image search (e.g. "chicken fried rice").${avoidLine}

Return ONLY valid JSON (no prose, no markdown fences) matching this schema exactly:
{
  "title": string,
  "description": string,
  "prepTime": string,
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Hard",
  "kidFriendly": boolean,
  "imageQuery": string,
  "ingredients": [{ "name": string, "amount": string, "category": "Vegetables" | "Dairy" | "Meat" | "Other" }],
  "steps": [string],
  "missingIngredients": [{ "name": string, "amount": string, "category": "Vegetables" | "Dairy" | "Meat" | "Other" }]
}`;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON object found in response');
  return JSON.parse(raw.slice(start, end + 1));
}

const MOCK_DISHES = {
  normal: [
    {
      title: 'One-Pan Chicken Fried Rice',
      description:
        'A colorful, fast fried rice the whole table will fight over. Mild, soft-cooked egg and tender chicken make it a kid winner.',
      prepTime: '20 min',
      servings: 4,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'chicken fried rice',
      ingredients: [
        { name: 'Cooked rice', amount: '3 cups', category: 'Other' },
        { name: 'Chicken breast', amount: '2, diced', category: 'Meat' },
        { name: 'Eggs', amount: '2', category: 'Dairy' },
        { name: 'Frozen peas & carrots', amount: '1 cup', category: 'Vegetables' },
        { name: 'Soy sauce', amount: '2 tbsp', category: 'Other' },
        { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' },
        { name: 'Sesame oil', amount: '1 tsp', category: 'Other' },
      ],
      steps: [
        'Heat a wide pan over medium-high. Cook the chicken with a pinch of salt until golden, then set aside.',
        'Push to one side, scramble the eggs in the empty space, then mix with the chicken.',
        'Add garlic, peas & carrots; stir 1 minute.',
        'Add cold rice, soy sauce, and sesame oil. Toss until everything is hot and glossy.',
        'Taste, salt if needed, serve.',
      ],
    },
    {
      title: 'Cheesy Tomato Pasta Bake',
      description:
        'A bubbly, golden pasta bake with a sweet tomato sauce and a melted cheese top. Picky-eater approved every time.',
      prepTime: '25 min',
      servings: 4,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'cheesy tomato pasta bake',
      ingredients: [
        { name: 'Pasta (penne)', amount: '300 g', category: 'Other' },
        { name: 'Tomato passata', amount: '500 g', category: 'Vegetables' },
        { name: 'Mozzarella', amount: '150 g', category: 'Dairy' },
        { name: 'Parmesan', amount: '30 g', category: 'Dairy' },
        { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' },
        { name: 'Olive oil', amount: '1 tbsp', category: 'Other' },
      ],
      steps: [
        'Boil the pasta 2 minutes shy of the box time, then drain.',
        'Sweat garlic in olive oil, pour in passata, simmer 5 min, season.',
        'Stir pasta into sauce; tip into a baking dish.',
        'Top with both cheeses; bake 200 °C / 400 °F for 12 min until golden.',
      ],
    },
    {
      title: 'Sheet-Pan Honey-Soy Chicken & Broccoli',
      description:
        "Sticky, sweet, and salty — kids dunk it; you skip the dishes. One pan, 25 minutes, gone in 10.",
      prepTime: '25 min',
      servings: 4,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'sheet pan honey soy chicken broccoli',
      ingredients: [
        { name: 'Chicken thighs (boneless)', amount: '500 g', category: 'Meat' },
        { name: 'Broccoli', amount: '1 head', category: 'Vegetables' },
        { name: 'Honey', amount: '2 tbsp', category: 'Other' },
        { name: 'Soy sauce', amount: '2 tbsp', category: 'Other' },
        { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' },
        { name: 'Olive oil', amount: '1 tbsp', category: 'Other' },
      ],
      steps: [
        'Heat oven to 220 °C / 425 °F.',
        'Whisk honey, soy, grated garlic, oil. Toss with chicken and broccoli on a sheet pan.',
        'Roast 18–20 min, flipping halfway, until chicken is cooked and broccoli edges are crisp.',
        'Serve over rice with extra pan sauce.',
      ],
    },
    {
      title: 'Mini Margherita Pita Pizzas',
      description:
        'Each kid gets their own pizza in 12 minutes. Crisp pita base, bright tomato sauce, melty cheese.',
      prepTime: '15 min',
      servings: 4,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'mini margherita pita pizza',
      ingredients: [
        { name: 'Pita breads', amount: '4', category: 'Other' },
        { name: 'Tomato sauce', amount: '½ cup', category: 'Vegetables' },
        { name: 'Mozzarella', amount: '150 g', category: 'Dairy' },
        { name: 'Olive oil', amount: '1 tbsp', category: 'Other' },
        { name: 'Dried oregano', amount: '½ tsp', category: 'Other' },
      ],
      steps: [
        'Heat oven to 220 °C / 425 °F.',
        'Brush pitas lightly with oil. Spread tomato sauce, scatter cheese, sprinkle oregano.',
        'Bake 8–10 min until cheese bubbles. Slice into wedges.',
      ],
    },
  ],
  lazy: [
    {
      title: 'Quick Cheesy Scrambled Egg Toast',
      description:
        'Soft, cheesy scrambled eggs on toast — the 5-minute meal kids actually finish.',
      prepTime: '7 min',
      servings: 2,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'cheesy scrambled egg toast',
      ingredients: [
        { name: 'Eggs', amount: '4', category: 'Dairy' },
        { name: 'Cheddar', amount: '40 g', category: 'Dairy' },
        { name: 'Bread', amount: '4 slices', category: 'Other' },
        { name: 'Butter', amount: '1 tbsp', category: 'Dairy' },
      ],
      steps: [
        'Toast the bread.',
        'Beat eggs with a pinch of salt. Melt butter on low, pour in eggs, stir gently.',
        'When almost set, fold in grated cheese; pile onto toast.',
      ],
    },
    {
      title: '10-Minute Tomato Pasta',
      description:
        'A bowl of saucy buttered tomato pasta — done in the time it takes to set the table.',
      prepTime: '10 min',
      servings: 4,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'tomato butter pasta',
      ingredients: [
        { name: 'Pasta', amount: '300 g', category: 'Other' },
        { name: 'Tomato passata', amount: '300 g', category: 'Vegetables' },
        { name: 'Butter', amount: '2 tbsp', category: 'Dairy' },
        { name: 'Parmesan', amount: '30 g', category: 'Dairy' },
      ],
      steps: [
        'Boil the pasta in salted water.',
        'Warm passata with butter and a pinch of salt.',
        'Drain pasta, toss with sauce, finish with parmesan.',
      ],
    },
    {
      title: 'Microwave Cheesy Rice Bowl',
      description:
        'Hot rice, melted cheese, a soft fried egg on top — comfort food in 8 minutes.',
      prepTime: '8 min',
      servings: 2,
      difficulty: 'Easy',
      kidFriendly: true,
      imageQuery: 'cheesy rice bowl egg',
      ingredients: [
        { name: 'Cooked rice', amount: '2 cups', category: 'Other' },
        { name: 'Cheddar', amount: '50 g', category: 'Dairy' },
        { name: 'Eggs', amount: '2', category: 'Dairy' },
        { name: 'Butter', amount: '1 tbsp', category: 'Dairy' },
      ],
      steps: [
        'Warm rice in the microwave with a splash of water.',
        'Stir in grated cheddar until melted.',
        'Fry eggs softly in butter; slide on top of the bowls.',
      ],
    },
  ],
};

function pickMock(mode, avoidTitles = []) {
  const list = MOCK_DISHES[mode === 'lazy' ? 'lazy' : 'normal'];
  const filtered = list.filter((d) => !avoidTitles.includes(d.title));
  const pool = filtered.length ? filtered : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

function withMissing(recipe, ingredients) {
  const have = new Set(ingredients.map((s) => s.toLowerCase().trim()));
  const missing = recipe.ingredients.filter((it) => {
    const n = it.name.toLowerCase();
    for (const h of have) {
      if (h && (n.includes(h) || h.includes(n))) return false;
    }
    return true;
  });
  return { ...recipe, missingIngredients: missing };
}

export function imageUrlFor(query, seed = 1) {
  const q = encodeURIComponent((query || 'food').trim().replace(/\s+/g, ','));
  return `https://loremflickr.com/640/420/${q},food?lock=${seed}`;
}

export async function generateRecipe({ ingredients, profile, mode, avoidTitles = [] }) {
  const client = getClient();
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!client) {
    const base = pickMock(mode, avoidTitles);
    const finished = withMissing(base, ingredients);
    return { ...finished, id, _mock: true };
  }

  const prompt = buildPrompt({ ingredients, profile, mode, avoidTitles });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const parsed = extractJson(text);
  if (!parsed.imageQuery) parsed.imageQuery = parsed.title || 'food';
  return { ...parsed, id };
}
