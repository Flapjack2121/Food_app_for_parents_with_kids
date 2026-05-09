import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

function getClient() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

function buildPrompt({ ingredients, profile, mode }) {
  const kids = (profile?.kids || [])
    .map((k, i) => `Kid ${i + 1}: age ${k.age}${k.picky ? ', picky eater' : ''}`)
    .join('; ');
  const allergies = (profile?.allergies || []).join(', ') || 'none';
  const lazy = mode === 'lazy';

  return `You are a friendly home-cooking helper. Suggest ONE simple recipe for a parent cooking for kids.

Family profile:
- Kids: ${kids || 'unspecified'}
- Allergies (avoid these): ${allergies}
- Mode: ${lazy ? 'LAZY (max 10 min prep, max 4 ingredients total)' : 'normal'}

Ingredients on hand: ${ingredients.join(', ') || 'unspecified'}

Return ONLY valid JSON (no prose, no markdown fences) matching this schema:
{
  "title": string,
  "description": string (1-2 sentences, mention kid appeal),
  "prepTime": string (e.g. "15 min"),
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Hard",
  "kidFriendly": boolean,
  "ingredients": [{ "name": string, "amount": string, "category": "Vegetables" | "Dairy" | "Meat" | "Other" }],
  "steps": [string],
  "missingIngredients": [{ "name": string, "amount": string, "category": "Vegetables" | "Dairy" | "Meat" | "Other" }]
}

Rules:
- "missingIngredients" lists items NOT in the ingredients-on-hand list.
- Avoid all listed allergies.
- ${lazy ? 'Keep total ingredients to 4 or fewer and prepTime under 10 min.' : 'Keep it weeknight-simple.'}
- Make it appealing for kids${kids ? ' of the listed ages' : ''}.`;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON object found in response');
  return JSON.parse(raw.slice(start, end + 1));
}

function mockRecipe({ ingredients, mode }) {
  const lazy = mode === 'lazy';
  const base = ingredients[0] || 'pasta';
  return {
    title: lazy ? `${cap(base)} Quick Bowl` : `${cap(base)} Family Skillet`,
    description: lazy
      ? `A 10-minute ${base} bowl that kids actually eat. Mild, simple, and ready before they ask "is it ready yet?"`
      : `A weeknight ${base} dish that's gentle on picky palates and fun to plate.`,
    prepTime: lazy ? '10 min' : '20 min',
    servings: 4,
    difficulty: 'Easy',
    kidFriendly: true,
    ingredients: [
      { name: cap(base), amount: '2 cups', category: guessCat(base) },
      { name: 'Olive oil', amount: '1 tbsp', category: 'Other' },
      { name: 'Salt', amount: 'to taste', category: 'Other' },
      ...(lazy
        ? []
        : [
            { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' },
            { name: 'Cheese', amount: '½ cup', category: 'Dairy' },
          ]),
    ],
    steps: [
      `Prep the ${base} and any add-ins.`,
      'Warm a pan over medium heat with the oil.',
      'Cook everything together until tender and fragrant.',
      'Season, serve, and let kids sprinkle their own cheese.',
    ],
    missingIngredients: lazy
      ? [{ name: 'Olive oil', amount: '1 tbsp', category: 'Other' }]
      : [
          { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' },
          { name: 'Cheese', amount: '½ cup', category: 'Dairy' },
        ],
  };
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function guessCat(name) {
  const n = name.toLowerCase();
  if (/(milk|cheese|yogurt|butter|cream)/.test(n)) return 'Dairy';
  if (/(chicken|beef|pork|turkey|fish|salmon|bacon)/.test(n)) return 'Meat';
  if (/(tomato|broccoli|spinach|carrot|onion|pepper|garlic|lettuce)/.test(n))
    return 'Vegetables';
  return 'Other';
}

export async function generateRecipe({ ingredients, profile, mode }) {
  const client = getClient();
  const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!client) {
    return { ...mockRecipe({ ingredients, mode }), id, _mock: true };
  }

  const prompt = buildPrompt({ ingredients, profile, mode });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const parsed = extractJson(text);
  return { ...parsed, id };
}
