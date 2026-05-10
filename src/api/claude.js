import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';
const CATEGORIES = ['Vegetables', 'Dairy', 'Meat', 'Pantry', 'Frozen'];

function getClient() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

export function imageUrlFor(query, seed = 1) {
  const cleaned = (query || 'food').trim().replace(/\s+/g, ' ');
  const prompt = `professional food photography of ${cleaned}, plated, top-down view, soft natural lighting, appetising, restaurant quality, no text`;
  const safeSeed = Math.abs(Number(seed) || 1) % 999983;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=640&height=420&seed=${safeSeed}&nologo=true`;
}

const RESCUE_LIMITS = {
  quick: { time: 15, ingredients: 99, label: 'Quick (≤15 min)' },
  'very-quick': { time: 10, ingredients: 4, label: 'Very Quick (≤10 min, ≤4 ingr)' },
  emergency: { time: 5, ingredients: 4, label: 'Emergency (≤5 min, no shopping)' },
};

function profileBlock(profile) {
  const kids = (profile?.children || profile?.kids || [])
    .map(
      (c, i) =>
        `${c.name || `Kid ${i + 1}`} (age ${c.age}${
          c.pickyEater || c.picky ? ', picky eater' : ''
        })`
    )
    .join(', ');
  const allergies = (profile?.allergies || []).join(', ') || 'none';
  const skill = profile?.cookingSkill || 'comfortable';
  return `- Parent: ${profile?.parentName || profile?.name || 'parent'}
- Children: ${kids || 'unspecified'}
- Allergies/restrictions: ${allergies}
- Cooking skill: ${skill}`;
}

function contextBlock(context = {}) {
  const lines = [];
  if (context.time) lines.push(`- Available time: ${context.time} minutes`);
  if (context.energy) lines.push(`- Energy level: ${context.energy}`);
  if (context.mode && context.mode !== 'normal')
    lines.push(`- Mode: ${context.mode}${RESCUE_LIMITS[context.mode] ? ` (${RESCUE_LIMITS[context.mode].label})` : ''}`);
  if (context.lovedRecipes?.length)
    lines.push(`- Family loved recently: ${context.lovedRecipes.join(', ')}`);
  if (context.dislikedRecipes?.length)
    lines.push(`- Family disliked recently: ${context.dislikedRecipes.join(', ')}`);
  if (context.avoidTitles?.length)
    lines.push(`- Avoid suggesting again: ${context.avoidTitles.join(', ')}`);
  return lines.length ? lines.join('\n') : '- (none)';
}

function jsonShape() {
  return `{
  "recipes": [
    {
      "id": "string",
      "title": "string",
      "description": "one short sentence",
      "prepTime": number,
      "servings": number,
      "difficulty": "Easy" | "Medium" | "Hard",
      "kidFriendly": boolean,
      "kidFriendlyReason": "short explanation (e.g. 'Soft texture, mild flavor')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "imageQuery": "1-3 lowercase keywords for an image search",
      "ingredients": [
        { "name": "string", "amount": number, "unit": "string", "category": "Vegetables|Dairy|Meat|Pantry|Frozen", "haveIt": boolean }
      ],
      "missingIngredients": ["string"],
      "steps": [
        { "stepNumber": number, "instruction": "string", "timerSeconds": number }
      ],
      "tags": ["string"]
    }
  ]
}`;
}

function buildBatchPrompt({ ingredients, profile, context, count = 3 }) {
  const lazy = context?.mode === 'very-quick' || context?.mode === 'emergency';
  const onHand = ingredients.length > 0 ? ingredients.join(', ') : 'unspecified — pantry basics only';
  return `You are a family cooking assistant for parents with young children.

Family profile:
${profileBlock(profile)}

Today's context:
${contextBlock(context)}

Available ingredients: ${onHand}

Suggest ${count} DIFFERENT real, named, recognisable dishes (e.g. "Chicken Fried Rice", "Cheesy Tomato Pasta Bake", "Sheet-Pan Honey-Soy Chicken"). Never invent generic combos like "carrots with cheese". Each must be a complete, balanced dish kids will actually eat.

Hard rules:
- Strictly avoid every listed allergy/restriction.
- ${
    context?.mode === 'emergency'
      ? 'Emergency mode: max 5 minutes total, only what\'s on hand + pantry basics, NO shopping needed.'
      : context?.mode === 'very-quick'
        ? 'Very Quick mode: max 10 min, max 4 total ingredients.'
        : context?.mode === 'quick'
          ? 'Quick mode: max 15 min, simple steps.'
          : context?.time
            ? `Stay within ${context.time} minutes total.`
            : 'Weeknight friendly (≤30 min).'
  }
- ${context?.energy === 'exhausted' ? 'Parent is exhausted: minimise active steps and decisions.' : ''}
- Use as many on-hand ingredients as sensibly possible. Anything else needed must appear in "missingIngredients".
- For each ingredient set haveIt=true if it's already on the available list (case-insensitive partial match), else false.
- For each step, populate timerSeconds with a non-zero number ONLY when there's an unattended wait (e.g. "boil pasta" → 480, "rest" → 0 if active). Otherwise set 0.

Return ONLY valid JSON (no prose, no markdown fences) matching this exact schema:

${jsonShape()}`;
}

function buildClonePrompt({ dishName, profile }) {
  return `You are a family cooking assistant.

Create a healthy homemade version of "${dishName}" that looks and tastes similar enough for picky toddlers to accept it. Use simple ingredients (max 6 total), no deep-frying, minimal processing. The dish must remain visually recognisable as the requested item.

Family profile:
${profileBlock(profile)}

Strictly avoid every listed allergy/restriction.

Return ONLY valid JSON (no prose, no markdown fences) in this exact shape:

${jsonShape()}`;
}

function buildAdjustmentPrompt({ recipe, problem, profile }) {
  return `You previously suggested this recipe:

${JSON.stringify(recipe, null, 2)}

The kid won't eat it because: "${problem}".

Family profile:
${profileBlock(profile)}

Modify the SAME dish minimally to address that complaint while keeping the family allergies. Swap a single offending element if possible (e.g. broccoli → carrots, spicy → mild, crunchy → soft). Keep title close to original (you may suffix " (kid-friendly version)" or change just one word). Return ONLY valid JSON in this exact shape:

${jsonShape()}`;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON object found in response');
  return JSON.parse(raw.slice(start, end + 1));
}

function newId() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normaliseRecipe(r, ingredients = []) {
  const have = new Set(ingredients.map((s) => s.toLowerCase().trim()));
  const ings = (r.ingredients || []).map((it) => {
    const cat = CATEGORIES.includes(it.category) ? it.category : 'Pantry';
    const haveIt =
      typeof it.haveIt === 'boolean'
        ? it.haveIt
        : Array.from(have).some(
            (h) =>
              h && (it.name?.toLowerCase().includes(h) || h.includes(it.name?.toLowerCase()))
          );
    return {
      name: it.name,
      amount: it.amount ?? '',
      unit: it.unit || '',
      category: cat,
      haveIt,
    };
  });
  const missingObjs = ings.filter((it) => !it.haveIt);
  const steps = (r.steps || []).map((s, i) =>
    typeof s === 'string'
      ? { stepNumber: i + 1, instruction: s, timerSeconds: detectTimer(s) }
      : {
          stepNumber: s.stepNumber || i + 1,
          instruction: s.instruction || '',
          timerSeconds: Number(s.timerSeconds) || detectTimer(s.instruction || ''),
        }
  );
  return {
    id: r.id || newId(),
    title: r.title || 'Untitled',
    description: r.description || '',
    prepTime: typeof r.prepTime === 'number' ? r.prepTime : parsePrepTime(r.prepTime),
    servings: r.servings || 4,
    difficulty: r.difficulty || 'Easy',
    kidFriendly: r.kidFriendly !== false,
    kidFriendlyReason: r.kidFriendlyReason || '',
    calories: r.calories || null,
    protein: r.protein || null,
    carbs: r.carbs || null,
    imageQuery: r.imageQuery || r.title || 'food',
    ingredients: ings,
    missingIngredients: missingObjs,
    steps,
    tags: r.tags || [],
  };
}

function parsePrepTime(s) {
  if (!s) return 20;
  const m = String(s).match(/(\d+)/);
  return m ? Number(m[1]) : 20;
}

function detectTimer(text = '') {
  const m = text.match(/(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('sec')) return n;
  if (unit.startsWith('hour') || unit.startsWith('hr')) return n * 3600;
  return n * 60;
}

const MOCK_LIBRARY = [
  {
    title: 'One-Pan Chicken Fried Rice',
    description: 'A colorful, fast fried rice the whole table will fight over.',
    prepTime: 20,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Mild, soft-cooked egg and tender chicken',
    calories: 420,
    protein: 24,
    carbs: 48,
    imageQuery: 'chicken fried rice',
    ingredients: [
      { name: 'Cooked rice', amount: 3, unit: 'cups', category: 'Pantry' },
      { name: 'Chicken breast', amount: 2, unit: 'pieces', category: 'Meat' },
      { name: 'Eggs', amount: 2, unit: 'pieces', category: 'Dairy' },
      { name: 'Frozen peas & carrots', amount: 1, unit: 'cup', category: 'Frozen' },
      { name: 'Soy sauce', amount: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Garlic', amount: 2, unit: 'cloves', category: 'Vegetables' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Heat a wide pan over medium-high heat.', timerSeconds: 0 },
      { stepNumber: 2, instruction: 'Cook the diced chicken with a pinch of salt for 6 minutes.', timerSeconds: 360 },
      { stepNumber: 3, instruction: 'Push to one side, scramble the eggs in the empty space.', timerSeconds: 0 },
      { stepNumber: 4, instruction: 'Add garlic, peas & carrots; stir for 1 minute.', timerSeconds: 60 },
      { stepNumber: 5, instruction: 'Add cold rice and soy sauce. Toss until everything is hot, about 3 minutes.', timerSeconds: 180 },
    ],
    tags: ['rice', 'chicken', 'kid-friendly'],
  },
  {
    title: 'Cheesy Tomato Pasta Bake',
    description: 'Bubbly, golden pasta bake with a sweet tomato sauce.',
    prepTime: 25,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Familiar pasta + cheese flavors',
    calories: 510,
    protein: 21,
    carbs: 65,
    imageQuery: 'cheesy tomato pasta bake',
    ingredients: [
      { name: 'Pasta (penne)', amount: 300, unit: 'g', category: 'Pantry' },
      { name: 'Tomato passata', amount: 500, unit: 'g', category: 'Pantry' },
      { name: 'Mozzarella', amount: 150, unit: 'g', category: 'Dairy' },
      { name: 'Parmesan', amount: 30, unit: 'g', category: 'Dairy' },
      { name: 'Garlic', amount: 2, unit: 'cloves', category: 'Vegetables' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Heat oven to 200°C / 400°F.', timerSeconds: 0 },
      { stepNumber: 2, instruction: 'Boil the pasta for 8 minutes, then drain.', timerSeconds: 480 },
      { stepNumber: 3, instruction: 'Sweat garlic in olive oil, pour in passata, simmer 5 min.', timerSeconds: 300 },
      { stepNumber: 4, instruction: 'Stir pasta into sauce; tip into a baking dish.', timerSeconds: 0 },
      { stepNumber: 5, instruction: 'Top with both cheeses; bake 12 minutes until golden.', timerSeconds: 720 },
    ],
    tags: ['pasta', 'baked', 'cheese'],
  },
  {
    title: 'Sheet-Pan Honey-Soy Chicken',
    description: 'Sticky, sweet, and salty — kids dunk it; you skip the dishes.',
    prepTime: 25,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Sweet glaze, finger-friendly pieces',
    calories: 380,
    protein: 28,
    carbs: 22,
    imageQuery: 'sheet pan honey soy chicken broccoli',
    ingredients: [
      { name: 'Chicken thighs (boneless)', amount: 500, unit: 'g', category: 'Meat' },
      { name: 'Broccoli', amount: 1, unit: 'head', category: 'Vegetables' },
      { name: 'Honey', amount: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Soy sauce', amount: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Garlic', amount: 2, unit: 'cloves', category: 'Vegetables' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Heat oven to 220°C / 425°F.', timerSeconds: 0 },
      { stepNumber: 2, instruction: 'Whisk honey, soy, grated garlic, oil. Toss with chicken and broccoli on a sheet pan.', timerSeconds: 0 },
      { stepNumber: 3, instruction: 'Roast 18 minutes, flipping halfway.', timerSeconds: 1080 },
      { stepNumber: 4, instruction: 'Serve over rice with extra pan sauce.', timerSeconds: 0 },
    ],
    tags: ['chicken', 'sheet-pan'],
  },
  {
    title: 'Mini Margherita Pita Pizzas',
    description: 'Each kid gets their own pizza in 12 minutes.',
    prepTime: 15,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Kids assemble their own',
    calories: 320,
    protein: 14,
    carbs: 38,
    imageQuery: 'mini margherita pita pizza',
    ingredients: [
      { name: 'Pita breads', amount: 4, unit: 'pieces', category: 'Pantry' },
      { name: 'Tomato sauce', amount: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Mozzarella', amount: 150, unit: 'g', category: 'Dairy' },
      { name: 'Olive oil', amount: 1, unit: 'tbsp', category: 'Pantry' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Heat oven to 220°C / 425°F.', timerSeconds: 0 },
      { stepNumber: 2, instruction: 'Brush pitas with oil. Spread sauce, scatter cheese.', timerSeconds: 0 },
      { stepNumber: 3, instruction: 'Bake 8 minutes until cheese bubbles.', timerSeconds: 480 },
    ],
    tags: ['pizza', 'pita'],
  },
  {
    title: 'Quick Cheesy Scrambled Egg Toast',
    description: 'Soft, cheesy scrambled eggs on toast — the 5-minute meal kids actually finish.',
    prepTime: 7,
    servings: 2,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Soft and mild',
    calories: 290,
    protein: 16,
    carbs: 22,
    imageQuery: 'cheesy scrambled egg toast',
    ingredients: [
      { name: 'Eggs', amount: 4, unit: 'pieces', category: 'Dairy' },
      { name: 'Cheddar', amount: 40, unit: 'g', category: 'Dairy' },
      { name: 'Bread', amount: 4, unit: 'slices', category: 'Pantry' },
      { name: 'Butter', amount: 1, unit: 'tbsp', category: 'Dairy' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Toast the bread.', timerSeconds: 120 },
      { stepNumber: 2, instruction: 'Melt butter on low, pour in beaten eggs, stir gently.', timerSeconds: 0 },
      { stepNumber: 3, instruction: 'When almost set, fold in grated cheese; pile onto toast.', timerSeconds: 0 },
    ],
    tags: ['eggs', 'breakfast'],
  },
  {
    title: '10-Minute Tomato Pasta',
    description: 'A bowl of saucy buttered tomato pasta — done in the time it takes to set the table.',
    prepTime: 10,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Mild, buttery sauce',
    calories: 380,
    protein: 11,
    carbs: 62,
    imageQuery: 'tomato butter pasta',
    ingredients: [
      { name: 'Pasta', amount: 300, unit: 'g', category: 'Pantry' },
      { name: 'Tomato passata', amount: 300, unit: 'g', category: 'Pantry' },
      { name: 'Butter', amount: 2, unit: 'tbsp', category: 'Dairy' },
      { name: 'Parmesan', amount: 30, unit: 'g', category: 'Dairy' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Boil pasta in salted water for 8 minutes.', timerSeconds: 480 },
      { stepNumber: 2, instruction: 'Warm passata with butter and a pinch of salt.', timerSeconds: 0 },
      { stepNumber: 3, instruction: 'Drain pasta, toss with sauce, finish with parmesan.', timerSeconds: 0 },
    ],
    tags: ['pasta', 'quick'],
  },
  {
    title: 'Microwave Cheesy Rice Bowl',
    description: 'Hot rice, melted cheese, a soft fried egg on top.',
    prepTime: 8,
    servings: 2,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Warm comfort food',
    calories: 340,
    protein: 14,
    carbs: 44,
    imageQuery: 'cheesy rice bowl egg',
    ingredients: [
      { name: 'Cooked rice', amount: 2, unit: 'cups', category: 'Pantry' },
      { name: 'Cheddar', amount: 50, unit: 'g', category: 'Dairy' },
      { name: 'Eggs', amount: 2, unit: 'pieces', category: 'Dairy' },
      { name: 'Butter', amount: 1, unit: 'tbsp', category: 'Dairy' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Warm rice in the microwave with a splash of water.', timerSeconds: 60 },
      { stepNumber: 2, instruction: 'Stir in grated cheddar until melted.', timerSeconds: 0 },
      { stepNumber: 3, instruction: 'Fry eggs softly in butter; slide on top of the bowls.', timerSeconds: 0 },
    ],
    tags: ['rice', 'quick'],
  },
  {
    title: 'Veggie-Loaded Mac and Cheese',
    description: 'Classic mac and cheese with a stealth veg upgrade.',
    prepTime: 25,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Cheesy, soft, mild',
    calories: 460,
    protein: 18,
    carbs: 55,
    imageQuery: 'mac and cheese',
    ingredients: [
      { name: 'Macaroni', amount: 250, unit: 'g', category: 'Pantry' },
      { name: 'Milk', amount: 400, unit: 'ml', category: 'Dairy' },
      { name: 'Cheddar', amount: 150, unit: 'g', category: 'Dairy' },
      { name: 'Butter', amount: 2, unit: 'tbsp', category: 'Dairy' },
      { name: 'Frozen cauliflower', amount: 1, unit: 'cup', category: 'Frozen' },
      { name: 'Flour', amount: 2, unit: 'tbsp', category: 'Pantry' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Boil macaroni 8 min; add cauliflower last 3 min.', timerSeconds: 480 },
      { stepNumber: 2, instruction: 'Melt butter, whisk in flour, then milk; simmer 3 min.', timerSeconds: 180 },
      { stepNumber: 3, instruction: 'Stir in cheese until smooth; combine with drained pasta + cauliflower.', timerSeconds: 0 },
    ],
    tags: ['mac and cheese'],
  },
];

function pickMockBatch({ count = 3, avoidTitles = [], mode } = {}) {
  let pool = MOCK_LIBRARY.filter((d) => !avoidTitles.includes(d.title));
  if (mode === 'very-quick' || mode === 'emergency') pool = pool.filter((d) => d.prepTime <= 10);
  if (mode === 'quick') pool = pool.filter((d) => d.prepTime <= 15);
  if (pool.length === 0) pool = MOCK_LIBRARY;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function generateRecipes({
  ingredients = [],
  profile,
  context = {},
  count = 3,
}) {
  const client = getClient();

  if (!client) {
    const batch = pickMockBatch({ count, avoidTitles: context.avoidTitles, mode: context.mode });
    return batch.map((r) => normaliseRecipe({ ...r, id: newId() }, ingredients));
  }

  const prompt = buildBatchPrompt({ ingredients, profile, context, count });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 3500,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const parsed = extractJson(text);
  const list = parsed.recipes || [];
  return list.map((r) => normaliseRecipe({ ...r, id: r.id || newId() }, ingredients));
}

export async function adjustRecipe({ recipe, problem, profile }) {
  const client = getClient();

  if (!client) {
    const swapped = swapForProblem(recipe, problem);
    return normaliseRecipe({ ...swapped, id: newId() }, []);
  }

  const prompt = buildAdjustmentPrompt({ recipe, problem, profile });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const parsed = extractJson(text);
  const r = parsed.recipes?.[0] || parsed;
  return normaliseRecipe({ ...r, id: newId() }, []);
}

function swapForProblem(recipe, problem) {
  const clone = JSON.parse(JSON.stringify(recipe));
  const p = problem.toLowerCase();
  const SWAPS = {
    spicy: { from: /chili|jalape|cayenne|paprika|spicy|hot sauce/i, to: 'mild seasoning' },
    texture: { from: /crunchy|crispy|raw/i, to: 'soft' },
    weird: { from: /broccoli|spinach|kale/i, to: 'carrots' },
  };
  const key = p.includes('spicy')
    ? 'spicy'
    : p.includes('texture')
      ? 'texture'
      : p.includes('weird') || p.includes('looks')
        ? 'weird'
        : 'weird';
  const swap = SWAPS[key];
  clone.ingredients = (clone.ingredients || []).map((it) =>
    swap.from.test(it.name) ? { ...it, name: swap.to } : it
  );
  clone.steps = (clone.steps || []).map((s) =>
    typeof s === 'string'
      ? s.replace(swap.from, swap.to)
      : { ...s, instruction: s.instruction.replace(swap.from, swap.to) }
  );
  clone.title = `${recipe.title} (kid-friendly)`;
  clone.kidFriendlyReason = `Adjusted: ${problem}`;
  return clone;
}

function mockClone(dishName) {
  const lower = dishName.toLowerCase();
  const PRESETS = {
    nugget: {
      title: 'Homemade Crispy Chicken Bites',
      imageQuery: 'baked chicken nuggets',
      ingredients: [
        { name: 'Chicken breast', amount: 400, unit: 'g', category: 'Meat' },
        { name: 'Egg', amount: 1, unit: 'piece', category: 'Dairy' },
        { name: 'Breadcrumbs', amount: 1, unit: 'cup', category: 'Pantry' },
        { name: 'Olive oil', amount: 1, unit: 'tbsp', category: 'Pantry' },
        { name: 'Salt', amount: 1, unit: 'pinch', category: 'Pantry' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Heat oven to 200°C / 400°F. Line a tray with baking paper.', timerSeconds: 0 },
        { stepNumber: 2, instruction: 'Cut chicken into bite-sized pieces.', timerSeconds: 0 },
        { stepNumber: 3, instruction: 'Dip each piece in beaten egg, then breadcrumbs.', timerSeconds: 0 },
        { stepNumber: 4, instruction: 'Lay on tray, brush with oil, bake 15 minutes.', timerSeconds: 900 },
      ],
    },
    pizza: {
      title: 'Mini Margherita Pita Pizzas',
      imageQuery: 'mini margherita pita pizza',
      ingredients: [
        { name: 'Pita breads', amount: 4, unit: 'pieces', category: 'Pantry' },
        { name: 'Tomato sauce', amount: 0.5, unit: 'cup', category: 'Pantry' },
        { name: 'Mozzarella', amount: 150, unit: 'g', category: 'Dairy' },
        { name: 'Olive oil', amount: 1, unit: 'tbsp', category: 'Pantry' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Heat oven to 220°C / 425°F.', timerSeconds: 0 },
        { stepNumber: 2, instruction: 'Brush pitas with oil, spread sauce, scatter cheese.', timerSeconds: 0 },
        { stepNumber: 3, instruction: 'Bake 8 minutes until cheese bubbles.', timerSeconds: 480 },
      ],
    },
    burger: {
      title: 'Mini Homemade Beef Burgers',
      imageQuery: 'mini beef burgers',
      ingredients: [
        { name: 'Ground beef (lean)', amount: 400, unit: 'g', category: 'Meat' },
        { name: 'Mini buns', amount: 4, unit: 'pieces', category: 'Pantry' },
        { name: 'Cheddar', amount: 60, unit: 'g', category: 'Dairy' },
        { name: 'Olive oil', amount: 1, unit: 'tbsp', category: 'Pantry' },
        { name: 'Salt', amount: 1, unit: 'pinch', category: 'Pantry' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Shape beef into 4 small patties; salt lightly.', timerSeconds: 0 },
        { stepNumber: 2, instruction: 'Pan-fry on medium-high 3 minutes per side.', timerSeconds: 360 },
        { stepNumber: 3, instruction: 'Top with cheese, melt 30 seconds, build buns.', timerSeconds: 30 },
      ],
    },
    fries: {
      title: 'Crispy Oven Potato Wedges',
      imageQuery: 'oven baked potato wedges',
      ingredients: [
        { name: 'Potatoes', amount: 600, unit: 'g', category: 'Vegetables' },
        { name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'Pantry' },
        { name: 'Salt', amount: 1, unit: 'pinch', category: 'Pantry' },
        { name: 'Paprika (sweet)', amount: 1, unit: 'tsp', category: 'Pantry' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Heat oven to 220°C / 425°F.', timerSeconds: 0 },
        { stepNumber: 2, instruction: 'Cut potatoes into wedges. Toss with oil, salt, paprika.', timerSeconds: 0 },
        { stepNumber: 3, instruction: 'Roast 25 minutes, flipping halfway.', timerSeconds: 1500 },
      ],
    },
  };
  let key = null;
  if (/(nugget|chicken bite|tender)/.test(lower)) key = 'nugget';
  else if (/pizza/.test(lower)) key = 'pizza';
  else if (/(burger|patty)/.test(lower)) key = 'burger';
  else if (/(fries|chips|wedge)/.test(lower)) key = 'fries';
  const preset = PRESETS[key] || PRESETS.nugget;
  return {
    description: `A homemade, kid-friendly take on ${dishName}.`,
    prepTime: 25,
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    kidFriendlyReason: 'Familiar shape and flavor, mild seasoning',
    calories: 380,
    protein: 22,
    carbs: 30,
    tags: ['homemade', 'clone'],
    ...preset,
  };
}

export async function cloneDish({ dishName, profile }) {
  const client = getClient();
  if (!client) {
    return normaliseRecipe({ ...mockClone(dishName), id: newId() }, []);
  }
  const prompt = buildClonePrompt({ dishName, profile });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const parsed = extractJson(text);
  const r = parsed.recipes?.[0] || parsed;
  return normaliseRecipe({ ...r, id: newId() }, []);
}

export async function generateWeekPlan({ profile, context = {} }) {
  const client = getClient();
  if (!client) {
    const batch = pickMockBatch({ count: 7 });
    return batch.map((r) => normaliseRecipe({ ...r, id: newId() }, []));
  }
  const recipes = await generateRecipes({
    profile,
    context: { ...context, weekPlan: true },
    count: 7,
  });
  return recipes;
}
